"use client";
import * as Dialog from "@radix-ui/react-dialog";
export { Button } from "./ui/button";
import {
  X,
  BookOpen,
  ClipboardList,
  CalendarDays,
  GraduationCap,
  CheckSquare,
  Timer,
  Target,
  Flame,
  FileText,
  Clock3,
  Bell,
  Check,
  ChevronRight,
} from "lucide-react";
import type { ButtonHTMLAttributes, ReactNode } from "react";
import { Entry, Kind, View, tone } from "@/lib/model";

export function Modal({
  title,
  children,
  onClose,
  wide = false,
}: {
  title: string;
  children: ReactNode;
  onClose: () => void;
  wide?: boolean;
}) {
  return (
    <Dialog.Root
      open
      onOpenChange={(open) => {
        if (!open) onClose();
      }}
    >
      <Dialog.Portal>
        <Dialog.Overlay className="overlay" />
        <Dialog.Content
          aria-describedby={undefined}
          className={"dialog " + (wide ? "wide" : "")}
        >
          <div className="dialog-heading">
            <Dialog.Title>{title}</Dialog.Title>
            <Dialog.Close className="icon-button" aria-label="Close dialog">
              <X size={18} />
            </Dialog.Close>
          </div>
          {children}
        </Dialog.Content>
      </Dialog.Portal>
    </Dialog.Root>
  );
}
const icons = {
  task: CheckSquare,
  event: CalendarDays,
  assignment: ClipboardList,
  exam: GraduationCap,
  session: BookOpen,
  pomodoro: Timer,
  habit: Flame,
  habitLog: Check,
  note: FileText,
  goal: Target,
  notification: Bell,
  profile: BookOpen,
  subject: BookOpen,
  attendance: Clock3,
};
export function TypeIcon({ entry }: { entry: Entry }) {
  const I = icons[entry.kind];
  return (
    <span className={"type-icon " + tone(entry)}>
      <I size={19} />
    </span>
  );
}
export function Tag({
  children,
  color = "violet",
}: {
  children: ReactNode;
  color?: string;
}) {
  return <span className={"tag " + color}>{children}</span>;
}
export function SectionTitle({
  icon,
  title,
  extra,
}: {
  icon?: ReactNode;
  title: string;
  extra?: ReactNode;
}) {
  return (
    <div className="section-title">
      <h2>
        {icon}
        {title}
      </h2>
      {extra}
    </div>
  );
}
export function LinkButton({
  children,
  action,
}: {
  children: ReactNode;
  action: () => void;
}) {
  return (
    <button className="text-link" onClick={action}>
      {children}
      <ChevronRight size={14} />
    </button>
  );
}
export function Empty({ children }: { children: ReactNode }) {
  return (
    <div className="empty">
      <BookOpen size={23} />
      <p>{children}</p>
    </div>
  );
}
export type Actions = {
  go: (v: View) => void;
  edit: (kind: Kind, entry?: Entry, defaults?: Partial<Entry>) => void;
  notify: (m: string) => void;
};
