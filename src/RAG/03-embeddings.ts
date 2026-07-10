import "dotenv/config";

import { Document } from "@langchain/core/documents";
import { RecursiveCharacterTextSplitter } from "@langchain/textsplitters";
import { OllamaEmbeddings } from "@langchain/ollama";
import { MemoryVectorStore } from "@langchain/classic/vectorstores/memory";

// ===============================
// Source Document
// ===============================
const rawText = `
Solana is a high-performance blockchain designed for decentralized applications and crypto assets.
It was founded by Anatoly Yakovenko in 2017 and launched in 2020.
Solana uses Proof of History (PoH) combined with Proof of Stake (PoS).

Solana can process up to 65,000 transactions per second with block times of 400 milliseconds.
The native token of Solana is SOL, used to pay transaction fees and for staking.
Transaction fees on Solana are extremely low, often fractions of a cent.

Validators are nodes that process transactions and secure the Solana network.
They stake SOL as collateral and earn rewards for honest participation.
Running a validator requires powerful hardware including fast CPUs, large RAM, and high-speed SSDs.

Program Derived Addresses (PDAs) are deterministic addresses derived from a program ID and seeds.
PDAs have no private key and can only be signed by their owning program.
They are commonly used for vaults, escrow accounts, and storing program state.

Cross Program Invocations (CPIs) allow one Solana program to call another program.
This enables composability between programs, similar to function calls in traditional software.
`;

// ===============================
// Create Document
// ===============================
const documents = [
  new Document({
    pageContent: rawText,
    metadata: {
      source: "solana-notes",
    },
  }),
];

// ===============================
// Split into Chunks
// ===============================
const splitter = new RecursiveCharacterTextSplitter({
  chunkSize: 200,
  chunkOverlap: 40,
});

const chunks = await splitter.splitDocuments(documents);

console.log(`✅ Split into ${chunks.length} chunks\n`);

// ===============================
// Embedding Model
// ===============================
const embeddings = new OllamaEmbeddings({
  model: "nomic-embed-text",
});

// ===============================
// Create Vector Store
// ===============================
console.log("📦 Creating embeddings...");

const vectorStore = await MemoryVectorStore.fromDocuments(
  chunks,
  embeddings
);

console.log("✅ Vector Store Ready!\n");

// ===============================
// Similarity Search
// ===============================
const query = "How does Solana achieve high transaction speed?";

console.log(`🔍 Query: ${query}\n`);

const results = await vectorStore.similaritySearch(query, 3);

// ===============================
// Display Results
// ===============================
console.log("Top 3 Results:\n");

results.forEach((doc, index) => {
  console.log(`========== Result ${index + 1} ==========\n`);
  console.log(doc.pageContent);
  console.log("\nMetadata:", doc.metadata);
  console.log("\n");
});