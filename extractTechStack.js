import fs from 'fs/promises';
import axios from 'axios';
import cheerio from 'cheerio';

(async () => {
  try {
    const data = await fs.readFile('urls.json', 'utf-8');
    const urls = JSON.parse(data);
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

            while (
              next.length &&
              !['h1', 'h2', 'h3'].includes(next[0].name)
            ) {
              if (next[0].name === 'p') {
                content += $(next).text().trim() + '\n';
              }
              next = next.next();
            }

            if (content) {
              snippets.push({ heading, content: content.trim() });
            }
          }
        });

        report[url] = snippets;
      } catch (error) {
        console.error(`Skipping ${url}: ${error.message}`);
      }
    }

    await fs.writeFile(
      'techStackReport.json',
      JSON.stringify(report, null, 2)
    );
    console.log(
      `Extracted tech stack information for ${Object.keys(report).length} pages; report written to techStackReport.json`
    );
  } catch (err) {
    console.error('Error:', err.message);
  }
})();