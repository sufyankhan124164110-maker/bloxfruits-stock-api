import express, { Request, Response } from "express";
import cors from "cors";
import axios from "axios";
import * as cheerio from "cheerio";

const app = express();

app.use(cors());

const PORT = process.env.PORT || 3300;

const URL =
  "https://blox-fruits.fandom.com/wiki/Blox_Fruits_%22Stock%22";

interface FruitObj {
  name: string;
  price: number;
}

function removeDuplicates(arr: string[]) {
  return [...new Set(arr)];
}

async function scrapeStock(selector: string) {
  const res = await axios.get(URL);
  const $ = cheerio.load(res.data);

  const data: FruitObj[] = [];

  $(selector).each((_, el) => {
    const name = $(el).find("big b a").attr("title");
    const priceText = $(el).find("span").last().text();

    if (!name) return;

    data.push({
      name,
      price: parseFloat(priceText.replace(/,/g, "") || "0"),
    });
  });

  return removeDuplicates(data.map(d => JSON.stringify(d))).map(d =>
    JSON.parse(d)
  );
}

app.get("/", (req: Request, res: Response) => {
  res.json({
    status: "online",
    message: "Blox Fruits Stock API",
    endpoints: {
      currentStock: "/v1/currentstock",
      lastStock: "/v1/laststock",
    },
  });
});

app.get("/v1/currentstock", async (req: Request, res: Response) => {
  try {
    const selector =
      "#mw-customcollapsible-current figure > figcaption > center";

    const data = await scrapeStock(selector);

    res.json(data);
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: "current stock failed" });
  }
});

app.get("/v1/laststock", async (req: Request, res: Response) => {
  try {
    const selector =
      "#mw-customcollapsible-last figure > figcaption > center";

    const data = await scrapeStock(selector);

    res.json(data);
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: "last stock failed" });
  }
});

app.listen(PORT, () => {
  console.log(`Server running on port ${PORT}`);
});
