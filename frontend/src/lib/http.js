const BASE = "/api";

export class ApiError extends Error {
  constructor(status, body, message) {
    super(message);
    this.status = status;
    this.body = body;
  }
}

async function request(path, options = {}) {
  let res;
  try {
    res = await fetch(BASE + path, {
      headers: { "Content-Type": "application/json" },
      ...options,
    });
  } catch {
    throw new ApiError(0, null, "We couldn't reach the server. Check your connection and try again.");
  }
  let body = null;
  const text = await res.text();
  if (text) {
    try {
      body = JSON.parse(text);
    } catch {
      body = text;
    }
  }
  if (!res.ok) {
    let msg = "Something went wrong. Please try again.";
    const d = body && body.detail;
    if (typeof d === "string") msg = d;
    else if (Array.isArray(d) && d.length && d[0].msg) msg = d[0].msg;
    throw new ApiError(res.status, body, msg);
  }
  return body;
}

export const apiGet = (path) => request(path);
export const apiPost = (path, data) => request(path, { method: "POST", body: JSON.stringify(data ?? {}) });

export function qs(params) {
  const p = new URLSearchParams();
  Object.entries(params).forEach(([k, v]) => {
    if (v !== undefined && v !== null && v !== "" && v !== false) p.set(k, String(v));
  });
  const s = p.toString();
  return s ? `?${s}` : "";
}
