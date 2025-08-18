export const runtime = "nodejs";
import OpenAI from "openai";

export async function POST(req) {
  try {
    const { apiKey, model, focus, amount, note } = await req.json();
    if (!apiKey) return new Response("Missing API key", { status: 400 });
    if (!note) return new Response("No note provided", { status: 400 });

    const client = new OpenAI({ apiKey });

    const mapAmount = (a) =>
    a === "small" ? 5 : a === "medium" ? 10 : a === "large" ? 20 : "auto"; // supports "auto"
    const count = mapAmount(amount);

    const prompt = `
    You are given a student's digital note. Create high-quality flashcards.

    OUTPUT RULES:
    - Use EXACTLY this pattern for every line: Question >> Answer
    - No numbering, no bullets, no headings, and no extra commentary before or after.
    - Keep questions concise and answers precise.
    - If a term requires context, include only the minimum needed.

    Focus area: ${focus}.
    ${count === "auto"
    ? "Choose a reasonable number of flashcards (between 5 and 20) based on importance and density of the note."
    : `Create exactly ${count} flashcards.`}

    Note:
    ${note}
    `;


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
