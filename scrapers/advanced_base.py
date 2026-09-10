"""
Advanced Scraper Base with Anti-Bot Features

Includes:
- Proxy rotation
- Session management
- CAPTCHA detection
- User-agent rotation
- Cookie handling
- Advanced rate limiting
"""

from __future__ import annotations

import asyncio
import time
from datetime import datetime, timezone
from typing import Any
from urllib.parse import urljoin
from urllib.robotparser import RobotFileParser

import requests
from playwright.async_api import async_playwright, Browser, BrowserContext, Page


class RobotsPolicyError(RuntimeError):
    """Raised when a source refuses automated access according to robots.txt."""


class ProxyRotator:
    """Manages proxy rotation for scraping."""
    
    def __init__(self, proxy_list: list[str] | None = None):
        self.proxy_list = proxy_list or [
            # Add your proxy list here
            # Format: "http://ip:port" or "http://user:pass@ip:port"
        ]
        self.current_index = 0
    
    def get_next_proxy(self) -> dict | None:
        """Get next proxy in rotation."""
        if not self.proxy_list:
            return None
        
        proxy_url = self.proxy_list[self.current_index % len(self.proxy_list)]
        self.current_index += 1
        return {"http": proxy_url, "https": proxy_url}
    
    def reset(self) -> None:
        """Reset proxy rotation."""
        self.current_index = 0


class UserAgentRotator:
    """Manages user-agent rotation."""
    
    USER_AGENTS = [
        "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36",
        "Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36",
        "Mozilla/5.0 (X11; Linux x86_64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36",
        "Mozilla/5.0 (Windows NT 10.0; Win64; x64; rv:121.0) Gecko/20100101 Firefox/121.0",
        "Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/605.1.15 (KHTML, like Gecko) Version/17.1 Safari/605.1.15",
    ]
    
    def __init__(self):
        self.current_index = 0
    
    def get_next_user_agent(self) -> str:
        """Get next user-agent in rotation."""
        ua = self.USER_AGENTS[self.current_index % len(self.USER_AGENTS)]
        self.current_index += 1
        return ua


class RateLimiter:
    """Advanced rate limiting with jitter."""
    
    def __init__(self, min_interval_seconds: float = 7.0, jitter: bool = True):
        self.min_interval_seconds = min_interval_seconds
        self.jitter = jitter
        self.last_request_at: float | None = None
    
    def wait(self) -> None:
        """Wait before next request."""
        if self.last_request_at is None:
            self.last_request_at = time.monotonic()
            return
        
        elapsed = time.monotonic() - self.last_request_at
        
        # Add random jitter (±20%)
        jitter_factor = 1.0
        if self.jitter:
            import random
            jitter_factor = random.uniform(0.8, 1.2)
        
        wait_time = max(0, (self.min_interval_seconds * jitter_factor) - elapsed)
        if wait_time > 0:
            time.sleep(wait_time)
        
        self.last_request_at = time.monotonic()


class CaptchaDetector:
    """Detect CAPTCHA and anti-bot challenges."""
    
    CAPTCHA_KEYWORDS = [
        "captcha", "recaptcha", "hcaptcha", "bot", "verify",
        "challenge", "robot", "automated", "blocked", "too many requests"
    ]
    
    @staticmethod
    def detect_captcha(page_content: str | None) -> bool:
        """Detect if page contains CAPTCHA."""
        if not page_content:
            return False
        
        content_lower = page_content.lower()
        return any(keyword in content_lower for keyword in CaptchaDetector.CAPTCHA_KEYWORDS)
    
    @staticmethod
    async def detect_captcha_async(page: Page) -> bool:
        """Detect CAPTCHA on a Playwright page."""
        try:
            content = await page.content()
            return CaptchaDetector.detect_captcha(content)
        except Exception:
            return False


def check_robots_allowed(target_url: str, user_agent: str = "*", timeout_seconds: int = 5) -> bool:
    """Check robots.txt before scraping. This is a hard ethical safeguard with timeout protection."""
    robots_url = urljoin(target_url.rstrip("/") + "/", "robots.txt")
    parser = RobotFileParser()
    parser.set_url(robots_url)
    try:
        resp = requests.get(
            robots_url,
            timeout=timeout_seconds,
            headers={"User-Agent": user_agent if user_agent != "*" else "APIx-Scraper/1.0"}
        )
        if resp.status_code == 200:
            parser.parse(resp.text.splitlines())
        elif resp.status_code in (401, 403):
            raise RobotsPolicyError(f"robots.txt HTTP {resp.status_code} denies access on {target_url}")
        else:
            return True
    except RobotsPolicyError:
        raise
    except Exception as exc:
        raise RobotsPolicyError(f"Unable to fetch robots.txt for {target_url}: {exc}") from exc
    
    has_permission = parser.can_fetch(user_agent, target_url)
    if not has_permission:
        raise RobotsPolicyError(f"robots.txt denies scraping for {user_agent} on {target_url}")
    
    return True


class AdvancedScraper:
    """Base class for advanced scraping with anti-bot features."""
    
    def __init__(
        self,
        site_url: str,
        use_proxy: bool = False,
        proxy_list: list[str] | None = None,
        headless: bool = True,
        timeout_seconds: int = 60,
    ):
        self.site_url = site_url
        self.use_proxy = use_proxy
        self.proxy_rotator = ProxyRotator(proxy_list) if use_proxy else None
        self.user_agent_rotator = UserAgentRotator()
        self.rate_limiter = RateLimiter(min_interval_seconds=7.0, jitter=True)
        self.headless = headless
        self.timeout_seconds = timeout_seconds
        self.browser: Browser | None = None
        self.context: BrowserContext | None = None
    
    async def init_browser(self) -> Browser:
        """Initialize browser with advanced options."""
        playwright = await async_playwright().start()
        
        browser_args = [
            "--disable-blink-features=AutomationControlled",
            "--disable-dev-shm-usage",
            "--disable-gpu",
        ]
        
        proxy = self.proxy_rotator.get_next_proxy() if self.proxy_rotator else None
        
        self.browser = await playwright.chromium.launch(
            headless=self.headless,
            args=browser_args,
            proxy=proxy,
        )
        
        return self.browser
    
    async def create_context(self) -> BrowserContext:
        """Create browser context with stealth measures."""
        if not self.browser:
            await self.init_browser()
        
        self.context = await self.browser.new_context(
            user_agent=self.user_agent_rotator.get_next_user_agent(),
            viewport={"width": 1440, "height": 1200},
            locale="en-IN",
        )
        
        # Add stealth scripts
        await self.context.add_init_script("""
            Object.defineProperty(navigator, 'webdriver', {
                get: () => false,
            });
        """)
        
        return self.context
    
    async def safe_goto(self, page: Page, url: str) -> bool:
        """Navigate to URL with safety checks."""
        try:
            self.rate_limiter.wait()
            await page.goto(url, wait_until="domcontentloaded", timeout=self.timeout_seconds * 1000)
            await page.wait_for_load_state("networkidle", timeout=self.timeout_seconds * 1000)
            
            # Check for CAPTCHA
            if await CaptchaDetector.detect_captcha_async(page):
                return False
            
            return True
        except Exception as exc:
            print(f"Error navigating to {url}: {exc}")
            return False
    
    async def cleanup(self) -> None:
        """Cleanup browser and context."""
        if self.context:
            await self.context.close()
        if self.browser:
            await self.browser.close()
