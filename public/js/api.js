export async function api(path, options) {
  const res = await fetch(`/api${path}`, {
    ...options,
    headers: { "Content-Type": "application/json", ...(options?.headers ?? {}) },
  });
  if (!res.ok) throw new Error(`${path} -> ${res.status}`);
  return res.json();
}
