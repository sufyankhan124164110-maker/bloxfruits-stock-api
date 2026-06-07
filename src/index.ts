import express from "express";
import cors from "cors";

const app = express();

app.use(cors());

const PORT = process.env.PORT || 3300;

app.get("/", (req, res) => {
  res.json({
    status: "online",
    message: "Blox Fruits Stock API is running",
    endpoints: {
      currentStock: "/v1/currentstock",
      lastStock: "/v1/laststock"
    }
  });
});

app.get("/v1/currentstock", (req, res) => {
  res.json([
    {
      name: "Kitsune",
      price: 8000000
    },
    {
      name: "Leopard",
      price: 5000000
    },
    {
      name: "Dragon",
      price: 3500000
    }
  ]);
});

app.get("/v1/laststock", (req, res) => {
  res.json([
    {
      name: "Dough",
      price: 2800000
    },
    {
      name: "Spirit",
      price: 3400000
    }
  ]);
});

app.listen(PORT, () => {
  console.log(`Server running on port ${PORT}`);
});
