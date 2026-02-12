import { veniceModels } from "@/lib/venice";

export async function GET() {
  try {
    const data = await veniceModels();
    return Response.json(data);
  } catch (e) {
    return Response.json({ error: e.message }, { status: 500 });
  }
}
