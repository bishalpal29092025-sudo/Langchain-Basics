import "dotenv/config";
import { ChatCerebras } from "@langchain/cerebras";
import { ChatPromptTemplate } from "@langchain/core/prompts";
import { JsonOutputParser } from "@langchain/core/output_parsers";

const llm = new ChatCerebras({
  model: "gpt-oss-120b",
  temperature: 0,
  apiKey: process.env.CEREBRAS_API_KEY,
});

const prompt = ChatPromptTemplate.fromMessages([
  [
    "system",
    "You are a Solana expert. Always respond with valid JSON only. No markdown, no code blocks, no backticks, just a raw JSON object.",
  ],
  [
    "human",
    "Give me info about the Solana concept: {concept}. Return a JSON object with these exact keys: name (string), description (string), use_case (string), example (one sentence string, no code).",
  ],
]);

const parser = new JsonOutputParser();

const chain = prompt.pipe(llm).pipe(parser);

const response = await chain.invoke({
  concept: "PDA",
});

console.log(typeof response);
console.log(response);
console.log("Name:", response.name);
console.log("Use case:", response.use_case);
