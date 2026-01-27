import requests
from typing import List
from app.core.config import settings


class DropboxService:
    def __init__(self) -> None:
        if not settings.DROPBOX_ACCESS_TOKEN:
            raise ValueError("DROPBOX_ACCESS_TOKEN is required")
        self.token = settings.DROPBOX_ACCESS_TOKEN

    def _headers(self) -> dict:
        return {"Authorization": f"Bearer {self.token}"}

    def upload_file(self, content: bytes, dropbox_path: str) -> None:
        headers = {
            **self._headers(),
            "Dropbox-API-Arg": f'{{"path":"{dropbox_path}","mode":"overwrite"}}',
            "Content-Type": "application/octet-stream",
        }
        res = requests.post("https://content.dropboxapi.com/2/files/upload", headers=headers, data=content, timeout=60)
        res.raise_for_status()

    def create_shared_link(self, dropbox_path: str) -> str:
        headers = {**self._headers(), "Content-Type": "application/json"}
        body = {"path": dropbox_path, "settings": {"requested_visibility": "public"}}
        res = requests.post("https://api.dropboxapi.com/2/sharing/create_shared_link_with_settings", headers=headers, json=body, timeout=30)
        if res.status_code == 409:
            # Link exists
            list_res = requests.post("https://api.dropboxapi.com/2/sharing/list_shared_links", headers=headers, json={"path": dropbox_path}, timeout=30)
            list_res.raise_for_status()
            links = list_res.json().get("links", [])
            if links:
                return links[0]["url"]
        res.raise_for_status()
        return res.json()["url"]

    def upload_files(self, files: List[tuple], base_path: str) -> List[str]:
        links = []
        for filename, content in files:
            path = f"{base_path}/{filename}"
            self.upload_file(content, path)
            links.append(self.create_shared_link(path))
        return links
