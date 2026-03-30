import express from "express";
import path from "path";
import { fileURLToPath } from "url";
import fs from "fs";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const app = express();
const PORT = 3000;

const distPath = path.resolve(__dirname, "dist");

// Log startup info
console.log("Server starting...");
console.log("Dist path:", distPath);
console.log("Dist exists:", fs.existsSync(distPath));

// Serve static files from dist
app.use(express.static(distPath));

// Health check
app.get("/health", (req, res) => {
  res.send("OK");
});

// SPA fallback: serve index.html for any unknown route
app.get("*", (req, res) => {
  const indexPath = path.join(distPath, "index.html");
  if (fs.existsSync(indexPath)) {
    res.sendFile(indexPath);
  } else {
    res.status(404).send("Application build not found. Please ensure 'npm run build' was successful.");
  }
});

app.listen(PORT, "0.0.0.0", () => {
  console.log(`Server is listening on http://0.0.0.0:${PORT}`);
});
