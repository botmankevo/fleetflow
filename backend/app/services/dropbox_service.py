import os
import io
import base64
from typing import Optional, List, Tuple
import dropbox
from dropbox.exceptions import ApiError
from app.core.config import settings


class DropboxService:
    """Service for Dropbox integration."""
    
    def __init__(self):
        if not settings.DROPBOX_ACCESS_TOKEN:
            raise ValueError("DROPBOX_ACCESS_TOKEN not configured")
        self.dbx = dropbox.Dropbox(settings.DROPBOX_ACCESS_TOKEN)
    
    def upload_file(self, file_content: bytes, dropbox_path: str) -> str:
        """Upload file to Dropbox and return path."""
        try:
            self.dbx.files_upload(
                file_content,
                dropbox_path,
                autorename=False,
                mode=dropbox.files.WriteMode("overwrite")
            )
            return dropbox_path
        except ApiError as e:
            raise Exception(f"Dropbox upload failed: {str(e)}")
    
    def create_shared_link(self, dropbox_path: str) -> str:
        """Create a shared link for a file."""
        try:
            link = self.dbx.sharing_create_shared_link_with_settings(
                dropbox_path,
                dropbox.sharing.SharedLinkSettings(
                    requested_visibility=dropbox.sharing.RequestedVisibility.public
                )
            )
            return link.url
        except ApiError as e:
            # Link might already exist
            try:
                links = self.dbx.sharing_list_shared_links(path=dropbox_path)
                if links.links:
                    return links.links[0].url
            except:
                pass
            raise Exception(f"Failed to create shared link: {str(e)}")
    
    def create_folder(self, folder_path: str) -> bool:
        """Create folder in Dropbox."""
        try:
            self.dbx.files_create_folder_v2(folder_path)
            return True
        except ApiError as e:
            if e.error.is_path() and e.error.get_path().is_conflict():
                return True  # Folder already exists
            raise Exception(f"Failed to create folder: {str(e)}")
    
    def download_file(self, dropbox_path: str) -> bytes:
        """Download file from Dropbox."""
        try:
            metadata, response = self.dbx.files_download(dropbox_path)
            return response.content
        except ApiError as e:
            raise Exception(f"Dropbox download failed: {str(e)}")
    
    def list_files(self, folder_path: str) -> List[str]:
        """List files in a folder."""
        try:
            result = self.dbx.files_list_folder(folder_path)
            files = []
            for entry in result.entries:
                if isinstance(entry, dropbox.files.FileMetadata):
                    files.append(entry.name)
            return files
        except ApiError:
            return []
