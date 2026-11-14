export async function api(path, options = {}) {
  const hasBody = options.body !== undefined;
  const response = await fetch(`/api${path}`, {
    credentials: 'include',
    ...options,
    headers: {
      ...(hasBody ? { 'Content-Type': 'application/json' } : {}),
      ...options.headers
    }
  });

  const data = await response.json().catch(() => ({}));
  if (!response.ok) {
    throw new Error(data.message || '요청을 처리하지 못했습니다.');
  }
  return data;
}
