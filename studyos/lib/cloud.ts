import { createClient } from "@supabase/supabase-js";
import { useStudy } from "./store";
import { Entry, Kind } from "./model";
const url = process.env.NEXT_PUBLIC_SUPABASE_URL,
  key = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;
export const cloud = url && key ? createClient(url, key) : null;
export const tables: Record<Kind, string> = {
  profile: "users",
  assignment: "assignments",
  exam: "exams",
  task: "tasks",
  habit: "habits",
  habitLog: "habit_logs",
  pomodoro: "pomodoro_sessions",
  session: "study_sessions",
  note: "notes",
  goal: "goals",
  event: "calendar_events",
  notification: "notifications",
  subject: "subjects",
  attendance: "attendance_records",
};
const cursors = new Map<string, string>();
export async function synchronize(owner: string) {
  if (!cloud || owner === "guest") return;
  const state = useStudy.getState();
  if (state.owner !== owner) return;
  const pending = new Set(state.dirty);
  const changes = state.entries.filter((e) => pending.has(e.id));
  for (let offset = 0; offset < changes.length; offset += 250) {
    if (useStudy.getState().owner !== owner) return;
    const batch = changes.slice(offset, offset + 250);
    const { data, error } = await cloud.rpc("save_study_records", {
      items: batch,
    });
    if (error) throw new Error(error.message);
    useStudy
      .getState()
      .merge(
        owner,
        data as Entry[],
        new Map(batch.map((e) => [e.id, e.updated])),
      );
  }
  while (useStudy.getState().owner === owner) {
    const { data, error } = await cloud.rpc("read_study_changes", {
      after_seq: cursors.get(owner) || "0",
    });
    if (error) throw new Error(error.message);
    const rows = data as {
      payload: Entry;
      version: number;
      cursor_value: string;
    }[];
    if (!rows.length || useStudy.getState().owner !== owner) break;
    useStudy.getState().merge(
      owner,
      rows.map((r) => ({ ...r.payload, version: r.version })),
      new Map(),
    );
    cursors.set(owner, rows[rows.length - 1].cursor_value);
    if (rows.length < 500) break;
  }
}
async function files() {
  return new Promise<IDBDatabase>((resolve, reject) => {
    const r = indexedDB.open("studyos-files", 1);
    r.onupgradeneeded = () => r.result.createObjectStore("attachments");
    r.onsuccess = () => resolve(r.result);
    r.onerror = () => reject(r.error);
  });
}
export async function uploadFile(file: File, owner: string) {
  if (file.size > 10 * 1024 * 1024)
    throw new Error("Choose a file under 10 MB.");
  const path = owner + "/" + crypto.randomUUID();
  if (cloud && owner !== "guest") {
    const { error } = await cloud.storage
      .from("study-files")
      .upload(path, file);
    if (error) throw error;
    return { name: file.name, path };
  }
  const db = await files();
  await new Promise<void>((resolve, reject) => {
    const tx = db.transaction("attachments", "readwrite");
    tx.objectStore("attachments").put(file, path);
    tx.oncomplete = () => resolve();
    tx.onerror = () => reject(tx.error);
  });
  db.close();
  return { name: file.name, path, local: true };
}
export async function downloadFile(a: NonNullable<Entry["attachment"]>) {
  let blob: Blob;
  if (a.local) {
    const db = await files();
    blob = await new Promise((resolve, reject) => {
      const req = db
        .transaction("attachments")
        .objectStore("attachments")
        .get(a.path);
      req.onsuccess = () =>
        req.result
          ? resolve(req.result)
          : reject(new Error("Attachment is unavailable on this device."));
      req.onerror = () => reject(req.error);
    });
    db.close();
  } else {
    if (!cloud)
      throw new Error("Connect your cloud account to download this file.");
    const { data, error } = await cloud.storage
      .from("study-files")
      .download(a.path);
    if (error) throw error;
    blob = data;
  }
  download(blob, a.name);
}
export function download(blob: Blob, name: string) {
  const url = URL.createObjectURL(blob),
    a = document.createElement("a");
  a.href = url;
  a.download = name;
  a.click();
  setTimeout(() => URL.revokeObjectURL(url), 1500);
}
