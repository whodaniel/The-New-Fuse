#!/usr/bin/env python3
from playwright.sync_api import sync_playwright
import json

with sync_playwright() as p:
    browser = p.chromium.launch(headless=False)
    context = browser.new_context()
    page = context.new_page()
    
    # Go to email accounts page
    page.goto('https://www.stackcp.com/services/be2e4e715ddd64f5/email/email-accounts', timeout=60000)
    page.wait_for_load_state('networkidle')
    
    # Wait for user to log in if needed
    print("Page title:", page.title())
    
    # Take screenshot to see what we're looking at
    page.screenshot(path='/tmp/email_accounts.png', full_page=True)
    
    # Try to get email accounts
    # Look for table rows with email addresses
    accounts = page.locator('table tbody tr').all()
    print(f"Found {len(accounts)} rows")
    
    for i, row in enumerate(accounts):
        try:
            cells = row.locator('td').all()
            if cells:
                email = cells[0].inner_text() if len(cells) > 0 else "?"
                print(f"Row {i}: {email}")
        except Exception as e:
            print(f"Row {i}: Error - {e}")
    
    browser.close()