import fs from "fs";
import path from "path";

/**
 * Encodes files in a folder (and sub-folders) to Base64 and writes JS export files.
 * @param {string} inputFolder - The folder containing the files to process.
 * @param {string} outputFolder - The folder to save the generated JS files.
 */
async function encodeFilesToBase64(inputFolder, outputFolder) {
	const objectEntries = [];

	// Recursive function to process files
	async function processFolder(folder) {
		const entries = fs.readdirSync(folder, { withFileTypes: true });

		for (const entry of entries) {
			const fullPath = path.join(folder, entry.name);

			if (entry.isDirectory()) {
				// Recurse into sub-folder
				await processFolder(fullPath);
			} else if (entry.isFile()) {
				const relativePath = path.relative(inputFolder, fullPath);
				const fileNameWithoutExt = path.parse(entry.name).name;
				const fileExt = path.extname(entry.name).slice(1);
				const fileContent = fs.readFileSync(fullPath);
				const base64Content = fileContent.toString("base64");
				const mimeType = getMimeType(fileExt);
				const exportName = `${camelCase(
					fileNameWithoutExt
				)}${fileExt.toUpperCase()}`;

				objectEntries.push(
					`"${exportName}": "data:${mimeType};base64,${base64Content}"`
				);

				console.log(`Processed: ${entry.name}`);
			}
		}
	}

	await processFolder(inputFolder);

	const htmlPath = path.resolve("index.html");
	let html = fs.readFileSync(htmlPath, "utf-8");

	const constantsObject = `window.mediaData = {\n  ${objectEntries.join(
		",\n  "
	)}\n};`;

	html = html.replace(
		/(<script[^>]*id=["']app-constants["'][^>]*>)([\s\S]*?)(<\/script>)/,
		(_, startTag, scriptContent, endTag) => {
			const cleanedScript = scriptContent
				.replace(/window\.mediaData\s*=\s*\{[\s\S]*?\};?/, "")
				.trim();
			return `${startTag}\n${constantsObject}\n${cleanedScript}\n${endTag}`;
		}
	);

	fs.writeFileSync(htmlPath, html, "utf-8");
	console.log("✅ Injected base64 object into <script id='app-constants'>");
}

/**
 * Generate export code for FBX files with usage instructions
 * @param {string} exportName - The variable name
 * @param {string} base64Content - The base64 encoded content
 * @param {string} mimeType - The MIME type
 * @returns {string} Export code
 */
function generateFbxExport(exportName, base64Content, mimeType) {
	return `
// Base64 encoded FBX model
export const ${exportName} = "data:${mimeType};base64,${base64Content}";

/* 
  To use this FBX model in Three.js with Phaser:

  import { ${exportName} } from './path/to/this/file';
  import { FBXLoader } from 'three/examples/jsm/loaders/FBXLoader';

  // In your scene:
  loadModel() {
    // Convert data URL to blob
    const base64 = ${exportName}.split(',')[1];
    const binary = atob(base64);
    const bytes = new Uint8Array(binary.length);
    for (let i = 0; i < binary.length; i++) {
      bytes[i] = binary.charCodeAt(i);
    }
    
    const blob = new Blob([bytes.buffer], { type: '${mimeType}' });
    const url = URL.createObjectURL(blob);
    
    // Load with FBXLoader
    const loader = new FBXLoader();
    loader.load(
      url,
      (object) => {
        // Position and scale
        object.position.set(0, 0, 0);
        object.scale.set(0.1, 0.1, 0.1);
        
        // Add to scene
        this.threeScene.add(object);
        
        // Clean up
        URL.revokeObjectURL(url);
      },
      (xhr) => {
        console.log((xhr.loaded / xhr.total * 100) + '% loaded');
      },
      (error) => {
        console.error('Error loading model:', error);
      }
    );
  }
*/
`;
}

/**
 * Get the MIME type based on the file extension.
 * @param {string} ext - The file extension.
 * @returns {string} MIME type.
 */
function getMimeType(ext) {
	const mimeTypes = {
		png: "image/png",
		jpg: "image/jpeg",
		jpeg: "image/jpeg",
		gif: "image/gif",
		svg: "image/svg+xml",
		json: "application/json",
		atlas: "text/plain",
		mp3: "audio/mpeg",
		wav: "audio/wav",
		fbx: "application/octet-stream",
	};
	return mimeTypes[ext.toLowerCase()] || "application/octet-stream";
}

/**
 * Converts a string to camelCase.
 * @param {string} str - The input string.
 * @returns {string} The camelCase version of the string.
 */
function camelCase(str) {
	return str.replace(/[-_](.)/g, (_, char) => char.toUpperCase());
}

// Example usage
const inputFolder = "./public/assets"; // Replace with your input folder
const outputFolder = "./media"; // Replace with your output folder

encodeFilesToBase64(inputFolder, outputFolder).catch(console.error);
