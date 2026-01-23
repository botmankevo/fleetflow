import io
import base64
from typing import Optional, Tuple
from jinja2 import Template
from app.services.dropbox_service import DropboxService


PDF_TEMPLATE = """
<!DOCTYPE html>
<html>
<head>
    <meta charset="UTF-8">
    <style>
        * {
            margin: 0;
            padding: 0;
            box-sizing: border-box;
        }
        body {
            font-family: Arial, sans-serif;
            padding: 20px;
            font-size: 11px;
            color: #333;
            line-height: 1.4;
        }
        .page {
            width: 8.5in;
            height: 11in;
            page-break-after: always;
            display: flex;
            flex-direction: column;
        }
        .header {
            text-align: center;
            font-size: 18px;
            font-weight: bold;
            margin-bottom: 15px;
            border-bottom: 2px solid #333;
            padding-bottom: 10px;
        }
        .top-section {
            display: grid;
            grid-template-columns: 1fr 1fr;
            gap: 20px;
            margin-bottom: 15px;
        }
        .company-info {
            text-align: left;
        }
        .load-summary {
            text-align: right;
        }
        .section-title {
            font-weight: bold;
            margin-top: 10px;
            margin-bottom: 5px;
            border-bottom: 1px solid #999;
        }
        .broker-locations {
            display: grid;
            grid-template-columns: 1fr 1fr;
            gap: 20px;
            margin-bottom: 15px;
        }
        .broker {
            text-align: left;
        }
        .locations {
            text-align: right;
        }
        .receiver-info {
            margin-bottom: 15px;
            padding: 10px;
            border: 1px solid #ccc;
        }
        .signature-section {
            margin: 10px 0;
        }
        .signature-line {
            margin-top: 20px;
            border-top: 1px solid #333;
            width: 200px;
        }
        .signature-font {
            font-family: cursive;
            font-size: 20px;
            margin: 5px 0;
        }
        .files-section {
            margin-bottom: 10px;
            padding: 5px;
            border: 1px solid #ddd;
        }
        .file-thumbnail {
            display: inline-block;
            max-width: 120px;
            max-height: 120px;
            margin: 5px;
            border: 1px solid #ccc;
        }
        .links {
            margin-top: 5px;
            font-size: 9px;
        }
        a {
            color: #0066cc;
            text-decoration: none;
        }
        a:hover {
            text-decoration: underline;
        }
        .footer {
            margin-top: auto;
            font-size: 9px;
            color: #666;
            text-align: center;
            border-top: 1px solid #ccc;
            padding-top: 5px;
        }
    </style>
</head>
<body>
    <div class="page">
        <div class="header">Proof of Delivery (POD) Packet</div>
        
        <div class="top-section">
            <div class="company-info">
                <div class="section-title">{{ company_name }}</div>
                <div>{{ company_address }}</div>
                <div>{{ company_phone }}</div>
            </div>
            <div class="load-summary">
                <div class="section-title">Load Summary</div>
                <div><strong>Load ID:</strong> {{ load_id }}</div>
                <div><strong>Load #:</strong> {{ load_number }}</div>
                <div><strong>Delivery Date:</strong> {{ delivery_date }}</div>
            </div>
        </div>
        
        <div class="broker-locations">
            <div class="broker">
                <div class="section-title">Broker</div>
                <div>{{ broker_name }}</div>
                <div>{{ broker_phone }}</div>
                <div>{{ broker_email }}</div>
            </div>
            <div class="locations">
                <div class="section-title">Locations</div>
                <div><strong>Pickup:</strong> {{ pickup_location }}</div>
                <div><strong>Delivery:</strong> {{ delivery_location }}</div>
            </div>
        </div>
        
        <div class="receiver-info">
            <div class="section-title">Receiver Information</div>
            <div><strong>Receiver Name:</strong> {{ receiver_name }}</div>
            <div class="signature-section">
                <div><strong>Signature:</strong></div>
                <div class="signature-font">{{ receiver_signature_text }}</div>
            </div>
        </div>
        
        <div>
            <div><strong>Delivery Notes:</strong></div>
            <div style="margin-left: 10px;">{{ delivery_notes }}</div>
        </div>
        
        <div class="files-section">
            <div class="section-title">Signed BOL / POD</div>
            {% if bol_image_preview %}
            <img src="{{ bol_image_preview }}" class="file-thumbnail" alt="BOL Preview">
            {% endif %}
            <div class="links">
                {% if bol_folder_link %}<a href="{{ bol_folder_link }}" target="_blank">View BOL</a>{% endif %}
                {% if bol_view_all_link %}<a href="{{ bol_view_all_link }}" target="_blank">View All</a>{% endif %}
            </div>
        </div>
        
        <div class="files-section">
            <div class="section-title">Delivery Photos</div>
            {% if photos_image_preview %}
            <img src="{{ photos_image_preview }}" class="file-thumbnail" alt="Photo Preview">
            {% endif %}
            <div class="links">
                {% if photos_zip_link %}<a href="{{ photos_zip_link }}" target="_blank">View All Photos</a>{% endif %}
            </div>
        </div>
        
        <div class="footer">
            <div>Generated by FleetFlow POD Management System</div>
            <div>{{ generated_date }}</div>
        </div>
    </div>
</body>
</html>
"""


