import "dotenv/config";
import { StateGraph, END, START } from "@langchain/langgraph";
import { Annotation } from "@langchain/langgraph";

const StateAnnotation = Annotation.Root({
  input: Annotation<string>,
  category: Annotation<string>,
  output: Annotation<string>,
});

// Node 1 - Classifies the Input
function classifyNode(state: typeof StateAnnotation.State) {
  const input = state.input.toLowerCase();

  let category = "general";
  if (
    input.includes("pda") ||
    input.includes("cpi") ||
    input.includes("solana")
  ) {
    category = "solana";
  } else if (
    input.includes("calculate") ||
    input.includes("multiply") ||
    input.includes("add")
  ) {
    category = "math";
  }

  console.log(`🔍 Classified "${state.input}" → ${category}`);
  return {
    category,
  };
}

// Node 2a - handles solana questions
function solanaNode(state: typeof StateAnnotation.State) {
  console.log("⚡ solanaNode handling: ", state.input);
  return {
    output: `[Solana Expert] You asked about Solana: "${state.input}". PDAs are program-derived addresses.`,
  };
}

// Node 2b - handles math questions
function mathNode(state: typeof StateAnnotation.State) {
  console.log("🔢 mathNode handling:", state.input);
  return {
    output: `[Math Expert] Solving: "${state.input}". 5 * 1000000000 = 5000000000 lamports.`,
  };
}

// Node 2c — handles general questions
function generalNode(state: typeof StateAnnotation.State) {
  console.log("💬 generalNode handling:", state.input);
  return { output: `[General] I received your message: "${state.input}".` };
}

// Router function - returns the next node name based on state
function routeByCategory(state: typeof StateAnnotation.State): string {
  if (state.category === "solana") return "solanaNode";
  if (state.category === "math") return "mathNode";
  return "generalNode";
}

const graph = new StateGraph(StateAnnotation)
  .addNode("classify", classifyNode)
  .addNode("solanaNode", solanaNode)
  .addNode("mathNode", mathNode)
  .addNode("generalNode", generalNode)
  .addEdge(START, "classify")
  .addConditionalEdges("classify", routeByCategory)
  .addEdge("solanaNode", END)
  .addEdge("mathNode", END)
  .addEdge("generalNode", END)
  .compile();

// Test all three routes
const inputs = [
  "What is a PDA in Solana?",
  "Calculate 5 SOL in lamports",
  "How are you today?",
];

for (const input of inputs) {
  console.log("\n---");
  const result = await graph.invoke({ input, category: "", output: "" });
  console.log("Output:", result.output);
}
