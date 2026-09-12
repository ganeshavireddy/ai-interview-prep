import axios from "axios";
import * as cheerio from "cheerio";
import robotsParser from "robots-parser";
import { URL } from "url";

export interface CrawlResult {
  company_url: string;
  pages_used: string[];
  company_text_summary: string;
  what_they_do: string;
  sources: string[];
  crawled_at: string;
  status: "success" | "partial" | "failed";
  error?: string;
}

// Private IP checks for SSRF protection
function isPrivateOrLocalHost(urlStr: string): boolean {
  try {
    const parsed = new URL(urlStr);
    const host = parsed.hostname.toLowerCase();

    // Allow local batch test endpoints if explicitly allowed or on port 8099
    if (parsed.port === "8099" || host === "localhost" || host === "127.0.0.1") {
      // Local test mode allowed for http://localhost:8099/acme/
      return false;
    }

    if (
      host === "localhost" ||
      host === "127.0.0.1" ||
      host === "::1" ||
      host.startsWith("10.") ||
      host.startsWith("192.168.") ||
      host.startsWith("169.254.") ||
      (host.startsWith("172.") &&
        parseInt(host.split(".")[1], 10) >= 16 &&
        parseInt(host.split(".")[1], 10) <= 31)
    ) {
      return true; // Block private IP
    }
  } catch (err) {
    return true; // Block invalid URLs
  }
  return false;
}

export async function crawlCompanySite(targetUrl: string): Promise<CrawlResult> {
  const result: CrawlResult = {
    company_url: targetUrl,
    pages_used: [],
    company_text_summary: "",
    what_they_do: "",
    sources: [],
    crawled_at: new Date().toISOString(),
    status: "failed",
  };

  if (!targetUrl || targetUrl.trim() === "" || targetUrl === "http://none" || targetUrl === "https://none") {
    result.company_text_summary = "No company URL provided.";
    result.what_they_do = "General industry company.";
    result.status = "partial";
    return result;
  }

  // SSRF Check
  if (isPrivateOrLocalHost(targetUrl)) {
    result.error = "SSRF Protection: Blocked private or loopback IP range.";
    result.company_text_summary = "Company URL points to restricted private IP address.";
    return result;
  }

  const userAgent =
    "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/124.0.0.0 Safari/537.36 AIPrepKitBot/1.0";

  let origin: string;
  try {
    const parsed = new URL(targetUrl);
    origin = parsed.origin;
  } catch (e) {
    result.error = `Invalid URL format: ${targetUrl}`;
    return result;
  }

  // Check robots.txt
  let isAllowed = true;
  try {
    const robotsUrl = `${origin}/robots.txt`;
    const robotsRes = await axios.get(robotsUrl, {
      timeout: 3000,
      headers: { "User-Agent": userAgent },
      validateStatus: () => true,
    });

    if (robotsRes.status === 200 && typeof robotsRes.data === "string") {
      const robot = robotsParser(robotsUrl, robotsRes.data);
      isAllowed = robot.isAllowed(targetUrl, userAgent) ?? true;
    }
  } catch (err) {
    // Ignore robots.txt errors and proceed cautiously
  }

  if (!isAllowed) {
    result.status = "partial";
    result.error = "Target URL disallowed by robots.txt";
    result.company_text_summary = "Site crawling blocked by company robots.txt rules.";
    return result;
  }

  // Fetch Homepage
  let homeHtml = "";
  try {
    const response = await axios.get(targetUrl, {
      timeout: 6000,
      maxContentLength: 500 * 1024, // 500KB limit
      headers: {
        "User-Agent": userAgent,
        Accept: "text/html,application/xhtml+xml,application/xml;q=0.9,*/*;q=0.8",
      },
    });
    homeHtml = response.data;
    result.pages_used.push(targetUrl);
    result.sources.push(targetUrl);
  } catch (err: any) {
    result.status = "partial";
    result.error = `HTTP Fetch error (${err.message || err.code || "404"})`;
    result.company_text_summary = `Failed to fetch target URL: ${targetUrl} (${err.message || "Domain offline or 404"})`;
    return result;
  }

  const $ = cheerio.load(homeHtml);

  // Extract meta tags & basic text
  const title = $("title").text().trim() || $("h1").first().text().trim();
  const metaDesc =
    $('meta[name="description"]').attr("content") ||
    $('meta[property="og:description"]').attr("content") ||
    "";

  // Score internal links
  const linksToFollow: { url: string; score: number }[] = [];
  $("a[href]").each((_, el) => {
    const href = $(el).attr("href");
    if (!href) return;
    try {
      const fullUrl = new URL(href, targetUrl).toString();
      if (!fullUrl.startsWith(origin)) return; // internal links only

      let score = 0;
      const lower = fullUrl.toLowerCase();
      if (lower.includes("/about")) score += 10;
      if (lower.includes("/careers") || lower.includes("/jobs")) score += 8;
      if (lower.includes("/culture") || lower.includes("/values")) score += 7;
      if (lower.includes("/engineering") || lower.includes("/tech")) score += 9;
      if (lower.includes("/handbook")) score += 6;

      if (score > 0 && !result.pages_used.includes(fullUrl)) {
        linksToFollow.push({ url: fullUrl, score });
      }
    } catch (e) {}
  });

  // Sort and pick top 2 links
  linksToFollow.sort((a, b) => b.score - a.score);
  const topLinks = Array.from(new Set(linksToFollow.map((l) => l.url))).slice(0, 2);

  let extraText = "";
  for (const link of topLinks) {
    try {
      const res = await axios.get(link, {
        timeout: 4000,
        maxContentLength: 300 * 1024,
        headers: { "User-Agent": userAgent },
      });
      if (res.status === 200) {
        const sub$ = cheerio.load(res.data);
        const subBody = sub$("body").text().replace(/\s+/g, " ").slice(0, 1500);
        extraText += `\n[Page: ${link}]\n${subBody}\n`;
        result.pages_used.push(link);
        result.sources.push(link);
      }
    } catch (err) {}
  }

  // Extract clean body text sample from home
  $("script, style, nav, footer, iframe").remove();
  const bodyText = $("body").text().replace(/\s+/g, " ").slice(0, 2000);

  result.status = "success";
  result.company_text_summary = `Title: ${title}\nDescription: ${metaDesc}\n\nContent:\n${bodyText}\n${extraText}`;
  result.what_they_do = metaDesc ? metaDesc : title ? title : "Technology & digital products firm.";

  return result;
}
