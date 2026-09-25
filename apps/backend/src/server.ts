import express from "express";
import type { Example } from "@tms/contracts";

const example: Example = {
  id: 1,
  name: "Test",
  value: "Hello"
};

const app = express();
const PORT = process.env.PORT || 5000;

app.use(express.json());

app.get("/", (_req, res) => {
  res.json({
    message: "Hello from Express + TypeScript! Hello World"
  });
});

app.listen(PORT, () => {
  console.log(`Server running at http://localhost:${PORT}`);
});
