import io
from typing import List
from PIL import Image, ImageOps, ImageEnhance


def scan_images_to_pdf(images: List[bytes]) -> bytes:
    processed = []
    for img_bytes in images:
        with Image.open(io.BytesIO(img_bytes)) as img:
            img = img.convert("RGB")
            img = ImageOps.grayscale(img)
            img = ImageOps.autocontrast(img)
            enhancer = ImageEnhance.Contrast(img)
            img = enhancer.enhance(1.4)
            processed.append(img.convert("RGB"))

    if not processed:
        return b""

    output = io.BytesIO()
    first, rest = processed[0], processed[1:]
    first.save(output, format="PDF", save_all=True, append_images=rest)
    output.seek(0)
    return output.read()
