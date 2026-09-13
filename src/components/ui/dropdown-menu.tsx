"use client";

import { useEffect, useRef, useState } from "react";
import { createPortal } from "react-dom";
import { cn } from "@/lib/utils";

type MenuPos = {
  top?: number;
  bottom?: number;
  left?: number;
  right?: number;
};

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
  const [pos, setPos] = useState<MenuPos | null>(null);
  const triggerRef = useRef<HTMLDivElement>(null);
  const menuRef = useRef<HTMLDivElement>(null);

  // The menu renders in a portal with fixed positioning: rows live inside
  // the table's overflow container, which would otherwise clip the menu
  // (e.g. a one-row table showed no options at all).
  function toggle() {
    if (open) {
      setOpen(false);
      return;
    }
    const r = triggerRef.current?.getBoundingClientRect();
    if (!r) return;
    const horizontal =
      align === "end"
        ? { right: window.innerWidth - r.right }
        : { left: r.left };
    // Flip upwards when the trigger sits near the bottom of the viewport.
    const vertical =
      r.bottom + 160 > window.innerHeight
        ? { bottom: window.innerHeight - r.top + 6 }
        : { top: r.bottom + 6 };
    setPos({ ...horizontal, ...vertical });
    setOpen(true);
  }

  useEffect(() => {
    if (!open) return;
    const onClick = (e: MouseEvent) => {
      const t = e.target as Node;
      if (!triggerRef.current?.contains(t) && !menuRef.current?.contains(t)) {
        setOpen(false);
      }
    };
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") setOpen(false);
    };
    const onScrollOrResize = () => setOpen(false);
    document.addEventListener("mousedown", onClick);
    document.addEventListener("keydown", onKey);
    window.addEventListener("scroll", onScrollOrResize, true);
    window.addEventListener("resize", onScrollOrResize);
    return () => {
      document.removeEventListener("mousedown", onClick);
      document.removeEventListener("keydown", onKey);
      window.removeEventListener("scroll", onScrollOrResize, true);
      window.removeEventListener("resize", onScrollOrResize);
    };
  }, [open]);

  return (
    <div ref={triggerRef} className="inline-block">
      <div onClick={toggle}>{trigger}</div>
      {open &&
        pos &&
        createPortal(
          <div
            ref={menuRef}
            style={{ position: "fixed", ...pos }}
            className={cn(
              "z-50 min-w-[10rem] rounded-md border bg-card shadow-md p-1",
            )}
            onClick={() => setOpen(false)}
            role="menu"
          >
            {children}
          </div>,
          document.body,
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
