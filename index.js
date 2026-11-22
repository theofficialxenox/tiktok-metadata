const express = require("express");
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
    const response = await fetch(
      `https://www.tiktok.com/oembed?url=${encodeURIComponent(url)}`,
      {
        headers: {
          "User-Agent": "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36",
          "Accept": "application/json",
        },
      }
    );

    if (!response.ok) throw new Error(`oEmbed failed: ${response.status}`);

    const data = await response.json();

    const html = data.html || "";
    const title = data.title || "";

    const hashtagsFromHtml = [...html.matchAll(/\/tag\/([\w]+)\?/g)].map(m => `#${m[1]}`);
    const hashtagsFromTitle = [...title.matchAll(/#([\w]+)/g)].map(m => `#${m[1]}`);
    const hashtags = [...new Set([...hashtagsFromHtml, ...hashtagsFromTitle])];

    const authorUrl = data.author_url || "";
    const authorHandle = authorUrl
      ? "@" + authorUrl.split("/").filter(Boolean).pop()
      : "";

    return res.json({
      thumbnail: data.thumbnail_url || "",
      description: title,
      author: data.author_name || "TikTok",
      authorHandle,
      hashtags,
    });

  } catch (err) {
    console.log("oEmbed error:", err.message);
    return res.json({ error: err.message, thumbnail: "", description: "", author: "TikTok", authorHandle: "", hashtags: [] });
  }
});

app.get("/", (req, res) => res.json({ status: "ok" }));

app.listen(PORT, () => console.log(`Metadata server running on port ${PORT}`));
