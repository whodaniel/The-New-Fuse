import fs from 'fs/promises';
import axios from 'axios';
import * as cheerio from 'cheerio';
import path from 'path';
import { fileURLToPath } from 'url';
import fsSync from 'fs';

const __dirname = path.dirname(fileURLToPath(import.meta.url));

async function main() {
  try {
    // Read URLs from project root
    const urlsPath = path.join(__dirname, '..', 'urls.json');
    const urls = JSON.parse(fsSync.readFileSync(urlsPath, 'utf-8'));
    // Filter for advanced-usage or features
    const filtered = urls.filter(url =>
      /^https:\/\/docs\.roocode\.com\/(advanced-usage|features)\//.test(url)
    );
    const report = {};

    for (const url of filtered) {
      try {
        const response = await axios.get(url);
        const $ = cheerio.load(response.data);
        const snippets = [];

        $('h1, h2, h3').each((_, el) => {
          const headingText = $(el).text().toLowerCase();
          if (/architecture|stack|system/.test(headingText)) {
            const heading = $(el).text().trim();
            let content = '';
            let next = $(el).next();

            while (next.length && !['h1', 'h2', 'h3'].includes(next[0].name)) {
              if (next[0].name === 'p') content += $(next).text().trim() + '\n';
              next = next.next();
            }

            if (content) snippets.push({ heading, content: content.trim() });
          }
        });

        report[url] = snippets;
      } catch {
        console.error(`Skipping ${url}`);
      }
    }

    // Write report back to project root
    await fs.writeFile(
      '../techStackReport.json',
      JSON.stringify(report, null, 2)
    );
    console.log(`Extracted tech stack information for ${Object.keys(report).length} pages; report written to techStackReport.json`);
  } catch (err) {
    console.error('Error:', err.message);
    process.exit(1);
  }
}

main().catch(console.error);