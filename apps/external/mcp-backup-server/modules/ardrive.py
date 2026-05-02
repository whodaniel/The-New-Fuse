import os
import json
import requests
from ardrive import ArDrive

MAX_FREE_FILE_SIZE = 100 * 1024 * 1024
ardrive_client = None


def authenticate():
    global ardrive_client
    wallet_path = os.getenv("ARDRIVE_WALLET_PATH")

    if not wallet_path or not os.path.exists(wallet_path):
        raise ValueError("ARDRIVE_WALLET_PATH not configured or wallet file missing")

    with open(wallet_path, "r") as f:
        wallet = json.load(f)

    ardrive_client = ArDrive(wallet=wallet, use_turbo=True)


def list_remote_files() -> dict:
    results = {}
    if not ardrive_client:
        return results

    try:
        files = ardrive_client.list_all_files()
        for f in files:
            if "dataHash" in f:
                results[f["dataHash"]] = f
    except Exception:
        pass
    return results


def upload_file(local_path: str, remote_path: str) -> bool:
    if not ardrive_client:
        authenticate()

    file_size = os.path.getsize(local_path)

    try:
        result = ardrive_client.upload_file(
            file_path=local_path,
            parent_folder_id=os.getenv("ARDRIVE_FOLDER_ID"),
            turbo=file_size <= MAX_FREE_FILE_SIZE,
        )

        if result.get("status") == "success":
            print(f"✓ Uploaded {local_path} | TX: {result.get('txId')}")
            return True
        return False

    except Exception as e:
        print(f"✗ Error uploading {local_path}: {str(e)}")
        return False

    try:
        with open(local_path, "rb") as f:
            file_data = f.read()

        headers = {
            "Content-Type": "application/octet-stream",
            "x-turbo-file-name": os.path.basename(remote_path),
        }

        response = requests.post(
            TURBO_UPLOAD_URL, data=file_data, headers=headers, timeout=120
        )

        if response.status_code == 200:
            transaction_id = response.text.strip()
            print(f"✓ Uploaded {local_path} permanently | TX ID: {transaction_id}")
            return True
        else:
            print(
                f"✗ Failed upload {local_path}: {response.status_code} {response.text}"
            )
            return False

    except Exception as e:
        print(f"✗ Error uploading {local_path}: {str(e)}")
        return False
