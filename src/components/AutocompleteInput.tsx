import React, { useState, useRef, useEffect } from "react";
import { Input } from "@/components/ui/input";

interface AutocompleteInputProps {
  value: string;
  onChange: (value: string) => void;
  suggestions: string[];
  placeholder?: string;
}

const AutocompleteInput: React.FC<AutocompleteInputProps> = ({ value, onChange, suggestions, placeholder }) => {
  const [open, setOpen] = useState(false);
  const [filtered, setFiltered] = useState<string[]>([]);
  const wrapperRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (value) {
      setFiltered(suggestions.filter(s => s.toLowerCase().includes(value.toLowerCase())));
    } else {
      setFiltered(suggestions);
    }
  }, [value, suggestions]);

  useEffect(() => {
    const handler = (e: MouseEvent) => {
      if (wrapperRef.current && !wrapperRef.current.contains(e.target as Node)) setOpen(false);
    };
    document.addEventListener("mousedown", handler);
    return () => document.removeEventListener("mousedown", handler);
  }, []);

  return (
    <div ref={wrapperRef} className="relative">
      <Input
        placeholder={placeholder}
        value={value}
        onChange={(e) => { onChange(e.target.value); setOpen(true); }}
        onFocus={() => setOpen(true)}
      />
      {open && filtered.length > 0 && (
        <ul className="absolute z-50 mt-1 w-full max-h-40 overflow-y-auto rounded-md border bg-popover text-popover-foreground shadow-md">
          {filtered.map((s) => (
            <li
              key={s}
              className="cursor-pointer px-3 py-1.5 text-sm hover:bg-accent hover:text-accent-foreground"
              onMouseDown={() => { onChange(s); setOpen(false); }}
            >
              {s}
            </li>
          ))}
        </ul>
      )}
    </div>
  );
};

export default AutocompleteInput;
