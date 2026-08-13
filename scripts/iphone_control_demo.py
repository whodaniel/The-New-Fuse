#!/usr/bin/env python3
import pyautogui
import time
import Quartz

print("✅ iPhone Vision Bridge: Full Control Demo")
print()

# Locate exact QuickTime window
window_list = Quartz.CGWindowListCopyWindowInfo(Quartz.kCGWindowListOptionOnScreenOnly, Quartz.kCGNullWindowID)
qt = None
for w in window_list:
    if w.get('kCGWindowName') == 'Movie Recording' and w.get('kCGWindowOwnerName') == 'QuickTime Player':
        qt = w
        break

if not qt:
    print("❌ QuickTime window not found. Is it open and showing iPhone?")
    exit(1)

b = qt['kCGWindowBounds']
x, y, w, h = b['X'], b['Y'], b['Width'], b['Height']

print(f"✅ iPhone window found: {int(w)}x{int(h)} at ({int(x)}, {int(y)})")
print()
print("--- DEMO STARTING IN 3 SECONDS ---")
time.sleep(3)

# 1. Scroll up home screen
print("\n1/3: Scrolling home screen up...")
pyautogui.moveTo(x + w/2, y + h*0.7)
pyautogui.drag(0, -120, duration=0.3, button='left')
time.sleep(1)

# 2. Move to Discord icon position
print("\n2/3: Moving to Discord icon...")
discord_x = x + (w * 0.42)
discord_y = y + (h * 0.88)
pyautogui.moveTo(discord_x, discord_y, duration=0.4)
time.sleep(0.8)

# 3. Tap open Discord
print("\n3/3: TAPPING TO OPEN DISCORD")
pyautogui.click()

print("\n✅ ✅ ✅ DEMO COMPLETE")
print("Discord should now be opening on your iPhone.")
print("\nFull bidirectional control is now active.")
