import * as path from 'path';
import * as fs from 'fs';
import { exec } from 'child_process';

async function generateCertificates(): Promise<any> {
    const keyPath = path.join(__dirname, 'key.pem');
    const certPath = path.join(__dirname, 'cert.pem');

    if (!fs.existsSync(keyPath) || !fs.existsSync(certPath)) {
        const command = 'openssl req -x509 -newkey rsa:4096 -keyout key.pem -out cert.pem -days 365 -nodes -subj \'/CN=localhost\'';

        exec(command, (error: Error | null, stdout: string, stderr: string) => {
            if (error) {
                console.error(`Error generating certificates: ${error.message}`);
                return;
            }
            if (stderr) {
                console.error(`stderr: ${stderr}`);
                return;
            }
            
        });
    } else {
        
    }
}

generateCertificates();