#!/usr/bin/osascript

on run
    do shell script "echo 'AppleScript test starting'"
    
    -- Simple dialog test
    display dialog "This is a test dialog from AppleScript" buttons {"OK"} default button "OK"
    
    do shell script "echo 'Dialog was shown successfully'"
    
    return "Test completed successfully"
end run
