// api/sub.js — Vercel Serverless Function
// Merges multiple V2Box/V2Ray subscription URLs into one

export default async function handler(req, res) {
  // CORS headers
  res.setHeader("Access-Control-Allow-Origin", "*");
  res.setHeader("Access-Control-Allow-Methods", "GET, OPTIONS");

  if (req.method === "OPTIONS") {
    return res.status(200).end();
  }

  // Read subscription URLs from environment variable
  // Format: SUB_URLS=https://sub1.example.com/sub,https://sub2.example.com/sub
  const subUrls = process.env.SUB_URLS
    ? process.env.SUB_URLS.split(",").map((u) => u.trim()).filter(Boolean)
    : [];

  if (subUrls.length === 0) {
    return res.status(500).send("No SUB_URLS configured in environment variables.");
  }

  try {
    // Fetch all subscriptions in parallel
    const results = await Promise.allSettled(
      subUrls.map((url) =>
        fetch(url, {
          headers: {
            "User-Agent": "v2rayN/6.0",
            "Accept": "*/*",
          },
          signal: AbortSignal.timeout(10000),
        }).then((r) => {
          if (!r.ok) throw new Error(`HTTP ${r.status} for ${url}`);
          return r.text();
        })
      )
    );

    const allNodes = [];

    for (let i = 0; i < results.length; i++) {
      const result = results[i];
      if (result.status === "rejected") {
        console.error(`Sub ${i + 1} failed: ${result.reason}`);
        continue;
      }

      const raw = result.value.trim();

      // Detect format: base64 or plain text
      let decoded = raw;
      if (!raw.startsWith("vmess://") && !raw.startsWith("vless://") &&
          !raw.startsWith("ss://") && !raw.startsWith("trojan://") &&
          !raw.startsWith("hysteria") && !raw.startsWith("#")) {
        try {
          decoded = Buffer.from(raw, "base64").toString("utf-8");
        } catch {
          decoded = raw;
        }
      }

      // Split into individual node lines
      const lines = decoded
        .split(/\r?\n/)
        .map((l) => l.trim())
        .filter((l) => l.length > 0);

      allNodes.push(...lines);
    }

    if (allNodes.length === 0) {
      return res.status(502).send("All subscriptions failed or returned empty content.");
    }

    // Deduplicate by exact line
    const unique = [...new Set(allNodes)];

    // Encode as base64 (standard v2ray subscription format)
    const merged = Buffer.from(unique.join("\n"), "utf-8").toString("base64");

    res.setHeader("Content-Type", "text/plain; charset=utf-8");
    res.setHeader("Cache-Control", "no-store, max-age=0");
    res.setHeader("Subscription-Userinfo", `total=${unique.length}`);
    return res.status(200).send(merged);
  } catch (err) {
    console.error("Merger error:", err);
    return res.status(500).send(`Internal error: ${err.message}`);
  }
}
