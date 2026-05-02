tell application "Google Chrome"
	set jsCode to "
(async () => {
try {
const response = await fetch('https://labs.google/fx/api/trpc/media.getMediaUrlRedirect?name=d8e23b93-0a09-4674-b8c4-6925f93e14a2', { redirect: 'follow' });
const text = await response.text();
return 'Status: ' + response.status + ' Type: ' + response.headers.get('content-type') + ' Body len: ' + text.length + ' Snippet: ' + text.substring(0, 50);
} catch(e) {
return e.toString();
}
})();
"
	set resultText to execute active tab of front window javascript jsCode
	return resultText
end tell
