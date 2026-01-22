import io
import zipfile
from typing import Iterable, Tuple


def build_zip(files: Iterable[Tuple[str, bytes]]) -> bytes:
    buffer = io.BytesIO()
    with zipfile.ZipFile(buffer, "w", zipfile.ZIP_DEFLATED) as zip_file:
        for filename, content in files:
            zip_file.writestr(filename, content)
    return buffer.getvalue()
