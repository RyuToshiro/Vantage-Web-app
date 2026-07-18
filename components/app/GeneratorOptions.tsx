"use client";

import { STYLE_PRESETS, type StylePreset } from "@/lib/types";
import { cn } from "@/lib/utils";

interface GeneratorOptionsProps {
  segmentLength: 5 | 8;
  onSegmentLengthChange: (v: 5 | 8) => void;
  style: StylePreset;
  onStyleChange: (v: StylePreset) => void;
  disabled?: boolean;
}

function OptionPill({
  active,
  disabled,
  soon,
  onClick,
  children,
}: {
  active: boolean;
  disabled?: boolean;
  soon?: boolean;
  onClick?: () => void;
  children: React.ReactNode;
}) {
  return (
    <button
      type="button"
      disabled={disabled}
      onClick={onClick}
      className={cn(
        "relative flex items-center gap-1.5 rounded-pill border px-3.5 py-1.5 text-sm transition-colors",
        active ? "border-ink bg-ink text-white" : "border-hairline text-ink hover:border-ink",
        disabled && "pointer-events-none opacity-40"
      )}
    >
      {children}
      {soon && (
        <span className="rounded-pill bg-accent-soft px-1.5 py-0.5 text-[10px] font-medium text-accent-dark">
          Soon
        </span>
      )}
    </button>
  );
}

export function GeneratorOptions({
  segmentLength,
  onSegmentLengthChange,
  style,
  onStyleChange,
  disabled,
}: GeneratorOptionsProps) {
  return (
    <div className="space-y-5">
      <div>
        <p className="mb-2 text-xs font-medium uppercase tracking-wide text-muted">Aspect ratio</p>
        <div className="flex flex-wrap gap-2">
          <OptionPill active disabled={disabled}>
            9:16
          </OptionPill>
          <OptionPill active={false} disabled soon>
            1:1
          </OptionPill>
          <OptionPill active={false} disabled soon>
            16:9
          </OptionPill>
        </div>
      </div>

      <div>
        <p className="mb-2 text-xs font-medium uppercase tracking-wide text-muted">Segment length</p>
        <div className="flex flex-wrap gap-2">
          {[5, 8].map((s) => (
            <OptionPill
              key={s}
              active={segmentLength === s}
              disabled={disabled}
              onClick={() => onSegmentLengthChange(s as 5 | 8)}
            >
              {s}s
            </OptionPill>
          ))}
        </div>
      </div>

      <div>
        <p className="mb-2 text-xs font-medium uppercase tracking-wide text-muted">Style</p>
        <div className="flex flex-wrap gap-2">
          {STYLE_PRESETS.map((s) => (
            <OptionPill key={s} active={style === s} disabled={disabled} onClick={() => onStyleChange(s)}>
              {s}
            </OptionPill>
          ))}
        </div>
      </div>
    </div>
  );
}
