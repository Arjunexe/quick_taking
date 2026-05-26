"use client";

import { useRef, useEffect, useCallback } from "react";

interface ChecklistEditorProps {
  content: string;
  onChange: (content: string) => void;
  placeholder?: string;
  className?: string;
}

const isCheckbox = (l: string) => l.startsWith("[ ] ") || l.startsWith("[x] ") || l.startsWith("[!] ");
const isChecked = (l: string) => l.startsWith("[x] ");
const isPriority = (l: string) => l.startsWith("[!] ");
const isUnchecked = (l: string) => l.startsWith("[ ] ");
const isBullet = (l: string) => l.startsWith("• ");
const getText = (l: string) => isCheckbox(l) ? l.slice(4) : isBullet(l) ? l.slice(2) : l;
const getPrefix = (l: string) =>
  l.startsWith("[x] ") ? "[x] " : l.startsWith("[!] ") ? "[!] " : l.startsWith("[ ] ") ? "[ ] " : l.startsWith("• ") ? "• " : "";

export function ChecklistEditor({ content, onChange, placeholder, className }: ChecklistEditorProps) {
  const lines = content === "" ? [""] : content.split("\n");
  const inputRefs = useRef<(HTMLTextAreaElement | null)[]>([]);
  const pendingFocus = useRef<{ line: number; pos: number } | null>(null);

  // Collect priority items with their original indices
  const priorityItems = lines
    .map((line, index) => ({ line, index }))
    .filter(({ line }) => isPriority(line));

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

      // Toggle: [ ] → [x], [x] → [ ], [!] → [x]
      if (newLines[index].startsWith("[!] ")) {
        newLines[index] = "[x] " + newLines[index].slice(4);
      } else if (newLines[index].startsWith("[ ] ")) {
        newLines[index] = "[x] " + newLines[index].slice(4);
      } else {
        newLines[index] = "[ ] " + newLines[index].slice(4);
      }

      // Find contiguous checkbox section
      let start = index;
      while (start > 0 && isCheckbox(newLines[start - 1])) start--;
      let end = index;
      while (end < newLines.length - 1 && isCheckbox(newLines[end + 1])) end++;

      // Reorder: priority first, then unchecked, then checked (preserve relative order)
      const section = newLines.slice(start, end + 1);
      const priority = section.filter((l) => l.startsWith("[!] "));
      const unchecked = section.filter((l) => l.startsWith("[ ] "));
      const checked = section.filter((l) => l.startsWith("[x] "));
      newLines.splice(start, end - start + 1, ...priority, ...unchecked, ...checked);
      setLines(newLines);
    },
    [lines, setLines]
  );

  const handlePromote = useCallback(
    (index: number) => {
      const newLines = [...lines];
      newLines[index] = "[!] " + newLines[index].slice(4);
      setLines(newLines);
    },
    [lines, setLines]
  );

  const handleDemote = useCallback(
    (index: number) => {
      const newLines = [...lines];
      newLines[index] = "[ ] " + newLines[index].slice(4);
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
    (index: number, e: React.KeyboardEvent<HTMLTextAreaElement>) => {
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
        // New line from a priority item should be regular checkbox, not priority
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
      {/* Focus Section */}
      {priorityItems.length > 0 && (
        <div className="mb-3 pb-3 border-b border-primary/20">
          {/* Focus Header */}
          <div className="flex items-center gap-2 mb-2 px-1">
            <svg className="w-3.5 h-3.5 text-primary-400" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
              <circle cx="12" cy="12" r="10" />
              <circle cx="12" cy="12" r="6" />
              <circle cx="12" cy="12" r="2" />
            </svg>
            <span className="text-xs font-medium text-primary-400 uppercase tracking-wider">Focus</span>
            <span className="text-[10px] text-zinc-600">{priorityItems.length}</span>
          </div>

          {/* Priority Items */}
          {priorityItems.map(({ line, index: originalIndex }) => {
            const text = getText(line);
            return (
              <div
                key={`priority-${originalIndex}`}
                className="flex items-center gap-2 py-1 px-1 group/priority rounded-lg hover:bg-white/[0.03] transition-colors"
              >
                {/* Checkbox */}
                <button
                  type="button"
                  onClick={() => handleToggle(originalIndex)}
                  className="w-[18px] h-[18px] rounded border-2 border-primary-400/60 flex-shrink-0 flex items-center justify-center transition-all duration-200 cursor-pointer hover:border-primary hover:bg-primary/20"
                />

                {/* Task text */}
                <span className="flex-1 text-zinc-200 leading-7 text-sm">{text}</span>

                {/* Remove from focus */}
                <button
                  type="button"
                  onClick={() => handleDemote(originalIndex)}
                  className="opacity-0 group-hover/priority:opacity-100 p-1 text-zinc-600 hover:text-zinc-400 transition-all duration-150 flex-shrink-0"
                  title="Remove from focus"
                >
                  <svg className="w-3.5 h-3.5" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                    <line x1="18" y1="6" x2="6" y2="18" />
                    <line x1="6" y1="6" x2="18" y2="18" />
                  </svg>
                </button>
              </div>
            );
          })}
        </div>
      )}

      {/* Main Content */}
      {lines.map((line, index) => {
        const cb = isCheckbox(line);
        const checked = isChecked(line);
        const priority = isPriority(line);
        const unchecked = isUnchecked(line);
        const bullet = isBullet(line);
        const text = getText(line);
        const isHeader = !cb && !bullet && text.trim() !== "";

        return (
          <div key={index} className="flex items-start gap-2 py-[2px] group/line">
            {cb && (
                <button
                  type="button"
                  onClick={() => priority ? handleDemote(index) : handleToggle(index)}
                  className={`mt-[5px] w-[18px] h-[18px] rounded border-2 flex-shrink-0 flex items-center justify-center transition-all duration-200 cursor-pointer ${
                    checked
                      ? "bg-primary border-primary"
                      : priority
                        ? "border-primary-400/40 bg-primary/10"
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
            {cb && unchecked && (
              <button
                type="button"
                onClick={() => handlePromote(index)}
                className="mt-[5px] opacity-0 group-hover/line:opacity-100 p-0 text-zinc-600 hover:text-primary-400 transition-all duration-150 flex-shrink-0"
                title="Add to focus"
              >
                <svg className="w-3.5 h-3.5" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                  <polyline points="18 15 12 9 6 15" />
                </svg>
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
                  } as React.KeyboardEvent<HTMLTextAreaElement>;
                  handleKeyDown(index, fakeEvent);
                }
              }}
              className="flex-1 min-w-0"
              autoComplete="off"
            >
              <textarea
                ref={(el) => {
                  inputRefs.current[index] = el;
                  // Auto-resize on mount
                  if (el) {
                    el.style.height = 'auto';
                    el.style.height = el.scrollHeight + 'px';
                  }
                }}
                value={text}
                onChange={(e) => {
                  handleChange(index, e.target.value);
                  // Auto-resize on content change
                  e.target.style.height = 'auto';
                  e.target.style.height = e.target.scrollHeight + 'px';
                }}
                onKeyDown={(e) => handleKeyDown(index, e)}
                onPaste={(e) => handlePaste(index, e)}
                enterKeyHint="enter"
                rows={1}
                className={`w-full bg-transparent outline-none leading-7 resize-none overflow-hidden block ${
                  checked
                    ? "line-through text-zinc-600"
                    : priority
                      ? "text-zinc-600 italic"
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

            {/* "in focus" badge for priority items in their original position */}
            {priority && (
              <span className="mt-[7px] flex-shrink-0 text-[10px] text-primary-400/50 font-medium tracking-wide">
                focus
              </span>
            )}
          </div>
        );
      })}
    </div>
  );
}
