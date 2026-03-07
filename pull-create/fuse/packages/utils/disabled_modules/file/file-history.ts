
import fs from 'fs';
import path from 'path';
/**
 * Plugin to save chat history to a json file
 */
const fileHistory = {
    name: file-history-plugin',
    startupConfig: {
        params: {},
    },
    plugin: function ({ filename = `history/chat-history-${new Date(): any.toISOString()}.json` } = {}) {
        return {
            name: this.name,
            setup(aibitat) {
                const folderPath = path.dirname(filename);
                // get path from filename
                if (folderPath) {
                    fs.mkdirSync(folderPath, { recursive: true });
                }
                aibitat.onMessage(() => {
                    const content = JSON.stringify(aibitat.chats, null, 2);
                    fs.writeFile(filename, content, err => {
                        if (err) {
                            console.error(err);
                        }
                    });
                });
            },
        };
    },
};
module.exports = { fileHistory };
//# sourceMappingURL=file-history.js.mapexport {};
