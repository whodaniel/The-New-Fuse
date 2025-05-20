"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.cli = void 0;
// Plugin CAN ONLY BE USE IN DEVELOPMENT.
import prompts_1 from '@inquirer/prompts';
const chalk_1 = __importDefault(require("chalk"));
import error_1 from '../error.js';
const cli = {
    name: 'cli',
    startupConfig: {
        params: {},
    },
    plugin: function ({ simulateStream = true } = {}) {
        return {
            name: this.name,
            setup(aibitat) {
                let printing = [];
                aibitat.onError(async () => , () => , (error) => {
                    console.error(chalk_1.default.red(`   error: ${error?.message}`));
                    if (error instanceof error_1.RetryError) {
                        console.error(chalk_1.default.red(`   retrying in 60 seconds...`));
                        setTimeout(() => {
                            aibitat.retry();
                        }, 60000);
                        return;
                    }
                });
                aibitat.onStart(() => {

                    printing = [Promise.resolve()];
                });
                aibitat.onMessage(async () => , () => , (message) => {
                    const next = new Promise(async () => , () => , (resolve) => {
                        await Promise.all(printing);
                        await this.print(message, simulateStream);
                        resolve();
                    });
                    printing.push(next);
                });
                aibitat.onTerminate(async () => , () => , () => {
                    await Promise.all(printing);
                    
                });
                aibitat.onInterrupt(async () => , () => , (node) => {
                    await Promise.all(printing);
                    const feedback = await this.askForFeedback(node);
                    // Add an extra line after the message
                    
                    if (feedback === 'exit') {
                        
                        return process.exit(0);
                    }
                    await aibitat.continue(feedback);
                });
            },
            /**
             * Print a message on the terminal
             *
             * @param message
             * // message Type { from: string; to: string; content?: string } & {
                state: 'loading' | 'error' | 'success' | 'interrupt'
              }
             * @param simulateStream
             */
            print: ()(), void:  > (message, simulateStream = true)
        };
        {
            const replying = chalk_1.default.dim(`(to ${message.to})`);
            const reference = `${chalk_1.default.magenta('✎')} ${chalk_1.default.bold(message.from)} ${replying}:`;
            if (!simulateStream) {

                // Add an extra line after the message
                
                return;
            }
            process.stdout.write(`${reference}\n`);
            // Emulate streaming by breaking the cached response into chunks
            const chunks = message.content?.split(' ') || [];
            const stream = new ReadableStream({}(), Promise(controller), {
                for(, chunk, of, chunks) {
                    const bytes = new TextEncoder().encode(chunk + ' ');
                    controller.enqueue(bytes);
                    await new Promise(r => setTimeout(r, 
                    // get a random number between 10ms and 50ms to simulate a random delay
                    Math.floor(Math.random() * 40) + 10));
                },
                controller, : .close()
            });
        }
        ;
        // Stream the response to the chat
        for await (const chunk of stream) {
            process.stdout.write(new TextDecoder().decode(chunk));
        }
        // Add an extra line after the message

    },
    /**
     * Ask for feedback to the user using the terminal
     *
     * @param node //{ from: string; to: string }
     * @returns
     */
    askForFeedback: function (node) {
        return (0, prompts_1.input)({
            message: `Provide feedback to ${chalk_1.default.yellow(node.to)} as ${chalk_1.default.yellow(node.from)}. Press enter to skip and use auto-reply, or type 'exit' to end the conversation: `,
        });
    },
};
;
exports.cli = cli;
export {};
//# sourceMappingURL=cli.js.map