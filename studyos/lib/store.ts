import { create } from "zustand";
import { Entry, makeEntry, shift, seed, localDay } from "./model";
type State = {
  entries: Entry[];
  owner: string;
  dirty: string[];
  ready: boolean;
  error: string;
  open: (owner: string) => void;
  save: (...entries: Entry[]) => void;
  remove: (id: string) => void;
  toggle: (entry: Entry) => void;
  habit: (entry: Entry) => void;
  merge: (owner: string, remote: Entry[], acked: Map<string, string>) => void;
};
const key = (owner: string) => "studyos.v1." + owner;
export const useStudy = create<State>((set, get) => {
  function persist(entries: Entry[], dirty: string[]) {
    let error = "";
    try {
      localStorage.setItem(
        key(get().owner),
        JSON.stringify({ entries, dirty }),
      );
    } catch {
      error =
        "Device storage is full or unavailable. Export a backup before leaving.";
    }
    set({ entries, dirty, error });
  }
  return {
    entries: [],
    owner: "guest",
    dirty: [],
    ready: false,
    error: "",
    open(owner) {
      let entries: Entry[] = [],
        dirty: string[] = [];
      try {
        const raw = localStorage.getItem(key(owner));
        if (raw) {
          ({ entries, dirty } = JSON.parse(raw));
        } else if (owner === "guest") {
          entries = seed();
        }
      } catch {
        set({
          owner,
          entries: [],
          dirty: [],
          ready: true,
          error:
            "This workspace could not be read. Import a backup in Settings.",
        });
        return;
      }
      set({ owner, ready: true, entries, dirty, error: "" });
      if (!localStorage.getItem(key(owner))) persist(entries, dirty);
    },
    save(...changes) {
      const { entries, dirty } = get();
      const byId = new Map(entries.map((e) => [e.id, e]));
      for (const e of changes) {
        const previous = byId.get(e.id);
        const recur =
          e.recurrence === "Daily" ? 1 : e.recurrence === "Weekly" ? 7 : 0;
        if (
          e.kind === "task" &&
          !e.deleted &&
          e.status === "Completed" &&
          previous?.status !== "Completed" &&
          recur
        ) {
          const nextDate = shift(e.date, recur),
            parent = e.parent || e.id;
          if (
            ![...byId.values()].some(
              (x) => x.parent === parent && x.date === nextDate && !x.deleted,
            )
          )
            changes.push({
              ...e,
              id: crypto.randomUUID(),
              parent,
              date: nextDate,
              status: "Pending",
              completedOn: undefined,
              version: 0,
              steps: e.steps?.map((s) => ({ ...s, done: false })),
            });
        }
        byId.set(e.id, { ...e, updated: new Date().toISOString() });
      }
      persist(
        [...byId.values()],
        [...new Set([...dirty, ...changes.map((e) => e.id)])],
      );
    },
    remove(id) {
      const e = get().entries.find((e) => e.id === id);
      if (e)
        get().save(
          { ...e, deleted: true },
          ...get()
            .entries.filter((x) => x.parent === id && !x.deleted)
            .map((x) => ({ ...x, deleted: true })),
        );
    },
    toggle(e) {
      const done = e.status !== "Completed";
      const changed = {
        ...e,
        status: done ? ("Completed" as const) : ("Pending" as const),
        completedOn: done ? localDay() : undefined,
      };
      get().save(changed);
    },
    async habit(e) {
      const owner = get().owner;
      const day = localDay();
      const digest = await crypto.subtle.digest(
        "SHA-256",
        new TextEncoder().encode([owner, e.id, day].join("/")),
      );
      const hex = Array.from(new Uint8Array(digest).slice(0, 16), (byte) =>
        byte.toString(16).padStart(2, "0"),
      ).join("");
      const id = [
        hex.slice(0, 8),
        hex.slice(8, 12),
        "8" + hex.slice(13, 16),
        "a" + hex.slice(17, 20),
        hex.slice(20),
      ].join("-");
      if (owner !== get().owner) return;
      const log = get().entries.find(
        (l) => l.kind === "habitLog" && l.parent === e.id && l.date === day,
      );
      if (log) get().save({ ...log, deleted: !log.deleted });
      else
        get().save(
          makeEntry("habitLog", e.title, { id, parent: e.id, date: day }),
        );
    },
    merge(owner, remote, acked) {
      if (get().owner !== owner) return;
      const { entries, dirty } = get();
      const kept = new Set(dirty);
      const byId = new Map(entries.map((e) => [e.id, e]));
      for (const e of remote) {
        const local = byId.get(e.id);
        if (acked.has(e.id) && local?.updated === acked.get(e.id))
          kept.delete(e.id);
        if (!kept.has(e.id)) byId.set(e.id, e);
        else if (local && acked.has(e.id))
          byId.set(e.id, { ...local, version: e.version });
      }
      persist([...byId.values()], [...kept]);
    },
  };
});
export const active = (rows: Entry[]) => rows.filter((e) => !e.deleted);
