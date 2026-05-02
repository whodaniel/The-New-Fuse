tell application "Google Chrome"
    set targetTab to missing value
    repeat with w in windows
        repeat with t in tabs of w
            if URL of t starts with "https://labs.google/fx/tools/flow" then
                set targetTab to t
                exit repeat
            end if
        end repeat
        if targetTab is not missing value then exit repeat
    end repeat

    if targetTab is not missing value then
        set jsCode to "
            let items = [];
            // Many Google tools have JSON data embedded
            let scriptTags = Array.from(document.querySelectorAll('script')).map(s => s.textContent);
            let jsonText = scriptTags.find(s => s.includes('d8e23b93-0a09-4674-b8c4-6925f93e14a2'));
            if (!jsonText) {
                // Fallback to text content
                jsonText = document.body.innerText;
            }
            jsonText;
        "
        set content to execute targetTab javascript jsCode
        return content
    else
        return "ERROR: Flow project tab not found."
    end if
end tell
