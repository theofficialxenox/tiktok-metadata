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
      `https://noembed.com/embed?url=${encodeURIComponent(url)}`,
      { headers: { "User-Agent": "Mozilla/5.0", "Accept": "application/json" } }
    );

    if (!response.ok) throw new Error("noembed failed");

    const data = await response.json();

    if (!data?.title || data?.error) throw new Error("no data");

    const description = data.title || "";
    const hashtags = [...description.matchAll(/#([\w]+)/g)].map(m => `#${m[1]}`);
    const authorHandle = data.author_url
      ? "@" + data.author_url.split("/").filter(Boolean).pop()
      : "";

    return res.json({
      thumbnail: data.thumbnail_url || "",
      description,
      author: data.author_name || "TikTok",
      authorHandle,
      hashtags,
    });

  } catch {
    // Fallback to TikTok oEmbed directly
    try {
      const response = await fetch(
        `https://www.tiktok.com/oembed?url=${encodeURIComponent(url)}`,
        { headers: { "User-Agent": "Mozilla/5.0", "Accept": "application/json" } }
      );

      if (!response.ok) throw new Error("oembed failed");

      const data = await response.json();
      const description = data.title || "";
      const hashtags = [...description.matchAll(/#([\w]+)/g)].map(m => `#${m[1]}`);
      const authorHandle = data.author_url
        ? "@" + data.author_url.split("/").filter(Boolean).pop()
        : "";

      return res.json({
        thumbnail: data.thumbnail_url || "",
        description,
        author: data.author_name || "TikTok",
        authorHandle,
        hashtags,
      });

    } catch {
      return res.json({ error: "Could not fetch metadata" });
    }
  }
});

app.get("/", (req, res) => res.json({ status: "ok" }));

app.listen(PORT, () => console.log(`Metadata server running on port ${PORT}`));
