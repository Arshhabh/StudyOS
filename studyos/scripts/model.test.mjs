import { test } from "node:test";
import assert from "node:assert/strict";
import {
  stats,
  seed,
  localDay,
  shift,
  daysUntil,
  streak,
  duration,
} from "../lib/model.ts";
test("dashboard aggregates match their underlying records", () => {
  const rows = seed(),
    s = stats(rows);
  assert.equal(s.minutes, 130);
  assert.equal(s.done, 5);
  assert.equal(s.tasks.length, 8);
  assert.equal(s.streak, 7);
  assert.equal(s.score, 79);
  assert.equal(duration(s.minutes), "2h 10m");
  const missing = stats([], localDay());
  assert.equal(missing.score, 0);
  assert.equal(missing.streak, 0);
});
test("calendar arithmetic and streaks cross month and year boundaries", () => {
  assert.equal(shift("2024-02-28", 1), "2024-02-29");
  assert.equal(daysUntil("2027-01-01", "2026-12-31"), 1);
  assert.equal(streak(["2026-12-31", "2026-12-30"], "2027-01-01"), 2);
  assert.equal(streak(["2026-12-30"], "2027-01-01"), 0);
});
