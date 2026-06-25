import "dotenv/config";
import { ChatCerebras } from "@langchain/cerebras";
import { ChatPromptTemplate } from "@langchain/core/prompts";

const llm = new ChatCerebras({
  model: "gpt-oss-120b",
  temperature: 0,
  apiKey: process.env.CEREBRAS_API_KEY,
});

const prompt = ChatPromptTemplate.fromMessages([
  ["system", "You are an expert in {topic}, Answer clearly and concisely."],
  ["human", "{question}"],
]);

const filled = await prompt.formatMessages({
  topic: "Solana Blockchain",
  question: "What is a PDA ?",
});

console.log("--- Formatted Prompt ---");
console.log(filled);

const response = await llm.invoke(filled);
console.log("\n--- AI Response ---");
console.log(response.content);