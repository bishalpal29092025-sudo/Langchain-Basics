# LangChain TypeScript — Basics

A hands-on LangChain course built in TypeScript, using the Cerebras inference API (`gpt-oss-120b`) as the LLM provider. Each file in `src/` covers one core concept, progressing from simple chat to structured output and memory.

---

## Tech stack

- [LangChain](https://js.langchain.com/) — `@langchain/core`, `@langchain/cerebras`, `langchain`
- [Cerebras](https://cerebras.ai/) — free-tier LLM API (1M tokens/day, ultra-fast inference)
- TypeScript + `tsx` — run `.ts` files directly without compiling
- Zod — runtime schema validation for structured outputs

---

## Project structure

```
src/
├── main.ts                          # Active working file
├── chatmodels.ts                    # Lesson 1 — Chat models & message types
├── promptTemplate.ts                # Lesson 2 — Prompt templates & placeholders
├── Chaining.ts                      # Lesson 3 — LCEL chaining with .pipe()
├── Streaming.ts                     # Lesson 4 — Token-by-token streaming
├── Zod-based-JSON-OutPut-Parser.ts  # Lesson 5 — JSON output + Zod validation
├── memory.ts                        # Lesson 6 — Manual chat history & memory
```

---

## Setup

### 1. Clone and install

```bash
git clone https://github.com/your-username/langchain-basics.git
cd langchain-basics
npm install
```

### 2. Get a Cerebras API key

Sign up for free at [cloud.cerebras.ai](https://cloud.cerebras.ai) — no credit card required. You get 1M tokens/day on `gpt-oss-120b`.

### 3. Create a `.env` file

```
CEREBRAS_API_KEY=your_key_here
```

### 4. Run any lesson file

```bash
npx tsx src/Streaming.ts
npx tsx src/Zod-based-JSON-OutPut-Parser.ts
```

Or run the active `main.ts` in watch mode:

```bash
npm run dev
```

---

## Lessons covered

### Lesson 1 — Chat models & messages
Sending messages to an LLM using `SystemMessage`, `HumanMessage`, and `AIMessage`. Manual chat history by passing previous messages back in.

```ts
const response = await llm.invoke([
  new SystemMessage("You are a helpful assistant."),
  new HumanMessage("What is LangChain?"),
]);
```

### Lesson 2 — Prompt templates
Reusable prompt structures with `{placeholders}` filled at runtime using `ChatPromptTemplate`.

```ts
const prompt = ChatPromptTemplate.fromMessages([
  ["system", "You are an expert in {topic}."],
  ["human", "{question}"],
]);
```

### Lesson 3 — Chaining (LCEL)
Connecting prompt → model → parser using `.pipe()`. The LangChain Expression Language pattern that everything is built on.

```ts
const chain = prompt.pipe(llm).pipe(parser);
const response = await chain.invoke({ topic: "Solana", question: "What is a PDA?" });
```

### Lesson 4 — Streaming
Getting tokens as they arrive instead of waiting for the full response.

```ts
const stream = await chain.stream({ topic: "Solana", question: "..." });
for await (const chunk of stream) {
  process.stdout.write(chunk);
}
```

### Lesson 5 — Output parsers & Zod
Parsing model output into typed JavaScript objects. `JsonOutputParser` for raw JSON, Zod for schema validation with TypeScript types inferred automatically.

```ts
const SolanaConceptSchema = z.object({
  name: z.string(),
  difficulty: z.enum(["beginner", "intermediate", "advanced"]),
  related_concepts: z.array(z.string()),
});
type SolanaConcept = z.infer<typeof SolanaConceptSchema>;
```

### Lesson 6 — Memory & chat history
LLMs are stateless — you manage history yourself. `MessagesPlaceholder` injects the full conversation into the prompt each turn.

```ts
const prompt = ChatPromptTemplate.fromMessages([
  ["system", "You are a Solana tutor."],
  new MessagesPlaceholder("chat_history"),
  ["human", "{input}"],
]);
```

---

## Coming up

- Lesson 7 — Tools & agents (`createReactAgent`, `AgentExecutor`)
- Lesson 8 — Multi-agent systems, middleware, guardrails

---

## Key concepts quick reference

| Concept | What it does |
|---|---|
| `ChatPromptTemplate` | Reusable prompt with placeholders |
| `StringOutputParser` | Extracts plain string from AI response |
| `JsonOutputParser` | Parses JSON string into JS object |
| `MessagesPlaceholder` | Injects chat history array into prompt |
| `.pipe()` | Chains steps: prompt → llm → parser |
| `.invoke()` | Runs the chain, returns full result |
| `.stream()` | Runs the chain, returns token stream |
| `z.infer<typeof Schema>` | Generates TS type from Zod schema |