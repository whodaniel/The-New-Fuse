import os
from pcloud import PyCloud

pc = None


def authenticate():
    global pc
    username = os.getenv("PCLOUD_USERNAME")
    password = os.getenv("PCLOUD_PASSWORD")
    pc = PyCloud(username, password, endpoint="eapi")


def list_remote_files() -> dict:
    results = {}
    folderid = 0
    stack = [folderid]

    while stack:
        current_id = stack.pop()
        try:
            response = pc.listfolder(folderid=current_id)
            for item in response.get("metadata", {}).get("contents", []):
                if item["isfolder"]:
                    stack.append(item["id"])
                else:
                    if "hash" in item:
                        results[item["hash"]] = item
        except Exception:
            pass
    return results


def upload_file(local_path: str, remote_path: str) -> bool:
    try:
        pc.uploadfile(files=[local_path], path="/")
        return True
    except Exception:
        return False
