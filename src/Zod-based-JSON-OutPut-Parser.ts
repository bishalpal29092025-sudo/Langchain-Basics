import "dotenv/config";
import { ChatCerebras } from "@langchain/cerebras";
import { ChatPromptTemplate } from "@langchain/core/prompts";
import { JsonOutputParser } from "@langchain/core/output_parsers";
import { z } from "zod";

const llm = new ChatCerebras({
  model: "gpt-oss-120b",
  temperature: 0,
  apiKey: process.env.CEREBRAS_API_KEY,
});

// Define the exact shape you expect
const SolanaConceptSchema = z.object({
    name: z.string(),
    description: z.string(),
    difficulty: z.enum(["beginner", "intermediate", "advanced"]),
    use_case: z.string(),
    related_concepts: z.array(z.string()),
});

// Infer the TypeScript type from the schema
type SolanaConcept = z.infer<typeof SolanaConceptSchema>;

const prompt = ChatPromptTemplate.fromMessages([
  ["system", "You are a Solana expert. Respond with valid JSON only. No markdown, no backticks."],
  ["human", "Explain the Solana concept: {concept}. Return JSON with keys: name (string), description (string), difficulty (one of: beginner, intermediate, advanced), use_case (string), related_concepts (array of strings)."],
]);

const parser = new JsonOutputParser<SolanaConcept>();

const chain = prompt.pipe(llm).pipe(parser);

const response = await chain.invoke({ concept: "CPI" });

// Validate with Zod
const validated = SolanaConceptSchema.parse(response);

console.log("Difficulty:", validated.difficulty);
console.log("Related concepts:", validated.related_concepts);
console.log("Full:", validated);