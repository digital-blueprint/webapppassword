#!/usr/bin/env python3
"""Capture WebAppPassword documentation screenshots with fictional data."""

import argparse
import json
import mimetypes
import os
from pathlib import Path
import re
import shutil
import subprocess
from tempfile import TemporaryDirectory
import time
from urllib.error import URLError
from urllib.parse import urlsplit
from urllib.request import urlopen
from xml.sax.saxutils import escape

from playwright.sync_api import Browser, Page, Route, expect, sync_playwright


ROOT = Path(__file__).resolve().parent.parent
EXAMPLE = ROOT / "docs" / "example"
OUTPUT = ROOT / "docs" / "screenshots"
DEMO_ORIGIN = "http://demo.example.test"
NEXTCLOUD_ORIGIN = "http://cloud.example.test"
APP_PATH = "/index.php/apps/webapppassword"
DAV_PATH = "/remote.php/dav/files"
DEMO_LOGIN = "alex-demo"
DEMO_FILES = (
    ("Documents", None, 0),
    ("Project-notes.md", "text/markdown", 2048),
    ("Quarterly-report.pdf", "application/pdf", 245760),
    ("Workshop-agenda.txt", "text/plain", 4096),
)


def dav_listing() -> str:
    """Build a fake WebDAV directory response shared by both demo views."""
    responses = []
    for name, mime, size in (("", None, 0), *DEMO_FILES):
        href = escape(f"{DAV_PATH}/{DEMO_LOGIN}/{name}")
        if name and mime is None:
            href += "/"
        resource_type = "<d:collection/>" if mime is None else ""
        file_properties = (
            f"<d:getcontenttype>{mime}</d:getcontenttype>"
            f"<d:getcontentlength>{size}</d:getcontentlength>"
            if mime is not None
            else ""
        )
        responses.append(f"""  <d:response><d:href>{href}</d:href>
    <d:propstat><d:prop>
      <d:resourcetype>{resource_type}</d:resourcetype>{file_properties}
      <d:getlastmodified>Tue, 10 Nov 2026 10:00:00 GMT</d:getlastmodified>
    </d:prop><d:status>HTTP/1.1 200 OK</d:status></d:propstat>
  </d:response>""")
    return '<d:multistatus xmlns:d="DAV:">\n' + "\n".join(responses) + "\n</d:multistatus>"


def route_demo(route: Route) -> None:
    """Serve the checked-in demo and intercept its popup and DAV requests."""
    request = route.request
    url = urlsplit(request.url)
    origin = f"{url.scheme}://{url.netloc}"
    if origin == DEMO_ORIGIN:
        path = (EXAMPLE / url.path.lstrip("/")).resolve()
        if path.is_relative_to(EXAMPLE) and path.is_file():
            route.fulfill(path=path, content_type=mimetypes.guess_type(path)[0])
            return
    elif origin == NEXTCLOUD_ORIGIN:
        if url.path == APP_PATH and request.is_navigation_request():
            payload = json.dumps(
                {"type": "webapppassword", "loginName": DEMO_LOGIN, "token": "demo-token-not-valid"}
            )
            route.fulfill(
                content_type="text/html",
                body=f"<script>window.opener.postMessage({payload}, {json.dumps(DEMO_ORIGIN)})</script>",
            )
            return
        if url.path.rstrip("/") == f"{DAV_PATH}/{DEMO_LOGIN}":
            headers = {
                "Access-Control-Allow-Origin": DEMO_ORIGIN,
                "Access-Control-Allow-Methods": "PROPFIND",
                "Access-Control-Allow-Headers": "Authorization, Content-Type, Depth",
            }
            if request.method == "OPTIONS":
                route.fulfill(status=204, headers=headers)
                return
            if request.method == "PROPFIND":
                route.fulfill(
                    status=207, headers=headers, content_type="application/xml", body=dav_listing()
                )
                return
    route.abort()


def capture(page: Page, *, style: str | None = None) -> bytes:
    page.evaluate("document.fonts.ready")
    page.mouse.move(0, 0)
    return page.screenshot(animations="disabled", style=style)


