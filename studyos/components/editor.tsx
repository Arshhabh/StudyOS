"use client";
import { useState, FormEvent } from "react";
import { Paperclip, Plus, Trash2, Check } from "lucide-react";
import { Entry, Kind, labels, makeEntry, subjectNames } from "@/lib/model";
import { useStudy } from "@/lib/store";
import { downloadFile, uploadFile } from "@/lib/cloud";
import { Modal, Button } from "./ui";
export type EditorSpec = {
  kind: Kind;
  entry?: Entry;
  defaults?: Partial<Entry>;
};
export function Editor({
  spec,
  close,
  notify,
}: {
  spec: EditorSpec;
  close: () => void;
  notify: (m: string) => void;
}) {
  const [e, set] = useState(
      () =>
        spec.entry ||
        makeEntry(spec.kind, "", {
          ...(spec.kind === "profile" && useStudy.getState().owner !== "guest"
            ? { id: useStudy.getState().owner }
            : {}),
          ...spec.defaults,
        }),
    ),
    [file, setFile] = useState<File | null>(null),
    [busy, working] = useState(false),
    [error, fail] = useState(""),
    [confirm, setConfirm] = useState(false),
    [step, setStep] = useState("");
  const { save, remove, owner, entries } = useStudy(),
    k = e.kind;
  const change = <K extends keyof Entry>(key: K, val: Entry[K]) =>
    set((old) => ({ ...old, [key]: val }));
  const dated = !["habit", "note", "profile", "subject"].includes(k);
  const withSteps = ["goal", "task", "exam"].includes(k),
    subjects = [
      ...new Set([
        ...subjectNames,
        ...entries
          .filter((x) => !x.deleted && (x.kind === "subject" || x.subject))
          .map((x) => (x.kind === "subject" ? x.title : x.subject)),
      ]),
    ];
  function addStep() {
    if (step.trim()) {
      change("steps", [
        ...(e.steps || []),
        { id: crypto.randomUUID(), title: step.trim(), done: false },
      ]);
      setStep("");
    }
  }
  async function submit(evt: FormEvent) {
    evt.preventDefault();
    if (!e.title.trim()) return;
    working(true);
    fail("");
    try {
      const attachment = file ? await uploadFile(file, owner) : e.attachment;
      const steps = [
        ...(e.steps || []),
        ...(step.trim()
          ? [{ id: crypto.randomUUID(), title: step.trim(), done: false }]
          : []),
      ];
      const progress = steps.length
        ? Math.round((100 * steps.filter((s) => s.done).length) / steps.length)
        : e.progress;
      save({
        ...e,
        title: e.title.trim(),
        attachment,
        steps,
        progress,
        status: k === "goal" && progress === 100 ? "Completed" : e.status,
        completedOn:
          e.status === "Completed" ? e.completedOn || e.date : undefined,
      });
      notify(labels[k] + " saved");
      close();
    } catch (err) {
      fail(err instanceof Error ? err.message : "Could not save this entry.");
    } finally {
      working(false);
    }
  }
  const status = [
    "task",
    "assignment",
    "event",
    "goal",
    "notification",
  ].includes(k);
  return (
    <Modal
      title={(spec.entry ? "Edit " : "New ") + labels[k].toLowerCase()}
      onClose={close}
    >
      <form onSubmit={submit} className="form">
        <label>
          {k === "profile" ? "Name" : "Title"}
          <input
            autoFocus
            required
            maxLength={200}
            value={e.title}
            onChange={(x) => change("title", x.target.value)}
            placeholder={
              k === "task" ? "What needs to get done?" : "Enter a title"
            }
          />
        </label>
        {k === "profile" ? (
          <>
            <div className="fields">
              <label>
                College
                <input
                  value={e.college || ""}
                  onChange={(x) => change("college", x.target.value)}
                />
              </label>
              <label>
                Branch
                <input
                  value={e.branch || ""}
                  onChange={(x) => change("branch", x.target.value)}
                />
              </label>
            </div>
            <label>
              Semester
              <input
                type="number"
                min="1"
                max="24"
                value={e.semester || ""}
                onChange={(x) => change("semester", x.target.value)}
              />
            </label>
            <label>
              Profile photo
              <input
                type="file"
                accept="image/png,image/jpeg,image/webp"
                onChange={(x) => {
                  const f = x.target.files?.[0];
                  if (!f) return;
                  if (f.size > 500000) {
                    fail("Choose a photo smaller than 500 KB.");
                    return;
                  }
                  const r = new FileReader();
                  r.onload = () => change("photo", String(r.result));
                  r.readAsDataURL(f);
                }}
              />
            </label>
          </>
        ) : null}
        {!["profile", "habit", "subject"].includes(k) && (
          <label>
            Subject or category
            <input
              list="study-subjects"
              value={e.subject}
              onChange={(x) => change("subject", x.target.value)}
              placeholder="Select or enter a subject"
            />
            <datalist id="study-subjects">
              {subjects.map((s) => (
                <option key={s}>{s}</option>
              ))}
            </datalist>
          </label>
        )}
        {dated && (
          <div className="fields">
            <label>
              {k === "exam" ? "Exam date" : "Date"}
              <input
                required
                type="date"
                value={e.date}
                onChange={(x) => change("date", x.target.value)}
              />
            </label>
            <label>
              Time
              <input
                type="time"
                value={e.time}
                onChange={(x) => change("time", x.target.value)}
              />
            </label>
          </div>
        )}
        <div className="fields">
          {status && (
            <label>
              Status
              <select
                value={e.status}
                onChange={(x) =>
                  change("status", x.target.value as Entry["status"])
                }
              >
                {["Pending", "In Progress", "Completed"].map((v) => (
                  <option key={v}>{v}</option>
                ))}
              </select>
            </label>
          )}
          {["task", "assignment"].includes(k) && (
            <label>
              Priority
              <select
                value={e.priority}
                onChange={(x) =>
                  change("priority", x.target.value as Entry["priority"])
                }
              >
                {["Low", "Medium", "High"].map((v) => (
                  <option key={v}>{v}</option>
                ))}
              </select>
            </label>
          )}
        </div>
        {["exam", "goal", "task", "event"].includes(k) && (
          <label>
            {k === "task" ? "Repeat" : k === "goal" ? "Goal category" : "Type"}
            <select
              value={(k === "task" ? e.recurrence : e.subtype) || ""}
              onChange={(x) =>
                change(k === "task" ? "recurrence" : "subtype", x.target.value)
              }
            >
              <option value="">Select an option</option>
              {(k === "task"
                ? ["Daily", "Weekly"]
                : k === "exam"
                  ? [
                      "Mid Semester",
                      "End Semester",
                      "Quiz",
                      "Practical",
                      "Viva",
                      "Unit Test",
                    ]
                  : k === "goal"
                    ? ["Academic", "Semester", "Skill", "Personal"]
                    : ["Class", "Study session", "Event", "Reminder"]
              ).map((v) => (
                <option key={v}>{v}</option>
              ))}
            </select>
          </label>
        )}
        {k === "exam" && (
          <label>
            Location
            <input
              value={e.location || ""}
              onChange={(x) => change("location", x.target.value)}
            />
          </label>
        )}
        {["exam", "goal"].includes(k) && !e.steps?.length && (
          <label>
            Progress · {e.progress || 0}%
            <input
              type="range"
              min="0"
              max="100"
              value={e.progress || 0}
              onChange={(x) => change("progress", Number(x.target.value))}
            />
          </label>
        )}
        <label>
          {k === "exam"
            ? "Syllabus"
            : k === "profile"
              ? "Academic goals"
              : "Notes"}
          <textarea
            rows={3}
            value={e.body}
            onChange={(x) => change("body", x.target.value)}
            placeholder="Add details…"
          />
        </label>
        {withSteps && (
          <div>
            <span className="label">
              {k === "goal"
                ? "Milestones"
                : k === "exam"
                  ? "Revision topics"
                  : "Subtasks"}
            </span>
            {e.steps?.map((s) => (
              <div className="check-row" key={s.id}>
                <button
                  type="button"
                  className={"check " + (s.done ? "checked" : "")}
                  aria-label={"Toggle " + s.title}
                  onClick={() =>
                    change(
                      "steps",
                      e.steps?.map((a) =>
                        a.id === s.id ? { ...a, done: !a.done } : a,
                      ),
                    )
                  }
                >
                  {s.done && <Check size={12} />}
                </button>
                {s.title}
                <button
                  type="button"
                  className="icon-button push"
                  aria-label={"Remove " + s.title}
                  onClick={() =>
                    change(
                      "steps",
                      e.steps?.filter((a) => a.id !== s.id),
                    )
                  }
                >
                  <Trash2 size={13} />
                </button>
              </div>
            ))}
            <div className="inline">
              <input
                placeholder="Add an item"
                value={step}
                onChange={(x) => setStep(x.target.value)}
                onKeyDown={(x) => {
                  if (x.key === "Enter") {
                    x.preventDefault();
                    addStep();
                  }
                }}
              />
              <Button type="button" variant="secondary" onClick={addStep}>
                <Plus size={16} />
              </Button>
            </div>
          </div>
        )}
        {k === "assignment" && (
          <label>
            Attachment
            {e.attachment && (
              <button
                type="button"
                className="text-link"
                onClick={() =>
                  downloadFile(e.attachment!).catch((x) => fail(x.message))
                }
              >
                <Paperclip size={14} />
                {e.attachment.name}
              </button>
            )}
            <input
              type="file"
              onChange={(x) => setFile(x.target.files?.[0] || null)}
            />
          </label>
        )}
        {error && (
          <p role="alert" className="error">
            {error}
          </p>
        )}
        <div className="form-actions">
          {spec.entry && k !== "profile" && (
            <Button
              type="button"
              variant="ghost"
              onClick={() => {
                if (confirm) {
                  remove(e.id);
                  notify(labels[k] + " deleted");
                  close();
                } else setConfirm(true);
              }}
            >
              <Trash2 size={14} />
              {confirm ? "Confirm delete" : "Delete"}
            </Button>
          )}
          <Button
            type="button"
            variant="secondary"
            className="push"
            onClick={close}
          >
            Cancel
          </Button>
          <Button disabled={busy}>
            {busy ? "Saving…" : "Save " + labels[k].toLowerCase()}
          </Button>
        </div>
      </form>
    </Modal>
  );
}
