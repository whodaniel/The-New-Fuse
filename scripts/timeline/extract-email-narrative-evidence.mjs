#!/usr/bin/env node

import fs from 'node:fs/promises';
import path from 'node:path';
import os from 'node:os';
import crypto from 'node:crypto';

const DEFAULT_MAIL_ROOT = path.join(os.homedir(), 'Library', 'Mail', 'V9');
const DEFAULT_OUTPUT_DIR = path.join(
  process.cwd(),
  'reports',
  'personal-archaeology',
  'email-discovery'
);

const DEFAULT_USER_ALIASES = [
  'whodaniel@yahoo.com',
  'daniel@thenewfuse.com',
  'danielgoldberg@thenewfuse.com',
];

const SENT_PATH_PATTERN = /\/(Sent(?: Messages)?|Outbox)\.mbox\//i;
const DRAFT_PATH_PATTERN = /\/Drafts?\.mbox\//i;
const JUNK_PATH_PATTERN = /\/(Bulk|Spam|Junk|Trash)\.mbox\//i;
const PARTIAL_FILE_PATTERN = /\.partial\.emlx$/i;

const MARKETING_KEYWORDS = [
  'unsubscribe',
  'newsletter',
  'promo',
  'promotion',
  'discount',
  'coupon',
  'deal',
  'webinar',
  'affiliate',
  'limited time',
  'offer',
  'click here',
  'buy now',
  'sale',
  'sponsored',
];

const TRANSACTIONAL_KEYWORDS = [
  'receipt',
  'invoice',
  'order',
  'purchase',
  'payment',
  'refund',
  'tracking',
  'shipment',
  'delivered',
  'verification code',
  'password reset',
  'account activated',
  'confirm your',
  '2fa',
];

const SYSTEM_KEYWORDS = [
  'notification',
  'alert',
  'security',
  'system',
  'daemon',
  'postmaster',
  'delivery status',
  'mail delivery',
  'undeliverable',
];

const SPAM_KEYWORDS = [
  'viagra',
  'cialis',
  'levitra',
  'casino',
  'slots',
  'xanax',
  'loan approved',
  'work from home',
  'hot singles',
  'adult',
  'xxx',
  'soft tabs',
  'penis',
  'erection',
  'winner',
  'prize claim',
];

const MEDIA_EMPIRE_KEYWORDS = [
  'daniel who',
  'media empire',
  'book',
  'manuscript',
  'chapter',
  'publisher',
  'publishing',
  'author',
  'story architect',
  'new fuse novel',
  'indi-visible media',
];

const TNF_KEYWORDS = [
  'the new fuse',
  'tnf',
  'thenewfuse',
  'library.thenewfuse.com',
  'openclaw',
  'relay',
  'supabase',
  'timeline',
  'story',
  'empire map',
  'daniel adam goldberg',
];

const PERSONAL_LIFE_KEYWORDS = [
  'family',
  'mother',
  'father',
  'sister',
  'brother',
  'mom',
  'dad',
  'home',
  'house',
  'personal',
  'health',
  'birthday',
  'relationship',
];

