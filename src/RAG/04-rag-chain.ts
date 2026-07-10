import "dotenv/config";
import { Document } from "@langchain/core/documents";
import { RecursiveCharacterTextSplitter } from "@langchain/textsplitters";
import { OllamaEmbeddings } from "@langchain/ollama";
import { MemoryVectorStore } from "@langchain/classic/vectorstores/memory";
import { ChatCerebras } from "@langchain/cerebras";
import { ChatPromptTemplate } from "@langchain/core/prompts";
import { StringOutputParser } from "@langchain/core/output_parsers";
import {
  RunnablePassthrough,
  RunnableSequence,
} from "@langchain/core/runnables";

const llm = new ChatCerebras({
  model: "gpt-oss-120b",
  temperature: 0,
  apiKey: process.env.CEREBRAS_API_KEY,
});

// Step 1 -- Source Document
const rawText = `Solana is a high-performance blockchain designed for decentralized applications and crypto assets.
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
This enables composability between programs, similar to function calls in traditional software.`;

//Step 2 -- Split
const splitter = new RecursiveCharacterTextSplitter({
  chunkSize: 200,
  chunkOverlap: 40,
});

const chunks = await splitter.splitDocuments([
  new Document({
    pageContent: rawText,
    metadata: {
      source: "solana-notes",
    },
  }),
]);
console.log(`Split into ${chunks.length} chunks`);

// Step 3 -- Embed and Store
const embeddings = new OllamaEmbeddings({
    model: "nomic-embed-text"
});

const vectorStore = await MemoryVectorStore.fromDocuments(chunks, embeddings);
const retriever = vectorStore.asRetriever(3); // Fetch top 3 chunks
console.log("Vector store ready...\n");

// Step 4 -- RAG Prompt
const ragPrompt = ChatPromptTemplate.fromMessages([
  [
    "system",
    `You are a Solana expert assistant. Answer the question using ONLY the provided context.
If the answer is not in the context, say "I don't have that information."

Context:
{context}`,
  ],
  ["human", "{question}"],
]);


// Step 5 -- Format retrieved docs into a single string
function formatDocs(docs: Document[]): string {
    return docs.map((d) => d.pageContent).join("\n\n");
}

// Step 6 -- RAG Chain
const ragChain = RunnableSequence.from([
    {
        context: retriever.pipe(formatDocs), // Retrieve -> Format
        question: new RunnablePassthrough(), // Pass question through unchanged
    },
    ragPrompt,
    llm,
    new StringOutputParser(),
]);

// Step 7 -- Ask questions
const questions = [
  "What is the transaction speed of Solana?",
  "What hardware do validators need?",
  "What are PDAs used for?",
  "What is the price of Bitcoin?", // not in context — should say "I don't have that information"
];

for (const question of questions) {
  console.log(`❓ ${question}`);
  const answer = await ragChain.invoke(question);
  console.log(`💬 ${answer}\n`);
}