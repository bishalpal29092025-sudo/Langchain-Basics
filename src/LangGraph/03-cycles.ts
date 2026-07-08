import "dotenv/config";
import { ChatCerebras } from "@langchain/cerebras";
import { StateGraph, END, START } from "@langchain/langgraph";
import { Annotation } from "@langchain/langgraph";

const llm = new ChatCerebras({
  model: "gpt-oss-120b",
  temperature: 0,
  apiKey: process.env.CEREBRAS_API_KEY,
});

const StateAnnotation = Annotation.Root({
  question: Annotation<string>,
  answer: Annotation<string>,
  score: Annotation<number>,
  attempts: Annotation<number>,
});

// Node 1 - generates an answer
async function generateNode(state: typeof StateAnnotation.State) {
  console.log(`\n Attempts #${state.attempts + 1} — generating answer...`);

  const response = await llm.invoke([
    {
      role: "system",
      content: "Answer the question in exactly 1 short sentence. Be concise.",
    },
    {
      role: "user",
      content: state.question,
    },
  ]);

  return {
    answer: String(response.content),
    attempts: state.attempts + 1,
  };
}

// Node 2 — evaluates the answer quality
async function evaluateNode(state: typeof StateAnnotation.State) {
  console.log(`📊 Evaluating: "${state.answer}"`);

  const response = await llm.invoke([
    {
      role: "system",
      content:
        "You are a strict evaluator. Rate the answer from 1-10 based on accuracy and conciseness. Reply with a single number only.",
    },
    {
      role: "user",
      content: `Question: ${state.question}\nAnswer: ${state.answer}\nScore (1-10):`,
    },
  ]);

  const score = parseInt(String(response.content).trim(), 10);
  console.log(`⭐ Score: ${score}/10`);

  return { score };
}

// Router - loop back if score is too low, otherwise end

function shouldRetry(state: typeof StateAnnotation.State): string {
  if (state.score >= 7) {
    console.log("Good enough - finishing.");
    return "end";
  }
  if (state.attempts >= 3) {
    console.log("Max attempts reached - finishing anyway.");
    return "end";
  }
  console.log("Score too low - retrying...");
  return "retry";
}

const graph = new StateGraph(StateAnnotation)
  .addNode("generate", generateNode)
  .addNode("evaluate", evaluateNode)
  .addEdge(START, "generate")
  .addEdge("generate", "evaluate")
  .addConditionalEdges("evaluate", shouldRetry, {
    retry: "generate", // loop back
    end: END,
  })
  .compile();

const result = await graph.invoke({
  question: "What is Solana Validator?",
  answer: "",
  score: 0,
  attempts: 0,
});

console.log("\n✅ Final answer:", result.answer);
console.log("⭐ Final score:", result.score);
console.log("🔢 Total attempts:", result.attempts);
