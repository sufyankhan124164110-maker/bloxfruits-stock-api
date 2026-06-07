import express, { Request, Response } from "express";
import cors from "cors";
import axios from "axios";
import cheerio from "cheerio";

const app = express();
app.use(cors());

const PORT = process.env.PORT || 3300;

/* ---------------- SOURCES ---------------- */

const SOURCES = [
  {
    name: "fandom",
    url: "https://blox-fruits.fandom.com/wiki/Blox_Fruits_%22Stock%22",
  },
  {
    name: "fruityblox",
    url: "https://fruityblox.com/stock",
  },
  {
    name: "beebom",
    url: "https://beebom.com/blox-fruits-stock/",
  },
];

/* ---------------- CACHE (IMPORTANT 🔥) ---------------- */

let lastGoodData: any = null;

/* ---------------- HELPERS ---------------- */

const fetchHTML = async (url: string) => {
  const res = await axios.get(url, {
    headers: {
      "User-Agent":
        "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 Chrome/120 Safari/537.36",
    },
    timeout: 10000,
  });

  return res.data;
};

const parseFandom = (html: string) => {
  const $ = cheerio.load(html);

  const names: string[] = [];
  const prices: string[] = [];

  $("#mw-customcollapsible-current a[title]").each((_, el) => {
    const name = $(el).attr("title");
    if (name) names.push(name);
  });

  $("#mw-customcollapsible-current span").each((_, el) => {
    const t = $(el).text().trim();
    if (/\d/.test(t)) prices.push(t);
  });

  return { names, prices };
};

const parseFruityBlox = (html: string) => {
  const $ = cheerio.load(html);

  const names: string[] = [];
  const prices: string[] = [];

  $("table tr").each((_, el) => {
    const tds = $(el).find("td");

    const name = $(tds[0]).text().trim();
    const price = $(tds[1]).text().trim();

    if (name) names.push(name);
    if (price) prices.push(price);
  });

  return { names, prices };
};

/* ---------------- CORE ENGINE ---------------- */

async function getStockFromSources() {
  for (const source of SOURCES) {
    try {
      const html = await fetchHTML(source.url);

      let data;

      if (source.name === "fandom") {
        data = parseFandom(html);
      } else {
        data = parseFruityBlox(html);
      }

      if (data.names.length > 0) {
        const result = data.names.map((name, i) => ({
          name,
          price: parseFloat((data.prices[i] || "0").replace(/,/g, "")),
        }));

        lastGoodData = result; // CACHE SUCCESS
        return result;
      }
    } catch (err) {
      console.log(`❌ Failed source: ${source.name}`);
    }
  }

  // ALL FAILED → fallback cache
  return lastGoodData || [];
}

/* ---------------- ROUTES ---------------- */

app.get("/", (req: Request, res: Response) => {
  res.json({
    status: "online",
    message: "Multi-source Blox Fruits Stock API",
  });
});

app.get("/v1/currentstock", async (req: Request, res: Response) => {
  try {
    const data = await getStockFromSources();
    res.json(data);
  } catch (err) {
    res.status(500).json({ error: "all sources failed" });
  }
});

app.get("/v1/laststock", async (req: Request, res: Response) => {
  try {
    const data = await getStockFromSources();
    res.json(data);
  } catch (err) {
    res.status(500).json({ error: "all sources failed" });
  }
});

app.listen(PORT, () => {
  console.log(`Server running on port ${PORT}`);
});