def capture_demo(browser: Browser) -> dict[str, bytes]:
    context = browser.new_context(
        viewport={"width": 1440, "height": 960},
        locale="en-US",
        color_scheme="light",
        timezone_id="UTC",
        reduced_motion="reduce",
        service_workers="block",
    )
    context.route("**/*", route_demo)
    try:
        screenshots = {}
        for name, button in (
            ("file-picker", "Open WebDAV file picker"),
            ("webdav", "Show WebDAV response"),
        ):
            page = context.new_page()
            page.goto(f"{DEMO_ORIGIN}/index.html")
            page.locator("#app-url").fill(f"{NEXTCLOUD_ORIGIN}{APP_PATH}")
            page.locator("#webdav-url").fill(f"{NEXTCLOUD_ORIGIN}{DAV_PATH}")
            if name == "file-picker":
                page.wait_for_function("customElements.get('dbp-file-source') !== undefined")
            page.get_by_role("button", name=button, exact=True).click()
            if name == "file-picker":
                page.get_by_role("button", name="Connect Nextcloud", exact=True).click()
                file_row = page.locator(".tabulator-row").filter(has_text="Quarterly-report.pdf")
                file_row.click()
                expect(file_row).to_have_class(re.compile(r"\btabulator-selected\b"))
                expect(page.get_by_role("button", name="Select files", exact=True)).to_be_enabled()
            else:
                expect(page.locator("#output")).to_have_value(re.compile("demo-token-not-valid"))
                expect(page.locator("#output2")).to_have_value(re.compile("<d:multistatus"))
            screenshots[name] = capture(page)
            page.close()
        return screenshots
    finally:
        context.close()


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


def capture_admin(browser: Browser) -> bytes:
    base_url = os.environ.get("SCREENSHOT_URL", "http://localhost:8081").rstrip("/")
    wait_for_nextcloud(base_url)

    page = browser.new_page(
        viewport={"width": 1440, "height": 1120},
        locale="en-US",
        color_scheme="light",
        reduced_motion="reduce",
        extra_http_headers={"Accept-Language": "en"},
    )
    try:
        page.set_default_timeout(30_000)
        page.goto(f"{base_url}/index.php/login")
        page.locator("#user").fill(os.environ.get("SCREENSHOT_USER", "admin"))
        page.locator("#password").fill(os.environ.get("SCREENSHOT_PASSWORD", "admin"))
        page.locator('button[type="submit"], input[type="submit"]').click()
        page.wait_for_url(lambda url: "/login" not in url)
        page.goto(f"{base_url}/index.php/settings/admin/webapppassword")

        # Fill the real UI, but deliberately do not click "Set origins".
        for selector, origins in {
            "#webapppassword-origins-entry": "https://workspace.example.org,https://*.projects.example.org",
            "#files-sharing-webapppassword-origins-entry": "https://share.example.org",
            "#preview-webapppassword-origins-entry": "https://gallery.example.org",
        }.items():
            page.locator(selector).fill(origins)
            page.locator(selector).press("Enter")
        expect(page.locator("#webapppassword-store-origins")).to_be_in_viewport()
        page.evaluate("document.activeElement.blur()")
        expect(page.locator("#header").get_by_role("button", name="Settings menu")).to_be_visible()
        # Hide the onboarding overlay in the image without changing account preferences.
        return capture(page, style="#firstrunwizard { visibility: hidden !important; }")
    finally:
        page.close()


def main() -> None:
    parser = argparse.ArgumentParser(description=__doc__)
    modes = parser.add_mutually_exclusive_group()
    modes.add_argument("--admin-only", action="store_true", help="Only capture Nextcloud admin settings")
    modes.add_argument("--demo-only", action="store_true", help="Only capture the two mocked demo views")
    args = parser.parse_args()

    cwebp = shutil.which("cwebp")
    if not cwebp:
        raise RuntimeError("cwebp is required. Run the script in the devenv development shell.")

    screenshots = {}
    with sync_playwright() as playwright:
        browser = playwright.chromium.launch()
        if not args.demo_only:
            screenshots["admin"] = capture_admin(browser)
        if not args.admin_only:
            screenshots.update(capture_demo(browser))
        browser.close()

    OUTPUT.mkdir(parents=True, exist_ok=True)
    # Stage every conversion before replacing any existing screenshot.
    with TemporaryDirectory(dir=OUTPUT) as directory:
        stage = Path(directory)
        png = stage / "capture.png"
        for name, image in screenshots.items():
            png.write_bytes(image)
            subprocess.run(
                [cwebp, "-quiet", "-lossless", str(png), "-o", str(stage / f"{name}.webp")],
                check=True,
            )
        for name in screenshots:
            destination = OUTPUT / f"{name}.webp"
            (stage / destination.name).replace(destination)
            print(f"Updated {destination.relative_to(ROOT)}")


if __name__ == "__main__":
    try:
        main()
    except RuntimeError as error:
        raise SystemExit(str(error)) from error
