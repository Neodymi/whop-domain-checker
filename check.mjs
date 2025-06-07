/*  check.mjs  —  Node ≥18  */
import { readFile, writeFile } from 'fs/promises';
import { existsSync, writeFileSync } from 'fs';
import puppeteer from 'puppeteer';

const HANDLES_FILE   = 'handles.txt';
const PROGRESS_FILE  = 'progress.json';
const AVAIL_FILE     = 'available.json';
const DELAY_MS       = 1_000;          // courtesy to Whop
const PROTOCOL_MS    = 120_000;        // Chrome-CDP timeout
const UA             = 'whop-handle-checker/5.0 (+github.com/yourname)';
const MAX_RETRIES    = 2;

const DEBUG = process.argv.includes('--debug');   // optional flag

//---------------------------------------------------------------- helpers
const sleep = ms => new Promise(r => setTimeout(r, ms));

async function launchBrowser() {
  return puppeteer.launch({
    headless: false,
    defaultViewport: null,
    slowMo: 40,
    protocolTimeout: PROTOCOL_MS,
    args: ['--no-sandbox', '--disable-setuid-sandbox']  // play nice on CI
  });
}

/** true ⇔ banner “Nothing to see … yet” rendered */
async function checkSlug(page, slug) {
  const url = `https://whop.com/${slug}`;

  await page.goto(url, { waitUntil: 'domcontentloaded', timeout: 30_000 });
  await page.waitForSelector('h1', { timeout: 10_000 }).catch(() => {});

  const h1 = await page.$eval('h1', el =>
    el.innerText.replace(/\s+/g, ' ').trim().toLowerCase()
  ).catch(() => '');

  if (DEBUG) console.log(`[debug] ${slug} → h1: “${h1}”`);
  return h1.includes('nothing to see') && h1.includes('yet');
}

/** write progress to disk (sync → safest) */
function saveProgress(checked, available) {
  writeFileSync(PROGRESS_FILE, JSON.stringify({ checked:[...checked], available:[...available] }, null, 2));
  writeFileSync(AVAIL_FILE,   JSON.stringify([...available] , null, 2));
}

//---------------------------------------------------------------- main
(async () => {
  //---------------------------------------------------------------- load input
  const raw = await readFile(HANDLES_FILE, 'utf8')
    .catch(e => { console.error('⛔️  handles.txt:', e.message); process.exit(1); });

  const allSlugs = [...new Set(raw.split(/\r?\n/).map(s => s.trim()).filter(Boolean))];
  if (!allSlugs.length) { console.error('⛔️  handles.txt is empty'); process.exit(1); }

  //---------------------------------------------------------------- restore progress if any
  let checked   = new Set();
  let available = new Set();

  if (existsSync(PROGRESS_FILE)) {
    try {
      const prev = JSON.parse(await readFile(PROGRESS_FILE, 'utf8'));
      checked   = new Set(prev.checked   ?? []);
      available = new Set(prev.available ?? []);
      console.log(`🔄 Resuming — already checked ${checked.size}/${allSlugs.length} slugs`);
    } catch { /* corrupt file ⇒ start fresh */ }
  }

  //---------------------------------------------------------------- global exit hooks
  const gracefulExit = (msg) => {
    console.error(msg);
    saveProgress(checked, available);
    process.exit(1);
  };
  process.on('unhandledRejection', err => gracefulExit(`❌  Unhandled rejection: ${err}`));
  process.on('SIGINT',             ()  => gracefulExit('\n🛑  Interrupted (Ctrl-C) — progress saved.'));

  //---------------------------------------------------------------- scanning loop
  for (const slug of allSlugs) {
    if (checked.has(slug)) continue;

    let success = false;
    for (let attempt = 1; attempt <= MAX_RETRIES && !success; ++attempt) {
      try {
        const browser = await launchBrowser();
        const page    = await browser.newPage();
        await page.setUserAgent(UA);

        const free   = await checkSlug(page, slug);
        console.log(`${slug.padEnd(24)} : ${free ? '✅  AVAILABLE' : '❌  taken'}`);
        if (free) available.add(slug);

        await browser.close();
        success = true;
      } catch (err) {
        console.error(`⚠️  ${slug} (attempt ${attempt}/${MAX_RETRIES}): ${err.message}`);
        if (attempt === MAX_RETRIES) console.error('   giving up, marking as taken');
      }
    }

    checked.add(slug);
    saveProgress(checked, available);   // flush after *each* slug
    await sleep(DELAY_MS);
  }

  console.log(`\n✨  Done — ${available.size} available handle(s) written to ${AVAIL_FILE}`);
})();
