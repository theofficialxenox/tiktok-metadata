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
    const handleFromUrl = url.match(/@([\w.]+)/)?.[1] || "";

    // Try Noembed
    const noembedRes = await fetch(
      `https://noembed.com/embed?url=${encodeURIComponent(url)}`,
      {
        headers: {
          "User-Agent": "Mozilla/5.0",
        },
      }
    );

    if (noembedRes.ok) {
      const data = await noembedRes.json();

      if (data.title && !data.error) {
        const hashtags = (data.title || "").match(/#\w+/g) || [];

        return res.json({
          thumbnail: data.thumbnail_url || "",
          description: data.title || "",
          author: data.author_name || handleFromUrl || "TikTok",
          authorHandle: handleFromUrl,
          hashtags,
        });
      }
    }

    // Fallback: return what we can from the URL
    return res.json({
      thumbnail: "",
      description: "",
      author: handleFromUrl || "TikTok",
      authorHandle: handleFromUrl,
      hashtags: [],
    });

  } catch (err) {
    console.error("Metadata error:", err.message);
    return res.json({ error: "Failed to fetch metadata", detail: err.message });
  }
});

app.listen(PORT, () => {
  console.log(`Metadata server running on port ${PORT}`);
});
