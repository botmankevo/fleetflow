import base64
import io
from pathlib import Path
from typing import Dict, List, Optional
from jinja2 import Environment, FileSystemLoader
from playwright.async_api import async_playwright
from app.core.config import settings
from app.services.dropbox_service import upload_file, create_shared_link
from app.services.image_service import resize_image


template_dir = Path(__file__).resolve().parent.parent / "templates"

env = Environment(loader=FileSystemLoader(str(template_dir)))


async def generate_pod_packet(payload: Dict) -> Dict[str, str]:
    html = env.get_template("pod_packet.html").render(**payload)
    async with async_playwright() as p:
        browser = await p.chromium.launch()
        page = await browser.new_page()
        await page.set_content(html, wait_until="networkidle")
        pdf_bytes = await page.pdf(format="A4", print_background=True)
        await browser.close()

    path = f"/POD Packets/{payload['load_id']}/Generated POD/pod_packet.pdf"
    upload_file(path, pdf_bytes)
    shared_link = create_shared_link(path, allow_public=payload.get("share_public", False))
    return {"path": path, "shared_link": shared_link}


def image_to_data_uri(image_bytes: bytes) -> str:
    encoded = base64.b64encode(image_bytes).decode("utf-8")
    return f"data:image/jpeg;base64,{encoded}"


def build_thumbnail_data_uri(image_bytes: bytes, size: int = 140) -> str:
    thumbnail = resize_image(image_bytes, size)
    return image_to_data_uri(thumbnail)
