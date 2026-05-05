import asyncio
from playwright.async_api import async_playwright
import os

async def generate_pdf(url: str, output_path: str):
    """
    Renders a URL to PDF using Playwright.
    """
    async with async_playwright() as p:
        browser = await p.chromium.launch(headless=True)
        page = await browser.new_page()
        
        # Go to the print route
        await page.goto(url, wait_until="networkidle")
        
        # Emulate print media
        await page.emulate_media(media="print")
        
        # Generate PDF
        await page.pdf(
            path=output_path,
            format="A4",
            print_background=True,
            margin={"top": "0in", "right": "0in", "bottom": "0in", "left": "0in"}
        )
        
        await browser.close()

async def get_pdf_bytes(url: str) -> bytes:
    """
    Returns PDF bytes for a given URL.
    """
    async with async_playwright() as p:
        browser = await p.chromium.launch(headless=True)
        page = await browser.new_page()
        await page.goto(url, wait_until="networkidle")
        await page.emulate_media(media="print")
        pdf_bytes = await page.pdf(format="A4", print_background=True)
        await browser.close()
        return pdf_bytes
