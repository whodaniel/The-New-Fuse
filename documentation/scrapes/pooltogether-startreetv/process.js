const fs = require('fs');
const path = require('path');

const dataPath = 'workspace/scrapes/pooltogether-startreetv/messages.jsonl';
const rawData = fs.readFileSync(dataPath, 'utf8');

const lines = rawData.split('\n').filter((l) => l.trim());
const messages = lines.map((l) => JSON.parse(l));

// Deduplicate by content and date
const uniqueMap = new Map();
messages.forEach((m) => {
  const key = `${m.date}|${m.content}`;
  uniqueMap.set(key, m);
});

const sortedMessages = Array.from(uniqueMap.values()).sort(
  (a, b) => new Date(a.date) - new Date(b.date)
);

// Save cleaned data
fs.writeFileSync(
  'workspace/scrapes/pooltogether-startreetv/cleaned_messages.json',
  JSON.stringify(sortedMessages, null, 2)
);

// Generate Markdown Timeline
let md = '# StarTreeTV - PoolTogether Timeline\n\n';
sortedMessages.forEach((m) => {
  const dateStr = new Date(m.date).toLocaleString('en-US', { timeZone: 'America/New_York' });
  md += `## ${dateStr}\n**Channel:** ${m.channel}\n\n${m.content}\n\n---\n\n`;
});
fs.writeFileSync('workspace/scrapes/pooltogether-startreetv/TIMELINE.md', md);

// Generate Mermaid Chart
let mermaid = 'mermaid\ngraph TD\n';
let lastDate = '';
sortedMessages.forEach((m, i) => {
  const dateStr = new Date(m.date).toLocaleDateString();
  if (dateStr !== lastDate) {
    mermaid += `  subgraph "${dateStr}"\n`;
    mermaid += `    msg${i}["${m.content.substring(0, 50).replace(/"/g, "'")}..."]\n`;
    mermaid += `  end\n`;
    if (i > 0) mermaid += `  msg${i - 1} --> msg${i}\n`;
    lastDate = dateStr;
  } else {
    mermaid += `  msg${i}["${m.content.substring(0, 50).replace(/"/g, "'")}..."]\n`;
    if (i > 0) mermaid += `  msg${i - 1} --> msg${i}\n`;
  }
});
fs.writeFileSync('workspace/scrapes/pooltogether-startreetv/MAP.mermaid', mermaid);

// Generate Navigable HTML
let html = `
<!DOCTYPE html>
<html>
<head>
    <title>StarTreeTV PoolTogether Map</title>
    <style>
        body { font-family: sans-serif; line-height: 1.6; max-width: 800px; margin: 20px auto; padding: 0 20px; background: #f4f4f9; }
        .message { background: white; padding: 15px; margin-bottom: 20px; border-radius: 8px; box-shadow: 0 2px 4px rgba(0,0,0,0.1); }
        .date { color: #666; font-size: 0.9em; font-weight: bold; }
        .channel { color: #007bff; font-size: 0.8em; }
        .content { margin-top: 10px; white-space: pre-wrap; }
        h1 { text-align: center; color: #333; }
    </style>
</head>
<body>
    <h1>StarTreeTV - PoolTogether Contributions</h1>
    <div id="timeline">
`;

sortedMessages.forEach((m) => {
  const dateStr = new Date(m.date).toLocaleString();
  html += `
        <div class="message">
            <div class="date">${dateStr}</div>
            <div class="channel">${m.channel}</div>
            <div class="content">${m.content}</div>
        </div>
  `;
});

html += `
    </div>
</body>
</html>
`;
fs.writeFileSync('workspace/scrapes/pooltogether-startreetv/MAP.html', html);
