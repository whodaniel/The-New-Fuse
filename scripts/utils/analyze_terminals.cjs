const fs = require('fs');

const content = fs.readFileSync('/tmp/terminal_v3.txt', 'utf8');
const tabs = content.split('---END_TAB---');

const results = [];

tabs.forEach(tab => {
    if (!tab.trim()) return;
    
    const lines = tab.split('\n');
    let winIdx, tabIdx, title, busy, historyLines = [];
    let inHistory = false;
    
    lines.forEach(line => {
        if (line.startsWith('WINDOW_INDEX:')) winIdx = line.split(':')[1];
        else if (line.startsWith('TAB_INDEX:')) tabIdx = line.split(':')[1];
        else if (line.startsWith('TITLE:')) title = line.split(':')[1];
        else if (line.startsWith('BUSY:')) busy = line.split(':')[1];
        else if (line === 'HISTORY_START') inHistory = true;
        else if (line === 'HISTORY_END') inHistory = false;
        else if (inHistory) historyLines.push(line);
    });
    
    const history = historyLines.join('\n');
    let unfinishedBusiness = [];
    let isOld = false;
    
    // Logic for unfinished business
    if (history.includes('error:') || history.includes('Error:')) {
        unfinishedBusiness.push('Contains error messages');
    }
    if (history.includes('Usage limit hit') || history.includes('usage limit')) {
        unfinishedBusiness.push('LLM Rate limited / Usage limit hit');
    }
    if (history.includes('Failed to connect') || history.includes('ECONNREFUSED')) {
        unfinishedBusiness.push('Connection failure');
    }
    
    // Determine if old
    // If history shows restorations from March or early April, it might be an old session
    if (history.includes('Restored Mar') || history.includes('Restored Apr 1') || history.includes('Restored Apr 2')) {
        // But only if it's currently idle
        if (busy === 'false') isOld = true;
    }
    
    if (title && title.toLowerCase().includes('claude')) {
        unfinishedBusiness.push('Claude agent (Unpaid/Dead end)');
        isOld = true;
    }
    
    if (busy === 'false' && (history.trim().endsWith('%') || history.trim().endsWith('$'))) {
        // Idle shell
        if (history.length < 1000) isOld = true;
    }

    results.push({
        winIdx,
        tabIdx,
        title: title ? title.trim() : 'unknown',
        busy,
        isOld,
        unfinishedBusiness,
        lastLine: history.trim().split('\n').pop()
    });
});

console.log(JSON.stringify(results, null, 2));
