"use client";
import { useState } from "react";
import {
  Cloud,
  Download,
  FileDown,
  Github,
  LogOut,
  UserRound,
  Moon,
  Sun,
  ShieldCheck,
  Database,
  Bell,
  RefreshCw,
} from "lucide-react";
import { Actions, Button, SectionTitle, Modal } from "./ui";
import { Entry, localDay, makeEntry, kinds } from "@/lib/model";
import { cloud, download, tables } from "@/lib/cloud";
import { useStudy } from "@/lib/store";
export function Settings({
  entries,
  actions,
  dark,
  theme,
  syncState,
  retry,
}: {
  entries: Entry[];
  actions: Actions;
  dark: boolean;
  theme: () => void;
  syncState: string;
  retry: () => void;
}) {
  const { owner, dirty } = useStudy(),
    profile = entries.find((e) => e.kind === "profile"),
    [conflicts, setConflicts] = useState<{ mine: Entry; remote: Entry }[]>([]),
    [error, fail] = useState("");
  async function sign(provider: "google" | "github") {
    if (!cloud) {
      fail(
        "To enable sign-in, add the Supabase project URL and publishable key from your project settings, then rebuild StudyOS.",
      );
      return;
    }
    const { error } = await cloud.auth.signInWithOAuth({
      provider,
      options: { redirectTo: window.location.origin },
    });
    if (error) fail(error.message);
  }
  async function review() {
    if (!cloud) return;
    try {
      const diffs = [];
      for (const mine of useStudy
        .getState()
        .entries.filter((e) => dirty.includes(e.id))) {
        const { data, error } = await cloud
          .from(tables[mine.kind])
          .select("payload,version")
          .eq("id", mine.id)
          .maybeSingle();
        if (error) throw error;
        if (data && data.version !== mine.version)
          diffs.push({
            mine,
            remote: { ...data.payload, version: data.version },
          });
      }
      setConflicts(diffs);
      if (!diffs.length) actions.notify("No conflicting records found");
    } catch (e) {
      fail(String(e));
    }
  }
  function exportCsv() {
    const esc = (s: string) =>
      '"' + (/^[=+@\-\t\r]/.test(s) ? "'" : "") + s.replaceAll('"', '""') + '"';
    const rows = [
      [
        "Type",
        "Title",
        "Subject",
        "Date",
        "Time",
        "Status",
        "Priority",
        "Minutes",
      ],
      ...entries.map((e) => [
        e.kind,
        e.title,
        e.subject,
        e.date,
        e.time,
        e.status,
        e.priority,
        String(e.minutes || ""),
      ]),
    ];
    download(
      new Blob(
        ["\uFEFF" + rows.map((r) => r.map(esc).join(",")).join("\r\n")],
        { type: "text/csv;charset=utf-8" },
      ),
      "StudyOS-" + localDay() + ".csv",
    );
  }
  return (
    <div className="two-col">
      <section className="panel settings-card">
        <SectionTitle title="Student profile" icon={<UserRound size={18} />} />
        <h3>{profile?.title || "Student"}</h3>
        <p>
          {[
            profile?.college,
            profile?.branch,
            profile?.semester ? "Semester " + profile.semester : "",
          ]
            .filter(Boolean)
            .join(" · ") || "Personalize your workspace."}
        </p>
        <p>{profile?.body}</p>
        <Button
          variant="secondary"
          onClick={() => actions.edit("profile", profile)}
        >
          Edit profile
        </Button>
      </section>
      <section className="panel settings-card">
        <SectionTitle title="Account & cloud sync" icon={<Cloud size={18} />} />
        <p>
          {owner === "guest"
            ? "Your guest workspace is stored in this browser. Sign in to open your personal cloud workspace."
            : syncState}
        </p>
        {owner === "guest" ? (
          <div className="inline wrap">
            <Button variant="secondary" onClick={() => sign("google")}>
              Google login
            </Button>
            <Button variant="secondary" onClick={() => sign("github")}>
              <Github size={15} />
              GitHub login
            </Button>
          </div>
        ) : (
          <div className="inline wrap">
            <Button variant="secondary" onClick={retry}>
              <RefreshCw size={14} />
              Sync now
            </Button>
            <Button
              variant="ghost"
              onClick={async () => {
                const result = await cloud!.auth.signOut();
                if (result.error) fail(result.error.message);
              }}
            >
              Sign out
            </Button>
            {dirty.length > 0 && (
              <Button variant="secondary" onClick={review}>
                Review conflicts
              </Button>
            )}
          </div>
        )}
        {error && (
          <p className="error" role="alert">
            {error}
          </p>
        )}
      </section>
      <section className="panel settings-card">
        <SectionTitle title="Preferences" icon={<Sun size={18} />} />
        <div className="summary-row">
          <span>Appearance</span>
          <Button variant="secondary" onClick={theme}>
            {dark ? <Moon size={15} /> : <Sun size={15} />}{" "}
            {dark ? "Dark" : "Light"}
          </Button>
        </div>
        <div className="summary-row">
          <span>Desktop reminders</span>
          <Button
            variant="secondary"
            onClick={async () => {
              if (!("Notification" in window)) {
                actions.notify(
                  "This browser does not support desktop notifications.",
                );
                return;
              }
              const p = await Notification.requestPermission();
              actions.notify(
                p === "granted"
                  ? "Desktop reminders enabled"
                  : "Allow notifications in your browser settings.",
              );
            }}
          >
            <Bell size={14} />
            Enable
          </Button>
        </div>
      </section>
      <section className="panel settings-card">
        <SectionTitle title="Export & backup" icon={<Database size={18} />} />
        <p>
          Download your workspace records. Attachments are stored separately.
        </p>
        <div className="inline wrap">
          <Button variant="secondary" onClick={exportCsv}>
            <FileDown size={15} />
            CSV
          </Button>
          <Button
            variant="secondary"
            onClick={() =>
              download(
                new Blob(
                  [JSON.stringify({ format: "studyos-v1", entries }, null, 2)],
                  { type: "application/json" },
                ),
                "StudyOS-backup.json",
              )
            }
          >
            <Download size={15} />
            Backup JSON
          </Button>
          <Button
            variant="secondary"
            onClick={() => {
              actions.go("Analytics");
              setTimeout(() => window.print(), 350);
            }}
          >
            Print report
          </Button>
        </div>
        <label className="restore-label">
          Import backup
          <input
            aria-label="Import backup JSON"
            type="file"
            accept=".json"
            onChange={async (ev) => {
              const f = ev.target.files?.[0];
              if (!f) return;
              try {
                if (f.size > 15e6) throw Error("Backup too large");
                const data = JSON.parse(await f.text());
                if (
                  data.format !== "studyos-v1" ||
                  !Array.isArray(data.entries) ||
                  !data.entries.every(
                    (r: Entry) =>
                      r &&
                      kinds.includes(r.kind) &&
                      [
                        "id",
                        "title",
                        "body",
                        "date",
                        "subject",
                        "time",
                        "updated",
                      ].every((k) => typeof r[k as keyof Entry] === "string") &&
                      (!r.steps || Array.isArray(r.steps)),
                  )
                )
                  throw Error("Invalid StudyOS backup");
                const existing = new Set(
                  useStudy.getState().entries.map((e) => e.id),
                );
                const fresh = (data.entries as Entry[]).filter(
                  (e) =>
                    !existing.has(e.id) && !(e.kind === "profile" && profile),
                );
                useStudy
                  .getState()
                  .save(...fresh.map((e) => ({ ...e, version: 0 })));
                actions.notify(fresh.length + " new records imported");
              } catch (err) {
                actions.notify(String(err));
              }
              ev.target.value = "";
            }}
          />
        </label>
      </section>
      {conflicts.length > 0 && (
        <Modal title="Resolve sync conflicts" onClose={() => setConflicts([])}>
          {conflicts.map(({ mine, remote }) => (
            <div key={mine.id} className="conflict">
              <strong>{mine.title}</strong>
              <p>
                Cloud copy: {remote.title} ·{" "}
                {new Date(remote.updated).toLocaleString()}
              </p>
              <div className="inline">
                <Button
                  onClick={() => {
                    useStudy
                      .getState()
                      .save({ ...mine, version: remote.version });
                    setConflicts((cs) =>
                      cs.filter((c) => c.mine.id !== mine.id),
                    );
                  }}
                >
                  Keep my edit
                </Button>
                <Button
                  variant="secondary"
                  onClick={() => {
                    useStudy
                      .getState()
                      .merge(
                        owner,
                        [remote],
                        new Map([[mine.id, mine.updated]]),
                      );
                    setConflicts((cs) =>
                      cs.filter((c) => c.mine.id !== mine.id),
                    );
                  }}
                >
                  Use cloud copy
                </Button>
              </div>
            </div>
          ))}
        </Modal>
      )}
    </div>
  );
}
