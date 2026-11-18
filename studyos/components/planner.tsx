"use client";
import { useState } from "react";
import {
  Check,
  ChevronLeft,
  ChevronRight,
  Plus,
  Search,
  Clock3,
  Flag,
  MapPin,
  Flame,
  Medal,
  GripVertical,
  CalendarDays,
  Pencil,
  BookOpen,
  Target,
} from "lucide-react";
import {
  Entry,
  Kind,
  labels,
  pretty,
  clock,
  localDay,
  shift,
  daysUntil,
  tone,
  streak,
} from "@/lib/model";
import { useStudy } from "@/lib/store";
import { Actions, Button, Tag, TypeIcon, Empty, SectionTitle } from "./ui";
export function Progress({ value }: { value: number }) {
  return (
    <div
      className="progress-track"
      role="progressbar"
      aria-valuenow={value}
      aria-valuemin={0}
      aria-valuemax={100}
    >
      <i style={{ width: value + "%" }} />
    </div>
  );
}
function Deadline({ e }: { e: Entry }) {
  const n = daysUntil(e.date);
  return (
    <Tag color={n < 0 ? "rose" : n < 3 ? "amber" : "blue"}>
      {n < 0
        ? Math.abs(n) + "d overdue"
        : n === 0
          ? "Due today"
          : n === 1
            ? "Tomorrow"
            : n + " days left"}
    </Tag>
  );
}
export function Planner({
  entries,
  kind,
  actions,
}: {
  entries: Entry[];
  kind: Kind;
  actions: Actions;
}) {
  const [q, query] = useState(""),
    [filter, setFilter] = useState("All"),
    [subject, choose] = useState("All subjects");
  const { save, toggle } = useStudy();
  const all = entries.filter((e) => e.kind === kind);
  const rows = all
    .filter(
      (e) =>
        (filter === "All" || e.status === filter || e.priority === filter) &&
        (subject === "All subjects" || e.subject === subject) &&
        (e.title + " " + e.subject).toLowerCase().includes(q.toLowerCase()),
    )
    .sort((a, b) =>
      kind === "task"
        ? (a.order ?? 0) - (b.order ?? 0)
        : (a.date + a.time).localeCompare(b.date + b.time),
    );
  function drop(id: string, target: string) {
    const sorted = all.slice().sort((a, b) => (a.order ?? 0) - (b.order ?? 0));
    const dragged = sorted.find((e) => e.id === id);
    if (!dragged || id === target) return;
    const others = sorted.filter((e) => e.id !== id);
    others.splice(
      others.findIndex((e) => e.id === target),
      0,
      dragged,
    );
    save(...others.map((e, i) => ({ ...e, order: i })));
  }
  return (
    <>
      <div className="toolbar">
        <label className="search-field">
          <Search size={16} />
          <input
            placeholder={"Search " + labels[kind].toLowerCase() + "s…"}
            value={q}
            onChange={(e) => query(e.target.value)}
          />
        </label>
        <select
          aria-label="Filter by subject"
          value={subject}
          onChange={(e) => choose(e.target.value)}
        >
          {[
            "All subjects",
            ...new Set(all.map((e) => e.subject).filter(Boolean)),
          ].map((s) => (
            <option key={s}>{s}</option>
          ))}
        </select>
        <select
          aria-label="Filter by status or priority"
          value={filter}
          onChange={(e) => setFilter(e.target.value)}
        >
          {[
            "All",
            "Pending",
            "In Progress",
            "Completed",
            ...(["task", "assignment"].includes(kind)
              ? ["High", "Medium", "Low"]
              : []),
          ].map((s) => (
            <option key={s}>{s}</option>
          ))}
        </select>
      </div>
      <div className={"record-grid " + (kind === "task" ? "list-records" : "")}>
        {rows.map((e) => (
          <article
            key={e.id}
            className="panel record"
            draggable={kind === "task"}
            onDragStart={(evt) => evt.dataTransfer.setData("text/plain", e.id)}
            onDragOver={(evt) => evt.preventDefault()}
            onDrop={(evt) => {
              evt.preventDefault();
              if (kind === "task")
                drop(evt.dataTransfer.getData("text/plain"), e.id);
            }}
          >
            {kind === "task" ? (
              <>
                <GripVertical size={15} className="muted" />
                <button
                  className={
                    "check " + (e.status === "Completed" ? "checked" : "")
                  }
                  aria-label={"Toggle " + e.title}
                  onClick={() => toggle(e)}
                >
                  {e.status === "Completed" && <Check size={12} />}
                </button>
                <button
                  className="grow plain text-left"
                  onClick={() => actions.edit(kind, e)}
                >
                  <strong className={e.status === "Completed" ? "strike" : ""}>
                    {e.title}
                  </strong>
                  <small>
                    {e.subject || "General"} · {pretty(e.date)}
                    {e.steps?.length
                      ? " · " +
                        e.steps.filter((s) => s.done).length +
                        "/" +
                        e.steps.length +
                        " subtasks"
                      : ""}
                  </small>
                </button>
                <Tag
                  color={
                    e.priority === "High"
                      ? "rose"
                      : e.priority === "Low"
                        ? "mint"
                        : "amber"
                  }
                >
                  {e.priority}
                </Tag>
              </>
            ) : (
              <>
                <div className="record-top">
                  <TypeIcon entry={e} />
                  {e.status === "Completed" ? (
                    <Tag color="mint">Completed</Tag>
                  ) : (
                    <Deadline e={e} />
                  )}
                </div>
                <button
                  className="plain text-left"
                  onClick={() => actions.edit(kind, e)}
                >
                  <h3>{e.title}</h3>
                </button>
                <p>
                  {e.subject || "General"}
                  {e.subtype ? " · " + e.subtype : ""}
                </p>
                {e.body && <p className="truncate">{e.body}</p>}
                <div className="detail">
                  <CalendarDays size={15} />
                  {pretty(e.date)} {e.time ? " · " + clock(e.time) : ""}
                </div>
                {e.location && (
                  <div className="detail">
                    <MapPin size={14} />
                    {e.location}
                  </div>
                )}
                {["goal", "exam"].includes(kind) && (
                  <>
                    <div className="progress-caption">
                      <span>
                        {kind === "exam" ? "Preparation" : "Milestones"}
                      </span>
                      <b>{e.progress || 0}%</b>
                    </div>
                    <Progress value={e.progress || 0} />
                  </>
                )}
                {kind === "goal" && e.progress === 100 && (
                  <Tag color="amber">Milestone achiever</Tag>
                )}
                {kind === "exam" && (
                  <Button
                    variant="secondary"
                    onClick={() =>
                      actions.edit("event", undefined, {
                        title: "Revise " + e.title,
                        subject: e.subject,
                        subtype: "Study session",
                        date:
                          daysUntil(e.date) > 1
                            ? shift(e.date, -1)
                            : localDay(),
                        parent: e.id,
                        body: e.body,
                      })
                    }
                  >
                    <CalendarDays size={14} />
                    Schedule revision
                  </Button>
                )}
                <div className="record-bottom">
                  <Tag color={e.status === "In Progress" ? "blue" : "neutral"}>
                    {kind === "exam" ? e.subtype || "Exam" : e.status}
                  </Tag>
                  <button
                    className="text-link"
                    onClick={() => actions.edit(kind, e)}
                  >
                    <Pencil size={13} />
                    Edit
                  </button>
                </div>
              </>
            )}
          </article>
        ))}
      </div>
      {!rows.length && (
        <div className="panel">
          <Empty>
            {all.length
              ? "No entries match these filters."
              : "Your " + labels[kind].toLowerCase() + "s will appear here."}
          </Empty>
        </div>
      )}
    </>
  );
}
export function Calendar({
  entries,
  actions,
}: {
  entries: Entry[];
  actions: Actions;
}) {
  const [mode, view] = useState<"Day" | "Week" | "Month">("Month"),
    [date, select] = useState(localDay());
  const [y, m] = date.split("-").map(Number),
    first = date.slice(0, 8) + "01",
    weekday =
      (new Date((mode === "Month" ? first : date) + "T12:00:00").getDay() + 6) %
      7;
  const start =
    mode === "Month"
      ? shift(first, -weekday)
      : mode === "Week"
        ? shift(date, -weekday)
        : date;
  const count =
    mode === "Month"
      ? Math.ceil((new Date(y, m, 0).getDate() + weekday) / 7) * 7
      : mode === "Week"
        ? 7
        : 1;
  const days = Array.from({ length: count }, (_, i) => shift(start, i));
  const scheduled = entries.filter((e) =>
    [
      "task",
      "assignment",
      "exam",
      "goal",
      "event",
      "notification",
      "session",
      "pomodoro",
    ].includes(e.kind),
  );
  const { save } = useStudy();
  function move(n: number) {
    if (mode === "Month") {
      select(localDay(new Date(y, m - 1 + n, 1)));
    } else select(shift(date, n * (mode === "Week" ? 7 : 1)));
  }
  return (
    <section className="panel calendar">
      <div className="calendar-head">
        <div className="inline">
          <button
            className="icon-button"
            aria-label="Previous period"
            onClick={() => move(-1)}
          >
            <ChevronLeft size={17} />
          </button>
          <h2>
            {pretty(
              date,
              mode === "Month"
                ? { month: "long", year: "numeric" }
                : { month: "short", day: "numeric", year: "numeric" },
            )}
          </h2>
          <button
            className="icon-button"
            aria-label="Next period"
            onClick={() => move(1)}
          >
            <ChevronRight size={17} />
          </button>
        </div>
        <div className="inline">
          <Button variant="secondary" onClick={() => select(localDay())}>
            Today
          </Button>
          <div className="segmented">
            {(["Day", "Week", "Month"] as const).map((v) => (
              <button
                key={v}
                onClick={() => view(v)}
                className={mode === v ? "selected" : ""}
              >
                {v}
              </button>
            ))}
          </div>
        </div>
      </div>
      <div
        className={"calendar-scroll " + (mode === "Day" ? "day-scroll" : "")}
      >
        <div className={"cal-grid " + mode.toLowerCase()}>
          {mode !== "Day" &&
            ["Mon", "Tue", "Wed", "Thu", "Fri", "Sat", "Sun"].map((s) => (
              <strong className="weekday" key={s}>
                {s}
              </strong>
            ))}
          {days.map((d) => (
            <div
              key={d}
              className={
                "cal-day " +
                (d === localDay() ? "today " : "") +
                (mode === "Month" && d.slice(0, 7) !== date.slice(0, 7)
                  ? "outside"
                  : "")
              }
              onDragOver={(e) => e.preventDefault()}
              onDrop={(evt) => {
                evt.preventDefault();
                const item = scheduled.find(
                  (e) => e.id === evt.dataTransfer.getData("text/plain"),
                );
                if (item) {
                  save({ ...item, date: d });
                  actions.notify("Moved to " + pretty(d));
                }
              }}
            >
              <div className="cal-date">
                <button
                  onClick={() => {
                    select(d);
                    view("Day");
                  }}
                >
                  {mode === "Day"
                    ? pretty(d, { weekday: "long" })
                    : Number(d.slice(-2))}
                </button>
                <button
                  className="icon-button"
                  aria-label={"Add event on " + d}
                  onClick={() => actions.edit("event", undefined, { date: d })}
                >
                  <Plus size={13} />
                </button>
              </div>
              {scheduled
                .filter((e) => e.date === d)
                .sort((a, b) => a.time.localeCompare(b.time))
                .map((e) => (
                  <button
                    key={e.id}
                    draggable
                    onDragStart={(evt) =>
                      evt.dataTransfer.setData("text/plain", e.id)
                    }
                    className={"cal-event " + tone(e)}
                    title={e.title}
                    onClick={() =>
                      ["session", "pomodoro"].includes(e.kind)
                        ? actions.go("Focus timer")
                        : actions.edit(e.kind, e)
                    }
                  >
                    {e.time && <b>{e.time} </b>}
                    {e.title}
                  </button>
                ))}
            </div>
          ))}
        </div>
      </div>
      <div className="calendar-legend">
        {["assignment", "exam", "event", "task"].map((k) => (
          <span key={k} className={"tag " + tone({ kind: k } as Entry)}>
            {labels[k as Kind]}
          </span>
        ))}
      </div>
    </section>
  );
}
export function Habits({
  entries,
  actions,
}: {
  entries: Entry[];
  actions: Actions;
}) {
  const [range, setRange] = useState(7),
    { habit } = useStudy(),
    today = localDay(),
    habits = entries.filter((e) => e.kind === "habit"),
    logs = entries.filter((e) => e.kind === "habitLog");
  return (
    <>
      <div className="toolbar">
        <div className="segmented">
          {[7, 30].map((n) => (
            <button
              key={n}
              className={n === range ? "selected" : ""}
              onClick={() => setRange(n)}
            >
              {n} days
            </button>
          ))}
        </div>
      </div>
      <div className="record-grid">
        {habits.map((h) => {
          const days = new Set(
              logs.filter((l) => l.parent === h.id).map((l) => l.date),
            ),
            count = streak([...days]),
            dates = Array.from({ length: range }, (_, i) =>
              shift(today, i + 1 - range),
            ),
            rate = Math.round(
              (100 * dates.filter((d) => days.has(d)).length) / range,
            );
          return (
            <section className="panel record" key={h.id}>
              <div className="record-top">
                <span className="type-icon amber">
                  <Flame size={20} />
                </span>
                <button
                  className="icon-button"
                  aria-label={"Edit " + h.title}
                  onClick={() => actions.edit("habit", h)}
                >
                  <Pencil size={15} />
                </button>
              </div>
              <h3>{h.title}</h3>
              <p>
                {count} day streak · {rate}% consistency
              </p>
              <div className={"habit-graph " + (range === 30 ? "month" : "")}>
                {dates.map((d) => (
                  <span
                    key={d}
                    title={
                      pretty(d) + (days.has(d) ? " · Completed" : " · Open")
                    }
                    className={days.has(d) ? "filled" : ""}
                  >
                    {range === 7 ? pretty(d, { weekday: "narrow" }) : ""}
                  </span>
                ))}
              </div>
              {count >= 7 && (
                <Tag color="amber">
                  <Medal size={12} />
                  {count >= 30 ? "Month streak" : "Week streak"}
                </Tag>
              )}
              <Button
                variant={days.has(today) ? "secondary" : "default"}
                onClick={() => habit(h)}
              >
                <Check size={15} />
                {days.has(today) ? "Completed today" : "Check in today"}
              </Button>
            </section>
          );
        })}
      </div>
      {!habits.length && (
        <Empty>Add a habit to begin tracking your consistency.</Empty>
      )}
    </>
  );
}
