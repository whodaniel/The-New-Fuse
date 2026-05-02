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
            (async function() {
                try {
                    const url = 'https://labs.google/fx/api/trpc/media.getMediaUrlRedirect?name=42575687-3121-49b3-8ad5-7d248c92ac21';
                    const resp = await fetch(url);
                    if (!resp.ok) return 'HTTP ' + resp.status;
                    const blob = await resp.blob();
                    return new Promise((resolve) => {
                        const reader = new FileReader();
                        reader.onloadend = () => resolve(reader.result);
                        reader.readAsDataURL(blob);
                    });
                } catch(e) {
                    return e.toString();
                }
            })();
        "
        set b64 to execute targetTab javascript jsCode
        return b64
    else
        return "ERROR: Flow project tab not found."
    end if
end tell
