#!/usr/bin/env node
import axios from 'axios';
import { parseStringPromise } from 'xml2js';
import fs from 'fs';

async function main() {
  try {
    const resp = await axios.get('https://docs.roocode.com/sitemap.xml');
    const parsed = await parseStringPromise(resp.data);
    const urls = (parsed.urlset?.url ?? [])
      .map(item => item.loc?.[0])
      .filter(loc => typeof loc === 'string' && loc.startsWith('https://docs.roocode.com/'));
    fs.writeFileSync('urls.json', JSON.stringify(urls, null, 2));
    console.log(`Found ${urls.length} URLs. Written to urls.json`);
  } catch (err) {
    console.error('Error fetching sitemap:', err.message);
    process.exit(1);
  }
}

main();