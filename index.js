const express = require("express");
const puppeteer = require("puppeteer");

const app = express();
const PORT = process.env.PORT || 3000;

app.use((req, res, next) => {
  res.header("Access-Control-Allow-Origin", "*");
  next();
});

app.get("/metadata", async (req, res) => {
  const url = req.query.url;
  if (!url) return res.json({ error: "No URL provided" });

  let browser;
  try {
    browser = await puppeteer.launch({
      headless: true,
      args: [
        "--no-sandbox",
        "--disable-setuid-sandbox",
        "--disable-dev-shm-usage",
        "--disable-gpu",
      ],
    });

    const page = await browser.newPage();
    await page.setUserAgent(
      "Mozilla/5.0 (iPhone; CPU iPhone OS 16_0 like Mac OS X) AppleWebKit/605.1.15 (KHTML, like Gecko) Version/16.0 Mobile/15E148 Safari/604.1"
    );

    await page.goto(url, { waitUntil: "networkidle2", timeout: 30000 });

    const metadata = await page.evaluate(() => {
      const getMeta = (prop) =>
        document.querySelector(`meta[property="${prop}"]`)?.content ||
        document.querySelector(`meta[name="${prop}"]`)?.content ||
        "";

      const title = getMeta("og:title");
      const description = getMeta("og:description");
      const thumbnail = getMeta("og:image");

      const hashtags = [...document.querySelectorAll('a[href*="/tag/"]')]
        .map((a) => {
          const match = a.href.match(/\/tag\/([\w]+)/);
          return match ? `#${match[1]}` : null;
        })
        .filter(Boolean);

      const authorFromTitle = title.match(/^(.+?)\s+on TikTok/i)?.[1] || "";

      return { title, description, thumbnail, hashtags, authorFromTitle };
    });

    const handleFromUrl = url.match(/@([\w.]+)/)?.[1] || "";

    return res.json({
      thumbnail: metadata.thumbnail,
      description: metadata.description || metadata.title,
      author: metadata.authorFromTitle || handleFromUrl || "TikTok",
      authorHandle: handleFromUrl,
      hashtags: metadata.hashtags || [],
    });

  } catch (err) {
    console.error("Puppeteer error:", err.message);
    return res.json({ error: "Failed to fetch metadata", detail: err.message });
  } finally {
    if (browser) await browser.close();
  }
});

app.listen(PORT, () => {
  console.log(`Metadata server running on port ${PORT}`);
});
