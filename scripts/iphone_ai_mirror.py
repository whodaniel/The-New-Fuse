import subprocess
import time
import pyautogui
import cv2
import numpy as np
import json

def launch_mirroring():
    # Launches the AirPlay receiver in a background process
    # '-n' sets the broadcast name visible to AirPlay-enabled devices
    # '-vsync no' is used to prioritize low latency for real-time vision tasks
    process = subprocess.Popen(['uxplay', '-n', 'TNF-Mirror-Receiver', '-vsync', 'no'], 
                             stdout=subprocess.PIPE, stderr=subprocess.PIPE)
    print("Mirroring server started. Please connect your mobile device to 'TNF-Mirror-Receiver'...")
    return process

def get_mirror_window_location(template_path='template.png'):
    # Step 1: Take a fresh screenshot of your entire Mac desktop
    screenshot = pyautogui.screenshot()
    screenshot = cv2.cvtColor(np.array(screenshot), cv2.COLOR_RGB2BGR)
    
    # Step 2: Load your saved window header template
    template = cv2.imread(template_path)
    if template is None:
        print("Error: Could not find template.png. Please create one.")
        return None

    # Step 3: Run template matching to find the window
    res = cv2.matchTemplate(screenshot, template, cv2.TM_CCOEFF_NORMED)
    min_val, max_val, min_loc, max_loc = cv2.minMaxLoc(res) #
    
    # Check if the match is strong enough (80% similarity)
    threshold = 0.8
    if max_val >= threshold:
        top_left = max_loc
        h, w = template.shape[:2]
        # Calculate the center of the window for easier clicking
        center_x = top_left[0] + (w // 2)
        center_y = top_left[1] + (h // 2)
        print(f"Window found at: {top_left}. Center: ({center_x}, {center_y})")
        return (top_left, (top_left[0] + w, top_left[1] + h))
    else:
        print("Mirror window not found on screen.")
        return None

def crop_iphone_screen(full_screenshot_path, window_coords):
    """
    Crops the full desktop screenshot to just the iPhone mirroring window.
    window_coords is a tuple: ((x1, y1), (x2, y2))
    """
    # Load the full desktop image
    image = cv2.imread(full_screenshot_path)
    
    # Unpack coordinates
    (x1, y1), (x2, y2) = window_coords
    
    # Crop using NumPy slicing: [y_start:y_end, x_start:x_end]
    # Note: We add a small offset to y1 to skip the window title bar if needed
    cropped_image = image[y1:y2, x1:x2]
    
    # Save the clean version for the AI
    clean_filename = "ai_vision_input.png"
    cv2.imwrite(clean_filename, cropped_image)
    
    print(f"Clean crop saved: {clean_filename}")
    return clean_filename

def ai_click_on_mac(ai_x, ai_y, window_offset):
    """
    ai_x, ai_y: Coordinates provided by the AI (relative to the cropped image)
    window_offset: The (x1, y1) top-left corner found by OpenCV
    """
    # Unpack the top-left corner of the window
    offset_x, offset_y = window_offset
    
    # Calculate the real position on your Mac screen
    real_x = offset_x + ai_x
    real_y = offset_y + ai_y
    
    # Optional: Small offset if your crop included the window title bar
    # title_bar_height = 25 
    # real_y += title_bar_height

    print(f"AI requested {ai_x, ai_y}. Clicking physical Mac screen at {real_x, real_y}")
    
    # Perform the click
    # Retina Adjustment (if needed) - Divide by 2 for Retina Macs
    pyautogui.click(real_x / 2, real_y / 2)

def draw_ai_grid(image_path):
    img = cv2.imread(image_path)
    h, w = img.shape[:2]
    
    # Draw horizontal and vertical lines every 100 pixels
    for x in range(0, w, 100):
        cv2.line(img, (x, 0), (x, h), (200, 200, 200), 1)
        cv2.putText(img, str(x), (x, 20), cv2.FONT_HERSHEY_SIMPLEX, 0.5, (0,0,255), 1)
        
    for y in range(0, h, 100):
        cv2.line(img, (0, y), (w, y), (200, 200, 200), 1)
        cv2.putText(img, str(y), (5, y), cv2.FONT_HERSHEY_SIMPLEX, 0.5, (0,0,255), 1)
        
    cv2.imwrite("grid_for_ai.png", img)

def capture_for_ai(filename="full_desktop.png"):
    # Capture the full screen
    screen = pyautogui.screenshot()
    screen.save(filename)
    print(f"Screenshot saved as {filename} for AI analysis.")

def main():
    mirror_process = launch_mirroring()
    
    try:
        # Give the user time to connect their phone
        print("Waiting 10 seconds to connect...")
        time.sleep(10) 
        
        while True:
            # Capture periodically for the AI
            capture_for_ai("full_desktop.png")
            coords = get_mirror_window_location("template.png")
            if coords:
                crop_iphone_screen("full_desktop.png", coords)
                draw_ai_grid("ai_vision_input.png")
                
                # Here you would call your AI model (e.g., GPT-4o API)
                # and use ai_click_on_mac to interact based on its output
                
            time.sleep(2) # Frequency of AI checks
            
    except KeyboardInterrupt:
        print("Stopping AI Agent...")
    finally:
        mirror_process.terminate()

if __name__ == "__main__":
    main()
