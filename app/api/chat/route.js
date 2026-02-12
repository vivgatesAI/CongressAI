import { veniceChat } from "@/lib/venice";

export async function POST(req) {
  try {
    const { messages, model } = await req.json();
    if (!messages || !Array.isArray(messages)) {
      return Response.json({ error: "Missing messages" }, { status: 400 });
    }

    const chosen = model || process.env.VENICE_MODEL_CHAT || "deepseek-v3.2";

    const data = await veniceChat({
      model: chosen,
      messages,
      temperature: 0.5,
      max_tokens: 1500,
      venice_parameters: {
        enable_web_search: "auto",
        enable_web_citations: true,
      },
    });

    return Response.json({ content: data.choices[0].message.content, citations: data.venice_parameters?.web_search_citations || [] });
  } catch (e) {
    return Response.json({ error: e.message }, { status: 500 });
  }
}
