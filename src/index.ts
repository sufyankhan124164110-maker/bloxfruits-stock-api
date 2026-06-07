import express, { Request, Response } from "express";
import cors from "cors";
import axios from "axios";
import cheerio from "cheerio";
import bodyParser from "body-parser";

const app = express();

app.use(bodyParser.json({ limit: "50mb" }));
app.use(cors());

const PORT = process.env.PORT || 3300;
const URL =
  "https://blox-fruits.fandom.com/wiki/Blox_Fruits_%22Stock%22";

interface FruitObj {
  name: string;
  price: number;
}

const removeDuplicates = (arr: string[]) => {
  return [...new Set(arr)];
};

async function scrapeStock(selector: string) {
  const res = await axios.get(URL);
  const $ = cheerio.load(res.data);

  const names: string[] = [];
  const prices: string[] = [];

  $(selector).each((_, el) => {
    const name = $(el).find("big b a").attr("title");
    const price = $(el).find("span").last().text();

    if (name) names.push(name);
    if (price) prices.push(price);
  });

  return {
    names: removeDuplicates(names),
    prices: removeDuplicates(prices),
  };
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

    const { names, prices } = await scrapeStock(selector);

    const data: FruitObj[] = names.map((name, i) => ({
      name,
      price: parseFloat((prices[i] || "0").replace(/,/g, "")),
    }));

    res.json(data);
  } catch (err) {
    res.status(500).json({ error: "Failed to fetch current stock" });
  }
});

app.get("/v1/laststock", async (req: Request, res: Response) => {
  try {
    const selector =
      "#mw-customcollapsible-last figure > figcaption > center";

    const { names, prices } = await scrapeStock(selector);

    const data: FruitObj[] = names.map((name, i) => ({
      name,
      price: parseFloat((prices[i] || "0").replace(/,/g, "")),
    }));

    res.json(data);
  } catch (err) {
    res.status(500).json({ error: "Failed to fetch last stock" });
  }
});

app.listen(PORT, () => {
  console.log(`Server running on port ${PORT}`);
});
