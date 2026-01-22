import io
from PIL import Image


def resize_image(image_bytes: bytes, width: int) -> bytes:
    with Image.open(io.BytesIO(image_bytes)) as img:
        ratio = width / float(img.width)
        height = int(float(img.height) * ratio)
        resized = img.resize((width, height))
        buffer = io.BytesIO()
        resized.save(buffer, format="JPEG", quality=82)
        return buffer.getvalue()
