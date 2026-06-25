
import "dotenv/config";
import { ChatCerebras } from "@langchain/cerebras";
import { HumanMessage, SystemMessage, AIMessage } from "@langchain/core/messages";

const llm = new ChatCerebras({
  model: "gpt-oss-120b", 
  temperature: 0,
  apiKey: process.env.CEREBRAS_API_KEY,
});



const response = await llm.invoke([
    new SystemMessage("You are a helpful assistant who answer in short, clear Responses."),
    new HumanMessage("What is LangChain?"),
    new AIMessage("LangChain is a framework fro building LLM-powerd applications."),
    new HumanMessage("What Can I build with it ?"),
]);

console.log(response.content);