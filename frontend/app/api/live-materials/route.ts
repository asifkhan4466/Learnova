import { randomUUID } from "node:crypto";
import { mkdir, readFile, writeFile, rm } from "node:fs/promises";
import path from "node:path";

const directory = () => process.env.LEARNOVA_MATERIALS_DIR || path.resolve(process.cwd(), "../backend/storage/live-materials");
const inlineTypes = new Set(["application/pdf", "image/png", "image/jpeg", "image/gif", "image/webp", "text/plain"]);

export async function POST(request: Request) {
  const origin = request.headers.get("origin");
  if (origin) {
    try {
      // Route request URLs may use Next's internal hostname; Host is the browser-facing origin.
      if (new URL(origin).host !== request.headers.get("host")) return Response.json({ error: "Upload from the Learnova site only." }, { status: 403 });
    } catch { return Response.json({ error: "Upload from the Learnova site only." }, { status: 403 }); }
  }
  const form = await request.formData();
  const file = form.get("file");
  if (!(file instanceof File) || !file.size) return Response.json({ error: "Choose a lecture material file." }, { status: 400 });
  if (file.size > 10 * 1024 * 1024) return Response.json({ error: "Material files must be 10 MB or smaller." }, { status: 413 });
  const id = randomUUID();
  const storage = directory();
  const metadata = { name: file.name, type: file.type || "application/octet-stream", size: file.size };
  try {
    await mkdir(storage, { recursive: true });
    await writeFile(path.join(storage, `${id}.data`), new Uint8Array(await file.arrayBuffer()), { flag: "wx" });
    await writeFile(path.join(storage, `${id}.json`), JSON.stringify(metadata), { flag: "wx" });
    return Response.json({ fileUrl: `/api/live-materials?id=${id}` }, { status: 201 });
  } catch {
    await Promise.allSettled([rm(path.join(storage, `${id}.data`), { force: true }), rm(path.join(storage, `${id}.json`), { force: true })]);
    return Response.json({ error: "Lecture material could not be stored. Please try again." }, { status: 503 });
  }
}

export async function GET(request: Request) {
  const id = new URL(request.url).searchParams.get("id") || "";
  if (!/^[a-f0-9]{8}-[a-f0-9]{4}-4[a-f0-9]{3}-[89ab][a-f0-9]{3}-[a-f0-9]{12}$/i.test(id)) return new Response("Material not found", { status: 404 });
  try {
    const storage = directory();
    const metadata = JSON.parse(await readFile(path.join(storage, `${id}.json`), "utf8"));
    const file = await readFile(path.join(storage, `${id}.data`));
    return new Response(new Uint8Array(file), { headers: {
      "Content-Type": metadata.type,
      "Content-Disposition": `${inlineTypes.has(metadata.type) ? "inline" : "attachment"}; filename*=UTF-8''${encodeURIComponent(metadata.name)}`,
      "X-Content-Type-Options": "nosniff", "Cache-Control": "private, no-store",
    } });
  } catch { return new Response("Material not found", { status: 404 }); }
}
