#!/usr/bin/env python3
"""Capture the local Nextcloud admin settings without saving example origins."""

import json
import os
from pathlib import Path
import time
from urllib.error import URLError
from urllib.request import urlopen

from playwright.sync_api import sync_playwright


def wait_for_nextcloud(base_url: str) -> None:
    """Allow the Docker entrypoint up to five minutes to install Nextcloud."""
    deadline = time.monotonic() + 300
    while time.monotonic() < deadline:
        try:
            with urlopen(f"{base_url}/status.php", timeout=5) as response:
                status = json.load(response)
            if (
                status.get("installed")
                and status.get("needsDbUpgrade")
                and not status.get("maintenance")
            ):
                raise RuntimeError(
                    "Nextcloud requires an upgrade before taking a screenshot. "
                    "For the local development instance, run: just upgrade"
                )
            if (
                status.get("installed")
                and not status.get("maintenance")
                and not status.get("needsDbUpgrade")
            ):
                return
        except (URLError, TimeoutError, ValueError):
            pass
        time.sleep(2)
    raise RuntimeError(f"Nextcloud at {base_url} was not ready within five minutes")


def main() -> None:
    base_url = os.environ.get("SCREENSHOT_URL", "http://localhost:8081").rstrip("/")
    output = Path(__file__).resolve().parent.parent / "screenshot.png"
    wait_for_nextcloud(base_url)

    with sync_playwright() as playwright:
        browser = playwright.chromium.launch()
        page = browser.new_page(
            viewport={"width": 1660, "height": 1660},
            device_scale_factor=1,
            locale="en-US",
            color_scheme="light",
            reduced_motion="reduce",
        )
        page.set_default_timeout(30_000)
        page.goto(f"{base_url}/index.php/login")
        page.locator("#user").fill(os.environ.get("SCREENSHOT_USER", "admin"))
        page.locator("#password").fill(os.environ.get("SCREENSHOT_PASSWORD", "admin"))
        page.locator('button[type="submit"], input[type="submit"]').click()
        page.wait_for_url(lambda url: "/login" not in url)
        page.goto(f"{base_url}/index.php/settings/admin/webapppassword")

        # Fill the real UI, but deliberately do not click "Set origins".
        for selector in (
            "#webapppassword-origins",
            "#files-sharing-webapppassword-origins",
            "#preview-webapppassword-origins",
        ):
            page.locator(selector).fill("https://example.com,https://*.example.org")
        page.locator("#webapppassword-store-origins").wait_for(state="visible")
        page.evaluate("document.activeElement.blur()")
        page.evaluate("document.fonts.ready")
        page.screenshot(path=str(output), animations="disabled")
        browser.close()

    print(f"Updated {output}")


if __name__ == "__main__":
    try:
        main()
    except RuntimeError as error:
        raise SystemExit(str(error)) from error
