/**
 * Test Native Commands - Run in Chrome DevTools Console
 *
 * Copy and paste these commands into the browser console
 * (on any webpage, not chrome:// pages)
 *
 * This will send commands to the Electron app via the Chrome extension
 */

// Extension ID for The New Fuse AI Bridge
const EXTENSION_ID = 'koddjfgfedjfamjgganioboekladjlcf';

// Helper function to send native commands
function sendNativeCommand(command, args = []) {
  return new Promise((resolve, reject) => {
    const message = {
      type: 'SEND_NATIVE_MESSAGE',
      payload: {
        id: `cmd-${Date.now()}`,
        command: command,
        args: args,
      },
    };

    chrome.runtime.sendMessage(EXTENSION_ID, message, (response) => {
      if (chrome.runtime.lastError) {
        reject(chrome.runtime.lastError);
      } else {
        resolve(response);
      }
    });
  });
}

// ============================================
// TEST COMMANDS - Copy each one to console
// ============================================

// 1. Check system status
console.log('Sending check_system command...');
sendNativeCommand('check_system')
  .then((r) => console.log('System Status:', r))
  .catch((e) => console.error(e));

// 2. Open an application (e.g., Calculator)
// sendNativeCommand("open_application", ["Calculator"]).then(r => console.log("Open App:", r));

// 3. Kill a process by name
// sendNativeCommand("kill_process", ["node"]).then(r => console.log("Kill:", r));

// 4. Check if a file exists
// sendNativeCommand("file_operation", ["exists", "/tmp"]).then(r => console.log("File exists:", r));

// 5. Get prompt templates
// sendNativeCommand("get_prompt_templates").then(r => console.log("Templates:", r));

// 6. Execute a custom command (e.g., list directory)
// sendNativeCommand("ls", ["-la", "/tmp"]).then(r => console.log("LS:", r));

console.log('Commands dispatched. Check for responses above.');
