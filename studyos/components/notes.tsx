"use client";
import { useState, useRef, useEffect } from "react";
import Markdown from "react-markdown";
import {
  Pin,
  Search,
  BookOpen,
  Trash2,
  Bold,
  Italic,
  Heading2,
  List,
  Plus,
  Check,
  FileText,
} from "lucide-react";
import { Entry, makeEntry, pretty } from "@/lib/model";
import { useStudy } from "@/lib/store";
import { Actions, Button, Modal, Empty } from "./ui";
function serialize(n: Node): string {
  if (n.nodeType === 3) return n.textContent || "";
  const s = Array.from(n.childNodes).map(serialize).join("");
  switch (n.nodeName) {
    case "B":
    case "STRONG":
      return "**" + s + "**";
    case "I":
    case "EM":
      return "*" + s + "*";
    case "H1":
      return "# " + s + "\n\n";
    case "H2":
      return "## " + s + "\n\n";
    case "H3":
      return "### " + s + "\n\n";
    case "LI":
      return "- " + s + "\n";
    case "P":
    case "DIV":
      return s + "\n\n";
    case "BR":
      return "\n";
    default:
      return s;
  }
}
export function Notes({
  entries,
  actions,
}: {
  entries: Entry[];
  actions: Actions;
}) {
  const [q, search] = useState(""),
    [subject, filter] = useState("All subjects"),
    [id, select] = useState(""),
    [mode, view] = useState("Rich text"),
    [confirm, ask] = useState(false);
  const notes = entries.filter((e) => e.kind === "note"),
    shown = notes
      .filter(
        (n) =>
          (subject === "All subjects" || n.subject === subject) &&
          (n.title + " " + n.body).toLowerCase().includes(q.toLowerCase()),
      )
      .sort(
        (a, b) =>
          Number(!!b.pinned) - Number(!!a.pinned) ||
          b.updated.localeCompare(a.updated),
      ),
    e = shown.find((n) => n.id === id) || shown[0],
    { save, remove } = useStudy();
  return (
    <div className="notes-layout">
      <aside className="panel note-browser">
        <div className="search-field">
          <Search size={15} />
          <input
            placeholder="Search notes…"
            value={q}
            onChange={(x) => search(x.target.value)}
          />
        </div>
        <select
          aria-label="Subject folder"
          value={subject}
          onChange={(x) => filter(x.target.value)}
        >
          {[
            "All subjects",
            ...new Set(notes.map((n) => n.subject).filter(Boolean)),
          ].map((s) => (
            <option key={s}>{s}</option>
          ))}
        </select>
        {shown.map((n) => (
          <button
            key={n.id}
            className={"note-choice " + (n.id === e?.id ? "active" : "")}
            onClick={() => select(n.id)}
          >
            <strong>
              {n.pinned && <Pin size={12} />} {n.title || "Untitled note"}
            </strong>
            <small>{n.subject || "Quick notes"}</small>
          </button>
        ))}
      </aside>
      {e ? (
        <section className="panel note-editor">
          <div className="note-meta">
            <span>
              <Check size={13} />
              Saved on device
            </span>
            <button
              className={"icon-button " + (e.pinned ? "enabled" : "")}
              aria-label="Pin note"
              onClick={() => save({ ...e, pinned: !e.pinned })}
            >
              <Pin size={15} />
            </button>
            <button
              className="icon-button"
              aria-label="Delete note"
              onClick={() => ask(true)}
            >
              <Trash2 size={15} />
            </button>
          </div>
          <input
            aria-label="Note title"
            className="note-title"
            value={e.title}
            onChange={(x) => save({ ...e, title: x.target.value })}
          />
          <label className="inline">
            Folder
            <input
              aria-label="Note subject folder"
              value={e.subject}
              onChange={(x) => save({ ...e, subject: x.target.value })}
              placeholder="Quick notes"
            />
          </label>
          <div className="segmented">
            {["Rich text", "Markdown", "Preview"].map((s) => (
              <button
                key={s}
                className={mode === s ? "selected" : ""}
                onClick={() => view(s)}
              >
                {s}
              </button>
            ))}
          </div>
          {mode === "Markdown" ? (
            <textarea
              className="markdown-input"
              aria-label="Markdown content"
              value={e.body}
              onChange={(x) => save({ ...e, body: x.target.value })}
            />
          ) : mode === "Preview" ? (
            <div className="markdown">
              <Markdown>{e.body}</Markdown>
            </div>
          ) : (
            <RichNote key={e.id} e={e} />
          )}
          {confirm && (
            <Modal title="Delete this note?" onClose={() => ask(false)}>
              <p>{e.title}</p>
              <div className="form-actions">
                <Button variant="secondary" onClick={() => ask(false)}>
                  Cancel
                </Button>
                <Button
                  onClick={() => {
                    remove(e.id);
                    ask(false);
                  }}
                >
                  Delete note
                </Button>
              </div>
            </Modal>
          )}
        </section>
      ) : (
        <div className="panel">
          <Empty>No matching notes.</Empty>
          <Button onClick={() => actions.edit("note")}>Create note</Button>
        </div>
      )}
    </div>
  );
}
function RichNote({ e }: { e: Entry }) {
  const editor = useRef<HTMLDivElement>(null);
  const [initial] = useState(e.body);
  function sync() {
    if (editor.current) {
      const row = useStudy.getState().entries.find((x) => x.id === e.id);
      if (row)
        useStudy
          .getState()
          .save({ ...row, body: serialize(editor.current).trimEnd() });
    }
  }
  const controls = [
    { icon: Bold, title: "Bold", cmd: "bold" },
    { icon: Italic, title: "Italic", cmd: "italic" },
    { icon: Heading2, title: "Heading", cmd: "formatBlock", arg: "h2" },
    { icon: List, title: "Bullet list", cmd: "insertUnorderedList" },
  ];
  return (
    <>
      <div className="rich-tools">
        {controls.map(({ icon: I, title, cmd, arg }) => (
          <button
            key={cmd}
            className="icon-button"
            title={title}
            aria-label={title}
            onMouseDown={(evt) => {
              evt.preventDefault();
              editor.current?.focus();
              document.execCommand(cmd, false, arg);
              sync();
            }}
          >
            <I size={16} />
          </button>
        ))}
      </div>
      <div
        ref={editor}
        role="textbox"
        aria-label="Rich text note"
        contentEditable
        suppressContentEditableWarning
        className="markdown editable"
        onPaste={(evt) => {
          evt.preventDefault();
          document.execCommand(
            "insertText",
            false,
            evt.clipboardData.getData("text/plain"),
          );
        }}
        onInput={sync}
      >
        <Markdown>{initial}</Markdown>
      </div>
    </>
  );
}
