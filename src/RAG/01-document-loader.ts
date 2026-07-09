import "dotenv/config";
import { Document } from "@langchain/core/documents";
import { CheerioWebBaseLoader } from "@langchain/community/document_loaders/web/cheerio";
import * as fs from "fs";

// Manually create a Document from a text file (most reliable approach)
fs.writeFileSync(
  "src/RAG/sample.txt",
  `Solana is a high-performance blockchain.
It uses Proof of History (PoH) combined with Proof of Stake (PoS).
Solana can process up to 65,000 transactions per second.
The native token of Solana is SOL.
Validators on Solana need powerful hardware to participate.
PDAs (Program Derived Addresses) are a key feature of Solana programs.
CPIs (Cross Program Invocations) allow programs to call other programs.`
);

// Loader 1 — manual text file → Document
console.log("📄 Loading text file...");
const rawText = fs.readFileSync("src/RAG/sample.txt", "utf-8");
const textDocs = [
  new Document({
    pageContent: rawText,
    metadata: { source: "src/RAG/sample.txt" },
  }),
];

console.log("Text docs count:", textDocs.length);
console.log("Content preview:", textDocs[0].pageContent.slice(0, 100));
console.log("Metadata:", textDocs[0].metadata);

// Loader 2 — web page
console.log("\n🌐 Loading web page...");
const webLoader = new CheerioWebBaseLoader("https://solana.com/docs/terminology");
const webDocs = await webLoader.load();

console.log("Web docs count:", webDocs.length);
console.log("Content preview:", webDocs[0].pageContent.slice(0, 200));
console.log("Metadata:", webDocs[0].metadata);