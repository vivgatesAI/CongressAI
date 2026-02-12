import pdfParse from "pdf-parse";
import { veniceChat } from "@/lib/venice";
import { agendaSchemaDescription } from "@/lib/schema";

export async function POST(req) {
  try {
    const form = await req.formData();
    const file = form.get("file");
    if (!file) return Response.json({ error: "No file uploaded" }, { status: 400 });

    const arrayBuffer = await file.arrayBuffer();
    const data = await pdfParse(Buffer.from(arrayBuffer));
    const text = data.text || "";

    if (!text.trim()) return Response.json({ error: "No extractable text found" }, { status: 400 });

    const model = process.env.VENICE_MODEL_REASONING || "kimi-k2-5";
    const fallback = process.env.VENICE_MODEL_FALLBACK || "grok-41-fast";

    const messages = [
      {
        role: "system",
        content: `You extract structured conference agendas. ${agendaSchemaDescription}`,
      },
      {
        role: "user",
        content: text,
      },
    ];

    let result;
    try {
      const data = await veniceChat({
        model,
        messages,
        temperature: 0.2,
        max_tokens: 3000,
        response_format: { type: "json_object" },
      });
      result = data.choices[0].message.content;
    } catch {
      const data = await veniceChat({
        model: fallback,
        messages,
        temperature: 0.2,
        max_tokens: 3000,
        response_format: { type: "json_object" },
      });
      result = data.choices[0].message.content;
    }

    return new Response(result, { headers: { "Content-Type": "application/json" } });
  } catch (e) {
    return Response.json({ error: e.message }, { status: 500 });
  }
}
