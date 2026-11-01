// YouCam S2S client: auth, file upload (pre-signed PUT), task submit + poll.
// All calls run server-side. Key never reaches the browser.
const BASE = process.env.YOUCAM_BASE_URL || "https://yce-api-01.makeupar.com";
const KEY = process.env.YOUCAM_API_KEY || "";

function headers(json = true) {
  const h: Record<string, string> = { Authorization: `Bearer ${KEY}` };
  if (json) h["content-type"] = "application/json";
  return h;
}

export function isFixtureMode() {
  return process.env.SKINDAY_FIXTURE_MODE === "1" || !KEY;
}

export async function getFileUploadUrl(feature: string, file: { file_name: string; file_size: number; content_type: string }) {
  // POST /s2s/v2.0/file[/{feature}] with { files: [{file_name, file_size, content_type}] }
  // -> { status, data: { files: [{ file_id, requests: [{method, url, headers}] }] } }
  const candidates = [`/s2s/v2.0/file/${feature}`, `/s2s/v2.0/file`];
  let lastErr = "";
  for (const p of candidates) {
    const r = await fetch(`${BASE}${p}`, {
      method: "POST",
      headers: headers(),
      body: JSON.stringify({ files: [file] }),
    });
    const text = await r.text();
    if (r.ok) {
      const j = JSON.parse(text) as { data?: { files?: { file_id: string; requests?: { method: string; url: string; headers?: Record<string, string> }[] }[] } };
      const f = j.data?.files?.[0];
      const up = f?.requests?.[0];
      if (f?.file_id && up?.url) return { file_id: f.file_id, upload_url: up.url, upload_headers: up.headers ?? {} };
      lastErr = `bad file shape: ${text.slice(0, 200)}`;
      continue;
    }
    lastErr = `${p}: ${r.status} ${text.slice(0, 200)}`;
  }
  throw new Error(`file upload url failed: ${lastErr}`);
}

export async function putBytes(uploadUrl: string, bytes: Buffer, extraHeaders: Record<string, string> = {}, contentType = "image/jpeg") {
  const r = await fetch(uploadUrl, {
    method: "PUT",
    headers: { "content-type": contentType, ...extraHeaders },
    body: bytes as unknown as BodyInit,
  });
  if (!r.ok) throw new Error(`presigned PUT failed: ${r.status} ${(await r.text()).slice(0, 200)}`);
}

export async function submitTask(path: string, body: Record<string, unknown>) {
  const r = await fetch(`${BASE}${path}`, { method: "POST", headers: headers(), body: JSON.stringify(body) });
  const text = await r.text();
  if (!r.ok) throw new Error(`${path} submit failed ${r.status}: ${text.slice(0, 500)}`);
  const j = JSON.parse(text) as { task_id?: string; taskId?: string; data?: { task_id?: string } };
  const id = j.task_id || j.taskId || j.data?.task_id;
  if (!id) throw new Error(`${path} no task_id: ${text.slice(0, 500)}`);
  return id;
}

type PollEnvelope = {
  task_status?: string;
  taskStatus?: string;
  status?: string;
  result?: unknown;
  results?: unknown;
  error?: unknown;
  data?: { task_status?: string; error?: unknown; results?: unknown } & Record<string, unknown>;
};

export async function pollTask<T = unknown>(statusPath: (id: string) => string, taskId: string, opts?: { tries?: number; delayMs?: number }) {
  // Real envelope: { status: 200, data: { task_status: 'running'|'success'|'error', error, results } }.
  // Results shape per API: skin -> { output: [...] }, tone -> { color, face_quality }, vto -> { url }.
  const tries = opts?.tries ?? 30;
  const delayMs = opts?.delayMs ?? 2000;
  let last: unknown = null;
  for (let i = 0; i < tries; i++) {
    const r = await fetch(`${BASE}${statusPath(taskId)}`, { headers: headers(false) });
    const text = await r.text();
    if (!r.ok) throw new Error(`poll failed ${r.status}: ${text.slice(0, 300)}`);
    const j = JSON.parse(text) as PollEnvelope;
    const d = j.data ?? {};
    const st = String(j.task_status || j.taskStatus || d.task_status || "").toLowerCase();
    last = j;
    if (st === "success" || st === "done" || st === "completed") return (d.results ?? j.result ?? j.results ?? j) as T;
    if (st === "error" || st === "failed") throw new Error(`task error: ${JSON.stringify(d.error ?? j).slice(0, 500)}`);
    await new Promise((res) => setTimeout(res, delayMs));
  }
  throw new Error(`task timeout after ${tries} polls: ${JSON.stringify(last).slice(0, 300)}`);
}

// Uploads raw bytes once, returns file_id. Caller picks feature path.
export async function uploadImageBytes(feature: string, bytes: Buffer, fileName = "upload.jpg", contentType = "image/jpeg") {
  const { file_id, upload_url, upload_headers } = await getFileUploadUrl(feature, {
    file_name: fileName,
    file_size: bytes.length,
    content_type: contentType,
  });
  await putBytes(upload_url, bytes, upload_headers, contentType);
  return file_id;
}

// Budget guard: check units + per-feature cost before spending.
export async function getCredit() {
  const r = await fetch(`${BASE}/s2s/v1.0/client/credit`, { headers: headers(false) });
  if (!r.ok) throw new Error(`credit check failed: ${(await r.text()).slice(0, 200)}`);
  return r.json() as Promise<unknown>;
}

export async function getFeatureCost() {
  const r = await fetch(`${BASE}/s2s/v2.0/credit/feature-cost`, { headers: headers(false) });
  if (!r.ok) throw new Error(`feature-cost check failed: ${(await r.text()).slice(0, 200)}`);
  return r.json() as Promise<unknown>;
}