class PDFService:
    """Service for PDF generation."""
    
    def __init__(self):
        self.dropbox_service = DropboxService()
    
    async def generate_pod_pdf(
        self,
        load_data: dict,
        pod_data: dict,
        company_data: dict,
        bol_image_data: Optional[bytes] = None,
        photo_image_data: Optional[bytes] = None,
    ) -> bytes:
        """Generate POD PDF using Playwright."""
        try:
            from playwright.async_api import async_playwright
        except ImportError:
            raise Exception("Playwright not installed. Run: pip install playwright && playwright install")
        
        # Prepare template data
        context = {
            "company_name": company_data.get("company_name", "FleetFlow"),
            "company_address": company_data.get("address", ""),
            "company_phone": company_data.get("phone", ""),
            "load_id": load_data.get("id"),
            "load_number": load_data.get("load_number"),
            "delivery_date": pod_data.get("delivery_date"),
            "broker_name": load_data.get("broker_name", ""),
            "broker_phone": load_data.get("broker_phone", ""),
            "broker_email": load_data.get("broker_email", ""),
            "pickup_location": load_data.get("pickup_location"),
            "delivery_location": load_data.get("delivery_location"),
            "receiver_name": pod_data.get("receiver_name"),
            "receiver_signature_text": pod_data.get("receiver_signature", ""),
            "delivery_notes": pod_data.get("delivery_notes", ""),
            "bol_folder_link": pod_data.get("bol_folder_link", ""),
            "bol_view_all_link": pod_data.get("bol_view_all_link", ""),
            "photos_zip_link": pod_data.get("photos_zip_link", ""),
            "bol_image_preview": self._image_to_data_uri(bol_image_data) if bol_image_data else None,
            "photos_image_preview": self._image_to_data_uri(photo_image_data) if photo_image_data else None,
            "generated_date": self._get_current_date(),
        }
        
        # Render template
        template = Template(PDF_TEMPLATE)
        html_content = template.render(**context)
        
        # Generate PDF using Playwright
        async with async_playwright() as p:
            browser = await p.chromium.launch(
                headless=True,
                args=["--no-sandbox", "--disable-setuid-sandbox"]
            )
            page = await browser.new_page(
                viewport={"width": 850, "height": 1100}
            )
            await page.set_content(html_content)
            pdf_bytes = await page.pdf(
                format="Letter",
                margin={"top": "0.5in", "bottom": "0.5in", "left": "0.5in", "right": "0.5in"}
            )
            await browser.close()
        
        return pdf_bytes
    
    def _image_to_data_uri(self, image_data: bytes) -> str:
        """Convert image bytes to data URI."""
        if isinstance(image_data, str):
            if image_data.startswith("data:"):
                return image_data
            image_data = base64.b64decode(image_data)
        
        b64 = base64.b64encode(image_data).decode("utf-8")
        return f"data:image/jpeg;base64,{b64}"
    
    def _get_current_date(self) -> str:
        """Get current date as string."""
        from datetime import datetime
        return datetime.now().strftime("%Y-%m-%d %H:%M")
