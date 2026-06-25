import "dotenv/config";
import { ChatCerebras } from "@langchain/cerebras";
import { StringOutputParser } from "@langchain/core/output_parsers";
import { HumanMessage, AIMessage } from "@langchain/core/messages";
import {
  ChatPromptTemplate,
  MessagesPlaceholder,
} from "@langchain/core/prompts";

const llm = new ChatCerebras({
  model: "gpt-oss-120b",
  temperature: 0,
  apiKey: process.env.CEREBRAS_API_KEY,
});

const prompt = ChatPromptTemplate.fromMessages([
  ["system", "You are a Solana tutor. Answer clearly and concisely."],
  new MessagesPlaceholder("chat_history"),
  ["human", "{input}"],
]);

const chain = prompt.pipe(llm).pipe(new StringOutputParser());

// We manage history manually as an array
const chatHistory: (HumanMessage | AIMessage)[] = [];

async function chat(userInput: string): Promise<string> {
  const response = await chain.invoke({
    input: userInput,
    chat_history: chatHistory,
  });

  chatHistory.push(new HumanMessage(userInput));
  chatHistory.push(new AIMessage(response));

  return response;
}

// Simulate a multi-turn conversation
const reply1 = await chat("What is an Account in Solana?");
console.log("User: What is an Account in Solana?");
console.log("AI:", reply1);

console.log("---");

const reply2 = await chat("How is it different from an Ethereum account?");
console.log("User: How is it different from an Ethereum account?");
console.log("AI:", reply2);

console.log("---");

const reply3 = await chat("Can you give me a real world example of what we just discussed?");
console.log("User: Can you give me a real world example of what we just discussed?");
console.log("AI:", reply3);

