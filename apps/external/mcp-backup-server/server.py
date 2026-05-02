import os
import hashlib
import pathspec
import uuid
import time
from typing import List, Dict, Optional
from fastmcp import FastMCP
from dotenv import load_dotenv
from backup_logger import (
    log_backup_start,
    log_backup_progress,
    log_backup_complete,
    log_backup_error,
)

load_dotenv()
mcp = FastMCP("multicloud-backup")


def calculate_file_hash(file_path: str) -> str:
    hash_sha256 = hashlib.sha256()
    with open(file_path, "rb") as f:
        for chunk in iter(lambda: f.read(4194304), b""):
            hash_sha256.update(chunk)
    return hash_sha256.hexdigest()


def load_gitignore_patterns(root_dir: str) -> pathspec.PathSpec:
    ignore_patterns = [".git/", "__pycache__/", "*.tmp", "*.log", ".DS_Store"]
    gitignore_path = os.path.join(root_dir, ".gitignore")
    if os.path.exists(gitignore_path):
        with open(gitignore_path, "r") as f:
            ignore_patterns.extend(
                [
                    line.strip()
                    for line in f
                    if line.strip() and not line.startswith("#")
                ]
            )
    return pathspec.PathSpec.from_lines("gitwildmatch", ignore_patterns)


from modules import google_drive, pcloud, ardrive


@mcp.tool()
def backup_google_drive(root_dir: str, dry_run: bool = True) -> Dict:
    """Backup creative and business files to Google Drive"""
    spec = load_gitignore_patterns(root_dir)
    results = {"uploaded": 0, "skipped": 0, "failed": 0, "errors": []}

    google_drive.authenticate()
    existing_files = google_drive.list_remote_files()

    for root, _, files in os.walk(root_dir):
        for filename in files:
            full_path = os.path.join(root, filename)
            rel_path = os.path.relpath(full_path, root_dir)

            if spec.match_file(rel_path):
                continue

            file_hash = calculate_file_hash(full_path)
            if file_hash in existing_files:
                results["skipped"] += 1
                continue

            if dry_run:
                results["uploaded"] += 1
                continue

            ok = google_drive.upload_file(full_path, rel_path)
            if ok:
                results["uploaded"] += 1
            else:
                results["failed"] += 1

    return results


@mcp.tool()
def backup_pcloud(root_dir: str, dry_run: bool = True) -> Dict:
    """Backup personal and family files to pCloud"""
    spec = load_gitignore_patterns(root_dir)
    results = {"uploaded": 0, "skipped": 0, "failed": 0, "errors": []}

    pcloud.authenticate()
    existing_files = pcloud.list_remote_files()

    for root, _, files in os.walk(root_dir):
        for filename in files:
            full_path = os.path.join(root, filename)
            rel_path = os.path.relpath(full_path, root_dir)

            if spec.match_file(rel_path):
                continue

            file_hash = calculate_file_hash(full_path)
            if file_hash in existing_files:
                results["skipped"] += 1
                continue

            if dry_run:
                results["uploaded"] += 1
                continue

            ok = pcloud.upload_file(full_path, rel_path)
            if ok:
                results["uploaded"] += 1
            else:
                results["failed"] += 1

    return results


@mcp.tool()
def backup_ardrive(root_dir: str, dry_run: bool = True) -> Dict:
    """Backup AI generated images to ArDrive permanent blockchain storage"""
    results = {"uploaded": 0, "skipped": 0, "failed": 0, "errors": []}

    ardrive.authenticate()
    existing_files = ardrive.list_remote_files()

    image_extensions = (".png", ".jpg", ".jpeg", ".webp", ".svg")
    for root, _, files in os.walk(root_dir):
        for filename in files:
            if not filename.lower().endswith(image_extensions):
                continue

            full_path = os.path.join(root, filename)
            rel_path = os.path.relpath(full_path, root_dir)

            file_hash = calculate_file_hash(full_path)
            if file_hash in existing_files:
                results["skipped"] += 1
                continue

            if dry_run:
                results["uploaded"] += 1
                continue

            ok = ardrive.upload_file(full_path, rel_path)
            if ok:
                results["uploaded"] += 1
            else:
                results["failed"] += 1

    return results


@mcp.tool()
def run_full_backup(dry_run: bool = True) -> Dict:
    """Run full backup across all configured cloud platforms"""
    config = load_backup_config()
    results = {}

    if config.get("google_drive_enabled"):
        results["google_drive"] = backup_google_drive(
            config["google_drive_source"], dry_run
        )

    if config.get("pcloud_enabled"):
        results["pcloud"] = backup_pcloud(config["pcloud_source"], dry_run)

    if config.get("ardrive_enabled"):
        results["ardrive"] = backup_ardrive(config["ardrive_source"], dry_run)

    return results


def load_backup_config() -> Dict:
    import json

    config_path = os.path.join(os.path.dirname(__file__), "backup_config.json")
    if os.path.exists(config_path):
        with open(config_path, "r") as f:
            return json.load(f)
    return {}


if __name__ == "__main__":
    mcp.run()
