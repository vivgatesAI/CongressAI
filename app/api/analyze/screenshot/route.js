import { veniceChat } from "@/lib/venice";
import { agendaSchemaDescription } from "@/lib/schema";

export async function POST(req) {
  try {
    const { imageBase64 } = await req.json();
    if (!imageBase64) return Response.json({ error: "Missing imageBase64" }, { status: 400 });

    const model = process.env.VENICE_MODEL_VISION || "qwen3-vl-235b-a22b";

    const messages = [
      {
        role: "user",
        content: [
          { type: "text", text: `Extract agenda data from this image. ${agendaSchemaDescription}` },
          { type: "image_url", image_url: { url: imageBase64 } },
        ],
      },
    ];

    const data = await veniceChat({
      model,
      messages,
      temperature: 0.2,
      max_tokens: 2000,
      response_format: { type: "json_object" },
    });

    const result = data.choices[0].message.content;
    return new Response(result, { headers: { "Content-Type": "application/json" } });
  } catch (e) {
    return Response.json({ error: e.message }, { status: 500 });
  }
}
