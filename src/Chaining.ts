import "dotenv/config";
import { ChatCerebras } from "@langchain/cerebras";
import { ChatPromptTemplate } from "@langchain/core/prompts";
import { StringOutputParser } from "@langchain/core/output_parsers";


const llm = new ChatCerebras({
  model: "gpt-oss-120b",
  temperature: 0,
  apiKey: process.env.CEREBRAS_API_KEY,
});

const prompt = ChatPromptTemplate.fromMessages([
    [
        "system", "You are an expert in {topic}. Answer in 2-3 sentences only."
    ],
    [
        "human", "{question}"
    ]
]);

const parser = new StringOutputParser;

const chain = prompt.pipe(llm).pipe(parser);

const response = await chain.invoke({
    topic: "Solana Blockchain",
    question: "What is CPI? And Why we need it?"
});

console.log(typeof response);
console.log(response);