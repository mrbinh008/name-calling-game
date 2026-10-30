import { useEffect, useRef } from "react";

interface MangoCanopyProps {
  roster: readonly string[];
  absent: readonly string[];
  called: readonly string[];
  selectedNames: readonly string[];
}

export default function MangoCanopy({
  roster,
  absent,
  called,
  selectedNames,
}: MangoCanopyProps) {
  const listRef = useRef<HTMLUListElement>(null);
  const selectedName = selectedNames[0];
  useEffect(() => {
    if (!selectedName) return;
    listRef.current
      ?.querySelector(".is-selected")
      ?.scrollIntoView?.({ block: "nearest", inline: "nearest" });
  }, [selectedName]);
  return (
    <section
      className={`mango-canopy ${roster.length > 36 ? "is-dense" : ""}`}
      aria-label="Cây xoài của lớp"
    >
      <p className="mango-canopy-hint">
        Mỗi quả xoài là một học sinh <span>· {roster.length} quả trên cây</span>
      </p>
      <ul
        ref={listRef}
        className="mango-branches"
        aria-label="Xoài trên cây"
        tabIndex={0}
      >
        {roster.map((name) => {
          const selected = selectedNames.includes(name);
          const isAbsent = absent.includes(name);
          const wasCalled = called.includes(name);
          return (
            <li
              key={name}
              className={`mango-fruit${selected ? " is-selected" : ""}${isAbsent ? " is-absent" : ""}${wasCalled ? " is-called" : ""}`}
            >
              <svg
                viewBox="0 0 220 132"
                preserveAspectRatio="none"
                aria-hidden="true"
              >
                <path
                  d="M112 32 Q111 17 120 5"
                  fill="none"
                  stroke="#76522a"
                  strokeWidth="5"
                  strokeLinecap="round"
                />
                <path
                  d="M115 21 Q137 -2 158 12 Q146 36 115 21"
                  fill="#5d8d31"
                  stroke="#335f23"
                  strokeWidth="2"
                />
                <path
                  className="mango-fruit-body"
                  d="M112 28 C155 22 207 41 208 78 C210 108 180 122 132 123 C87 128 30 128 13 95 C-4 61 30 37 66 34 C83 31 96 31 112 28Z"
                />
                <path
                  d="M34 65 Q49 47 78 46"
                  fill="none"
                  stroke="#fff6b5"
                  strokeWidth="5"
                  strokeLinecap="round"
                  opacity=".65"
                />
              </svg>
              <span className="mango-fruit-name">{name}</span>
              {(selected || isAbsent || wasCalled) && (
                <span className="mango-fruit-state">
                  {selected ? "Được chọn" : isAbsent ? "Vắng" : "Đã gọi"}
                </span>
              )}
            </li>
          );
        })}
      </ul>
    </section>
  );
}
