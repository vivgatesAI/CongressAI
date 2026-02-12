import { load } from "cheerio";

const DEFAULT_MAX_PAGES = parseInt(process.env.CRAWL_MAX_PAGES || "15", 10);
const DEFAULT_TIMEOUT = parseInt(process.env.CRAWL_TIMEOUT_MS || "20000", 10);
const SAME_DOMAIN_ONLY = (process.env.CRAWL_SAME_DOMAIN_ONLY || "true") === "true";

function normalizeUrl(url) {
  try {
    const u = new URL(url);
    u.hash = "";
    return u.toString();
  } catch {
    return null;
  }
}

function isSameDomain(a, b) {
  try {
    const ua = new URL(a);
    const ub = new URL(b);
    return ua.hostname === ub.hostname;
  } catch {
    return false;
  }
}

export async function crawlAgenda({ startUrl, maxPages = DEFAULT_MAX_PAGES }) {
  const visited = new Set();
  const queue = [startUrl];
  const pages = [];

  while (queue.length > 0 && pages.length < maxPages) {
    const url = queue.shift();
    if (!url || visited.has(url)) continue;

    const normalized = normalizeUrl(url);
    if (!normalized) continue;
    visited.add(normalized);

    let res;
    try {
      const controller = new AbortController();
      const t = setTimeout(() => controller.abort(), DEFAULT_TIMEOUT);
      res = await fetch(normalized, { signal: controller.signal });
      clearTimeout(t);
    } catch {
      continue;
    }

    if (!res || !res.ok) continue;
    const html = await res.text();
    const $ = load(html);

    const title = $("title").text().trim();
    const text = $("body").text().replace(/\s+/g, " ").trim();
    pages.push({ url: normalized, title, text, html });

    const links = new Set();
    $("a[href]").each((_, el) => {
      const href = $(el).attr("href");
      if (!href) return;
      try {
        const abs = new URL(href, normalized).toString();
        if (SAME_DOMAIN_ONLY && !isSameDomain(abs, normalized)) return;
        links.add(abs);
      } catch {
        return;
      }
    });

    const agendaKeywords = ["agenda", "program", "schedule", "sessions", "abstracts", "speakers", "tracks"];
    [...links].forEach((link) => {
      const lower = link.toLowerCase();
      if (agendaKeywords.some((k) => lower.includes(k))) queue.push(link);
    });
  }

  return pages;
}
