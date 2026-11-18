import assert from "node:assert/strict";
import { readFile } from "node:fs/promises";
import { test } from "node:test";
import { PGlite } from "@electric-sql/pglite";
test("migration, owner isolation, atomic writes, idempotent retries and AI quota", async () => {
  const db = new PGlite();
  try {
    await db.exec(`create schema auth;create schema storage;create role anon;create role authenticated;
 create table auth.users(id uuid primary key);
 create function auth.uid() returns uuid language sql stable as $$ select nullif(current_setting('request.jwt.claim.sub',true),'')::uuid $$;
 create table storage.buckets(id text primary key,name text,public boolean,file_size_limit bigint);
 create table storage.objects(bucket_id text,name text);alter table storage.objects enable row level security;
 create function storage.foldername(text) returns text[] language sql as $$ select string_to_array($1,'/') $$;
 grant usage on schema auth,public,storage to authenticated;`);
    for (const name of [
      "001_studyos.sql",
      "002_access_and_assistant.sql",
      "003_incremental_sync.sql",
    ])
      await db.exec(
        await readFile(
          new URL("../supabase/migrations/" + name, import.meta.url),
          "utf8",
        ),
      );
    const alice = crypto.randomUUID(),
      bob = crypto.randomUUID();
    await db.query("insert into auth.users values($1),($2)", [alice, bob]);
    await db.exec("set role authenticated");
    const sign = (id) =>
      db.query("select set_config('request.jwt.claim.sub',$1,false)", [id]);
    const write = async (...rows) =>
      (
        await db.query("select public.save_study_records($1::jsonb) as value", [
          JSON.stringify(rows),
        ])
      ).rows.map((r) => r.value);
    await sign(alice);
    const task = {
      id: crypto.randomUUID(),
      kind: "task",
      title: "Read notes",
      version: 0,
      date: "2026-11-18",
      status: "Pending",
      subject: "Physics",
      time: "",
      body: "",
      updated: new Date().toISOString(),
    };
    const [stored] = await write(task);
    const feed = async (cursor = "0") =>
      (await db.query("select * from public.read_study_changes($1)", [cursor]))
        .rows;
    const firstPage = await feed();
    assert.equal(firstPage.length, 1);
    assert.equal((await feed(firstPage[0].cursor_value)).length, 0);
    assert.equal(stored.version, 1);
    assert.equal((await write(task))[0].version, 1);
    const [edited] = await write({ ...stored, title: "Read chapter 2" });
    assert.equal(edited.version, 2);
    const extra = { ...task, id: crypto.randomUUID() };
    await assert.rejects(
      write(extra, { ...stored, title: "Stale copy" }),
      /another device/,
    );
    assert.equal((await db.query("select * from public.tasks")).rows.length, 1);
    await assert.rejects(
      db.query("update public.tasks set version=999"),
      /permission denied/,
    );
    await sign(bob);
    assert.equal((await feed()).length, 0);
    assert.equal((await db.query("select * from public.tasks")).rows.length, 0);
    await assert.rejects(
      write({ ...edited, title: "Foreign row" }),
      /another device/,
    );
    for (let i = 0; i < 30; i++)
      assert.equal(
        (await db.query("select public.reserve_assistant_request() as allowed"))
          .rows[0].allowed,
        true,
      );
    assert.equal(
      (await db.query("select public.reserve_assistant_request() as allowed"))
        .rows[0].allowed,
      false,
    );
    await sign(alice);
    assert.equal(
      (await db.query("select public.reserve_assistant_request() as allowed"))
        .rows[0].allowed,
      true,
    );
  } finally {
    await db.close();
  }
});