function parseArgs(argv) {
  const options = {
    mailRoot: DEFAULT_MAIL_ROOT,
    outDir: DEFAULT_OUTPUT_DIR,
    includePartial: false,
    limit: 0,
    bodySnippetChars: 1000,
    aliases: [...DEFAULT_USER_ALIASES],
  };

  for (let i = 2; i < argv.length; i += 1) {
    const token = argv[i];
    const next = argv[i + 1];
    if ((token === '--mail-root' || token === '--root') && next) {
      options.mailRoot = path.resolve(next);
      i += 1;
      continue;
    }
    if (token.startsWith('--mail-root=')) {
      options.mailRoot = path.resolve(token.slice('--mail-root='.length));
      continue;
    }
    if ((token === '--out-dir' || token === '--out') && next) {
      options.outDir = path.resolve(next);
      i += 1;
      continue;
    }
    if (token.startsWith('--out-dir=')) {
      options.outDir = path.resolve(token.slice('--out-dir='.length));
      continue;
    }
    if (token === '--include-partial') {
      options.includePartial = true;
      continue;
    }
    if (token === '--limit' && next) {
      options.limit = Number(next);
      i += 1;
      continue;
    }
    if (token.startsWith('--limit=')) {
      options.limit = Number(token.slice('--limit='.length));
      continue;
    }
    if (token === '--alias' && next) {
      options.aliases.push(String(next).toLowerCase());
      i += 1;
      continue;
    }
    if (token.startsWith('--alias=')) {
      options.aliases.push(token.slice('--alias='.length).toLowerCase());
      continue;
    }
    if (token === '--body-snippet-chars' && next) {
      options.bodySnippetChars = Number(next);
      i += 1;
      continue;
    }
    if (token.startsWith('--body-snippet-chars=')) {
      options.bodySnippetChars = Number(token.slice('--body-snippet-chars='.length));
      continue;
    }
    if (token === '-h' || token === '--help') {
      printUsage();
      process.exit(0);
    }
    throw new Error(`Unknown option: ${token}`);
  }

  if (!Number.isFinite(options.limit) || options.limit < 0) {
    throw new Error('--limit must be a non-negative number');
  }
  if (!Number.isFinite(options.bodySnippetChars) || options.bodySnippetChars < 120) {
    throw new Error('--body-snippet-chars must be >= 120');
  }
  return options;
}

function printUsage() {
  console.log(`
Extract and classify Apple Mail historical email narrative evidence.

Usage:
  node scripts/timeline/extract-email-narrative-evidence.mjs [options]

Options:
  --mail-root <path>           Mail root (default: ~/Library/Mail/V9)
  --out-dir <path>             Output directory
  --include-partial            Include *.partial.emlx
  --limit <n>                  Limit number of files processed after sorting
  --alias <email>              Add user alias email
  --body-snippet-chars <n>     Body snippet max characters (default: 1000)
`);
}

async function ensureDir(dirPath) {
  await fs.mkdir(dirPath, { recursive: true });
}

async function walkEmlxFiles(root, includePartial) {
  const queue = [root];
  const files = [];
  while (queue.length > 0) {
    const dir = queue.pop();
    let entries;
    try {
      entries = await fs.readdir(dir, { withFileTypes: true });
    } catch {
      continue;
    }
    for (const entry of entries) {
      const fullPath = path.join(dir, entry.name);
      if (entry.isDirectory()) {
        queue.push(fullPath);
        continue;
      }
      if (!entry.isFile()) continue;
      if (!entry.name.endsWith('.emlx')) continue;
      if (!includePartial && PARTIAL_FILE_PATTERN.test(entry.name)) continue;
      files.push(fullPath);
    }
  }
  return files;
}

function normalizeNewlines(text) {
  return text.replace(/\r\n/g, '\n').replace(/\r/g, '\n');
}

function parseEmlxMessage(buffer) {
  const raw = buffer.toString('utf8');
  const firstNewline = raw.indexOf('\n');
  if (firstNewline < 0) return raw;
  const declaredLength = Number(raw.slice(0, firstNewline).trim());
  if (!Number.isFinite(declaredLength) || declaredLength <= 0) {
    return raw;
  }
  const start = firstNewline + 1;
  const end = Math.min(start + declaredLength, buffer.length);
  return buffer.subarray(start, end).toString('utf8');
}

function splitHeadersAndBody(messageText) {
  const normalized = normalizeNewlines(messageText);
  const idx = normalized.indexOf('\n\n');
  if (idx < 0) return { headerText: normalized, bodyText: '' };
  return {
    headerText: normalized.slice(0, idx),
    bodyText: normalized.slice(idx + 2),
  };
}

function decodeQuotedPrintable(input) {
  const softBreak = input.replace(/=\n/g, '');
  return softBreak.replace(/=([A-Fa-f0-9]{2})/g, (_, hex) =>
    String.fromCharCode(parseInt(hex, 16))
  );
}

