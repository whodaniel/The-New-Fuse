import os
from google.oauth2.credentials import Credentials
from google_auth_oauthlib.flow import InstalledAppFlow
from google.auth.transport.requests import Request
from googleapiclient.discovery import build
from googleapiclient.http import MediaFileUpload

SCOPES = ["https://www.googleapis.com/auth/drive.file"]
service = None


def authenticate():
    global service
    creds = None
    if os.path.exists("token.json"):
        creds = Credentials.from_authorized_user_file("token.json", SCOPES)
    if not creds or not creds.valid:
        if creds and creds.expired and creds.refresh_token:
            creds.refresh(Request())
        else:
            flow = InstalledAppFlow.from_client_secrets_file("credentials.json", SCOPES)
            creds = flow.run_local_server(port=0)
        with open("token.json", "w") as token:
            token.write(creds.to_json())
    service = build("drive", "v3", credentials=creds)


def list_remote_files() -> dict:
    results = {}
    page_token = None
    while True:
        response = (
            service.files()
            .list(
                spaces="drive",
                fields="nextPageToken, files(id, name, md5Checksum)",
                pageToken=page_token,
            )
            .execute()
        )
        for file in response.get("files", []):
            if "md5Checksum" in file:
                results[file["md5Checksum"]] = file
        page_token = response.get("nextPageToken", None)
        if page_token is None:
            break
    return results


def upload_file(local_path: str, remote_path: str) -> bool:
    try:
        file_metadata = {"name": os.path.basename(remote_path)}
        media = MediaFileUpload(local_path, resumable=True)
        service.files().create(
            body=file_metadata, media_body=media, fields="id"
        ).execute()
        return True
    except Exception:
        return False
