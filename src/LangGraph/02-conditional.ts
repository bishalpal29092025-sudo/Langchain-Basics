import "dotenv/config";
import { StateGraph, START, END } from "@langchain/langgraph";
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