function decodeEncodedWords(input) {
  return input.replace(/=\?([^?]+)\?([bBqQ])\?([^?]*)\?=/g, (_, charset, mode, data) => {
    const m = mode.toUpperCase();
    try {
      if (m === 'B') {
        return Buffer.from(data, 'base64').toString('utf8');
      }
      const qpLike = data.replace(/_/g, ' ');
      const decoded = decodeQuotedPrintable(qpLike);
      return Buffer.from(decoded, 'latin1').toString('utf8');
    } catch {
      return data;
    }
  });
}

function parseHeaders(headerText) {
  const lines = normalizeNewlines(headerText).split('\n');
  const unfolded = [];
  for (const line of lines) {
    if (/^\s/.test(line) && unfolded.length > 0) {
      unfolded[unfolded.length - 1] += ` ${line.trim()}`;
    } else {
      unfolded.push(line);
    }
  }
  const headers = new Map();
  for (const line of unfolded) {
    const idx = line.indexOf(':');
    if (idx <= 0) continue;
    const key = line.slice(0, idx).trim().toLowerCase();
    const value = decodeEncodedWords(line.slice(idx + 1).trim());
    if (!headers.has(key)) headers.set(key, []);
    headers.get(key).push(value);
  }
  return headers;
}

function firstHeader(headers, name) {
  const arr = headers.get(name.toLowerCase());
  if (!arr || arr.length === 0) return '';
  return String(arr[0] || '');
}

function allHeaders(headers, name) {
  return headers.get(name.toLowerCase()) || [];
}

function extractEmails(raw) {
  if (!raw) return [];
  const out = [];
  const value = String(raw);
  const regex = /[A-Z0-9._%+-]+@[A-Z0-9.-]+\.[A-Z]{2,}/gi;
  let match;
  while ((match = regex.exec(value)) !== null) {
    out.push(match[0].toLowerCase());
  }
  return Array.from(new Set(out));
}

function extractBoundary(contentType) {
  const match = /boundary="?([^";]+)"?/i.exec(contentType || '');
  return match ? match[1] : null;
}

function decodeTransfer(text, encoding) {
  const enc = (encoding || '').toLowerCase();
  if (enc.includes('base64')) {
    const compact = text.replace(/\s+/g, '');
    try {
      return Buffer.from(compact, 'base64').toString('utf8');
    } catch {
      return text;
    }
  }
  if (enc.includes('quoted-printable')) {
    return decodeQuotedPrintable(text);
  }
  return text;
}

function stripHtml(html) {
  if (!html) return '';
  return html
    .replace(/<style[\s\S]*?<\/style>/gi, ' ')
    .replace(/<script[\s\S]*?<\/script>/gi, ' ')
    .replace(/<\/?(div|p|br|li|tr|h[1-6])[^>]*>/gi, '\n')
    .replace(/<[^>]+>/g, ' ')
    .replace(/&nbsp;/gi, ' ')
    .replace(/&amp;/gi, '&')
    .replace(/&lt;/gi, '<')
    .replace(/&gt;/gi, '>')
    .replace(/\s+/g, ' ')
    .trim();
}

function parseMultipart(bodyText, boundary) {
  const delimiter = `--${boundary}`;
  const endDelimiter = `--${boundary}--`;
  const chunks = bodyText.split(delimiter).map((part) => part.trim());
  const parts = [];
  for (const chunk of chunks) {
    if (!chunk || chunk === '--' || chunk === endDelimiter || chunk.endsWith('--')) continue;
    const { headerText, bodyText: partBody } = splitHeadersAndBody(chunk);
    const headers = parseHeaders(headerText);
    parts.push({ headers, body: partBody });
  }
  return parts;
}

