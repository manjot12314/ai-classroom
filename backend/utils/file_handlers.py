import os
from pathlib import Path
from typing import BinaryIO, Optional

from ..config import get_settings

settings = get_settings()


def ensure_upload_dir() -> Path:
    path = Path(settings.file_upload_dir)
    path.mkdir(parents=True, exist_ok=True)
    return path


def save_upload(file_obj: BinaryIO, filename: str) -> Path:
    upload_dir = ensure_upload_dir()
    target = upload_dir / filename
    with open(target, "wb") as f:
        f.write(file_obj.read())
    return target


def save_bytes(
    data: bytes,
    filename: str,
    allowed_mime: Optional[str] = None,
    max_size_mb: int = 20,
) -> Path:
    if not data:
        raise ValueError("Uploaded file is empty")
    if len(data) > max_size_mb * 1024 * 1024:
        raise ValueError(f"File exceeds {max_size_mb}MB limit")
    if allowed_mime and not allowed_mime.startswith(("image/", "video/")):
        raise ValueError("Unsupported file type")
    upload_dir = ensure_upload_dir()
    target = upload_dir / filename
    with open(target, "wb") as f:
        f.write(data)
    return target


def delete_file(path: Path) -> None:
    try:
        os.remove(path)
    except OSError:
        pass

