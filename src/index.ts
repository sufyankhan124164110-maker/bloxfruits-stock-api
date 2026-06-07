import express from "express";
import cors from "cors";
import axios from "axios";
import * as cheerio from "cheerio";

const app = express();
app.use(cors());

const PORT = process.env.PORT || 3300;

const URL =
  "https://blox-fruits.fandom.com/wiki/Blox_Fruits_%22Stock%22";

type Fruit = {
  name: string;
  price: number;
};

function safeNumber(text: string | undefined) {
  if (!text) return 0;
  const cleaned = text.replace(/,/g, "").match(/\d+/g);
  return cleaned ? parseFloat(cleaned[0]) : 0;
}

async function scrape(section: string) {
  const { data } = await axios.get(URL);
  const $ = cheerio.load(data);

  const names: string[] = [];
  const prices: string[] = [];

  // grab all links inside section (more stable than spans)
  $(`#${section} a`).each((_, el) => {
    const name = $(el).attr("title");
    if (name && !name.includes("Special:")) {
      names.push(name);
    }
  });

  // grab all text nodes that look like numbers
  $(`#${section}`).find("span, b, td").each((_, el) => {
    const txt = $(el).text().trim();
    if (/\d/.test(txt)) {
      prices.push(txt);
    }
  });

  return { names, prices };
}

app.get("/", (_, res) => {
  res.json({
    status: "ok",
    routes: ["/v1/currentstock", "/v1/laststock"],
  });
});

app.get("/v1/currentstock", async (_, res) => {
  try {
    const { names, prices } = await scrape(
      "mw-customcollapsible-current"
    );

    const result: Fruit[] = names.map((name, i) => ({
      name,
      price: safeNumber(prices[i]),
    }));

    res.json(result);
  } catch (err) {
    res.status(500).json({ error: "scrape failed" });
  }
});

app.get("/v1/laststock", async (_, res) => {
  try {
    const { names, prices } = await scrape(
      "mw-customcollapsible-last"
    );

    const result: Fruit[] = names.map((name, i) => ({
      name,
      price: safeNumber(prices[i]),
    }));

    res.json(result);
  } catch (err) {
    res.status(500).json({ error: "scrape failed" });
  }
});

app.listen(PORT, () => {
  console.log("🔥 Server running on port", PORT);
});