function extractTextFromMessage(headers, bodyText) {
  const contentType = firstHeader(headers, 'content-type');
  const transferEncoding = firstHeader(headers, 'content-transfer-encoding');
  const boundary = extractBoundary(contentType);

  if (boundary && /multipart\//i.test(contentType)) {
    const parts = parseMultipart(bodyText, boundary);
    const plainTexts = [];
    const htmlTexts = [];
    for (const part of parts) {
      const partType = firstHeader(part.headers, 'content-type');
      const partEncoding = firstHeader(part.headers, 'content-transfer-encoding');
      let content = decodeTransfer(part.body, partEncoding);
      if (/multipart\//i.test(partType)) {
        const nestedBoundary = extractBoundary(partType);
        if (nestedBoundary) {
          const nestedText = extractTextFromMessage(part.headers, part.body);
          if (nestedText) plainTexts.push(nestedText);
          continue;
        }
      }
      if (/text\/plain/i.test(partType)) {
        plainTexts.push(content);
      } else if (/text\/html/i.test(partType)) {
        htmlTexts.push(stripHtml(content));
      }
    }
    const plain = plainTexts.join('\n').trim();
    if (plain) return plain;
    return htmlTexts.join('\n').trim();
  }

  const decoded = decodeTransfer(bodyText, transferEncoding);
  if (/text\/html/i.test(contentType)) return stripHtml(decoded);
  return decoded.trim();
}

function toEpoch(dateHeader, fallbackEpoch = 0) {
  const parsed = Date.parse(String(dateHeader || '').trim());
  if (Number.isFinite(parsed)) return Math.floor(parsed / 1000);
  return fallbackEpoch;
}

function canonicalMailboxPath(filePath) {
  const marker = '/Library/Mail/V9/';
  const idx = filePath.indexOf(marker);
  if (idx < 0) return filePath;
  return filePath.slice(idx + marker.length);
}

function normalizeSubject(subject) {
  return String(subject || '').replace(/\s+/g, ' ').trim();
}

function normalizeBodySnippet(text, maxChars) {
  return String(text || '')
    .replace(/\s+/g, ' ')
    .trim()
    .slice(0, maxChars);
}

function listHasAny(text, keywords) {
  const normalized = String(text || '').toLowerCase();
  return keywords.some((k) => normalized.includes(k));
}

function automatedSender(address) {
  const lower = String(address || '').toLowerCase();
  return /(no-?reply|do-?not-?reply|postmaster|mailer-daemon|notification|notifications|alert|support|helpdesk)/i.test(
    lower
  );
}

function spamLikeSender(address) {
  const lower = String(address || '').toLowerCase();
  return /(pharmacy|casino|sex|dating|loan|winner|prize|promo|deal|cheap)/i.test(lower);
}

function deriveInitialKey(meta) {
  const messageId = String(meta.messageId || '').trim().toLowerCase();
  if (messageId) return `msgid:${messageId}`;
  const fallback = [
    meta.dateEpoch || 0,
    meta.fromEmail || '',
    (meta.toEmails || []).join(','),
    normalizeSubject(meta.subject),
  ].join('|');
  const hash = crypto.createHash('sha1').update(fallback).digest('hex');
  return `fallback:${hash}`;
}

