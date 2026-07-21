"""
0xVerdict — Reconnaissance Engine (Member 1: Task 1.1)
Crawls target domain, extracts links/forms, and evaluates security headers.
"""

import asyncio
import aiohttp
from urllib.parse import urljoin, urlparse
from html.parser import HTMLParser
from typing import Optional
import re


CRITICAL_SECURITY_HEADERS = [
    "Content-Security-Policy",
    "Strict-Transport-Security",
    "X-Frame-Options",
    "Referrer-Policy",
    "X-Content-Type-Options",
    "Permissions-Policy",
]

CRAWL_DEPTH = 2
MAX_PAGES = 30
REQUEST_TIMEOUT = 10


class LinkFormParser(HTMLParser):
    """Lightweight HTML parser to extract links and forms."""

    def __init__(self, base_url: str):
        super().__init__()
        self.base_url = base_url
        self.links: list[str] = []
        self.forms: list[dict] = []
        self._current_form: Optional[dict] = None

    def handle_starttag(self, tag, attrs):
        attrs_dict = dict(attrs)

        if tag == "a":
            href = attrs_dict.get("href", "")
            if href and not href.startswith(("#", "mailto:", "tel:", "javascript:")):
                full_url = urljoin(self.base_url, href)
                if full_url.startswith(self.base_url):
                    self.links.append(full_url)

        elif tag == "form":
            self._current_form = {
                "endpoint": urljoin(self.base_url, attrs_dict.get("action", "/")),
                "method": attrs_dict.get("method", "GET").upper(),
                "inputs": [],
            }

        elif tag == "input" and self._current_form is not None:
            inp_type = attrs_dict.get("type", "text").lower()
            inp_name = attrs_dict.get("name", "")
            if inp_name and inp_type not in ("hidden", "submit", "button", "reset"):
                self._current_form["inputs"].append({
                    "name": inp_name,
                    "type": inp_type,
                })

        elif tag == "textarea" and self._current_form is not None:
            inp_name = attrs_dict.get("name", "")
            if inp_name:
                self._current_form["inputs"].append({
                    "name": inp_name,
                    "type": "textarea",
                })

    def handle_endtag(self, tag):
        if tag == "form" and self._current_form is not None:
            if self._current_form["inputs"]:
                self.forms.append(self._current_form)
            self._current_form = None


class ReconEngine:
    def __init__(self, target_url: str):
        self.target_url = target_url.rstrip("/")
        self.base_domain = urlparse(target_url).netloc
        self.visited: set[str] = set()
        self.pages_found: list[str] = []
        self.forms_found: list[dict] = []
        self.headers_collected: dict = {}
        self.missing_headers: list[str] = []

    async def run(self) -> dict:
        """Execute full reconnaissance: crawl + header analysis."""
        connector = aiohttp.TCPConnector(ssl=False)
        timeout = aiohttp.ClientTimeout(total=REQUEST_TIMEOUT)
        async with aiohttp.ClientSession(connector=connector, timeout=timeout) as session:
            # Collect root headers first
            await self._collect_headers(session)
            # Crawl pages
            await self._crawl(session, self.target_url, depth=0)

        return {
            "pages_found": self.pages_found,
            "forms_found": self.forms_found,
            "headers_collected": self.headers_collected,
            "missing_headers": self.missing_headers,
        }

    async def _collect_headers(self, session: aiohttp.ClientSession):
        """Analyze HTTP security headers on root URL."""
        try:
            async with session.get(self.target_url) as resp:
                raw_headers = dict(resp.headers)
                self.headers_collected = {k: v for k, v in raw_headers.items()}
                self.missing_headers = [
                    h for h in CRITICAL_SECURITY_HEADERS
                    if h.lower() not in {k.lower() for k in raw_headers}
                ]
        except Exception as e:
            self.headers_collected = {"Error": str(e)}

    async def _crawl(self, session: aiohttp.ClientSession, url: str, depth: int):
        """Recursively crawl the target domain up to CRAWL_DEPTH."""
        if depth > CRAWL_DEPTH or url in self.visited or len(self.pages_found) >= MAX_PAGES:
            return

        self.visited.add(url)

        try:
            async with session.get(url) as resp:
                if "text/html" not in resp.headers.get("Content-Type", ""):
                    return
                html = await resp.text(errors="replace")
                path = urlparse(url).path or "/"
                if path not in self.pages_found:
                    self.pages_found.append(path)

                parser = LinkFormParser(self.target_url)
                parser.feed(html)

                # Deduplicate forms by endpoint+method
                for form in parser.forms:
                    key = (form["endpoint"], form["method"])
                    if not any(
                        (f["endpoint"], f["method"]) == key for f in self.forms_found
                    ):
                        self.forms_found.append(form)

                # Crawl discovered links
                tasks = [
                    self._crawl(session, link, depth + 1)
                    for link in set(parser.links)
                    if link not in self.visited
                ]
                if tasks:
                    await asyncio.gather(*tasks, return_exceptions=True)

        except Exception:
            pass  # Skip unreachable pages silently
