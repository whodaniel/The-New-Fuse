import * as fs from 'fs';
import * as path from 'path';
import { chromium } from 'playwright';
async function login() {
    const profileDir = path.join(process.env.HOME || '/tmp', '.video-processor-chrome-alt');
    console.log('Launching browser for login at:', profileDir);
    fs.mkdirSync(profileDir, { recursive: true });
    const context = await chromium.launchPersistentContext(profileDir, {
        headless: false,
        channel: 'chrome',
        args: [
            '--no-first-run',
            '--no-default-browser-check',
            '--disable-blink-features=AutomationControlled',
            '--window-size=1280,800',
        ],
        viewport: null,
        ignoreDefaultArgs: ['--enable-automation'],
        userAgent: 'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36',
    });
    const page = await context.newPage();
    await page.goto('https://aistudio.google.com/app/prompts/new_chat');
    console.log('Browser open. Please log in to Google AI Studio.');
    console.log('Press Ctrl+C to stop this script once logged in.');
    // Keep alive
    await new Promise(() => { });
}
login().catch(console.error);
//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJmaWxlIjoibG9naW4tYnJvd3Nlci5qcyIsInNvdXJjZVJvb3QiOiIiLCJzb3VyY2VzIjpbImxvZ2luLWJyb3dzZXIudHMiXSwibmFtZXMiOltdLCJtYXBwaW5ncyI6IkFBQUEsT0FBTyxLQUFLLEVBQUUsTUFBTSxJQUFJLENBQUM7QUFDekIsT0FBTyxLQUFLLElBQUksTUFBTSxNQUFNLENBQUM7QUFDN0IsT0FBTyxFQUFFLFFBQVEsRUFBRSxNQUFNLFlBQVksQ0FBQztBQUV0QyxLQUFLLFVBQVUsS0FBSztJQUNsQixNQUFNLFVBQVUsR0FBRyxJQUFJLENBQUMsSUFBSSxDQUFDLE9BQU8sQ0FBQyxHQUFHLENBQUMsSUFBSSxJQUFJLE1BQU0sRUFBRSw2QkFBNkIsQ0FBQyxDQUFDO0lBQ3hGLE9BQU8sQ0FBQyxHQUFHLENBQUMsaUNBQWlDLEVBQUUsVUFBVSxDQUFDLENBQUM7SUFDM0QsRUFBRSxDQUFDLFNBQVMsQ0FBQyxVQUFVLEVBQUUsRUFBRSxTQUFTLEVBQUUsSUFBSSxFQUFFLENBQUMsQ0FBQztJQUU5QyxNQUFNLE9BQU8sR0FBRyxNQUFNLFFBQVEsQ0FBQyx1QkFBdUIsQ0FBQyxVQUFVLEVBQUU7UUFDakUsUUFBUSxFQUFFLEtBQUs7UUFDZixPQUFPLEVBQUUsUUFBUTtRQUNqQixJQUFJLEVBQUU7WUFDSixnQkFBZ0I7WUFDaEIsNEJBQTRCO1lBQzVCLCtDQUErQztZQUMvQyx3QkFBd0I7U0FDekI7UUFDRCxRQUFRLEVBQUUsSUFBSTtRQUNkLGlCQUFpQixFQUFFLENBQUMscUJBQXFCLENBQUM7UUFDMUMsU0FBUyxFQUNQLHVIQUF1SDtLQUMxSCxDQUFDLENBQUM7SUFFSCxNQUFNLElBQUksR0FBRyxNQUFNLE9BQU8sQ0FBQyxPQUFPLEVBQUUsQ0FBQztJQUNyQyxNQUFNLElBQUksQ0FBQyxJQUFJLENBQUMsa0RBQWtELENBQUMsQ0FBQztJQUVwRSxPQUFPLENBQUMsR0FBRyxDQUFDLGtEQUFrRCxDQUFDLENBQUM7SUFDaEUsT0FBTyxDQUFDLEdBQUcsQ0FBQyxrREFBa0QsQ0FBQyxDQUFDO0lBRWhFLGFBQWE7SUFDYixNQUFNLElBQUksT0FBTyxDQUFDLEdBQUcsRUFBRSxHQUFFLENBQUMsQ0FBQyxDQUFDO0FBQzlCLENBQUM7QUFFRCxLQUFLLEVBQUUsQ0FBQyxLQUFLLENBQUMsT0FBTyxDQUFDLEtBQUssQ0FBQyxDQUFDIiwic291cmNlc0NvbnRlbnQiOlsiaW1wb3J0ICogYXMgZnMgZnJvbSAnZnMnO1xuaW1wb3J0ICogYXMgcGF0aCBmcm9tICdwYXRoJztcbmltcG9ydCB7IGNocm9taXVtIH0gZnJvbSAncGxheXdyaWdodCc7XG5cbmFzeW5jIGZ1bmN0aW9uIGxvZ2luKCkge1xuICBjb25zdCBwcm9maWxlRGlyID0gcGF0aC5qb2luKHByb2Nlc3MuZW52LkhPTUUgfHwgJy90bXAnLCAnLnZpZGVvLXByb2Nlc3Nvci1jaHJvbWUtYWx0Jyk7XG4gIGNvbnNvbGUubG9nKCdMYXVuY2hpbmcgYnJvd3NlciBmb3IgbG9naW4gYXQ6JywgcHJvZmlsZURpcik7XG4gIGZzLm1rZGlyU3luYyhwcm9maWxlRGlyLCB7IHJlY3Vyc2l2ZTogdHJ1ZSB9KTtcblxuICBjb25zdCBjb250ZXh0ID0gYXdhaXQgY2hyb21pdW0ubGF1bmNoUGVyc2lzdGVudENvbnRleHQocHJvZmlsZURpciwge1xuICAgIGhlYWRsZXNzOiBmYWxzZSxcbiAgICBjaGFubmVsOiAnY2hyb21lJyxcbiAgICBhcmdzOiBbXG4gICAgICAnLS1uby1maXJzdC1ydW4nLFxuICAgICAgJy0tbm8tZGVmYXVsdC1icm93c2VyLWNoZWNrJyxcbiAgICAgICctLWRpc2FibGUtYmxpbmstZmVhdHVyZXM9QXV0b21hdGlvbkNvbnRyb2xsZWQnLFxuICAgICAgJy0td2luZG93LXNpemU9MTI4MCw4MDAnLFxuICAgIF0sXG4gICAgdmlld3BvcnQ6IG51bGwsXG4gICAgaWdub3JlRGVmYXVsdEFyZ3M6IFsnLS1lbmFibGUtYXV0b21hdGlvbiddLFxuICAgIHVzZXJBZ2VudDpcbiAgICAgICdNb3ppbGxhLzUuMCAoTWFjaW50b3NoOyBJbnRlbCBNYWMgT1MgWCAxMF8xNV83KSBBcHBsZVdlYktpdC81MzcuMzYgKEtIVE1MLCBsaWtlIEdlY2tvKSBDaHJvbWUvMTIwLjAuMC4wIFNhZmFyaS81MzcuMzYnLFxuICB9KTtcblxuICBjb25zdCBwYWdlID0gYXdhaXQgY29udGV4dC5uZXdQYWdlKCk7XG4gIGF3YWl0IHBhZ2UuZ290bygnaHR0cHM6Ly9haXN0dWRpby5nb29nbGUuY29tL2FwcC9wcm9tcHRzL25ld19jaGF0Jyk7XG5cbiAgY29uc29sZS5sb2coJ0Jyb3dzZXIgb3Blbi4gUGxlYXNlIGxvZyBpbiB0byBHb29nbGUgQUkgU3R1ZGlvLicpO1xuICBjb25zb2xlLmxvZygnUHJlc3MgQ3RybCtDIHRvIHN0b3AgdGhpcyBzY3JpcHQgb25jZSBsb2dnZWQgaW4uJyk7XG5cbiAgLy8gS2VlcCBhbGl2ZVxuICBhd2FpdCBuZXcgUHJvbWlzZSgoKSA9PiB7fSk7XG59XG5cbmxvZ2luKCkuY2F0Y2goY29uc29sZS5lcnJvcik7XG4iXX0=