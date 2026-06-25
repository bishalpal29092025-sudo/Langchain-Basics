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

const parser = new StringOutputParser();

const chain = prompt.pipe(llm).pipe(parser);

// Stream the response token by token
const stream = await chain.stream({
    topic: "Solana Blockchain",
    question: "What is an account of Solana ?"
});

process.stdout.write("Response: ");

for await(const chunk of stream){
    process.stdout.write(chunk);
}

console.log("\n--- Done ---");

// Streaming is what makes ChatGPT-style UIs feel instant. In a real app you'd push each chunk to the frontend via SSE or WebSocket.