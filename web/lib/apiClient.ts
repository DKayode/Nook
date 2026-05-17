// Server-side helper for calling the FastAPI service.
const base = process.env.API_INTERNAL_URL ?? "http://api:8000";
const token = process.env.API_INTERNAL_TOKEN ?? "";

export async function callApi<T>(path: string, body: unknown): Promise<T> {
  const res = await fetch(`${base}${path}`, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      "X-Internal-Token": token,
    },
    body: JSON.stringify(body),
    cache: "no-store",
  });
  if (!res.ok) throw new Error(`api ${path} failed: ${res.status} ${await res.text()}`);
  return res.json() as Promise<T>;
}
