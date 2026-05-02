#!/usr/bin/env node

import fs from 'node:fs';
import path from 'node:path';
import process from 'node:process';
import { chromium } from 'playwright';

const DEFAULT_REGIONS = [
  'atasehir',
  'taksim',
  'kadikoy',
  'besiktas',
  'sariyer',
];
const DEFAULT_TOTAL = 25;
const DEFAULT_MAX_SCROLL_STEPS = 14;

function parseArgs(argv) {
  const args = {
    regions: [...DEFAULT_REGIONS],
    total: DEFAULT_TOTAL,
    out: '',
    headful: false,
    quiet: false,
    maxScrollSteps: DEFAULT_MAX_SCROLL_STEPS,
  };

  for (let i = 0; i < argv.length; i += 1) {
    const token = argv[i];
    const next = argv[i + 1];

    if (token === '--regions' && next) {
      args.regions = next
        .split(',')
        .map((part) => part.trim())
        .filter(Boolean);
      i += 1;
      continue;
    }

    if (token === '--total' && next) {
      args.total = Number.parseInt(next, 10) || DEFAULT_TOTAL;
      i += 1;
      continue;
    }

    if (token === '--out' && next) {
      args.out = next;
      i += 1;
      continue;
    }

    if (token === '--max-scroll-steps' && next) {
      args.maxScrollSteps =
        Number.parseInt(next, 10) || DEFAULT_MAX_SCROLL_STEPS;
      i += 1;
      continue;
    }

    if (token === '--headful') {
      args.headful = true;
      continue;
    }

    if (token === '--quiet') {
      args.quiet = true;
      continue;
    }
  }

  return args;
}

function createLogger({ quiet }) {
  function write(level, message) {
    if (quiet && (level === 'INFO' || level === 'STEP')) {
      return;
    }
    const stamp = new Date().toISOString();
    process.stdout.write(`[${stamp}] [${level}] ${message}\n`);
  }

  return {
    banner: (message) => write('BANNER', message),
    info: (message) => write('INFO', message),
    step: (message) => write('STEP', message),
    warn: (message) => write('WARN', message),
    success: (message) => write('SUCCESS', message),
  };
}

function cleanText(value) {
  if (!value) {
    return '';
  }

  return value
    .replace(/[\uE000-\uF8FF]/g, '')
    .replace(/\s+/g, ' ')
    .trim();
}

function parseRating(value) {
  if (!value) {
    return null;
  }

  const normalized = value.replace(',', '.').trim();
  const parsed = Number.parseFloat(normalized);
  return Number.isFinite(parsed) ? parsed : null;
}

function parseReviewCount(value) {
  if (!value) {
    return null;
  }

  const match = value.match(/(\d[\d\.]*)\s*(yorum|degerlendirme|review)/i);
  if (!match) {
    return null;
  }

  const normalized = match[1].replaceAll('.', '');
  const parsed = Number.parseInt(normalized, 10);
  return Number.isFinite(parsed) ? parsed : null;
}

function parseLatLngFromUrl(url) {
  if (!url) {
    return { lat: null, lng: null };
  }

  const match = url.match(/@(-?\d+\.\d+),(-?\d+\.\d+)/);
  if (!match) {
    return { lat: null, lng: null };
  }

  return {
    lat: Number.parseFloat(match[1]),
    lng: Number.parseFloat(match[2]),
  };
}

function formatDurationMs(durationMs) {
  const seconds = Math.floor(durationMs / 1000);
  const minutes = Math.floor(seconds / 60);
  const remainingSeconds = seconds % 60;

  if (minutes === 0) {
    return `${remainingSeconds}s`;
  }

  return `${minutes}m ${remainingSeconds}s`;
}

async function readText(page, selector, timeout = 3500) {
  try {
    const text = await page.locator(selector).first().textContent({ timeout });
    return cleanText(text || '');
  } catch {
    return '';
  }
}

async function readAttr(page, selector, attr, timeout = 3500) {
  try {
    const value = await page
      .locator(selector)
      .first()
      .getAttribute(attr, { timeout });
    return value || '';
  } catch {
    return '';
  }
}

