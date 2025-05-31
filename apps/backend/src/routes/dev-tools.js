import { Router } from 'express';
import { spawn } from 'child_process';
import { StreamResponse } from '../utils/stream.js';
const router = Router();
router.post('/api/dev-tools/cleanup', async (req, res) => {
    const options = req.body;
    const stream = new StreamResponse(res);
    try {
        const script = spawn('./scripts/fresh-env.sh', [
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
        stream.write(`Failed to execute cleanup: ${error.message}`);
        stream.end();
    }
});
router.post('/api/dev-tools/start', async (req, res) => {
    const stream = new StreamResponse(res);
    try {
        const script = spawn('./scripts/launch-unified.sh', ['development']);
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
        stream.write(`Failed to start development environment: ${error.message}`);
        stream.end();
    }
});
export default router;
