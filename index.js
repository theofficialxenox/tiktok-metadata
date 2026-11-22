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
    const response = await fetch(url, {
      headers: {
        "User-Agent": "Mozilla/5.0 (iPhone; CPU iPhone OS 16_0 like Mac OS X) AppleWebKit/605.1.15 (KHTML, like Gecko) Version/16.0 Mobile/15E148 Safari/604.1",
        "Accept": "text/html,application/xhtml+xml,application/xml;q=0.9,*/*;q=0.8",
        "Accept-Language": "en-US,en;q=0.9",
      },
      redirect: "follow",
    });

    if (!response.ok) throw new Error(`Page fetch failed: ${response.status}`);

    const html = await response.text();

    // Try og tags
    const title = html.match(/<meta[^>]+property="og:title"[^>]+content="([^"]+)"/)?.[1] || "";
    const description = html.match(/<meta[^>]+property="og:description"[^>]+content="([^"]+)"/)?.[1] || title;
    const thumbnail = html.match(/<meta[^>]+property="og:image"[^>]+content="([^"]+)"/)?.[1] || "";

    // Author from title (format: "Name on TikTok" or "@handle")
    const authorFromTitle = title.match(/^(.+?)\s+on TikTok/i)?.[1] || "";
    const handleFromUrl = url.match(/@([\w.]+)/)?.[1] || "";

    const hashtags = [...description.matchAll(/#([\w]+)/g)].map(m => `#${m[1]}`);

    return res.json({
      thumbnail,
      description,
      author: authorFromTitle || handleFromUrl || "TikTok",
      authorHandle: handleFromUrl ? `@${handleFromUrl}` : "",
      hashtags,
    });

  } catch (err) {
    return res.json({ error: err.message, thumbnail: "", description: "", author: "TikTok", authorHandle: "", hashtags: [] });
  }
});

app.get("/debug", async (req, res) => {
  const url = req.query.url;
  if (!url) return res.json({ error: "No URL" });
  const response = await fetch(url, {
    headers: {
      "User-Agent": "Mozilla/5.0 (iPhone; CPU iPhone OS 16_0 like Mac OS X) AppleWebKit/605.1.15 (KHTML, like Gecko) Version/16.0 Mobile/15E148 Safari/604.1",
      "Accept": "text/html,application/xhtml+xml,application/xml;q=0.9,*/*;q=0.8",
    },
    redirect: "follow",
  });
  const text = await response.text();
  return res.json({ status: response.status, length: text.length, snippet: text.slice(0, 2000) });
});

app.get("/", (req, res) => res.json({ status: "ok" }));

app.listen(PORT, () => console.log(`Metadata server running on port ${PORT}`));
