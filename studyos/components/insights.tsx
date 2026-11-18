"use client";
import { useState } from "react";
import {
  Sparkles,
  Send,
  BookOpen,
  BarChart3,
  Target,
  Clock3,
  CalendarDays,
  Plus,
  Check,
  Calculator,
  Trash2,
} from "lucide-react";
import Markdown from "react-markdown";
import {
  BarChart,
  Bar,
  ResponsiveContainer,
  XAxis,
  YAxis,
  Tooltip,
  CartesianGrid,
} from "recharts";
import {
  Entry,
  stats,
  shift,
  localDay,
  duration,
  pretty,
  makeEntry,
  daysUntil,
} from "@/lib/model";
import { useStudy } from "@/lib/store";
import { cloud } from "@/lib/cloud";
import { ActivityChart, MetricCards } from "./dashboard";
import { Actions, Button, SectionTitle, Empty } from "./ui";
export function Analytics({
  entries,
  actions,
}: {
  entries: Entry[];
  actions: Actions;
}) {
  const [period, range] = useState(7),
    end = localDay(),
    start = shift(end, 1 - period);
  const inRange = entries.filter((e) => e.date >= start && e.date <= end),
    ss = inRange.filter(
      (e) =>
        ["session", "pomodoro"].includes(e.kind) && e.status === "Completed",
    );
  const subjects = [...new Set(ss.map((e) => e.subject || "General"))].map(
    (s) => ({
      name: s,
      hours:
        Math.round(
          (100 *
            ss
              .filter((e) => (e.subject || "General") === s)
              .reduce((n, e) => n + (e.minutes || 0), 0)) /
            60,
        ) / 100,
    }),
  );
  const data = Array.from({ length: period }, (_, i) => {
    const day = shift(start, i),
      s = stats(entries, day);
    return {
      day: pretty(day, { month: "short", day: "numeric" }),
      Productivity: s.score,
      Habits: s.habits.length
        ? Math.round((100 * s.logs.length) / s.habits.length)
        : 0,
      Focus: Math.round(
        s.sessions
          .filter((e) => e.kind === "pomodoro" && e.date === day)
          .reduce((n, e) => n + (e.minutes || 0), 0),
      ),
      Assignments: entries.filter(
        (e) =>
          e.kind === "assignment" &&
          e.status === "Completed" &&
          (e.completedOn || e.date) === day,
      ).length,
    };
  });
  const [metric, choose] = useState("Productivity");
  return (
    <>
      <MetricCards entries={entries} go={actions.go} />
      <div className="toolbar">
        <div className="segmented">
          {[1, 7, 30].map((p) => (
            <button
              key={p}
              className={p === period ? "selected" : ""}
              onClick={() => range(p)}
            >
              {p === 1 ? "Today" : p + " days"}
            </button>
          ))}
        </div>
        <Button variant="secondary" onClick={() => window.print()}>
          Export PDF
        </Button>
      </div>
      <div className="two-col">
        <ActivityChart entries={entries} />
        <section className="panel">
          <SectionTitle
            title="Study by subject"
            icon={<BookOpen size={18} />}
          />
          {subjects.length ? (
            subjects.map((s) => (
              <div key={s.name} className="subject-bar">
                <span>
                  {s.name}
                  <b>{duration(s.hours * 60)}</b>
                </span>
                <div className="progress-track">
                  <i
                    style={{
                      width:
                        (100 * s.hours) /
                          Math.max(...subjects.map((v) => v.hours), 0.01) +
                        "%",
                    }}
                  />
                </div>
              </div>
            ))
          ) : (
            <Empty>No study sessions in this period.</Empty>
          )}
        </section>
        <section className="panel">
          <SectionTitle
            title="Progress trends"
            icon={<BarChart3 size={18} />}
            extra={
              <select
                aria-label="Trend metric"
                value={metric}
                onChange={(e) => choose(e.target.value)}
              >
                {["Productivity", "Habits", "Focus", "Assignments"].map((s) => (
                  <option key={s}>{s}</option>
                ))}
              </select>
            }
          />
          <p className="muted">
            {metric === "Focus"
              ? "Focus minutes"
              : metric === "Assignments"
                ? "Assignments completed"
                : "Daily percentage"}
          </p>
          <ResponsiveContainer width="100%" height={190}>
            <BarChart data={data} margin={{ left: -25, right: 8, top: 10 }}>
              <CartesianGrid
                vertical={false}
                stroke="var(--border)"
                strokeDasharray="3 3"
              />
              <XAxis
                dataKey="day"
                tick={{ fontSize: 10, fill: "var(--muted)" }}
                minTickGap={22}
              />
              <YAxis tick={{ fontSize: 10, fill: "var(--muted)" }} />
              <Tooltip />
              <Bar dataKey={metric} fill="#8f74e8" radius={[4, 4, 0, 0]} />
            </BarChart>
          </ResponsiveContainer>
        </section>
        <section className="panel">
          <SectionTitle title="Academic summary" icon={<Target size={18} />} />
          {[
            [
              "Study time",
              duration(ss.reduce((n, e) => n + (e.minutes || 0), 0)),
            ],
            ["Focus sessions", ss.filter((e) => e.kind === "pomodoro").length],
            [
              "Assignments completed",
              inRange.filter(
                (e) => e.kind === "assignment" && e.status === "Completed",
              ).length,
            ],
            [
              "Tasks completed",
              inRange.filter(
                (e) => e.kind === "task" && e.status === "Completed",
              ).length,
            ],
            [
              "Most studied subject",
              subjects.sort((a, b) => b.hours - a.hours)[0]?.name || "—",
            ],
          ].map(([k, v]) => (
            <div key={k} className="summary-row">
              <span>{k}</span>
              <strong>{v}</strong>
            </div>
          ))}
        </section>
      </div>
    </>
  );
}
export function Assistant({
  entries,
  actions,
}: {
  entries: Entry[];
  actions: Actions;
}) {
  const [prompt, set] = useState(""),
    [busy, working] = useState(false),
    [history, chat] = useState<
      { request: string; answer: string; source: string }[]
    >([]);
  const owner = useStudy((s) => s.owner);
  async function ask(p: string) {
    if (!p.trim() || busy) return;
    set("");
    working(true);
    const due = entries
        .filter(
          (e) =>
            ["assignment", "exam", "task"].includes(e.kind) &&
            e.status !== "Completed",
        )
        .sort((a, b) => a.date.localeCompare(b.date)),
      exams = due.filter((e) => e.kind === "exam"),
      s = stats(entries);
    let answer = "",
      source = "Offline planner";
    if (cloud && owner !== "guest") {
      try {
        const { data, error } = await cloud.functions.invoke(
          "study-assistant",
          {
            body: {
              prompt: p.slice(0, 2000),
              context: JSON.stringify(
                due
                  .slice(0, 20)
                  .map(({ title, subject, date, kind, progress }) => ({
                    title,
                    subject,
                    date,
                    kind,
                    progress,
                  })),
              ).slice(0, 8000),
            },
          },
        );
        if (!error && data?.answer) {
          answer = data.answer;
          source = "AI assistant";
        }
      } catch {}
    }
    if (!answer) {
      if (/revis|exam/i.test(p) && exams.length) {
        answer =
          "## Revision schedule\n" +
          exams
            .slice(0, 4)
            .map(
              (e) =>
                "- **" +
                e.title +
                "** · " +
                pretty(e.date) +
                ". Set aside a 25-minute recall session " +
                (daysUntil(e.date) > 1
                  ? "on " + pretty(shift(e.date, -1))
                  : "today") +
                ". Use the last 5 minutes to list topics that need another pass.",
            )
            .join("\n");
      } else if (/motiv|consisten|productiv|time manage/i.test(p)) {
        answer =
          "## Your next study block\nYou have logged **" +
          duration(s.minutes) +
          "** today and completed **" +
          s.done +
          " of " +
          s.tasks.length +
          "** tasks.\n\n" +
          (due[0]
            ? "Start with **" + due[0].title + "**. "
            : "Choose one topic. ") +
          "Set a 25-minute timer, close distractions, and write one sentence about what you learned before your break.";
      } else {
        answer =
          "## Study plan for today\n" +
          (due.length
            ? due
                .slice(0, 3)
                .map(
                  (e, i) =>
                    i +
                    1 +
                    ". **" +
                    e.title +
                    "** · " +
                    (i === 0 ? "25" : "20") +
                    " minutes. Due " +
                    pretty(e.date) +
                    ". " +
                    (e.kind === "exam"
                      ? "Test yourself on the syllabus."
                      : "Complete one concrete step and update its status."),
                )
                .join("\n")
            : "1. Pick a subject and review your notes for 20 minutes.") +
          "\n\nTake a 5-minute break between blocks.";
      }
    }
    chat((h) => [...h, { request: p, answer, source }]);
    working(false);
  }
  return (
    <section className="panel assistant">
      <span className="assistant-logo">
        <Sparkles size={30} />
      </span>
      <h2>What are you studying today?</h2>
      <p>
        Plan your next session around your tasks, exams, and available time.
      </p>
      <div className="prompt-chips">
        {[
          "Plan my study day",
          "Build a revision schedule",
          "Improve my productivity",
        ].map((p) => (
          <Button
            variant="secondary"
            key={p}
            disabled={busy}
            onClick={() => ask(p)}
          >
            {p}
          </Button>
        ))}
      </div>
      {history.map((m, i) => (
        <div key={i} className="conversation">
          <strong>{m.request}</strong>
          <small>{m.source}</small>
          <div className="markdown">
            <Markdown>{m.answer}</Markdown>
          </div>
          <Button
            variant="ghost"
            onClick={() =>
              actions.edit("note", undefined, {
                title: m.request,
                body: m.answer,
              })
            }
          >
            <Plus size={14} />
            Save to notes
          </Button>
          <Button
            variant="ghost"
            onClick={() =>
              actions.edit("notification", undefined, {
                title: m.request,
                body: m.answer,
              })
            }
          >
            <CalendarDays size={14} />
            Create reminder
          </Button>
        </div>
      ))}
      <form
        className="assistant-input"
        onSubmit={(e) => {
          e.preventDefault();
          ask(prompt);
        }}
      >
        <input
          required
          maxLength={2000}
          aria-label="Message"
          placeholder="Ask about your study plan…"
          value={prompt}
          onChange={(e) => set(e.target.value)}
        />
        <Button disabled={busy || !prompt.trim()} aria-label="Send message">
          {busy ? "Thinking…" : <Send size={16} />}
        </Button>
      </form>
    </section>
  );
}
export function Utilities({
  entries,
  actions,
}: {
  entries: Entry[];
  actions: Actions;
}) {
  const [mode, tab] = useState("GPA"),
    [title, name] = useState(""),
    [a, setA] = useState(""),
    [b, setB] = useState(""),
    [semester, term] = useState("1");
  const save = useStudy((s) => s.save),
    remove = useStudy((s) => s.remove);
  const marks = entries.filter(
      (e) => e.kind === "subject" && e.credits !== undefined,
    ),
    att = entries.filter((e) => e.kind === "attendance"),
    sem = marks.filter((e) => e.semester === semester),
    rows = mode === "CGPA" ? marks : sem;
  const credits = rows.reduce((n, e) => n + (e.credits || 0), 0),
    avg = credits
      ? rows.reduce((n, e) => n + (e.credits || 0) * (e.score || 0), 0) /
        credits
      : 0;
  const ratio =
    Number(b) > 0 && a !== "" && Number(a) <= Number(b)
      ? (100 * Number(a)) / Number(b)
      : null;
  return (
    <section className="panel utilities">
      <div className="segmented">
        {["GPA", "CGPA", "Attendance", "Percentage", "Progress"].map((s) => (
          <button
            key={s}
            className={mode === s ? "selected" : ""}
            onClick={() => {
              tab(s);
              setA("");
              setB("");
            }}
          >
            {s}
          </button>
        ))}
      </div>
      {mode === "Progress" ? (
        <SemesterProgress entries={entries} />
      ) : (
        <>
          <h2>{mode} calculator</h2>
          <form
            className="form"
            onSubmit={(e) => {
              e.preventDefault();
              if (mode === "Percentage") return;
              if (mode === "Attendance")
                save(
                  makeEntry("attendance", title.trim(), {
                    attended: Number(a),
                    total: Number(b),
                  }),
                );
              else
                save(
                  makeEntry("subject", title.trim(), {
                    score: Number(a),
                    credits: Number(b),
                    semester,
                  }),
                );
              setA("");
              setB("");
              name("");
              actions.notify("Record saved");
            }}
          >
            {mode !== "Percentage" && (
              <label>
                Subject
                <input
                  required
                  value={title}
                  onChange={(e) => name(e.target.value)}
                  placeholder="Subject name"
                />
              </label>
            )}
            <div className="fields">
              {["GPA", "CGPA"].includes(mode) && (
                <label>
                  Semester
                  <input
                    type="number"
                    required
                    min="1"
                    max="24"
                    value={semester}
                    onChange={(e) => term(e.target.value)}
                  />
                </label>
              )}
              <label>
                {mode === "Percentage"
                  ? "Marks earned"
                  : mode === "Attendance"
                    ? "Classes attended"
                    : "Grade points (0–10)"}
                <input
                  type="number"
                  min="0"
                  step={mode === "Attendance" ? 1 : ".01"}
                  max={["GPA", "CGPA"].includes(mode) ? 10 : b || undefined}
                  required
                  value={a}
                  onChange={(e) => setA(e.target.value)}
                />
              </label>
              <label>
                {mode === "Percentage"
                  ? "Maximum marks"
                  : mode === "Attendance"
                    ? "Total classes"
                    : "Credits"}
                <input
                  type="number"
                  min={mode === "Attendance" ? 1 : ".01"}
                  step={mode === "Attendance" ? 1 : ".01"}
                  required
                  value={b}
                  onChange={(e) => setB(e.target.value)}
                />
              </label>
            </div>
            {mode !== "Percentage" && (
              <Button>
                <Plus size={14} />
                Save record
              </Button>
            )}
          </form>
          <div className="calc-result">
            <small>
              {mode === "CGPA"
                ? "Cumulative GPA"
                : mode === "GPA"
                  ? "Semester " + semester + " GPA"
                  : mode}
            </small>
            <b>
              {["GPA", "CGPA"].includes(mode)
                ? avg.toFixed(2)
                : ratio !== null
                  ? ratio.toFixed(1) + "%"
                  : "—"}
            </b>
          </div>
          {mode !== "Percentage" &&
            (mode === "Attendance" ? att : rows).map((e) => (
              <div className="data-row" key={e.id}>
                <div className="grow">
                  <strong>{e.title}</strong>
                  <small>
                    {mode === "Attendance"
                      ? e.attended + " of " + e.total + " classes"
                      : "Semester " +
                        e.semester +
                        " · " +
                        e.credits +
                        " credits"}
                  </small>
                </div>
                <b>
                  {mode === "Attendance"
                    ? ((100 * (e.attended || 0)) / (e.total || 1)).toFixed(1) +
                      "%"
                    : e.score}
                </b>
                <button
                  className="icon-button"
                  title="Remove record"
                  onClick={() => remove(e.id)}
                >
                  <Trash2 size={14} />
                </button>
              </div>
            ))}
        </>
      )}
    </section>
  );
}
function SemesterProgress({ entries }: { entries: Entry[] }) {
  const marks = entries.filter(
    (e) => e.kind === "subject" && e.credits && e.semester,
  );
  const semesters = [...new Set(marks.map((e) => e.semester!))].sort(
    (a, b) => Number(a) - Number(b),
  );
  const goals = entries.filter((e) => e.kind === "goal"),
    attendance = entries.filter((e) => e.kind === "attendance"),
    held = attendance.reduce((sum, e) => sum + (e.total || 0), 0),
    present = attendance.reduce((sum, e) => sum + (e.attended || 0), 0);
  return (
    <>
      <h2>Semester performance</h2>
      {semesters.length ? (
        semesters.map((s) => {
          const terms = marks.filter((e) => e.semester === s),
            credits = terms.reduce((n, e) => n + e.credits!, 0),
            gpa =
              terms.reduce((n, e) => n + e.credits! * (e.score || 0), 0) /
              credits;
          return (
            <div className="subject-bar" key={s}>
              <span>
                Semester {s} · {credits} credits<b>{gpa.toFixed(2)} / 10</b>
              </span>
              <div className="progress-track">
                <i style={{ width: gpa * 10 + "%" }} />
              </div>
            </div>
          );
        })
      ) : (
        <Empty>
          Save a subject and grade in the GPA calculator to track your
          semesters.
        </Empty>
      )}
      <div className="summary-row">
        <span>Attendance across subjects</span>
        <strong>
          {held ? ((100 * present) / held).toFixed(1) + "%" : "—"}
        </strong>
      </div>
      <div className="summary-row">
        <span>Goals completed</span>
        <strong>
          {goals.filter((e) => e.status === "Completed").length} /{" "}
          {goals.length}
        </strong>
      </div>
    </>
  );
}