function classifyRecord(record, userAliasesSet) {
  const subject = normalizeSubject(record.subject);
  const content = `${subject}\n${record.bodySnippet || ''}`.toLowerCase();
  const fromEmail = (record.fromEmail || '').toLowerCase();
  const toEmails = record.toEmails || [];
  const ccEmails = record.ccEmails || [];
  const recipients = [...toEmails, ...ccEmails];
  const hasListId = Boolean(record.listId);
  const inSentPath = SENT_PATH_PATTERN.test(record.path) || DRAFT_PATH_PATTERN.test(record.path);
  const inJunkPath = JUNK_PATH_PATTERN.test(record.path);

  const fromUser = userAliasesSet.has(fromEmail);
  const toUser = recipients.some((email) => userAliasesSet.has(email));
  const marketingSignal =
    hasListId ||
    automatedSender(fromEmail) ||
    listHasAny(content, MARKETING_KEYWORDS) ||
    /mailchimp|constantcontact|aweber|substack|convertkit/.test(fromEmail);
  const transactionalSignal = listHasAny(content, TRANSACTIONAL_KEYWORDS);
  const systemSignal = listHasAny(content, SYSTEM_KEYWORDS);
  const spamSignal =
    listHasAny(content, SPAM_KEYWORDS) ||
    spamLikeSender(fromEmail) ||
    (/free money|guaranteed income|earn \$\d+/.test(content) && !fromUser);

  let interactionScore = 0;
  if (fromUser) interactionScore += 3;
  if (toUser) interactionScore += 1;
  if (/^re:/i.test(subject)) interactionScore += 1;
  if (record.inReplyTo || record.references) interactionScore += 1;
  if (recipients.length > 0 && recipients.length <= 3) interactionScore += 1;
  if (marketingSignal) interactionScore -= 2;
  if (transactionalSignal) interactionScore -= 1;
  if (systemSignal) interactionScore -= 2;
  if (inJunkPath) interactionScore -= 3;
  if (automatedSender(fromEmail)) interactionScore -= 2;
  if (spamSignal) interactionScore -= 4;

  let classification = 'low_interaction_misc';
  if (inJunkPath || spamSignal) classification = 'junk_irrelevant';
  else if (systemSignal && !fromUser) classification = 'system_notification';
  else if (transactionalSignal && !fromUser) classification = 'transactional';
  else if (marketingSignal && !fromUser) classification = 'marketing_newsletter';
  else if (fromUser || interactionScore >= 3) classification = 'personal_interaction';

  const personalTimelineScore =
    (interactionScore >= 2 ? 4 : 0) +
    (listHasAny(content, PERSONAL_LIFE_KEYWORDS) ? 2 : 0) +
    (fromUser ? 2 : 0);
  const mediaEmpireScore =
    (listHasAny(content, MEDIA_EMPIRE_KEYWORDS) ? 5 : 0) +
    (listHasAny(content, ['podcast', 'music', 'book', 'author']) ? 1 : 0);
  const tnfScore = listHasAny(content, TNF_KEYWORDS) ? 5 : 0;

  const relevance = {
    personalTimelineScore,
    mediaEmpireScore,
    tnfScore,
  };

  const keepForNarrative =
    classification === 'personal_interaction' ||
    ((classification === 'transactional' || classification === 'low_interaction_misc') &&
      (personalTimelineScore >= 5 || mediaEmpireScore >= 5 || tnfScore >= 5)) ||
    (classification === 'system_notification' && (fromUser || tnfScore >= 5));

  return {
    ...record,
    classification,
    interactionScore,
    keepForNarrative,
    relevance,
    fromUser,
    toUser,
    marketingSignal,
    transactionalSignal,
    systemSignal,
    inSentPath,
    inJunkPath,
  };
}

function asIso(epochSeconds) {
  if (!Number.isFinite(epochSeconds) || epochSeconds <= 0) return null;
  return new Date(epochSeconds * 1000).toISOString();
}

async function writeJson(filePath, value) {
  await fs.writeFile(filePath, `${JSON.stringify(value, null, 2)}\n`, 'utf8');
}

async function writeJsonl(filePath, rows) {
  const payload = rows.map((row) => JSON.stringify(row)).join('\n');
  await fs.writeFile(filePath, payload.length ? `${payload}\n` : '', 'utf8');
}

