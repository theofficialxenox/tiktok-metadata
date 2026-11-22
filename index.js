const express = require("express");
const fetch = require("node-fetch");

const app = express();
const PORT = process.env.PORT || 3000;

app.use((req, res, next) => {
  res.header("Access-Control-Allow-Origin", "*");
  next();
});

app.get("/metadata", async (req, res) => {
  const url = req.query.url;
  if (!url) return res.json({ error: "No URL provided" });

  try {
    // Try oEmbed first
    const oembedRes = await fetch(
      `https://www.tiktok.com/oembed?url=${encodeURIComponent(url)}`,
      {
        headers: {
          "User-Agent": "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36",
        },
      }
    );

    if (oembedRes.ok) {
      const data = await oembedRes.json();

      const handleFromUrl = url.match(/@([\w.]+)/)?.[1] || "";
      const hashtags = (data.title || "").match(/#\w+/g) || [];

      return res.json({
        thumbnail: data.thumbnail_url || "",
        description: data.title || "",
        author: data.author_name || handleFromUrl || "TikTok",
        authorHandle: handleFromUrl,
        hashtags,
      });
    }

    // Fallback: scrape open graph tags
    const pageRes = await fetch(url, {
      headers: {
        "User-Agent": "Mozilla/5.0 (compatible; Googlebot/2.1; +http://www.google.com/bot.html)",
      },
    });

    const html = await pageRes.text();

    const getMeta = (prop) => {
      const match = html.match(new RegExp(`<meta[^>]+property=["']${prop}["'][^>]+content=["']([^"']+)["']`, "i"))
        || html.match(new RegExp(`<meta[^>]+content=["']([^"']+)["'][^>]+property=["']${prop}["']`, "i"));
      return match?.[1] || "";
    };

    const title = getMeta("og:title");
    const description = getMeta("og:description");
    const thumbnail = getMeta("og:image");
    const hashtags = (title + " " + description).match(/#\w+/g) || [];
    const handleFromUrl = url.match(/@([\w.]+)/)?.[1] || "";

    return res.json({
      thumbnail,
      description: description || title,
      author: handleFromUrl || "TikTok",
      authorHandle: handleFromUrl,
      hashtags,
    });

  } catch (err) {
    console.error("Metadata error:", err.message);
    return res.json({ error: "Failed to fetch metadata", detail: err.message });
  }
});

app.listen(PORT, () => {
  console.log(`Metadata server running on port ${PORT}`);
});
