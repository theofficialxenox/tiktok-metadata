const express = require("express");
const fetch = require("node-fetch");

const app = express();
const PORT = process.env.PORT || 3000;
const RAPIDAPI_KEY = "a2c81aaf53msha8b0f7a69633dc9p139bc7jsna7b197343552";

app.use((req, res, next) => {
  res.header("Access-Control-Allow-Origin", "*");
  next();
});

app.get("/metadata", async (req, res) => {
  const url = req.query.url;
  if (!url) return res.json({ error: "No URL provided" });

  try {
    const handleFromUrl = url.match(/@([\w.]+)/)?.[1] || "";

    const response = await fetch(
     `https://tiktok-scraper7.p.rapidapi.com/?url=${encodeURIComponent(url)}&hd=1`,
      {
        headers: {
          "x-rapidapi-host": "tiktok-scraper7.p.rapidapi.com",
          "x-rapidapi-key": RAPIDAPI_KEY,
        },
      }
    );

    const json = await response.json();

    if (json.code !== 0 || !json.data) {
      return res.json({
        thumbnail: "",
        description: "",
        author: handleFromUrl || "TikTok",
        authorHandle: handleFromUrl,
        hashtags: [],
      });
    }

    const data = json.data;
    const title = data.title || "";
    const hashtags = title.match(/#\w+/g) || [];

    return res.json({
      thumbnail: data.cover || "",
      description: title.replace(/#\w+/g, "").trim(),
      author: data.author?.nickname || handleFromUrl || "TikTok",
      authorHandle: data.author?.unique_id || handleFromUrl,
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
