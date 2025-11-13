-- Full Screen Screenshot Capture Application
-- This script captures the entire screen and saves it with a timestamp

on run
    captureFullScreen()
end run

-- Main screenshot capture function
on captureFullScreen()
    try
        -- Create timestamp for unique filename
        set currentDate to current date
        set dateStr to (year of currentDate) & "-" & ¬
            (text -2 thru -1 of ("0" & (month of currentDate as integer))) & "-" & ¬
            (text -2 thru -1 of ("0" & (day of currentDate)))
        set timeStr to (text -2 thru -1 of ("0" & (hours of currentDate))) & "-" & ¬
            (text -2 thru -1 of ("0" & (minutes of currentDate))) & "-" & ¬
            (text -2 thru -1 of ("0" & (seconds of currentDate)))
        set timestamp to dateStr & "_" & timeStr
        
        -- Get Desktop path
        set desktopPath to POSIX path of (path to desktop)
        set screenshotFile to desktopPath & "FullScreen_" & timestamp & ".png"
        
        -- Show capture dialog with options
        set userChoice to display dialog "Screenshot Capture Options:" buttons {"Cancel", "Capture Now", "Capture with Delay"} default button "Capture Now" with title "Screenshot Tool"
        
        if button returned of userChoice is "Cancel" then
            return
        else if button returned of userChoice is "Capture with Delay" then
            -- 3-second delay for positioning
            display notification "Screenshot in 3 seconds..." with title "Screenshot Delay"
            delay 3
        end if
        
        -- Capture the full screen
        -- Options: -x (no sound), -t png (PNG format), -C (include cursor)
        do shell script "screencapture -x -t png -C '" & screenshotFile & "'"
        
        -- Success notification
        display notification "Full screen captured successfully!" with title "Screenshot Saved" subtitle "File: FullScreen_" & timestamp & ".png"
        
        -- Ask if user wants to open the screenshot
        set openChoice to display dialog "Screenshot saved to Desktop. Would you like to open it?" buttons {"No", "Yes"} default button "Yes" with title "Screenshot Complete"
        
        if button returned of openChoice is "Yes" then
            do shell script "open '" & screenshotFile & "'"
        end if
        
        -- Return the file path
        return screenshotFile
        
    on error errMsg number errNum
        display alert "Screenshot Error" message "Failed to capture screenshot: " & errMsg & " (Error " & errNum & ")" buttons {"OK"} default button "OK" as critical
        return false
    end try
end captureFullScreen

-- Additional function for quick capture (can be called programmatically)
on quickCapture()
    try
        set currentDate to current date
        set timestamp to (year of currentDate) & (month of currentDate as integer) & (day of currentDate) & "_" & (time of currentDate)
        set desktopPath to POSIX path of (path to desktop)
        set screenshotFile to desktopPath & "Quick_" & timestamp & ".png"
        
        do shell script "screencapture -x -t png '" & screenshotFile & "'"
        display notification "Quick screenshot captured!" with title "Screenshot"
        
        return screenshotFile
    on error
        return false
    end try
end quickCapture

-- Function to capture specific area (interactive selection)
on captureSelection()
    try
        set currentDate to current date
        set timestamp to (year of currentDate) & (month of currentDate as integer) & (day of currentDate) & "_" & (time of currentDate)
        set desktopPath to POSIX path of (path to desktop)
        set screenshotFile to desktopPath & "Selection_" & timestamp & ".png"
        
        -- -s flag enables selection mode
        do shell script "screencapture -x -t png -s '" & screenshotFile & "'"
        display notification "Selection screenshot captured!" with title "Screenshot"
        
        return screenshotFile
    on error
        return false
    end try
end captureSelection
