// Same payload as the supplied Express root endpoint. The original service is retained.
export function GET() {
  return Response.json({ status: "success", message: "Learnova LMS backend is running" });
}
