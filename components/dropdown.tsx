"use client";

import { AnimatePresence, motion, useReducedMotion } from "motion/react";
import { useEffect, useId, useLayoutEffect, useRef, useState, useSyncExternalStore, type KeyboardEvent } from "react";
import { createPortal } from "react-dom";
import { normalizeDigits } from "@/lib/format";
import { CheckIcon, ChevronDownIcon } from "./icons";

export type DropdownOption = { value: string; label: string };

type DropdownProps = {
  id?: string;
  /** Short visible label rendered inside the field, e.g. «از». */
  label: string;
  /** Full accessible name, e.g. «سال ساخت از». */
  name: string;
  value: string;
  options: DropdownOption[];
  onChange: (value: string) => void;
  invalid?: boolean;
};

const GAP = 6;
const EDGE = 8;
const MAX_HEIGHT = 288;
const MIN_WIDTH = 144;
const MIN_SPACE_BELOW = 180;
const PAGE = 5;
const TYPEAHEAD_RESET_MS = 600;

const noopSubscribe = () => () => {};

/**
 * Select-only combobox. Focus stays on the trigger and options are tracked with aria-activedescendant,
 * so it works inside focus-trapped sheets. The list is portaled and fixed-positioned so clipping
 * (sidebar overflow, transformed sheets) cannot cut it off; it flips above the field when space below is short.
 */
