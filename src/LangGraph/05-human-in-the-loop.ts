import "dotenv/config";
import { ChatCerebras } from "@langchain/cerebras";
import {
  StateGraph,
  END,
  START,
  MemorySaver,
  interrupt,
  Command,
} from "@langchain/langgraph";
import { Annotation } from "@langchain/langgraph";
import * as readline from "readline";

const llm = new ChatCerebras({
  model: "gpt-oss-120b",
  temperature: 0,
  apiKey: process.env.CEREBRAS_API_KEY,
});

const StateAnnotation = Annotation.Root({
  task: Annotation<string>,
  draft: Annotation<string>,
  feedback: Annotation<string>,
  approved: Annotation<boolean>,
});

// Node 1 — AI generates a draft
async function generateDraftNode(state: typeof StateAnnotation.State) {
  console.log("\n Generating draft...");
  const response = await llm.invoke([
    {
      role: "system",
      content:
        "You are a helpful assistant. Complete the given task concisely.",
    },
    {
      role: "user",
      content: state.task,
    },
  ]);
  const draft = String(response.content);
  console.log("\n Draft: ", draft);

  return {
    draft,
  };
}

// Node 2 — pauses and waits for human approval
async function humanReviewNode(state: typeof StateAnnotation.State) {
  console.log("\n⏸️  Graph paused — waiting for human review...");

  // interrupt() pauses the graph and surfaces the value to the caller
  const feedback = interrupt({
    draft: state.draft,
    message:
      "Review the draft above. Type 'approve' to accept or provide feedback to revise.",
  });

  return {
    feedback: String(feedback),
    approved: String(feedback).toLowerCase() === "approve",
  };
}

// Node 3 — revises based on feedback
async function reviseDraftNode(state: typeof StateAnnotation.State) {
  console.log("\n✏️  Revising draft based on feedback...");

  const response = await llm.invoke([
    {
      role: "system",
      content:
        "You are a helpful assistant. Revise the draft based on the feedback.",
    },
    {
      role: "user",
      content: `Original draft:\n${state.draft}\n\nFeedback:\n${state.feedback}\n\nRevised version:`,
    },
  ]);

  const revised = String(response.content);
  console.log("\n📝 Revised Draft:\n", revised);

  return { draft: revised };
}

// Router - approved or needs revision
function routeAfterReview(state: typeof StateAnnotation.State) {
  return state.approved ? "end" : "revise";
}

// Build the graph
const checkpointer = new MemorySaver();

const graph = new StateGraph(StateAnnotation)
  .addNode("generate", generateDraftNode)
  .addNode("human_review", humanReviewNode)
  .addNode("revise", reviseDraftNode)
  .addEdge(START, "generate")
  .addEdge("generate", "human_review")
  .addConditionalEdges("human_review", routeAfterReview, {
    end: END,
    revise: "revise",
  })
  .addEdge("revise", "human_review")
  .compile({
    checkpointer,
    interruptBefore: ["human_review"],
  });

// Helper to get human input from terminal
function askHuman(question: string): Promise<string> {
  const r1 = readline.createInterface({
    input: process.stdin,
    output: process.stdout,
  });

  return new Promise((resolve) => {
    r1.question(question, (answer) => {
      r1.close();
      resolve(answer);
    });
  });
}

// Step 1 -run until interrupt
const config = { configurable: { thread_id: "hitl-1" } };
console.log("Starting graph...");
await graph.invoke(
  {
    task: "Write a 2-sentence description of what Solana is.",
    draft: "",
    feedback: "",
    approved: false,
  },
  config,
);

// Step 2 — ask human
const humanInput = await askHuman("\n👤 Your feedback (or type 'approve'): ");

// Step 3 — resume graph with human input
const finalResult = await graph.invoke(new Command({ resume: humanInput }), config);

console.log("\n✅ Final approved draft:\n", finalResult.draft);
