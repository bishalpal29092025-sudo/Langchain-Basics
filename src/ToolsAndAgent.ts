import "dotenv/config";
import { ChatCerebras } from "@langchain/cerebras";
import { tool } from "@langchain/core/tools";
import { createReactAgent } from "@langchain/langgraph/prebuilt";
import { z } from "zod";

const llm = new ChatCerebras({
  model: "gpt-oss-120b",
  temperature: 0,
  apiKey: process.env.CEREBRAS_API_KEY,
});

const calculatorTool = tool(
  ({ operation, a, b }: { operation: string; a: number; b: number }) => {
    if (operation === "add") return String(a + b);
    if (operation === "subtract") return String(a - b);
    if (operation === "multiply") return String(a * b);
    if (operation === "divide") return String(a / b);
    return "Unknown Operation";
  },
  {
    name: "calculator",
    description: "Performs basic arithmetic. Use when the user asks to calculate something.",
    schema: z.object({
      operation: z.enum(["add", "subtract", "multiply", "divide"]),
      a: z.number().describe("first number"),
      b: z.number().describe("second number"),
    }),
  }
);

const solanaGlossaryTool = tool(
  ({ term }: { term: string }) => {
    const glossary: Record<string, string> = {
      pda: "Program Derived Address — a deterministic, program-owned account with no private key.",
      cpi: "Cross Program Invocation — a mechanism for one Solana program to call another.",
      account: "A record on the Solana ledger that holds data, lamports, and an owner program.",
      lamport: "The smallest unit of SOL. 1 SOL = 1,000,000,000 lamports.",
    };
    return glossary[term.toLowerCase()] ?? `No definition found for "${term}"`;
  },
  {
    name: "solana_glossary",
    description: "Looks up definitions of Solana-specific terms like PDA, CPI, account, lamport.",
    schema: z.object({
      term: z.string().describe("The Solana term to look up"),
    }),
  }
);

const agent = createReactAgent({
  llm,
  tools: [calculatorTool, solanaGlossaryTool],
});

const result = await agent.invoke({
  messages: [{ role: "user", content: "What is a lamport? Also how many lamports is 5 SOL?" }],
});

const lastMessage = result.messages[result.messages.length - 1];
console.log("Agent answer:", lastMessage.content);