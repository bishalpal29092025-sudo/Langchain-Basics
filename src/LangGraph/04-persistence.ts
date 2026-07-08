import "dotenv/config";
import { ChatCerebras } from "@langchain/cerebras";
import { StateGraph, END, START, MemorySaver } from "@langchain/langgraph";
import { Annotation } from "@langchain/langgraph";
import { HumanMessage, AIMessage, BaseMessage } from "@langchain/core/messages";

const llm = new ChatCerebras({
  model: "gpt-oss-120b",
  temperature: 0,
  apiKey: process.env.CEREBRAS_API_KEY,
});

const StateAnnotation = Annotation.Root({
  messages: Annotation<BaseMessage[]>({
    reducer: (current, update) => [...current, ...update],
  }),
});

async function chatNode(state: typeof StateAnnotation.State) {
  const response = await llm.invoke(state.messages);
  return { messages: [response] };
}

// MemorySaver — stores state in memory between invocations
const checkpointer = new MemorySaver();

const graph = new StateGraph(StateAnnotation)
  .addNode("chat", chatNode)
  .addEdge(START, "chat")
  .addEdge("chat", END)
  .compile({
    checkpointer,
  }); // Attach the checkpointer

// thread_id - identifies this specific conversation session
const config = {
  configurable: {
    thread_id: "solana-chat-1",
  },
};

// Turn 1
console.log("--- Turn 1 ---");
const result1 = await graph.invoke(
  { messages: [new HumanMessage("What is a Solana Account?")] },
  config,
);
const reply1 = result1.messages[result1.messages.length - 1];
console.log("AI:", reply1.content);

// Turn 2 — graph remembers Turn 1 automatically via thread_id
console.log("\n--- Turn 2 ---");
const result2 = await graph.invoke(
  {
    messages: [
      new HumanMessage("How is it different from an Ethereum account?"),
    ],
  },
  config,
);
const reply2 = result2.messages[result2.messages.length - 1];
console.log("AI:", reply2.content);

// Turn 3 — still remembers everything
console.log("\n--- Turn 3 ---");
const result3 = await graph.invoke(
  {
    messages: [
      new HumanMessage("Summarize what we discussed in 2 bullet points."),
    ],
  },
  config,
);
const reply3 = result3.messages[result3.messages.length - 1];
console.log("AI:", reply3.content);
