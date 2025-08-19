export const runtime = "nodejs";
import OpenAI from "openai";

export async function POST(req) {
  try {
    const { apiKey, model, focus, note } = await req.json();
    if (!apiKey) return new Response("Missing API key", { status: 400 });
    if (!note) return new Response("No note provided", { status: 400 });

    const client = new OpenAI({ apiKey });

        let promptBase = "";

        switch (focus) {
        case "quiz":
            promptBase = `You are a flashcard generator. I will provide lecture notes, and you must create quiz-style flashcards using this exact format:
Format Requirements:

Use "Question >> Answer" structure
Each flashcard on a new line
No introductory text, explanations, or additional commentary
Focus on testable knowledge from the lecture content

Content Guidelines:

Create questions that test key concepts, definitions, processes, and important details
Include a mix of question types: definitions, explanations, applications, and factual recall
Ensure questions are clear and answerable based solely on the provided notes
Cover the main topics comprehensively
Find concepts and definitions in text, generate and add information yourself as little as possible

Example Output:
What is [concept]? >> [Definition/explanation]
How does [process] work? >> [Step-by-step explanation]
What are the key features of [topic]? >> [List of features]

Here are my lecture notes:

Lecture Notes:\n${note}`;
            break;
        case "vocabulary":
            promptBase = `You are a vocabulary flashcard generator for language learning. I will provide lecture notes, and you must create flashcards using this exact format:
Format Requirements:

Use "Word/Term >> Definition" structure
Each flashcard on a new line
No additional text, explanations, or commentary
Output only the flashcards

Content Guidelines:

Extract vocabulary words and their definitions directly from the provided text
Use the exact definitions provided in the source material whenever possible
Add minimal additional information - rely primarily on what's in the text
If a word list is provided, include ALL words from that list

Example Output:
[Word] >> [Definition from text]
[Term] >> [Explanation provided in notes]
[Vocabulary] >> [Meaning given in source]
Here are my lecture notes:
\n${note}`;
            break;
        case "terminology":
            promptBase = `You are a comprehensive flashcard generator for terminology and concepts. I will provide lecture notes, and you must create flashcards using this exact format:
Format Requirements:

Use "Question >> Answer" structure
Each flashcard on a new line
No additional text, explanations, or commentary
Output only the flashcards

Content Guidelines:

Include ALL terminology, concepts, and formulas from the text - do not miss any
Extract definitions exactly as provided in the source material
For concepts: Create "What is [concept]?" questions using text definitions
For formulas: Create "What is the formula for [X]?" questions
Use text explanations verbatim - avoid adding your own interpretations
Only provide your own explanation if absolutely no explanation exists in the text (this should be extremely rare)
Prioritize completeness - capture every defined term and concept

Example Output:
What is [term]? >> [Exact definition from text]
What is the formula for [concept]? >> [Formula from notes]
How is [concept] defined? >> [Definition provided in source]
Here are my lecture notes: \n${note}`;
            break;
        default:
            promptBase = `You are a flashcard generator. I will provide source material, and you must create flashcards using this exact format:
Format Requirements:

Use "Question >> Answer" structure
Each flashcard on a new line
No additional text, explanations, or commentary
Output only the flashcards

Content Guidelines:

Extract all key information from the provided material
Create questions that test important concepts, definitions, facts, and processes
Use information directly from the source material whenever possible
Include a mix of question types: "What is...?", "How does...?", "Define...", "What are the steps for...?"
Ensure comprehensive coverage - don't miss important topics
Keep answers concise but complete
Only add your own explanations if the source material lacks clarity (rare cases)

Example Output:
What is [concept]? >> [Definition/explanation]
How does [process] work? >> [Step-by-step explanation]
What are [item]? >> [Description/list]
Here is my source material:\n${note}`;
        }

        const prompt = promptBase;

    const response = await client.responses.create({
    model,
    input: [{ role: "user", content: prompt }]
    });


    let text = "";
    if (response.output_text) {
      text = response.output_text.trim();
    } else if (Array.isArray(response.output)) {
      text = response.output
        .flatMap((o) => o.content || [])
        .map((c) => (typeof c?.text === "string" ? c.text : ""))
        .join("\n");
    }

    return new Response(JSON.stringify({ text }), {
      headers: { "Content-Type": "application/json" }
    });
  } catch (err) {
    console.error(err);
    return new Response(`Server error: ${err.message || "unknown error"}`, { status: 500 });
  }
}
