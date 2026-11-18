"use client";
import { useEffect, useState, useCallback, useRef } from "react";
import { cloud, synchronize } from "./cloud";
import { useStudy } from "./store";
export function useWorkspace() {
  const { owner, ready, dirty, open } = useStudy(),
    [status, setStatus] = useState("Saved on this device"),
    [nonce, retry] = useState(0),
    running = useRef(false);
  useEffect(() => {
    open("guest");
    if (!cloud) return;
    const { data } = cloud.auth.onAuthStateChange((_event, session) => {
      const next = session?.user.id || "guest";
      if (useStudy.getState().owner !== next) open(next);
    });
    return () => data.subscription.unsubscribe();
  }, [open]);
  useEffect(() => {
    const update = (e: StorageEvent) => {
      if (e.key === "studyos.v1." + owner && e.newValue) open(owner);
    };
    window.addEventListener("storage", update);
    return () => window.removeEventListener("storage", update);
  }, [open, owner]);
  const sync = useCallback(async () => {
    if (!ready || owner === "guest" || !cloud || running.current) return;
    if (!navigator.onLine) {
      setStatus("Offline · changes saved on device");
      return;
    }
    running.current = true;
    setStatus("Syncing…");
    try {
      await synchronize(owner);
      setStatus("Cloud backup is up to date");
    } catch (e) {
      setStatus(
        e instanceof Error
          ? e.message
          : "Sync unavailable. Your edits are saved locally.",
      );
    } finally {
      running.current = false;
    }
  }, [owner, ready]);
  const changed = useStudy((s) =>
    s.dirty.map((id) => s.entries.find((e) => e.id === id)?.updated).join(","),
  );
  useEffect(() => {
    if (!ready || owner === "guest") return;
    const timer = setTimeout(sync, 1000),
      interval = setInterval(sync, 45000);
    window.addEventListener("online", sync);
    return () => {
      clearTimeout(timer);
      clearInterval(interval);
      window.removeEventListener("online", sync);
    };
  }, [changed, sync, nonce, ready, owner]);
  return { status, retry: () => retry((n) => n + 1) };
}
