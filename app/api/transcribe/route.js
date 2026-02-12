import { veniceTranscribe } from "@/lib/venice";

export async function POST(req) {
  try {
    const form = await req.formData();
    const file = form.get("file");
    if (!file) return Response.json({ error: "Missing file" }, { status: 400 });

    const arrayBuffer = await file.arrayBuffer();
    const model = process.env.VENICE_MODEL_STT || "nvidia/parakeet-tdt-0.6b-v3";
    const data = await veniceTranscribe({
      model,
      file: Buffer.from(arrayBuffer),
      filename: file.name || "audio.wav",
      contentType: file.type || "audio/wav",
    });

    return Response.json(data);
  } catch (e) {
    return Response.json({ error: e.message }, { status: 500 });
  }
}
