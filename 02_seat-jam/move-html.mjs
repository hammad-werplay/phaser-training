import fs from "fs";
import path from "path";
import { fileURLToPath } from "url";

const __dirname = path.dirname(fileURLToPath(import.meta.url));

const from = path.resolve(__dirname, "./indexfinal.html");
const to = path.resolve(__dirname, "./dist-inlines/index.html");

fs.mkdirSync(path.dirname(to), { recursive: true });

// Move (or overwrite) the file
fs.renameSync(from, to);

console.log(`✅ Moved ${from} → ${to}`);
