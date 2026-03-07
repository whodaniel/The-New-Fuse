tell application "Google Chrome"
	activate
	set jsCode to "
		(async function() {
			try {
				let results = [];
				let url = 'https://labs.google/fx/api/trpc/media.getMediaUrlRedirect?name=d8e23b93-0a09-4674-b8c4-6925f93e14a2';
				const response = await fetch(url, { redirect: 'follow' });
				const text = await response.text();
				document.body.setAttribute('data-test-result', 'Status: ' + response.status + ' | Body: ' + text.substring(0, 150));
			} catch(e) {
				document.body.setAttribute('data-test-result', 'Error: ' + e.toString());
			}
		})();
	"
	execute active tab of front window javascript jsCode
	delay 3
	set resultText to execute active tab of front window javascript "document.body.getAttribute('data-test-result')"
	return resultText
end tell
