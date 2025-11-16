// Quick Extension Diagnostic
// Copy and paste this into the Extension Development Host Console

// Check if our extension is loaded
const extensions = vscode.extensions.all;
const theNewFuse = extensions.find(ext => ext.id.includes('the-new-fuse'));

if (theNewFuse) {
    console.log('✅ The New Fuse extension found!');
    console.log('📦 Extension ID:', theNewFuse.id);
    console.log('📍 Is Active:', theNewFuse.isActive);
    console.log('📝 Display Name:', theNewFuse.packageJSON.displayName);
    console.log('🤖 View Containers:', theNewFuse.packageJSON.contributes?.viewsContainers);
} else {
    console.log('❌ The New Fuse extension NOT found');
    console.log('📋 Available extensions:', extensions.map(e => e.id).filter(id => !id.startsWith('vscode.')));
}

// Check for view containers
const containers = vscode.window.createTreeView ? 'TreeView API available' : 'TreeView API not available';
console.log('🌳 TreeView API:', containers);

// Check for our specific commands
const commands = vscode.commands.getCommands(true);
commands.then(allCommands => {
    const ourCommands = allCommands.filter(cmd => cmd.includes('the-new-fuse'));
    console.log('🎯 Our commands found:', ourCommands.length);
    ourCommands.forEach(cmd => console.log('  -', cmd));
});
