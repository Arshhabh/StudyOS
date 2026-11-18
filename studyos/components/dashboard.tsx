"use client";
import { useState } from "react";
import {
  CalendarDays,
  Sun,
  Plus,
  Play,
  Clock3,
  ListChecks,
  Flame,
  Zap,
  ArrowUpRight,
  ChevronRight,
  BookOpen,
  CalendarClock,
  Check,
  Target,
  CalendarCheck2,
  Activity,
  TrendingUp,
} from "lucide-react";
import {
  ResponsiveContainer,
  AreaChart,
  Area,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
} from "recharts";
import {
  Entry,
  localDay,
  pretty,
  clock,
  stats,
  duration,
  daysUntil,
  tone,
  labels,
  shift,
  streak,
} from "@/lib/model";
import {
  Button,
  LinkButton,
  SectionTitle,
  TypeIcon,
  Empty,
  Actions,
  Tag,
} from "./ui";
import { useStudy } from "@/lib/store";
import { Focus, FocusCard } from "./focus";
export function MetricCards({
  entries,
  go,
}: {
  entries: Entry[];
  go: Actions["go"];
}) {
  const st = stats(entries),
    today = localDay();
  const hist = Array.from({ length: 7 }, (_, i) =>
    stats(entries, shift(today, i - 6)),
  );
  const cards = [
    {
      name: "Study time",
      value: duration(st.minutes),
      icon: Clock3,
      color: "violet",
      caption: "Logged today",
      graph: hist.map((s) => s.minutes),
      view: "Analytics" as const,
    },
    {
      name: "Tasks completed",
      value: st.done,
      unit: "/ " + st.tasks.length,
      icon: ListChecks,
      color: "blue",
      caption: "Daily task progress",
      graph: hist.map((s) => s.done),
      view: "Tasks" as const,
    },
    {
      name: "Study streak",
      value: st.streak,
      unit: "days",
      icon: Flame,
      color: "amber",
      caption: "Consecutive days",
      graph: hist.map((s) => s.streak),
      view: "Habits" as const,
    },
    {
      name: "Productivity",
      value: st.score,
      unit: "%",
      icon: Zap,
      color: "mint",
      caption: "Today’s score",
      graph: hist.map((s) => s.score),
      view: "Analytics" as const,
    },
  ];
  return (
    <div className="metrics">
      {cards.map(
        (
          { name, value, unit, icon: I, color, caption, graph, view },
          index,
        ) => (
          <button
            key={name}
            className={"metric " + color}
            onClick={() => go(view)}
          >
            <div className="metric-label">
              <span className={"metric-icon " + color}>
                <I size={17} />
              </span>
              {name}
            </div>
            <div className="metric-main">
              <b>{value}</b>
              {unit && <span>{unit}</span>}
            </div>
            <small>{caption}</small>
            <div className="spark" aria-hidden="true">
              {index === 1 || index === 2 ? (
                <div className="spark-bars">
                  {graph.map((n, i) => (
                    <i
                      key={i}
                      style={{
                        height:
                          12 +
                          (Math.max(0, n) / Math.max(...graph, 1)) * 83 +
                          "%",
                        opacity: 0.32 + i * 0.1,
                      }}
                    />
                  ))}
                </div>
              ) : (
                <Spark values={graph} id={color} />
              )}
            </div>
          </button>
        ),
      )}
    </div>
  );
}
function Spark({ values, id }: { values: number[]; id: string }) {
  const low = Math.min(...values),
    delta = Math.max(...values) - low || 1;
  const points = values.map((v, i) => [i * 12, 26 - ((v - low) / delta) * 18]);
  const d = points.reduce((path, p, i) => {
    if (!i) return "M" + p.join(",");
    const prev = points[i - 1],
      m = (prev[0] + p[0]) / 2;
    return (
      path + " C" + m + "," + prev[1] + " " + m + "," + p[1] + " " + p.join(",")
    );
  }, "");
  return (
    <svg viewBox="0 0 74 33">
      <defs>
        <linearGradient id={"spark" + id} x1="0" x2="0" y1="0" y2="1">
          <stop stopColor="currentColor" stopOpacity=".23" />
          <stop offset="1" stopColor="currentColor" stopOpacity=".01" />
        </linearGradient>
      </defs>
      <path d={d + " L72,33 L0,33 Z"} fill={"url(#spark" + id + ")"} />
      <path
        d={d}
        fill="none"
        stroke="currentColor"
        strokeWidth="2.3"
        strokeLinecap="round"
      />
    </svg>
  );
}
export function ActivityChart({ entries }: { entries: Entry[] }) {
  const [range, setRange] = useState("7");
  const data = Array.from({ length: +range }, (_, i) => {
    const date = shift(localDay(), i + 1 - Number(range));
    return {
      day: pretty(
        date,
        Number(range) === 7
          ? { weekday: "short" }
          : { month: "short", day: "numeric" },
      ),
      hours: Math.round((stats(entries, date).minutes / 60) * 100) / 100,
    };
  });
  return (
    <section className="panel activity">
      <SectionTitle
        icon={<Activity size={18} />}
        title="Study activity"
        extra={
          <select
            aria-label="Study activity range"
            className="small-select"
            value={range}
            onChange={(e) => setRange(e.target.value)}
          >
            <option value="7">Last 7 days</option>
            <option value="30">Last 30 days</option>
          </select>
        }
      />
      <div className="chart-summary">
        <b>{duration(data.reduce((n, d) => n + d.hours * 60, 0))}</b>
        <small>Total study time</small>
      </div>
      <ResponsiveContainer width="100%" height={160}>
        <AreaChart
          data={data}
          margin={{ left: -25, right: 10, top: 8, bottom: 0 }}
        >
          <defs>
            <linearGradient id="studyfill" x1="0" x2="0" y1="0" y2="1">
              <stop stopColor="#9778ef" stopOpacity=".38" />
              <stop offset="1" stopColor="#9778ef" stopOpacity=".02" />
            </linearGradient>
          </defs>
          <CartesianGrid
            stroke="var(--border)"
            strokeDasharray="3 4"
            vertical={false}
          />
          <XAxis
            dataKey="day"
            tick={{ fill: "var(--muted)", fontSize: 10 }}
            tickLine={false}
            axisLine={false}
            minTickGap={18}
          />
          <YAxis
            tick={{ fill: "var(--muted)", fontSize: 10 }}
            tickLine={false}
            axisLine={false}
            unit="h"
          />
          <Tooltip
            contentStyle={{
              background: "var(--panel)",
              border: "1px solid var(--border)",
              borderRadius: 9,
            }}
          />
          <Area
            type="monotone"
            dataKey="hours"
            name="Hours"
            stroke="#8862e4"
            strokeWidth={2.7}
            fill="url(#studyfill)"
          />
        </AreaChart>
      </ResponsiveContainer>
    </section>
  );
}
export function Dashboard({
  entries,
  actions,
  f,
  now,
}: {
  entries: Entry[];
  actions: Actions;
  f: Focus;
  now: Date;
}) {
  const { go, edit } = actions,
    day = localDay(now),
    profile = entries.find((e) => e.kind === "profile"),
    hour = now.getHours(),
    agenda = entries
      .filter(
        (e) =>
          e.date === day &&
          (([
            "event",
            "exam",
            "assignment",
            "notification",
            "task",
            "goal",
          ].includes(e.kind) &&
            e.time) ||
            ["event", "exam", "assignment", "notification"].includes(e.kind)),
      )
      .sort((a, b) => a.time.localeCompare(b.time));
  const deadlines = entries
    .filter(
      (e) =>
        ["exam", "assignment"].includes(e.kind) && e.status !== "Completed",
    )
    .sort((a, b) => a.date.localeCompare(b.date))
    .slice(0, 4);
  const s = stats(entries);
  const greeting =
    hour < 12 ? "Good morning" : hour < 17 ? "Good afternoon" : "Good evening";
  const habit = useStudy((x) => x.habit);
  return (
    <>
      <section className="hero">
        <div className="hero-art" aria-hidden="true">
          <img src="/study-desk.webp" alt="" />
        </div>
        <div className="hero-copy">
          <div className="hero-date">
            <CalendarDays size={14} />
            {pretty(day, { weekday: "long", month: "long", day: "numeric" })}
          </div>
          <h1>
            {greeting}, {profile?.title.split(" ")[0] || "Student"}{" "}
            <Sun className="greeting-sun" size={28} />
          </h1>
          <p>Small steps today, big progress tomorrow.</p>
          <div className="hero-actions">
            <Button
              onClick={() => {
                go("Focus timer");
                f.startFocus();
              }}
            >
              <Play size={14} fill="currentColor" />
              Start focus session
            </Button>
            <Button variant="secondary" onClick={() => edit("task")}>
              <Plus size={16} />
              Add task
            </Button>
          </div>
        </div>
      </section>
      <MetricCards entries={entries} go={go} />
      <div className="dashboard-grid">
        <section className="panel agenda">
          <SectionTitle
            title="Today’s agenda"
            icon={<CalendarDays size={18} />}
            extra={
              <LinkButton action={() => go("Calendar")}>
                View calendar
              </LinkButton>
            }
          />
          <div className="panel-sub">
            {agenda.length} scheduled {agenda.length === 1 ? "item" : "items"}
            <span className="dot-separator">·</span>
            {pretty(day, { weekday: "long" })}
          </div>
          <div className="agenda-list">
            {agenda.length ? (
              agenda.slice(0, 5).map((e) => (
                <button
                  key={e.id}
                  className="agenda-row"
                  onClick={() => edit(e.kind, e)}
                >
                  <span className="agenda-time">{clock(e.time)}</span>
                  <TypeIcon entry={e} />
                  <span className="grow">
                    <strong>{e.title}</strong>
                    <small>{e.subject || labels[e.kind]}</small>
                  </span>
                  <Tag color={tone(e)}>{e.subtype || labels[e.kind]}</Tag>
                </button>
              ))
            ) : (
              <Empty>Your schedule is clear for today.</Empty>
            )}
          </div>
          <button className="add-agenda" onClick={() => edit("event")}>
            <Plus size={15} />
            Add to agenda
          </button>
        </section>
        <FocusCard f={f} />
        <ActivityChart entries={entries} />
        <section className="panel deadlines">
          <SectionTitle
            icon={<CalendarClock size={18} />}
            title="Upcoming deadlines"
            extra={
              <button
                className="icon-button"
                aria-label="Open academic calendar"
                onClick={() => go("Calendar")}
              >
                <ArrowUpRight size={16} />
              </button>
            }
          />
          {deadlines.length ? (
            deadlines.map((e) => (
              <button
                className="deadline-row"
                key={e.id}
                onClick={() => edit(e.kind, e)}
              >
                <div className={"date-block " + tone(e)}>
                  <small>
                    {pretty(e.date, { month: "short" }).toUpperCase()}
                  </small>
                  <b>{pretty(e.date, { day: "numeric" })}</b>
                </div>
                <div className="grow">
                  <strong>{e.title}</strong>
                  <small>
                    {e.subject} ·{" "}
                    {daysUntil(e.date) < 0
                      ? "Overdue"
                      : daysUntil(e.date) === 0
                        ? "Due today"
                        : "In " + daysUntil(e.date) + " days"}
                  </small>
                </div>
              </button>
            ))
          ) : (
            <Empty>No upcoming deadlines.</Empty>
          )}
        </section>
        <section className="panel">
          <SectionTitle
            title="Daily habits"
            icon={<Flame size={18} />}
            extra={
              <LinkButton action={() => go("Habits")}>All habits</LinkButton>
            }
          />
          {s.habits.map((h) => {
            const done = s.logs.some((l) => l.parent === h.id);
            return (
              <button
                key={h.id}
                className="habit-line"
                onClick={() => habit(h)}
              >
                <span className={"check " + (done ? "checked" : "")}>
                  {done && <Check size={12} />}
                </span>
                <strong>{h.title}</strong>
                <small className="push">
                  {streak(
                    entries
                      .filter((e) => e.kind === "habitLog" && e.parent === h.id)
                      .map((e) => e.date),
                  )}{" "}
                  day streak
                </small>
              </button>
            );
          })}
          {!s.habits.length && <Empty>Create your first daily habit.</Empty>}
        </section>
      </div>
    </>
  );
}