async function acceptConsent(page) {
  const selectors = [
    'button:has-text("Tümünü kabul et")',
    'button:has-text("Kabul et")',
    'button[aria-label="Tümünü kabul et"]',
  ];

  for (const selector of selectors) {
    try {
      const button = page.locator(selector).first();
      const count = await button.count();
      if (!count) {
        continue;
      }

      await button.click({ timeout: 1500 });
      await page.waitForTimeout(1200);
      return;
    } catch {
      // Continue with next selector.
    }
  }
}

async function collectRegionCandidates(page, region, regionTarget, options) {
  const { logger, maxScrollSteps } = options;
  logger.step(`Region '${region}': searching Google Maps`);

  const searchUrl = `https://www.google.com/maps/search/restoran+${encodeURIComponent(
    region,
  )}+istanbul?hl=tr`;

  await page.goto(searchUrl, { waitUntil: 'domcontentloaded', timeout: 90000 });
  await page.waitForTimeout(1800);
  await acceptConsent(page);

  await page.waitForSelector('div.Nv2PK a.hfpxzc', { timeout: 45000 });

  const collected = new Map();
  for (let scrollStep = 0; scrollStep < maxScrollSteps; scrollStep += 1) {
    const cards = await page.$$eval('div.Nv2PK', (nodes) => {
      return nodes.map((node) => {
        const link = node.querySelector('a.hfpxzc');
        const href = link?.getAttribute('href') || '';
        const name = link?.getAttribute('aria-label') || '';
        const text = (node.textContent || '').replace(/\s+/g, ' ').trim();

        const ratingMatch = text.match(/([0-5][\.,][0-9])/);
        let category = '';
        if (ratingMatch && ratingMatch.index !== undefined) {
          const after = text.slice(ratingMatch.index + ratingMatch[0].length);
          const categoryMatch = after.match(/^\s*([^·\n]+)/);
          category = (categoryMatch?.[1] || '').trim();
        }

        const reviewMatch = text.match(
          /(\d[\d\.]*)\s*(yorum|degerlendirme|review)/i,
        );

        return {
          href,
          name,
          ratingText: ratingMatch ? ratingMatch[1] : '',
          category,
          reviewText: reviewMatch ? reviewMatch[0] : '',
        };
      });
    });

    for (const card of cards) {
      if (!card.href) {
        continue;
      }
      if (collected.has(card.href)) {
        continue;
      }

      collected.set(card.href, {
        source_url: card.href,
        name: cleanText(card.name),
        region,
        rating: parseRating(card.ratingText),
        review_count: parseReviewCount(card.reviewText),
        category: cleanText(card.category),
      });
    }

    const shouldReportStep =
      scrollStep === 0 ||
      (scrollStep + 1) % 4 === 0 ||
      scrollStep === maxScrollSteps - 1;

    if (shouldReportStep) {
      logger.info(
        `Region '${region}': scroll ${scrollStep + 1}/${maxScrollSteps}, unique=${collected.size}`,
      );
    }

    if (collected.size >= regionTarget) {
      break;
    }

    await page
      .locator('div[role="feed"]')
      .first()
      .evaluate((element) => {
        element.scrollBy(0, element.scrollHeight);
      });
    await page.waitForTimeout(1100);
  }

  logger.success(`Region '${region}': collected ${collected.size} candidates`);
  return [...collected.values()];
}

async function enrichPlaceDetails(page, candidate) {
  const url = candidate.source_url.includes('hl=tr')
    ? candidate.source_url
    : `${candidate.source_url}${candidate.source_url.includes('?') ? '&' : '?'}hl=tr`;

  await page.goto(url, { waitUntil: 'domcontentloaded', timeout: 90000 });
  await page.waitForTimeout(2200);

  const resolvedUrl = page.url();
  const { lat, lng } = parseLatLngFromUrl(resolvedUrl);

  const name = (await readText(page, 'h1.DUwDvf')) || candidate.name;
  const address = await readText(page, 'button[data-item-id="address"]');
  const phone = await readText(page, 'button[data-item-id^="phone:tel:"]');
  const website = await readAttr(page, 'a[data-item-id="authority"]', 'href');
  const category = (await readText(page, 'button.DkEaL')) || candidate.category;
  const ratingText = await readText(
    page,
    'div.F7nice span[aria-hidden="true"]',
  );

  return {
    source_url: candidate.source_url,
    region: candidate.region,
    name,
    category: cleanText(category),
    address,
    phone,
    website,
    rating: parseRating(ratingText) ?? candidate.rating,
    review_count: candidate.review_count,
    lat,
    lng,
  };
}

