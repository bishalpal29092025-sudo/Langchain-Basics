import "dotenv/config";
import { Document } from "@langchain/core/documents";
import { RecursiveCharacterTextSplitter } from "@langchain/textsplitters";

// A longer document to split
const rawText = `Solana is a high-performance blockchain designed for decentralized applications and crypto assets.
It was founded by Anatoly Yakovenko in 2017 and launched in 2020.
Solana uses a unique consensus mechanism called Proof of History (PoH) combined with Proof of Stake (PoS).
Proof of History creates a historical record that proves an event occurred at a specific moment in time.
This allows validators to agree on the order of transactions without communicating with each other constantly.

Solana can process up to 65,000 transactions per second with block times of 400 milliseconds.
The native token of Solana is SOL, which is used to pay transaction fees and for staking.
Transaction fees on Solana are extremely low, often fractions of a cent.

Validators are nodes that process transactions and secure the Solana network.
They stake SOL as collateral and earn rewards for honest participation.
Running a validator requires powerful hardware including fast CPUs, large RAM, and high-speed SSDs.

Program Derived Addresses (PDAs) are deterministic addresses derived from a program ID and seeds.
PDAs have no private key and can only be signed by their owning program.
They are commonly used for vaults, escrow accounts, and storing program state.

Cross Program Invocations (CPIs) allow one Solana program to call another program.
This enables composability between programs, similar to function calls in traditional software.
CPIs are essential for building complex DeFi protocols on Solana.`;

const doc = new Document({
  pageContent: rawText,
  metadata: {
    source: "solana-notes",
  },
});

// RecursiveCharacterTextSplitter — splits by paragraphs, then sentences, then words
const splitter = new RecursiveCharacterTextSplitter({
  chunkSize: 200, // max characters per chunk
  chunkOverlap: 40, // overlap between chunk to preserve context
});

const chunks = await splitter.splitDocuments([doc]);

console.log(`📄 Original length: ${rawText.length} characters`);
console.log(`✂️  Split into ${chunks.length} chunks\n`);

chunks.forEach((chunk, i) => {
  console.log(`--- Chunk ${i + 1} (${chunk.pageContent.length} chars) ---`);
  console.log(chunk.pageContent);
  console.log("Metadata: ", chunk.metadata);
  console.log();
});
