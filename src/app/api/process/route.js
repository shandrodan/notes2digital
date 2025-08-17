export const runtime = "nodejs";

import OpenAI from "openai";

export async function POST(req) {
  try {
    if (!process.env.OPENAI_API_KEY) {
      return new Response("Server error: missing OPENAI_API_KEY in environment", { status: 500 });
    }

    const formData = await req.formData();
    const files = formData.getAll("file");
    if (!files || files.length === 0) {
      return new Response("No files uploaded", { status: 400 });
    }

    function guessMime(name) {
      const ext = (name || "").split(".").pop()?.toLowerCase();
      switch (ext) {
        case "jpg":
        case "jpeg":
          return "image/jpeg";
        case "png":
          return "image/png";
        case "gif":
          return "image/gif";
        case "webp":
          return "image/webp";
        case "bmp":
          return "image/bmp";
        case "heic":
          return "image/heic";
        default:
          return "image/png";
      }
    }

    const client = new OpenAI({ apiKey: process.env.OPENAI_API_KEY });
    const content = [];

    content.push({
      type: "input_text",
      text: `You are given ${files.length} image(s) of handwritten student notes. Transcribe the content into Markdown format suitable for Notion.\n\nRules:\n1) Transcribe text exactly.\n2) Preserve headings, lists, spacing.\n3) Describe drawings as (Drawing description).\n4) No extra explanations.\n5) Don't Wrap output in \`\`\`markdown code block.\n\nSeparate multiple images with lines: --- Page X ---`,
    });

    for (const file of files) {
      if (!file || typeof file === "string") continue;
      const bytes = await file.arrayBuffer();
      const mimeFromFile =
        file.type &&
        file.type.startsWith("image/") &&
        file.type !== "application/octet-stream"
          ? file.type
          : null;
      const mime = mimeFromFile || guessMime(file.name);
      const base64 = Buffer.from(bytes).toString("base64");
      const dataUrl = `data:${mime};base64,${base64}`;
      content.push({ type: "input_image", image_url: dataUrl });
    }

    const response = await client.responses.create({
      model: "gpt-4o-mini",
      input: [{ role: "user", content }],
    });

    let text = "";
    if (typeof response.output_text === "string" && response.output_text.trim()) {
      text = response.output_text;
    } else if (Array.isArray(response.output)) {
      text = response.output
        .flatMap((o) => o.content || [])
        .map((c) => (typeof c?.text === "string" ? c.text : ""))
        .join("\n");
    } else if (typeof response.output === "string") {
      text = response.output;
    }

    return new Response(JSON.stringify({ text }), { headers: { "Content-Type": "application/json" } });
  } catch (err) {
    console.error(err);
    return new Response(`Server error: ${(err && err.message) || "unknown error"}`, { status: 500 });
  }
}