async function main() {
  const startedAtMs = Date.now();
  const args = parseArgs(process.argv.slice(2));
  const logger = createLogger({ quiet: args.quiet });

  if (!args.out) {
    throw new Error('--out is required.');
  }
  if (!args.total || args.total < 1) {
    throw new Error('--total must be >= 1.');
  }

  logger.banner('Google Maps scrape started');
  logger.info(`Regions: ${args.regions.join(', ')}`);
  logger.info(`Requested total: ${args.total}`);
  logger.info(`Mode: ${args.headful ? 'headful' : 'headless'}`);

  const browser = await chromium.launch({ headless: !args.headful });
  const context = await browser.newContext({
    locale: 'tr-TR',
    viewport: { width: 1440, height: 1024 },
  });
  const page = await context.newPage();

  try {
    const regionTarget = Math.max(
      8,
      Math.ceil(args.total / Math.max(args.regions.length, 1)) + 4,
    );

    logger.info(`Per-region candidate target: ${regionTarget}`);

    const candidates = [];
    for (const region of args.regions) {
      try {
        const regionCandidates = await collectRegionCandidates(
          page,
          region,
          regionTarget,
          {
            logger,
            maxScrollSteps: args.maxScrollSteps,
          },
        );
        candidates.push(...regionCandidates);
      } catch (error) {
        logger.warn(
          `Region '${region}' failed: ${error instanceof Error ? error.message : String(error)}`,
        );
      }
    }

    const deduped = new Map();
    for (const candidate of candidates) {
      if (!deduped.has(candidate.source_url)) {
        deduped.set(candidate.source_url, candidate);
      }
    }

    const ranked = [...deduped.values()]
      .sort((a, b) => {
        const aRating = a.rating ?? 0;
        const bRating = b.rating ?? 0;
        if (aRating !== bRating) {
          return bRating - aRating;
        }

        const aReviews = a.review_count ?? 0;
        const bReviews = b.review_count ?? 0;
        return bReviews - aReviews;
      })
      .slice(0, args.total);

    logger.info(
      `Candidate pipeline: raw=${candidates.length}, deduped=${deduped.size}, selected=${ranked.length}`,
    );

    const places = [];
    let failedEnrichment = 0;

    for (let index = 0; index < ranked.length; index += 1) {
      const candidate = ranked[index];
      logger.step(
        `[${index + 1}/${ranked.length}] Enriching '${candidate.name}'`,
      );

      try {
        const enriched = await enrichPlaceDetails(page, candidate);
        places.push(enriched);
      } catch (error) {
        failedEnrichment += 1;
        logger.warn(
          `Enrichment failed for '${candidate.name}': ${
            error instanceof Error ? error.message : String(error)
          }`,
        );
      }
    }

    const finishedAtMs = Date.now();
    const payload = {
      scraped_at: new Date().toISOString(),
      regions: args.regions,
      requested_total: args.total,
      collected_total: places.length,
      summary: {
        raw_candidates: candidates.length,
        deduped_candidates: deduped.size,
        selected_candidates: ranked.length,
        failed_enrichment: failedEnrichment,
        duration_seconds: Number(
          ((finishedAtMs - startedAtMs) / 1000).toFixed(1),
        ),
      },
      places,
    };

    fs.writeFileSync(args.out, JSON.stringify(payload, null, 2), 'utf-8');

    logger.success(
      `Scrape complete in ${formatDurationMs(finishedAtMs - startedAtMs)}. collected=${places.length}`,
    );
    logger.info(`JSON output: ${path.resolve(args.out)}`);
  } finally {
    await context.close();
    await browser.close();
  }
}

main().catch((error) => {
  process.stderr.write(
    `[${new Date().toISOString()}] [ERROR] ${error instanceof Error ? error.message : String(error)}\n`,
  );
  process.exitCode = 1;
});
