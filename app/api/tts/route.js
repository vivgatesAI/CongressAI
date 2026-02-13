import { veniceTTS } from "../../../lib/venice.js";

export async function POST(req) {
  try {
    const { text, voice, speed } = await req.json();
    if (!text) return Response.json({ error: "Missing text" }, { status: 400 });

    const model = process.env.VENICE_MODEL_TTS || "tts-kokoro";
    const audio = await veniceTTS({ model, input: text, voice, speed });

    return new Response(audio, {
      headers: {
        "Content-Type": "audio/mpeg",
        "Content-Disposition": "attachment; filename=summary.mp3",
      },
    });
  } catch (e) {
    return Response.json({ error: e.message }, { status: 500 });
  }
}
