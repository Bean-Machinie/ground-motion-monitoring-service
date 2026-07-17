// Live search combobox over the signed-in customer's projects and results.
// Keyboard: arrows move the highlight, Enter opens the highlighted (or only)
// match, Escape clears the text or closes the panel.
import {
  useEffect,
  useRef,
  useState,
  type KeyboardEvent as ReactKeyboardEvent,
} from "react";
import { Link, useNavigate } from "react-router-dom";
import { supabase } from "@/lib/supabase";
import { useAuth } from "@/hooks/useAuth";
import { formatDate } from "@/lib/dates";
import { PROJECT_STATUS_LABELS } from "@/types/project";
import { RESULT_TYPE_LABELS } from "@/types/result";
import styles from "./GlobalSearch.module.css";

interface SearchEntry {
  key: string;
  kind: "project" | "result";
  title: string;
  category: string;
  meta: string;
  to: string;
}

export function GlobalSearch() {
  const { user } = useAuth();
  const navigate = useNavigate();

  const [query, setQuery] = useState("");
  const [open, setOpen] = useState(false);
  const [entries, setEntries] = useState<SearchEntry[]>([]);
  const [loading, setLoading] = useState(false);
  const [highlightIndex, setHighlightIndex] = useState(-1);

  const rootRef = useRef<HTMLDivElement | null>(null);
  const inputRef = useRef<HTMLInputElement | null>(null);

  const term = query.trim();
  const panelVisible = open && term.length > 0;

  // Debounced live search against Supabase (RLS scopes rows to the user).
  useEffect(() => {
    if (!user || term === "") {
      setEntries([]);
      setLoading(false);
      return;
    }
    let cancelled = false;
    setLoading(true);
    const timer = window.setTimeout(() => {
      void (async () => {
        try {
          const safe = term.replace(/[,%().]/g, " ").trim();
          if (safe === "") {
            if (!cancelled) setEntries([]);
            return;
          }
          const like = `%${safe}%`;
          const [projectsRes, resultsRes] = await Promise.all([
            supabase
              .from("projects")
              .select("*")
              .or(
                `name.ilike.${like},location_label.ilike.${like},monitoring_type.ilike.${like}`,
              )
              .limit(5),
            supabase
              .from("results")
              .select("*")
              .or(`title.ilike.${like},summary.ilike.${like}`)
              .limit(5),
          ]);
          const projects = projectsRes.data ?? [];
          const results = resultsRes.data ?? [];

          // Map result project_ids to slugs for navigation.
          const missingIds = [
            ...new Set(results.map((r) => r.project_id)),
          ].filter((id) => !projects.some((p) => p.id === id));
          let slugById = new Map(projects.map((p) => [p.id, p.slug]));
          if (missingIds.length > 0) {
            const { data: extra } = await supabase
              .from("projects")
              .select("*")
              .in("id", missingIds);
            for (const p of extra ?? []) slugById.set(p.id, p.slug);
          }

          const next: SearchEntry[] = [
            ...projects.map((p): SearchEntry => ({
              key: `project-${p.id}`,
              kind: "project",
              title: p.name,
              category: p.monitoring_type ?? "Project",
              meta: PROJECT_STATUS_LABELS[p.status],
              to: `/portal/projects/${p.slug}`,
            })),
            ...results.flatMap((r): SearchEntry[] => {
              const slug = slugById.get(r.project_id);
              if (!slug) return [];
              return [
                {
                  key: `result-${r.id}`,
                  kind: "result",
                  title: r.title,
                  category: RESULT_TYPE_LABELS[r.result_type],
                  meta: formatDate(r.published_at),
                  to: `/portal/projects/${slug}`,
                },
              ];
            }),
          ];
          if (!cancelled) {
            setEntries(next);
            setHighlightIndex(-1);
          }
        } finally {
          if (!cancelled) setLoading(false);
        }
      })();
    }, 200);
    return () => {
      cancelled = true;
      window.clearTimeout(timer);
    };
  }, [term, user]);

  // Clicking outside dismisses the panel.
  useEffect(() => {
    if (!panelVisible) return;
    const onMouseDown = (event: MouseEvent) => {
      const root = rootRef.current;
      if (root && event.target instanceof Node && !root.contains(event.target)) {
        setOpen(false);
      }
    };
    document.addEventListener("mousedown", onMouseDown);
    return () => document.removeEventListener("mousedown", onMouseDown);
  }, [panelVisible]);

  function goTo(entry: SearchEntry) {
    setOpen(false);
    setHighlightIndex(-1);
    navigate(entry.to);
  }

  function handleKeyDown(event: ReactKeyboardEvent<HTMLInputElement>) {
    if (event.key === "ArrowDown" && entries.length > 0) {
      event.preventDefault();
      setOpen(true);
      setHighlightIndex((i) => (i + 1) % entries.length);
    } else if (event.key === "ArrowUp" && entries.length > 0) {
      event.preventDefault();
      setHighlightIndex((i) => (i <= 0 ? entries.length - 1 : i - 1));
    } else if (event.key === "Enter") {
      const target =
        entries[highlightIndex] ?? (entries.length === 1 ? entries[0] : undefined);
      if (target) {
        event.preventDefault();
        goTo(target);
      }
    } else if (event.key === "Escape") {
      if (query !== "") {
        setQuery("");
        setHighlightIndex(-1);
      } else {
        setOpen(false);
      }
    }
  }

  function clear() {
    setQuery("");
    setHighlightIndex(-1);
    inputRef.current?.focus();
  }

  return (
    <div className={styles.root} ref={rootRef}>
      <div className={styles.inputWrap}>
        <span className={styles.searchIcon} aria-hidden="true">
          <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2">
            <circle cx="10.5" cy="10.5" r="6.5" />
            <line x1="15.5" y1="15.5" x2="21" y2="21" />
          </svg>
        </span>
        <input
          ref={inputRef}
          className={styles.input}
          type="text"
          role="combobox"
          aria-label="Search projects and results"
          aria-autocomplete="list"
          aria-expanded={panelVisible}
          aria-controls="global-search-listbox"
          aria-activedescendant={
            highlightIndex >= 0 ? `global-search-option-${highlightIndex}` : undefined
          }
          placeholder="Search projects…"
          value={query}
          onChange={(e) => {
            setQuery(e.target.value);
            setOpen(true);
          }}
          onFocus={() => setOpen(true)}
          onKeyDown={handleKeyDown}
        />
        {query !== "" ? (
          <button
            type="button"
            className={styles.clearButton}
            aria-label="Clear search"
            onClick={clear}
          >
            ×
          </button>
        ) : null}
      </div>

      {panelVisible ? (
        <div className={styles.panel}>
          {!user ? (
            <div className={styles.message}>
              <p className={styles.messageText}>
                Sign in to search your projects and results.
              </p>
              <Link to="/sign-in" onClick={() => setOpen(false)}>
                Sign in
              </Link>
            </div>
          ) : (
            <>
              <ul
                id="global-search-listbox"
                role="listbox"
                aria-label="Search results"
                className={styles.list}
              >
                {loading && entries.length === 0 ? (
                  <li className={styles.stateRow}>Searching…</li>
                ) : null}
                {!loading && entries.length === 0 ? (
                  <li className={styles.stateRow}>No matches found.</li>
                ) : null}
                {entries.map((entry, index) => (
                  <li
                    key={entry.key}
                    id={`global-search-option-${index}`}
                    role="option"
                    aria-selected={index === highlightIndex}
                    className={`${styles.option} ${
                      index === highlightIndex ? styles.optionActive : ""
                    }`}
                    onMouseEnter={() => setHighlightIndex(index)}
                    onMouseDown={(e) => e.preventDefault()}
                    onClick={() => goTo(entry)}
                  >
                    <span
                      className={`${styles.thumb} ${
                        entry.kind === "result" ? styles.thumbResult : ""
                      }`}
                      aria-hidden="true"
                    >
                      {entry.kind === "project" ? "P" : "R"}
                    </span>
                    <span className={styles.optionBody}>
                      <span className={styles.optionTitle}>{entry.title}</span>
                      <span className={styles.optionCategory}>
                        {entry.category}
                      </span>
                    </span>
                    <span className={styles.optionMeta}>{entry.meta}</span>
                  </li>
                ))}
              </ul>
              <button
                type="button"
                className={styles.footerButton}
                onClick={() => {
                  setOpen(false);
                  navigate("/portal/projects");
                }}
              >
                See all projects
              </button>
            </>
          )}
        </div>
      ) : null}
    </div>
  );
}
