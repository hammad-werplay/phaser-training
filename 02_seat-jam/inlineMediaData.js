import fs from "fs";
import path from "path";

const htmlPath = path.resolve("index.html");
let html = fs.readFileSync(htmlPath, "utf-8");

const scriptMatch = html.match(
	/<script[^>]*id=["']app-constants["'][^>]*>([\s\S]*?)<\/script>/
);

if (!scriptMatch) {
	throw new Error('No <script id="app-constants"> found');
}

const scriptContent = scriptMatch[1];

const mediaMatch = scriptContent.match(
	/const\s+mediaData\s*=\s*\{([\s\S]*?)\};?/
);

if (!mediaMatch) {
	throw new Error("No mediaData object found inside app-constants script");
}

const mediaBody = mediaMatch[1];

const mediaData = {};
const entryRegex = /["']?([\w\d_]+)["']?\s*:\s*["'](data:[^"']+)["']/g;
let match;

while ((match = entryRegex.exec(mediaBody))) {
	const [_, key, value] = match;
	mediaData[key] = value;
}

html = html.replace(/mediaData\.([a-zA-Z0-9_]+)/g, (_, key) => {
	if (mediaData[key]) {
		return `"${mediaData[key]}"`;
	}
	return `mediaData.${key}`;
});

html = html.replace(/const\s+mediaData\s*=\s*\{[\s\S]*?\};\s*/, "");

fs.writeFileSync("indexfinal.html", html, "utf-8");

console.log("✅ Finished. Saved as indexfinal.html");
