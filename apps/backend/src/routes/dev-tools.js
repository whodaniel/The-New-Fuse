"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const express_1 = require("express");
const child_process_1 = require("child_process");
const stream_1 = require("../utils/stream");
const router = (0, express_1.Router)();
router.post('/api/dev-tools/cleanup', async (req, res) => {
    const options = req.body;
    const stream = new stream_1.StreamResponse(res);
    try {
        const script = (0, child_process_1.spawn)('./scripts/fresh-env.sh', [
            options.all ? '--all' : '',
            ...Object.entries(options)
                .filter(([_, value]) => value)
                .map(([key]) => `--${key}`)
        ]);
        script.stdout.on('data', (data) => {
            stream.write(data.toString());
        });
        script.stderr.on('data', (data) => {
            stream.write(`Error: ${data.toString()}`);
        });
        script.on('close', (code) => {
            if (code === 0) {
                stream.write('Cleanup completed successfully');
            }
            else {
                stream.write(`Process exited with code ${code}`);
            }
            stream.end();
        });
    }
    catch (error) {
        const errorMessage = error instanceof Error ? error.message : 'Unknown error';
        stream.write(`Failed to execute cleanup: ${errorMessage}`);
        stream.end();
    }
});
router.post('/api/dev-tools/start', async (req, res) => {
    const stream = new stream_1.StreamResponse(res);
    try {
        const script = (0, child_process_1.spawn)('./scripts/launch-unified.sh', ['development']);
        script.stdout.on('data', (data) => {
            stream.write(data.toString());
        });
        script.stderr.on('data', (data) => {
            stream.write(`Error: ${data.toString()}`);
        });
        script.on('close', (code) => {
            if (code === 0) {
                stream.write('Development environment started successfully');
            }
            else {
                stream.write(`Process exited with code ${code}`);
            }
            stream.end();
        });
    }
    catch (error) {
        const errorMessage = error instanceof Error ? error.message : 'Unknown error';
        stream.write(`Failed to start development environment: ${errorMessage}`);
        stream.end();
    }
});
exports.default = router;
