// native-host.ts
import * as process from 'process';

// Listen for incoming data from the Chrome extension
process.stdin.on('data', (chunk) => {
    // The first 4 bytes of the chunk represent the message length
    const length = chunk.readUInt32LE(0);
    // The rest of the chunk is the message itself
    const message = chunk.slice(4, 4 + length).toString();
    const data = JSON.parse(message);

    // Process the data received from the extension
    if (data.action === 'receiveText') {
        // --- YOUR AI LOGIC GOES HERE ---
        // Process the `data.text` with your local AI
        const aiResponse = `AI processed the following text: "${data.text}"`;
        // --- END AI LOGIC ---

        // Send a response back to the extension to be injected into the page
        const response = { action: "injectText", text: aiResponse };
        const responseBuffer = Buffer.from(JSON.stringify(response));
        
        // Create a 4-byte header with the length of the message
        const header = Buffer.alloc(4);
        header.writeUInt32LE(responseBuffer.length, 0);

        // Write the header and the message to standard output
        process.stdout.write(header);
        process.stdout.write(responseBuffer);
    }
});