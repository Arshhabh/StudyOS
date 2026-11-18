"use client";
import { useEffect, useState } from "react";
import {
  Pause,
  Play,
  RotateCcw,
  Settings2,
  Timer,
  Headphones,
  SkipForward,
  Volume2,
  Clock3,
} from "lucide-react";
import {
  Entry,
  makeEntry,
  subjectNames,
  pretty,
  duration,
  localDay,
} from "@/lib/model";
import { useStudy } from "@/lib/store";
import { Button, Modal, SectionTitle, Empty } from "./ui";
type TimerState = {
  mode: "Focus" | "Short break" | "Long break" | "Stopwatch";
  focus: number;
  short: number;
  long: number;
  left: number;
  end: number;
  elapsed: number;
  subject: string;
  auto: boolean;
  sound: boolean;
  sessionId: string;
};
function initial(): TimerState {
  return {
    mode: "Focus",
    focus: 25,
    short: 5,
    long: 15,
    left: 1500,
    end: 0,
    elapsed: 0,
    subject: "Mathematics",
    auto: true,
    sound: true,
    sessionId: crypto.randomUUID(),
  };
}
function length(t: TimerState) {
  return (
    (t.mode === "Short break"
      ? t.short
      : t.mode === "Long break"
        ? t.long
        : t.focus) * 60
  );
}
function beep() {
  try {
    const ctx = new AudioContext(),
      o = ctx.createOscillator(),
      g = ctx.createGain();
    o.connect(g);
    g.connect(ctx.destination);
    g.gain.setValueAtTime(0.08, ctx.currentTime);
    g.gain.exponentialRampToValueAtTime(0.001, ctx.currentTime + 0.45);
    o.frequency.value = 700;
    o.start();
    o.stop(ctx.currentTime + 0.45);
    o.onended = () => {
      void ctx.close();
    };
  } catch {}
}
export function useFocus(owner: string, notify: (msg: string) => void) {
  const [t, set] = useState<TimerState>(initial),
    [loaded, loadedFor] = useState(""),
    [now, tick] = useState(Date.now());
  useEffect(() => {
    let state = initial();
    try {
      const v = localStorage.getItem("studyos.timer." + owner);
      if (v) state = { ...state, ...JSON.parse(v) };
    } catch {}
    set(state);
    loadedFor(owner);
  }, [owner]);
  useEffect(() => {
    if (loaded === owner)
      localStorage.setItem("studyos.timer." + owner, JSON.stringify(t));
  }, [t, owner, loaded]);
  useEffect(() => {
    const id = setInterval(() => tick(Date.now()), 500);
    return () => clearInterval(id);
  }, []);
  const watch = t.mode === "Stopwatch",
    remaining = t.end
      ? watch
        ? Math.floor((now - t.end) / 1000) + t.elapsed
        : Math.max(0, Math.ceil((t.end - now) / 1000))
      : watch
        ? t.elapsed
        : t.left;
  function log(seconds: number) {
    const store = useStudy.getState();
    if (
      seconds > 0 &&
      store.owner === owner &&
      !store.entries.some((e) => e.id === t.sessionId)
    ) {
      store.save(
        makeEntry(
          watch ? "session" : "pomodoro",
          watch ? "Study session" : "Focus session",
          {
            id: t.sessionId,
            subject: t.subject,
            minutes: Math.round((seconds / 60) * 100) / 100,
            status: "Completed",
            time: new Date().toTimeString().slice(0, 5),
          },
        ),
      );
    }
  }
  useEffect(() => {
    if (!t.end || watch || remaining > 0 || loaded !== owner) return;
    const focus = t.mode === "Focus";
    if (focus) log(t.focus * 60);
    if (t.sound) beep();
    const msg = focus
      ? "Focus session complete. Time for a break."
      : "Break complete. Ready to focus?";
    notify(msg);
    if ("Notification" in window && Notification.permission === "granted")
      new Notification("StudyOS", { body: msg });
    const mode = focus ? "Short break" : "Focus",
      left = (focus ? t.short : t.focus) * 60;
    set({
      ...t,
      mode,
      left,
      end: focus && t.auto ? Date.now() + left * 1000 : 0,
      sessionId: crypto.randomUUID(),
    });
  }, [remaining, loaded, owner, t.end]); // Wall-clock deadlines also settle on returning to the app.
  function choose(mode: TimerState["mode"]) {
    const n = {
      ...t,
      mode,
      end: 0,
      elapsed: 0,
      sessionId: crypto.randomUUID(),
    };
    set({ ...n, left: length(n) });
  }
  function toggle() {
    const n = Date.now();
    tick(n);
    set(
      t.end
        ? {
            ...t,
            end: 0,
            left: Math.max(0, remaining),
            elapsed: watch ? Math.max(0, remaining) : t.elapsed,
          }
        : { ...t, end: watch ? n : n + t.left * 1000 },
    );
  }
  function startFocus() {
    if (t.mode === "Focus" && t.end) return;
    const n = Date.now();
    tick(n);
    const base =
      t.mode === "Focus"
        ? t
        : {
            ...t,
            mode: "Focus" as const,
            left: t.focus * 60,
            sessionId: crypto.randomUUID(),
          };
    set({ ...base, end: n + base.left * 1000 });
  }
  return {
    t,
    set,
    startFocus,
    remaining: Math.max(0, remaining),
    choose,
    toggle,
    finish: () => {
      if (watch && remaining > 0) {
        log(remaining);
        notify("Study session saved");
      }
      choose(t.mode);
    },
  };
}
export type Focus = ReturnType<typeof useFocus>;
export function FocusCard({ f, full = false }: { f: Focus; full?: boolean }) {
  const [settings, show] = useState(false);
  const entries = useStudy((s) => s.entries);
  const completed = entries.filter(
    (e) => !e.deleted && e.kind === "pomodoro" && e.date === localDay(),
  ).length;
  const { t, remaining } = f;
  const percentage =
    t.mode === "Stopwatch" ? 1 : Math.min(1, remaining / length(t));
  const mm = Math.floor(remaining / 60)
      .toString()
      .padStart(2, "0"),
    ss = (remaining % 60).toString().padStart(2, "0");
  return (
    <section className={"panel focus-card " + (full ? "full-focus" : "")}>
      <SectionTitle
        icon={<Timer size={18} />}
        title="Focus timer"
        extra={
          <button
            onClick={() => show(true)}
            className="icon-button"
            aria-label="Timer settings"
          >
            <Settings2 size={16} />
          </button>
        }
      />
      <div className="timer-tabs">
        {(
          [
            "Focus",
            "Short break",
            "Long break",
            ...(full ? ["Stopwatch"] : []),
          ] as TimerState["mode"][]
        ).map((m) => (
          <button
            key={m}
            aria-pressed={m === t.mode}
            onClick={() => f.choose(m)}
            className={m === t.mode ? "selected" : ""}
          >
            {m}
          </button>
        ))}
      </div>
      <div className="timer-face">
        <svg viewBox="0 0 160 160" aria-hidden="true">
          <circle
            cx="80"
            cy="80"
            r="71"
            fill="none"
            stroke="var(--ringbg)"
            strokeWidth="7"
          />
          <circle
            cx="80"
            cy="80"
            r="71"
            fill="none"
            stroke="var(--purple)"
            strokeWidth="7"
            strokeLinecap="round"
            strokeDasharray={446.1}
            strokeDashoffset={446.1 * (1 - percentage)}
            transform="rotate(-90 80 80)"
          />
        </svg>
        <div>
          <b>
            {mm}:{ss}
          </b>
          <span>
            {t.mode === "Focus" ? "FOCUS TIME" : t.mode.toUpperCase()}
          </span>
        </div>
      </div>
      {full && (
        <label className="focus-subject">
          Subject
          <select
            value={t.subject}
            onChange={(x) => f.set({ ...t, subject: x.target.value })}
          >
            {[
              ...new Set([
                ...subjectNames,
                t.subject,
                ...entries
                  .filter((e) => !e.deleted && e.kind === "subject")
                  .map((e) => e.title),
              ]),
            ].map((v) => (
              <option key={v}>{v}</option>
            ))}
          </select>
        </label>
      )}
      <div className="timer-controls">
        <Button onClick={f.toggle}>
          {t.end ? (
            <Pause size={15} fill="currentColor" />
          ) : (
            <Play size={14} fill="currentColor" />
          )}
          {t.end
            ? "Pause"
            : t.mode === "Focus"
              ? "Start focus"
              : t.mode === "Stopwatch"
                ? "Start timer"
                : "Start break"}
        </Button>
        <Button
          variant="secondary"
          onClick={f.finish}
          title={t.mode === "Stopwatch" ? "Save session" : "Reset timer"}
          aria-label={t.mode === "Stopwatch" ? "Save session" : "Reset timer"}
        >
          {t.mode === "Stopwatch" ? (
            <SkipForward size={16} />
          ) : (
            <RotateCcw size={16} />
          )}
        </Button>
      </div>
      <div className="focus-foot">
        <span className="session-dots">
          {[0, 1, 2, 3].map((i) => (
            <i
              key={i}
              className={
                i < (completed % 4 || Math.min(completed, 4)) ? "filled" : ""
              }
            />
          ))}
        </span>
        {completed} {completed === 1 ? "session" : "sessions"} today
      </div>
      {settings && <TimerSettings f={f} close={() => show(false)} />}
    </section>
  );
}
function TimerSettings({ f, close }: { f: Focus; close: () => void }) {
  const [v, set] = useState(f.t);
  return (
    <Modal title="Timer settings" onClose={close}>
      <form
        className="form"
        onSubmit={(e) => {
          e.preventDefault();
          f.set({
            ...v,
            end: 0,
            left: length(v),
            elapsed: 0,
            sessionId: crypto.randomUUID(),
          });
          close();
        }}
      >
        <label>
          Session preset
          <select
            defaultValue=""
            onChange={(e) => {
              const [focus, short] = e.target.value.split("/").map(Number);
              set({ ...v, focus, short });
            }}
          >
            <option value="" disabled>
              Custom
            </option>
            {["25/5", "50/10", "90/20"].map((p) => (
              <option key={p}>{p}</option>
            ))}
          </select>
        </label>
        <div className="fields">
          {(["focus", "short", "long"] as const).map((k, i) => (
            <label key={k}>
              {["Focus", "Short break", "Long break"][i]} (min)
              <input
                type="number"
                required
                min="1"
                max="240"
                value={v[k]}
                onChange={(e) => set({ ...v, [k]: Number(e.target.value) })}
              />
            </label>
          ))}
        </div>
        <label className="check-label">
          <input
            type="checkbox"
            checked={v.auto}
            onChange={(e) => set({ ...v, auto: e.target.checked })}
          />
          Automatically start short breaks
        </label>
        <label className="check-label">
          <input
            type="checkbox"
            checked={v.sound}
            onChange={(e) => set({ ...v, sound: e.target.checked })}
          />
          Sound notifications
        </label>
        <Button>Save and reset timer</Button>
      </form>
    </Modal>
  );
}
export function FocusView({ f, entries }: { f: Focus; entries: Entry[] }) {
  const sessions = entries
    .filter(
      (e) =>
        ["session", "pomodoro"].includes(e.kind) && e.status === "Completed",
    )
    .sort((a, b) => (b.date + b.time).localeCompare(a.date + a.time));
  return (
    <div className="two-col">
      <FocusCard f={f} full />
      <section className="panel">
        <SectionTitle title="Session history" icon={<Headphones size={18} />} />
        {sessions.length ? (
          sessions.slice(0, 30).map((e) => (
            <div key={e.id} className="data-row">
              <span className="type-icon violet">
                <Clock3 size={17} />
              </span>
              <div className="grow">
                <strong>{e.subject || e.title}</strong>
                <small>
                  {pretty(e.date)} · {e.title}
                </small>
              </div>
              <b>{duration(e.minutes || 0)}</b>
            </div>
          ))
        ) : (
          <Empty>Your completed sessions appear here.</Empty>
        )}
      </section>
    </div>
  );
}
