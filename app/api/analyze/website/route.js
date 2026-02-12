import { veniceChat } from "@/lib/venice";
import { agendaSchemaDescription } from "@/lib/schema";
import { crawlAgenda } from "@/lib/crawl";

export async function POST(req) {
  try {
    const { url } = await req.json();
    if (!url) return Response.json({ error: "Missing url" }, { status: 400 });

    const pages = await crawlAgenda({ startUrl: url });
    if (!pages.length) return Response.json({ error: "No pages crawled" }, { status: 400 });

    const joined = pages.map((p) => `URL: ${p.url}\nTITLE: ${p.title}\nCONTENT: ${p.text}`).join("\n\n---\n\n");

    const model = process.env.VENICE_MODEL_REASONING || "kimi-k2-5";
    const fallback = process.env.VENICE_MODEL_FALLBACK || "grok-41-fast";

    const messages = [
      {
        role: "system",
        content: `Extract agenda data from the provided web pages. ${agendaSchemaDescription}`,
      },
      { role: "user", content: joined },
    ];

    let result;
    try {
      const data = await veniceChat({
        model,
        messages,
        temperature: 0.2,
        max_tokens: 3000,
        response_format: { type: "json_object" },
        venice_parameters: {
          enable_web_search: "auto",
          enable_web_scraping: true,
          enable_web_citations: true,
        },
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
