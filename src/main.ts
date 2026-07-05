import "dotenv/config";
import { ChatCerebras } from "@langchain/cerebras";
import { tool } from "@langchain/core/tools";
import { createReactAgent } from "@langchain/langgraph/prebuilt";
import { HumanMessage } from "@langchain/core/messages";
import { z } from "zod";

const llm = new ChatCerebras({
    model: "gpt-oss-120b",
    temperature: 0,
    apiKey: process.env.CEREBRAS_API_KEY,
});

// ------ Agent 1: Solana Expart ------
const solanaExpertTool = tool(
  async ({ question }: { question: string }) => {
    const agent = createReactAgent({
      llm,
      tools: [],
      stateModifier: "You are a Solana blockchain expert. Answer technical questions clearly and concisely.",
    });

    const result = await agent.invoke({
      messages: [new HumanMessage(question)],
    });

    const last = result.messages[result.messages.length - 1];
    return String(last.content);
  },
  {
    name: "solana_expert",
    description: "Routes Solana-specific technical questions to a Solana expert agent.",
    schema: z.object({
      question: z.string().describe("The Solana technical question to answer"),
    }),
  }
);

// --- Agent 2: Math Expert ---
const mathExpertTool = tool(
  async ({ question }: { question: string }) => {
    const agent = createReactAgent({
      llm,
      tools: [],
      stateModifier: "You are a math expert. Solve calculations step by step and return the final answer.",
    });

    const result = await agent.invoke({
      messages: [new HumanMessage(question)],
    });

    const last = result.messages[result.messages.length - 1];
    return String(last.content);
  },
  {
    name: "math_expert",
    description: "Routes math or calculation questions to a math expert agent.",
    schema: z.object({
      question: z.string().describe("The math question to solve"),
    }),
  }
);

// --- Supervisor Agent ---
// Receives the user message, decides which specialist to call
const supervisor = createReactAgent({
  llm,
  tools: [solanaExpertTool, mathExpertTool],
  stateModifier: `You are a supervisor that routes questions to the right specialist.
  - Use solana_expert for anything about Solana, blockchain, PDAs, CPIs, accounts, lamports.
  - Use math_expert for calculations, numbers, or math problems.
  - Combine their answers into a final response.`,
});

const result = await supervisor.invoke({
  messages: [
    new HumanMessage(
      "What is a Solana validator? Also, if a validator needs 500,000 SOL to stake and each SOL is worth $150, what is the total value in USD?"
    ),
  ],
});

const lastMessage = result.messages[result.messages.length - 1];
console.log("Supervisor answer:\n", lastMessage.content);