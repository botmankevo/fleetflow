import io
import time
from typing import Iterable, List, Optional
from dropbox import Dropbox
from dropbox.files import CommitInfo, UploadSessionCursor
from dropbox.sharing import SharedLinkSettings
from app.core.config import settings


def _client() -> Dropbox:
    return Dropbox(settings.dropbox_access_token)


def upload_file(path: str, content: bytes) -> str:
    dbx = _client()
    for attempt in range(3):
        try:
            dbx.files_upload(content, path, mute=True)
            return path
        except Exception:
            if attempt == 2:
                raise
            time.sleep(2 ** attempt)
    return path


def upload_large(path: str, stream: io.BytesIO, chunk_size: int = 4 * 1024 * 1024) -> str:
    dbx = _client()
    stream.seek(0)
    upload_session_start_result = dbx.files_upload_session_start(stream.read(chunk_size))
    cursor = UploadSessionCursor(session_id=upload_session_start_result.session_id, offset=stream.tell())
    commit = CommitInfo(path=path)
    while stream.tell() < len(stream.getvalue()):
        if (len(stream.getvalue()) - stream.tell()) <= chunk_size:
            dbx.files_upload_session_finish(stream.read(chunk_size), cursor, commit)
        else:
            dbx.files_upload_session_append_v2(stream.read(chunk_size), cursor)
            cursor.offset = stream.tell()
    return path


def create_shared_link(path: str, allow_public: bool = False) -> str:
    dbx = _client()
    settings_obj = SharedLinkSettings(requested_visibility="public" if allow_public else "team_only")
    result = dbx.sharing_create_shared_link_with_settings(path, settings_obj)
    return result.url


def list_folder(path: str) -> List[str]:
    dbx = _client()
    entries = dbx.files_list_folder(path).entries
    return [entry.path_lower for entry in entries]


def upload_many(prefix: str, files: Iterable[tuple[str, bytes]]) -> List[str]:
    paths = []
    for filename, content in files:
        path = f"{prefix}/{filename}"
        paths.append(upload_file(path, content))
    return paths