export function Dropdown({ id, label, name, value, options, onChange, invalid }: DropdownProps) {
  const reduce = useReducedMotion();
  const mounted = useSyncExternalStore(noopSubscribe, () => true, () => false);
  const autoId = useId();
  const baseId = id ?? autoId;
  const listId = `${baseId}-list`;
  const nameId = `${baseId}-name`;
  const optionId = (i: number) => `${baseId}-opt-${i}`;

  const triggerRef = useRef<HTMLButtonElement>(null);
  const listRef = useRef<HTMLUListElement>(null);
  const typeahead = useRef({ buffer: "", at: 0 });
  const [open, setOpen] = useState(false);
  const [active, setActive] = useState(-1);

  const selectedIndex = options.findIndex((o) => o.value === value);
  const selected = options[selectedIndex];

  const show = () => {
    setActive(Math.max(selectedIndex, 0));
    setOpen(true);
    triggerRef.current?.focus();
  };
  const hide = () => setOpen(false);
  const commit = (i: number) => {
    const option = options[i];
    if (option && option.value !== value) onChange(option.value);
    hide();
  };
  const move = (delta: number) => setActive((i) => Math.min(options.length - 1, Math.max(0, (i < 0 ? selectedIndex : i) + delta)));

  useLayoutEffect(() => {
    if (!open) return;
    const place = () => {
      const trigger = triggerRef.current;
      const list = listRef.current;
      if (!trigger || !list) return;
      const r = trigger.getBoundingClientRect();
      const vw = document.documentElement.clientWidth;
      const vh = window.visualViewport?.height ?? window.innerHeight;
      const below = vh - r.bottom - GAP - EDGE;
      const above = r.top - GAP - EDGE;
      const up = below < MIN_SPACE_BELOW && above > below;
      const width = Math.min(Math.max(r.width, MIN_WIDTH), vw - EDGE * 2);
      const right = Math.min(Math.max(vw - r.right, EDGE), vw - EDGE - width);
      Object.assign(list.style, {
        width: `${width}px`,
        right: `${right}px`,
        maxHeight: `${Math.max(Math.min(MAX_HEIGHT, up ? above : below), 120)}px`,
        top: up ? "" : `${r.bottom + GAP}px`,
        bottom: up ? `${window.innerHeight - r.top + GAP}px` : "",
        transformOrigin: up ? "bottom" : "top",
      });
    };
    const onPointerDown = (e: PointerEvent) => {
      const target = e.target as Node;
      if (!triggerRef.current?.contains(target) && !listRef.current?.contains(target)) setOpen(false);
    };
    place();
    document.addEventListener("pointerdown", onPointerDown);
    window.addEventListener("resize", place);
    window.addEventListener("scroll", place, { capture: true, passive: true });
    window.visualViewport?.addEventListener("resize", place);
    return () => {
      document.removeEventListener("pointerdown", onPointerDown);
      window.removeEventListener("resize", place);
      window.removeEventListener("scroll", place, { capture: true });
      window.visualViewport?.removeEventListener("resize", place);
    };
  }, [open]);

  useEffect(() => {
    if (open && active >= 0) document.getElementById(optionId(active))?.scrollIntoView({ block: "nearest" });
    // optionId is derived from baseId, which is stable.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [open, active]);

  const onKeyDown = (e: KeyboardEvent<HTMLButtonElement>) => {
    switch (e.key) {
      case "ArrowDown":
      case "ArrowUp":
        e.preventDefault();
        if (!open) show();
        else move(e.key === "ArrowDown" ? 1 : -1);
        return;
      case "PageDown":
      case "PageUp":
        if (!open) return;
        e.preventDefault();
        move(e.key === "PageDown" ? PAGE : -PAGE);
        return;
      case "Home":
      case "End":
        if (!open) return;
        e.preventDefault();
        setActive(e.key === "Home" ? 0 : options.length - 1);
        return;
      case "Enter":
      case " ":
        e.preventDefault();
        if (!open) show();
        else commit(active);
        return;
      case "Escape":
        if (!open) return;
        e.preventDefault();
        hide();
        return;
      case "Tab":
        if (open) hide();
        return;
    }
    if (e.key.length !== 1 || e.ctrlKey || e.metaKey || e.altKey) return;
    const now = Date.now();
    const t = typeahead.current;
    t.buffer = now - t.at > TYPEAHEAD_RESET_MS ? e.key : t.buffer + e.key;
    t.at = now;
    const needle = normalizeDigits(t.buffer);
    const match = options.findIndex((o) => normalizeDigits(o.label).includes(needle));
    if (match < 0) return;
    if (open) setActive(match);
    else commit(match);
  };

  return (
    <div className="relative">
      <span id={nameId} className="sr-only">
        {name}
      </span>
      <span aria-hidden="true" className="pointer-events-none absolute start-4 top-1/2 -translate-y-1/2 text-muted">
        {label}
      </span>
      <button
        ref={triggerRef}
        id={baseId}
        type="button"
        role="combobox"
        aria-haspopup="listbox"
        aria-expanded={open}
        aria-controls={listId}
        aria-labelledby={nameId}
        aria-activedescendant={open && active >= 0 ? optionId(active) : undefined}
        aria-invalid={invalid || undefined}
        className={`field flex h-14 items-center gap-2 ps-12 text-start ${open ? "border-green" : ""}`}
        onClick={() => (open ? hide() : show())}
        onKeyDown={onKeyDown}
        onBlur={hide}
      >
        <span className="min-w-0 flex-1 truncate">{selected?.label ?? ""}</span>
        <ChevronDownIcon size={18} className={`shrink-0 text-muted transition-transform duration-150 ${open ? "rotate-180" : ""}`} />
      </button>

      {mounted &&
        createPortal(
          <AnimatePresence>
            {open && (
              <motion.ul
                ref={listRef}
                id={listId}
                role="listbox"
                aria-labelledby={nameId}
                tabIndex={-1}
                className="fixed z-[60] flex flex-col gap-0.5 overflow-y-auto overscroll-contain rounded-button border border-border bg-surface p-1.5 shadow-xl shadow-ink/10"
                initial={reduce ? { opacity: 0 } : { opacity: 0, scaleY: 0.96 }}
                animate={reduce ? { opacity: 1 } : { opacity: 1, scaleY: 1 }}
                exit={{ opacity: 0, transition: { duration: reduce ? 0 : 0.1 } }}
                transition={{ duration: reduce ? 0 : 0.14, ease: [0.22, 1, 0.36, 1] }}
              >
                {options.map((o, i) => {
                  const isSelected = i === selectedIndex;
                  return (
                    <li
                      key={o.value || "__empty"}
                      id={optionId(i)}
                      role="option"
                      aria-selected={isSelected}
                      className={`tap flex cursor-pointer select-none items-center justify-between gap-3 rounded-[0.625rem] px-3 ${
                        i === active ? "bg-chip" : ""
                      } ${isSelected ? "font-bold" : ""}`}
                      onMouseDown={(e) => e.preventDefault()}
                      onMouseMove={() => i !== active && setActive(i)}
                      onClick={() => commit(i)}
                    >
                      {o.label}
                      {isSelected && <CheckIcon size={16} strokeWidth={2.5} className="shrink-0 text-green" />}
                    </li>
                  );
                })}
              </motion.ul>
            )}
          </AnimatePresence>,
          document.body,
        )}
    </div>
  );
}
