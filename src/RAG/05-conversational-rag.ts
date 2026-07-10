import "dotenv/config";
import { Document } from "@langchain/core/documents";
import { RecursiveCharacterTextSplitter } from "@langchain/textsplitters";
import { OllamaEmbeddings } from "@langchain/ollama";
import { MemoryVectorStore } from "@langchain/classic/vectorstores/memory";
import { ChatCerebras } from "@langchain/cerebras";
import { ChatPromptTemplate, MessagesPlaceholder } from "@langchain/core/prompts";
import { StringOutputParser } from "@langchain/core/output_parsers";
import { RunnablePassthrough, RunnableSequence } from "@langchain/core/runnables";
import { HumanMessage, AIMessage, BaseMessage } from "@langchain/core/messages";

const llm = new ChatCerebras({
  model: "gpt-oss-120b",
  temperature: 0,
  apiKey: process.env.CEREBRAS_API_KEY,
});

// ── 1. Setup vector store (same as lesson 4) ──
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

const splitter = new RecursiveCharacterTextSplitter({ chunkSize: 200, chunkOverlap: 40 });
const chunks = await splitter.splitDocuments([
  new Document({ pageContent: rawText, metadata: { source: "solana-notes" } }),
]);
const embeddings = new OllamaEmbeddings({ model: "nomic-embed-text" });
const vectorStore = await MemoryVectorStore.fromDocuments(chunks, embeddings);
const retriever = vectorStore.asRetriever(3);
console.log("✅ Vector store ready\n");

// ── 2. Condense question prompt ──
// Rewrites follow-up questions using chat history so retriever understands them
const condensePrompt = ChatPromptTemplate.fromMessages([
  [
    "system",
    `Given the chat history and a follow-up question, rewrite the follow-up question 
to be a standalone question that makes sense without the chat history.
If it's already standalone, return it as-is.`,
  ],
  new MessagesPlaceholder("chat_history"),
  ["human", "{question}"],
]);

// ── 3. RAG answer prompt ──
const answerPrompt = ChatPromptTemplate.fromMessages([
  [
    "system",
    `You are a Solana expert. Answer using ONLY the context below.
If not in context, say "I don't have that information."

Context:
{context}`,
  ],
  new MessagesPlaceholder("chat_history"),
  ["human", "{question}"],
]);

function formatDocs(docs: Document[]): string {
  return docs.map((d) => d.pageContent).join("\n\n");
}

// ── 4. Conversational RAG chain ──
const conversationalRagChain = RunnableSequence.from([
  {
    // Step 1 — condense the question using history
    standalone_question: RunnableSequence.from([
      { question: (input: any) => input.question, chat_history: (input: any) => input.chat_history },
      condensePrompt,
      llm,
      new StringOutputParser(),
    ]),
    chat_history: (input: any) => input.chat_history,
  },
  {
    // Step 2 — retrieve using the condensed question
    context: (input: any) => retriever.pipe(formatDocs).invoke(input.standalone_question),
    question: (input: any) => input.standalone_question,
    chat_history: (input: any) => input.chat_history,
  },
  answerPrompt,
  llm,
  new StringOutputParser(),
]);

// ── 5. Chat loop with memory ──
const chatHistory: BaseMessage[] = [];

async function chat(question: string): Promise<string> {
  const answer = await conversationalRagChain.invoke({
    question,
    chat_history: chatHistory,
  });

  chatHistory.push(new HumanMessage(question));
  chatHistory.push(new AIMessage(answer));

  return answer;
}

// ── 6. Multi-turn conversation ──
console.log("❓ What are PDAs in Solana?");
console.log("💬", await chat("What are PDAs in Solana?"));

console.log("\n❓ What are they used for?");  // follow-up — needs history to understand "they"
console.log("💬", await chat("What are they used for?"));

console.log("\n❓ How do CPIs relate to what we just discussed?");
console.log("💬", await chat("How do CPIs relate to what we just discussed?"));