async function main() {
  const options = parseArgs(process.argv);
  await ensureDir(options.outDir);

  const discoveredFiles = await walkEmlxFiles(options.mailRoot, options.includePartial);
  const files = options.limit > 0 ? discoveredFiles.slice(0, options.limit) : discoveredFiles;
  const metadata = [];

  for (let idx = 0; idx < files.length; idx += 1) {
    const filePath = files[idx];
    if (idx > 0 && idx % 5000 === 0) {
      console.log(`metadata pass: ${idx}/${files.length}`);
    }
    let buf;
    try {
      buf = await fs.readFile(filePath);
    } catch {
      continue;
    }
    const messageText = parseEmlxMessage(buf);
    const { headerText } = splitHeadersAndBody(messageText);
    const headers = parseHeaders(headerText);

    const subject = normalizeSubject(firstHeader(headers, 'subject'));
    const dateHeader = firstHeader(headers, 'date');
    const fromHeader = firstHeader(headers, 'from');
    const toHeader = allHeaders(headers, 'to').join(', ');
    const ccHeader = allHeaders(headers, 'cc').join(', ');
    const messageId = firstHeader(headers, 'message-id');
    const inReplyTo = firstHeader(headers, 'in-reply-to');
    const references = firstHeader(headers, 'references');
    const listId = firstHeader(headers, 'list-id');

    const fromEmails = extractEmails(fromHeader);
    const fromEmail = fromEmails[0] || '';
    const toEmails = extractEmails(toHeader);
    const ccEmails = extractEmails(ccHeader);
    const dateEpoch = toEpoch(dateHeader, 0);

    const row = {
      path: filePath,
      mailboxPath: canonicalMailboxPath(filePath),
      dateHeader,
      dateEpoch,
      dateIso: asIso(dateEpoch),
      subject,
      fromHeader,
      fromEmail,
      toEmails,
      ccEmails,
      messageId,
      inReplyTo,
      references,
      listId,
    };
    row.dedupeKey = deriveInitialKey(row);
    metadata.push(row);
  }

  const sentAliasCounts = new Map();
  for (const row of metadata) {
    if (!(SENT_PATH_PATTERN.test(row.path) || DRAFT_PATH_PATTERN.test(row.path))) continue;
    if (!row.fromEmail) continue;
    sentAliasCounts.set(row.fromEmail, (sentAliasCounts.get(row.fromEmail) || 0) + 1);
  }
  const inferredAliases = Array.from(sentAliasCounts.entries())
    .sort((a, b) => b[1] - a[1])
    .slice(0, 10)
    .map(([email]) => email);
  const userAliasesSet = new Set(
    [...options.aliases.map((a) => a.toLowerCase()), ...inferredAliases].filter(Boolean)
  );

  metadata.sort((a, b) => {
    const ad = Number.isFinite(a.dateEpoch) && a.dateEpoch > 0 ? a.dateEpoch : Number.MAX_SAFE_INTEGER;
    const bd = Number.isFinite(b.dateEpoch) && b.dateEpoch > 0 ? b.dateEpoch : Number.MAX_SAFE_INTEGER;
    if (ad !== bd) return ad - bd;
    return a.mailboxPath.localeCompare(b.mailboxPath);
  });

  const dedupeMap = new Map();
  const classified = [];
  const duplicates = [];

  for (let idx = 0; idx < metadata.length; idx += 1) {
    const base = metadata[idx];
    if (idx > 0 && idx % 2000 === 0) {
      console.log(`content pass: ${idx}/${metadata.length}`);
    }

    if (dedupeMap.has(base.dedupeKey)) {
      duplicates.push({
        dedupeKey: base.dedupeKey,
        duplicatePath: base.mailboxPath,
        canonicalPath: dedupeMap.get(base.dedupeKey).mailboxPath,
      });
      continue;
    }

    let buf;
    try {
      buf = await fs.readFile(base.path);
    } catch {
      continue;
    }
    const messageText = parseEmlxMessage(buf);
    const { headerText, bodyText } = splitHeadersAndBody(messageText);
    const headers = parseHeaders(headerText);
    const body = extractTextFromMessage(headers, bodyText);
    const bodySnippet = normalizeBodySnippet(body, options.bodySnippetChars);

    const record = classifyRecord(
      {
        ...base,
        bodySnippet,
      },
      userAliasesSet
    );

    dedupeMap.set(base.dedupeKey, record);
    classified.push(record);
  }

  const narrativeCandidates = classified
    .filter((row) => row.keepForNarrative)
    .map((row) => ({
      dedupeKey: row.dedupeKey,
      dateIso: row.dateIso,
      dateEpoch: row.dateEpoch,
      from: row.fromHeader,
      to: row.toEmails,
      subject: row.subject,
      classification: row.classification,
      relevance: row.relevance,
      interactionScore: row.interactionScore,
      mailboxPath: row.mailboxPath,
      bodySnippet: row.bodySnippet,
      tags: [
        ...(row.relevance.personalTimelineScore >= 5 ? ['personal_timeline'] : []),
        ...(row.relevance.mediaEmpireScore >= 5 ? ['daniel_who_media_empire'] : []),
        ...(row.relevance.tnfScore >= 5 ? ['tnf_story'] : []),
      ],
    }))
    .sort((a, b) => {
      const ad = Number.isFinite(a.dateEpoch) && a.dateEpoch > 0 ? a.dateEpoch : Number.MAX_SAFE_INTEGER;
      const bd = Number.isFinite(b.dateEpoch) && b.dateEpoch > 0 ? b.dateEpoch : Number.MAX_SAFE_INTEGER;
      if (ad !== bd) return ad - bd;
      return String(a.subject || '').localeCompare(String(b.subject || ''));
    });

  const countsByClass = {};
  for (const row of classified) {
    countsByClass[row.classification] = (countsByClass[row.classification] || 0) + 1;
  }

  const contacts = new Map();
  for (const row of classified) {
    const contact = row.fromEmail || '(unknown)';
    if (!contacts.has(contact)) {
      contacts.set(contact, {
        contact,
        firstDateEpoch: row.dateEpoch || null,
        lastDateEpoch: row.dateEpoch || null,
        count: 0,
        personalInteractionCount: 0,
        mediaEmpireHits: 0,
        tnfHits: 0,
      });
    }
    const entry = contacts.get(contact);
    entry.count += 1;
    if (row.classification === 'personal_interaction') entry.personalInteractionCount += 1;
    if (row.relevance.mediaEmpireScore >= 5) entry.mediaEmpireHits += 1;
    if (row.relevance.tnfScore >= 5) entry.tnfHits += 1;
    if (Number.isFinite(row.dateEpoch) && row.dateEpoch > 0) {
      if (!entry.firstDateEpoch || row.dateEpoch < entry.firstDateEpoch) {
        entry.firstDateEpoch = row.dateEpoch;
      }
      if (!entry.lastDateEpoch || row.dateEpoch > entry.lastDateEpoch) {
        entry.lastDateEpoch = row.dateEpoch;
      }
    }
  }
  const contactHistory = Array.from(contacts.values())
    .map((entry) => ({
      ...entry,
      firstDateIso: asIso(entry.firstDateEpoch),
      lastDateIso: asIso(entry.lastDateEpoch),
    }))
    .sort((a, b) => b.personalInteractionCount - a.personalInteractionCount);

  const sortedByDate = classified
    .filter((row) => Number.isFinite(row.dateEpoch) && row.dateEpoch > 0)
    .sort((a, b) => a.dateEpoch - b.dateEpoch);

  const summary = {
    generatedAt: new Date().toISOString(),
    sourceType: 'email-history-discovery',
    mailRoot: options.mailRoot,
    filesDiscovered: discoveredFiles.length,
    filesProcessedInScope: files.length,
    uniqueMessagesClassified: classified.length,
    duplicateCopiesSkipped: duplicates.length,
    inferredAliases,
    userAliases: Array.from(userAliasesSet).sort(),
    dateRange: {
      earliest: sortedByDate[0]?.dateIso || null,
      latest: sortedByDate[sortedByDate.length - 1]?.dateIso || null,
    },
    countsByClass,
    narrativeCandidateCount: narrativeCandidates.length,
    topNarrativeCandidatesOldestFirst: narrativeCandidates.slice(0, 100),
  };

  const summaryPath = path.join(options.outDir, 'email-discovery-summary.json');
  const fullPath = path.join(options.outDir, 'email-discovery-classified.jsonl');
  const candidatesPath = path.join(options.outDir, 'email-narrative-candidates.jsonl');
  const duplicatesPath = path.join(options.outDir, 'email-duplicate-copies.jsonl');
  const contactsPath = path.join(options.outDir, 'email-contact-history.json');

  await writeJson(summaryPath, summary);
  await writeJsonl(fullPath, classified);
  await writeJsonl(candidatesPath, narrativeCandidates);
  await writeJsonl(duplicatesPath, duplicates);
  await writeJson(contactsPath, contactHistory);

  console.log(JSON.stringify({
    ok: true,
    summaryPath,
    fullPath,
    candidatesPath,
    duplicatesPath,
    contactsPath,
    uniqueMessagesClassified: classified.length,
    duplicateCopiesSkipped: duplicates.length,
    earliest: summary.dateRange.earliest,
    latest: summary.dateRange.latest,
  }, null, 2));
}

main().catch((error) => {
  console.error(error instanceof Error ? error.message : String(error));
  process.exit(1);
});
