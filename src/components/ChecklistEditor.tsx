"use client";

import { useRef, useEffect, useCallback } from "react";

interface ChecklistEditorProps {
  content: string;
  onChange: (content: string) => void;
  placeholder?: string;
  className?: string;
}

const isCheckbox = (l: string) => l.startsWith("[ ] ") || l.startsWith("[x] ");
const isChecked = (l: string) => l.startsWith("[x] ");
const isBullet = (l: string) => l.startsWith("• ");
const getText = (l: string) => isCheckbox(l) ? l.slice(4) : isBullet(l) ? l.slice(2) : l;
const getPrefix = (l: string) =>
  l.startsWith("[x] ") ? "[x] " : l.startsWith("[ ] ") ? "[ ] " : l.startsWith("• ") ? "• " : "";

export function ChecklistEditor({ content, onChange, placeholder, className }: ChecklistEditorProps) {
  const lines = content === "" ? [""] : content.split("\n");
  const inputRefs = useRef<(HTMLInputElement | null)[]>([]);
  const pendingFocus = useRef<{ line: number; pos: number } | null>(null);

  useEffect(() => {
    if (pendingFocus.current) {
      const { line, pos } = pendingFocus.current;
      const input = inputRefs.current[line];
      if (input) {
        input.focus();
        requestAnimationFrame(() => input.setSelectionRange(pos, pos));
      }
      pendingFocus.current = null;
    }
  });

  const setLines = useCallback(
    (newLines: string[]) => onChange(newLines.join("\n")),
    [onChange]
  );

  const handleToggle = useCallback(
    (index: number) => {
      const newLines = [...lines];

      // Toggle
      if (newLines[index].startsWith("[ ] ")) {
        newLines[index] = "[x] " + newLines[index].slice(4);
      } else {
        newLines[index] = "[ ] " + newLines[index].slice(4);
      }

      // Find contiguous checkbox section
      let start = index;
      while (start > 0 && isCheckbox(newLines[start - 1])) start--;
      let end = index;
      while (end < newLines.length - 1 && isCheckbox(newLines[end + 1])) end++;

      // Reorder: unchecked first, checked last (preserve relative order)
      const section = newLines.slice(start, end + 1);
      const unchecked = section.filter((l) => l.startsWith("[ ] "));
      const checked = section.filter((l) => l.startsWith("[x] "));
      newLines.splice(start, end - start + 1, ...unchecked, ...checked);
      setLines(newLines);
    },
    [lines, setLines]
  );

  const handleChange = useCallback(
    (index: number, value: string) => {
      const newLines = [...lines];
      newLines[index] = getPrefix(lines[index]) + value;
      setLines(newLines);
    },
    [lines, setLines]
  );

  const handleKeyDown = useCallback(
    (index: number, e: React.KeyboardEvent<HTMLInputElement>) => {
      const line = lines[index];
      const input = e.currentTarget;
      const pos = input.selectionStart || 0;
      const text = getText(line);
      const prefix = getPrefix(line);

      // ] → create checkbox
      if (e.key === "]") {
        if (!prefix && pos >= 1 && text[pos - 1] === "[") {
          e.preventDefault();
          const newLines = [...lines];
          newLines[index] = "[ ] " + text.slice(0, pos - 1) + text.slice(pos);
          setLines(newLines);
          pendingFocus.current = { line: index, pos: 0 };
          return;
        }
        if (!prefix && text === "") {
          e.preventDefault();
          const newLines = [...lines];
          newLines[index] = "[ ] ";
          setLines(newLines);
          pendingFocus.current = { line: index, pos: 0 };
          return;
        }
      }

      // \ → bullet
      if (e.key === "\\" && !prefix && text.trim() === "") {
        e.preventDefault();
        const newLines = [...lines];
        newLines[index] = "• ";
        setLines(newLines);
        pendingFocus.current = { line: index, pos: 0 };
        return;
      }

      // Enter
      if (e.key === "Enter" && !e.shiftKey) {
        e.preventDefault();
        const before = text.slice(0, pos);
        const after = text.slice(pos);
        const newLines = [...lines];

        // Empty prefix line → remove prefix
        if ((isCheckbox(line) || isBullet(line)) && text.trim() === "") {
          newLines[index] = "";
          setLines(newLines);
          pendingFocus.current = { line: index, pos: 0 };
          return;
        }

        newLines[index] = prefix + before;
        let newPrefix = "";
        if (isCheckbox(line)) newPrefix = "[ ] ";
        else if (isBullet(line)) newPrefix = "• ";
        newLines.splice(index + 1, 0, newPrefix + after);
        setLines(newLines);
        pendingFocus.current = { line: index + 1, pos: 0 };
        return;
      }

      // Backspace at start
      if (e.key === "Backspace" && pos === 0 && (input.selectionEnd || 0) === 0) {
        e.preventDefault();
        if (prefix) {
          const newLines = [...lines];
          newLines[index] = text;
          setLines(newLines);
          pendingFocus.current = { line: index, pos: 0 };
          return;
        }
        if (index > 0) {
          const prevText = getText(lines[index - 1]);
          const prevPrefix = getPrefix(lines[index - 1]);
          const newLines = [...lines];
          newLines[index - 1] = prevPrefix + prevText + text;
          newLines.splice(index, 1);
          setLines(newLines);
          pendingFocus.current = { line: index - 1, pos: prevText.length };
        }
        return;
      }

      // Arrow keys
      if (e.key === "ArrowUp" && index > 0) {
        e.preventDefault();
        const prev = inputRefs.current[index - 1];
        if (prev) {
          prev.focus();
          const p = Math.min(pos, getText(lines[index - 1]).length);
          requestAnimationFrame(() => prev.setSelectionRange(p, p));
        }
      }
      if (e.key === "ArrowDown" && index < lines.length - 1) {
        e.preventDefault();
        const next = inputRefs.current[index + 1];
        if (next) {
          next.focus();
          const p = Math.min(pos, getText(lines[index + 1]).length);
          requestAnimationFrame(() => next.setSelectionRange(p, p));
        }
      }
    },
    [lines, setLines]
  );

  const handlePaste = useCallback(
    (index: number, e: React.ClipboardEvent) => {
      e.preventDefault();
      const pasted = e.clipboardData.getData("text").split("\n");
      const input = inputRefs.current[index];
      const pos = input?.selectionStart || 0;
      const selEnd = input?.selectionEnd || pos;
      const text = getText(lines[index]);
      const prefix = getPrefix(lines[index]);
      const before = text.slice(0, pos);
      const after = text.slice(selEnd);
      const newLines = [...lines];

      if (pasted.length === 1) {
        newLines[index] = prefix + before + pasted[0] + after;
        setLines(newLines);
        pendingFocus.current = { line: index, pos: before.length + pasted[0].length };
      } else {
        newLines[index] = prefix + before + pasted[0];
        const middle = pasted.slice(1, -1);
        const last = pasted[pasted.length - 1] + after;
        newLines.splice(index + 1, 0, ...middle, last);
        setLines(newLines);
        pendingFocus.current = {
          line: index + pasted.length - 1,
          pos: pasted[pasted.length - 1].length,
        };
      }
    },
    [lines, setLines]
  );

  return (
    <div className={`${className} overflow-y-auto`}>
      {lines.map((line, index) => {
        const cb = isCheckbox(line);
        const checked = isChecked(line);
        const bullet = isBullet(line);
        const text = getText(line);
        const isHeader = !cb && !bullet && text.trim() !== "";

        return (
          <div key={index} className="flex items-start gap-2 py-[2px]">
            {cb && (
              <button
                type="button"
                onClick={() => handleToggle(index)}
                className={`mt-[5px] w-[18px] h-[18px] rounded border-2 flex-shrink-0 flex items-center justify-center transition-all duration-200 cursor-pointer ${
                  checked
                    ? "bg-primary border-primary"
                    : "border-zinc-600 hover:border-primary/60"
                }`}
              >
                {checked && (
                  <svg className="w-3 h-3 text-white" viewBox="0 0 12 12" fill="none">
                    <path
                      d="M2.5 6L5 8.5L9.5 3.5"
                      stroke="currentColor"
                      strokeWidth="2"
                      strokeLinecap="round"
                      strokeLinejoin="round"
                    />
                  </svg>
                )}
              </button>
            )}
            {bullet && (
              <span className="mt-0.5 text-zinc-400 flex-shrink-0 w-[18px] text-center leading-7">
                •
              </span>
            )}
            <form
              onSubmit={(e) => {
                e.preventDefault();
                // Simulate Enter key for mobile keyboards that submit the form
                // instead of firing a keydown event
                const input = inputRefs.current[index];
                if (input) {
                  const fakeEvent = {
                    key: "Enter",
                    shiftKey: false,
                    preventDefault: () => {},
                    currentTarget: input,
                  } as React.KeyboardEvent<HTMLInputElement>;
                  handleKeyDown(index, fakeEvent);
                }
              }}
              className="flex-1 min-w-0"
              autoComplete="off"
            >
              <input
                ref={(el) => {
                  inputRefs.current[index] = el;
                }}
                type="text"
                value={text}
                onChange={(e) => handleChange(index, e.target.value)}
                onKeyDown={(e) => handleKeyDown(index, e)}
                onPaste={(e) => handlePaste(index, e)}
                enterKeyHint="enter"
                className={`w-full bg-transparent outline-none leading-7 ${
                  checked
                    ? "line-through text-zinc-600"
                    : cb
                      ? "text-zinc-200"
                      : bullet
                        ? "text-zinc-300"
                        : isHeader
                          ? "font-semibold text-zinc-200"
                          : "text-zinc-300"
                }`}
                placeholder={index === 0 && lines.length === 1 ? placeholder : ""}
                autoComplete="off"
              />
            </form>
          </div>
        );
      })}
    </div>
  );
}
