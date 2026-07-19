// Custom select styled after the site's dropdown menus: springy pop
// panel, amber hover highlight, and a rotating chevron — no native
// browser widgets.
import {
  useEffect,
  useId,
  useRef,
  useState,
  type KeyboardEvent as ReactKeyboardEvent,
} from "react";
import styles from "./Select.module.css";

export interface SelectOption {
  value: string;
  label: string;
}

interface SelectProps {
  label: string;
  value: string;
  options: SelectOption[];
  onChange: (value: string) => void;
}

export function Select({ label, value, options, onChange }: SelectProps) {
  const [open, setOpen] = useState(false);
  const rootRef = useRef<HTMLDivElement | null>(null);
  const triggerRef = useRef<HTMLButtonElement | null>(null);
  const listId = useId();

  const current = options.find((o) => o.value === value) ?? options[0];

  // Close on outside pointer-down (same pattern as the nav menus).
  useEffect(() => {
    if (!open) return;
    const onPointerDown = (event: PointerEvent) => {
      const root = rootRef.current;
      if (root && event.target instanceof Node && !root.contains(event.target)) {
        setOpen(false);
      }
    };
    document.addEventListener("pointerdown", onPointerDown);
    return () => document.removeEventListener("pointerdown", onPointerDown);
  }, [open]);

  function select(option: SelectOption) {
    onChange(option.value);
    setOpen(false);
    triggerRef.current?.focus();
  }

  function handleTriggerKeyDown(event: ReactKeyboardEvent<HTMLButtonElement>) {
    if (event.key === "ArrowDown" || event.key === "ArrowUp") {
      event.preventDefault();
      setOpen(true);
    } else if (event.key === "Escape") {
      setOpen(false);
    }
  }

  function handleListKeyDown(event: ReactKeyboardEvent<HTMLUListElement>) {
    if (event.key === "Escape") {
      event.stopPropagation();
      setOpen(false);
      triggerRef.current?.focus();
    }
  }

  return (
    <div className={styles.root} ref={rootRef}>
      <span className={styles.label}>{label}</span>
      <button
        type="button"
        className={`${styles.trigger}${open ? ` ${styles.triggerOpen}` : ""}`}
        aria-haspopup="listbox"
        aria-expanded={open}
        aria-controls={listId}
        ref={triggerRef}
        onClick={() => setOpen((o) => !o)}
        onKeyDown={handleTriggerKeyDown}
      >
        <span className={styles.triggerValue}>{current?.label}</span>
        <span
          className={`${styles.chevron}${open ? ` ${styles.chevronOpen}` : ""}`}
          aria-hidden="true"
        />
      </button>

      {open ? (
        <ul
          className={styles.menu}
          role="listbox"
          id={listId}
          aria-label={label}
          onKeyDown={handleListKeyDown}
        >
          {options.map((option) => {
            const selected = option.value === value;
            return (
              <li key={option.value}>
                <button
                  type="button"
                  role="option"
                  aria-selected={selected}
                  className={`${styles.option}${
                    selected ? ` ${styles.optionSelected}` : ""
                  }`}
                  onClick={() => select(option)}
                >
                  <span className={styles.optionDot} aria-hidden="true" />
                  {option.label}
                </button>
              </li>
            );
          })}
        </ul>
      ) : null}
    </div>
  );
}
