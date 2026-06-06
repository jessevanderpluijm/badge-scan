"use client";

import { useEffect, useRef, useState } from "react";
import { cn } from "@/lib/utils";

export function DropdownMenu({
  trigger,
  children,
  align = "end",
}: {
  trigger: React.ReactNode;
  children: React.ReactNode;
  align?: "start" | "end";
}) {
  const [open, setOpen] = useState(false);
  const ref = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!open) return;
    const onClick = (e: MouseEvent) => {
      if (!ref.current?.contains(e.target as Node)) setOpen(false);
    };
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") setOpen(false);
    };
    document.addEventListener("mousedown", onClick);
    document.addEventListener("keydown", onKey);
    return () => {
      document.removeEventListener("mousedown", onClick);
      document.removeEventListener("keydown", onKey);
    };
  }, [open]);

  return (
    <div ref={ref} className="relative inline-block">
      <div onClick={() => setOpen((o) => !o)}>{trigger}</div>
      {open && (
        <div
          className={cn(
            "absolute mt-1.5 z-40 min-w-[10rem] rounded-md border bg-card shadow-md p-1",
            align === "end" ? "right-0" : "left-0",
          )}
          onClick={() => setOpen(false)}
          role="menu"
        >
          {children}
        </div>
      )}
    </div>
  );
}

export function DropdownMenuItem({
  children,
  onClick,
  destructive,
  className,
}: {
  children: React.ReactNode;
  onClick: () => void;
  destructive?: boolean;
  className?: string;
}) {
  return (
    <button
      type="button"
      role="menuitem"
      onClick={onClick}
      className={cn(
        "w-full text-left px-2.5 py-1.5 text-sm rounded-md hover:bg-accent flex items-center gap-2 transition-colors",
        destructive && "text-destructive hover:bg-destructive/10",
        className,
      )}
    >
      {children}
    </button>
  );
}

export function DropdownMenuSeparator() {
  return <div className="my-1 h-px bg-border" />;
}
