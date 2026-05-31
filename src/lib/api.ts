export async function fetchApi(endpoint: string, options?: RequestInit) {
  try {
    const res = await fetch(`/api${endpoint}`, {
      ...options,
      headers: {
        'Content-Type': 'application/json',
        ...options?.headers
      },
    });
    const data = await res.json();
    return data;
  } catch (err: any) {
    return { success: false, message: err.message || "Network Error" };
  }
}
