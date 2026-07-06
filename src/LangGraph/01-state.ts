import "dotenv/config";
import { StateGraph, END, START } from "@langchain/langgraph";
import { Annotation } from "@langchain/langgraph";

// Define the shape of your graph's state

const StateAnnotation = Annotation.Root({
  input: Annotation<string>,
  output: Annotation<string>,
  step: Annotation<number>,
});

// Node 1 - processing the input

function processNode(state: typeof StateAnnotation.State) {
  console.log("📦 processNode received:", state.input);
  return {
    output: `Processed: ${state.input}`,
    step: 1,
  };
}

// Node 2 - formats the output
function formatNode(state: typeof StateAnnotation.State) {
  console.log("✏️  formatNode received:", state.output);
  return {
    output: `[FINAL] ${state.output}`,
    step: 2,
  };
}

// Build the graph
const graph = new StateGraph(StateAnnotation)
  .addNode("process", processNode)
  .addNode("format", formatNode)
  .addEdge(START, "process")
  .addEdge("process", "format")
  .addEdge("format", END)
  .compile();

const result = await graph.invoke({
  input: "Hello LangGraph",
  output: "",
  step: 0,
});

console.log("\n Final State: ", result);
