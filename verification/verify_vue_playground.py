import os
from playwright.sync_api import Page, expect, sync_playwright

def verify_vue_playground(page: Page):
    print("Navigating to Vue Playground...")
    page.goto("http://localhost:5174")

    # Wait for the app to load
    expect(page.locator("h1")).to_contain_text("Widget Controls")
    print("Loaded.")

    # Check initial state (should be Container mode by default)
    expect(page.get_by_text("Current Mode:")).to_be_visible()

    # Wait for "Connected" (might take a second due to onMounted)
    expect(page.get_by_text("✅ Connected")).to_be_visible()

    # Screenshot initial state
    page.screenshot(path="verification/vue_playground_initial.png")
    print("Initial screenshot taken.")

    # Click FAB Bottom Right
    print("Switching to FAB Bottom Right...")
    page.get_by_role("button", name="Bottom Right").click()

    # Wait a bit for transition
    page.wait_for_timeout(500)

    # Check if mode updated in Status panel
    expect(page.get_by_text("fab_bottom_right")).to_be_visible()

    # Click Sidebar Right
    print("Switching to Sidebar Right...")
    page.get_by_role("button", name="Right", exact=True).click()

    # Wait for transition
    page.wait_for_timeout(500)

    expect(page.get_by_text("sidebar_right")).to_be_visible()

    # Take final screenshot
    page.screenshot(path="verification/vue_playground_sidebar.png")
    print("Final screenshot taken.")

if __name__ == "__main__":
    os.makedirs("verification", exist_ok=True)
    with sync_playwright() as p:
        browser = p.chromium.launch(headless=True)
        page = browser.new_page(viewport={"width": 1280, "height": 720})
        try:
            verify_vue_playground(page)
        finally:
            browser.close()
