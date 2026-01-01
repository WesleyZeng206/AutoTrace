type FetchOptions = RequestInit & { json?: unknown };

export async function fetchJson<TResponse>(path: string, options: FetchOptions = {}): Promise<TResponse> {
  const headers = new Headers(options.headers);
  if (options.json !== undefined) {
    headers.set('Content-Type', 'application/json');
  }

  const response = await fetch(path, {
    ...options,
    credentials: options.credentials ?? 'include',
    headers,
    body: options.json !== undefined ? JSON.stringify(options.json) : options.body,
  });

  if (!response.ok) {
    const errorBody = await safeJson(response);
    const message = errorBody?.error || errorBody?.message || response.statusText;
    throw new Error(message);
  }

  return response.json() as Promise<TResponse>;
}

async function safeJson(response: Response) {
  try {
    return await response.json();
  } catch {
    return null;
  }
}
