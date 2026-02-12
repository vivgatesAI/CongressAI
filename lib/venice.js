export const VENICE_BASE_URL = process.env.VENICE_BASE_URL || "https://api.venice.ai/api/v1";

export function getVeniceKey() {
  const key = process.env.VENICE_API_KEY;
  if (!key) throw new Error("VENICE_API_KEY not set");
  return key;
}

export function buildHeaders() {
  return {
    "Content-Type": "application/json",
    Authorization: `Bearer ${getVeniceKey()}`,
  };
}

export async function veniceChat({ model, messages, temperature = 0.3, max_tokens = 2000, venice_parameters, response_format }) {
  const res = await fetch(`${VENICE_BASE_URL}/chat/completions`, {
    method: "POST",
    headers: buildHeaders(),
    body: JSON.stringify({
      model,
      messages,
      temperature,
      max_tokens,
      response_format,
      venice_parameters,
    }),
  });

  if (!res.ok) {
    const text = await res.text();
    throw new Error(`Venice chat error ${res.status}: ${text}`);
  }
  return res.json();
}

export async function veniceEmbeddings({ model, input }) {
  const res = await fetch(`${VENICE_BASE_URL}/embeddings`, {
    method: "POST",
    headers: buildHeaders(),
    body: JSON.stringify({ model, input }),
  });
  if (!res.ok) {
    const text = await res.text();
    throw new Error(`Venice embeddings error ${res.status}: ${text}`);
  }
  return res.json();
}

export async function veniceTTS({ model, input, voice = "af_nova", speed = 1.0 }) {
  const res = await fetch(`${VENICE_BASE_URL}/audio/speech`, {
    method: "POST",
    headers: buildHeaders(),
    body: JSON.stringify({ model, input, voice, speed }),
  });
  if (!res.ok) {
    const text = await res.text();
    throw new Error(`Venice TTS error ${res.status}: ${text}`);
  }
  const arrayBuffer = await res.arrayBuffer();
  return Buffer.from(arrayBuffer);
}

export async function veniceTranscribe({ model, file, filename, contentType }) {
  const form = new FormData();
  form.append("model", model);
  form.append("file", new Blob([file], { type: contentType }), filename);
  const res = await fetch(`${VENICE_BASE_URL}/audio/transcriptions`, {
    method: "POST",
    headers: {
      Authorization: `Bearer ${getVeniceKey()}`,
    },
    body: form,
  });
  if (!res.ok) {
    const text = await res.text();
    throw new Error(`Venice STT error ${res.status}: ${text}`);
  }
  return res.json();
}

export async function veniceModels() {
  const res = await fetch(`${VENICE_BASE_URL}/models?type=text,image,audio,embedding`, {
    headers: { Authorization: `Bearer ${getVeniceKey()}` },
  });
  if (!res.ok) {
    const text = await res.text();
    throw new Error(`Venice models error ${res.status}: ${text}`);
  }
  return res.json();
}
