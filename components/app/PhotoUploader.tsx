"use client";

import { useEffect, useRef, useState } from "react";
import { Plus, X, RefreshCw } from "lucide-react";

export interface PhotoSlot {
  id: string;
  file: File;
  previewUrl: string;
}

const MAX_PHOTOS = 8;

interface PhotoUploaderProps {
  onChange: (photos: PhotoSlot[]) => void;
  disabled?: boolean;
}

function makeSlot(file: File): PhotoSlot {
  return { id: `${file.name}-${file.size}-${Math.random().toString(36).slice(2)}`, file, previewUrl: URL.createObjectURL(file) };
}

export function PhotoUploader({ onChange, disabled }: PhotoUploaderProps) {
  const [primary, setPrimary] = useState<[PhotoSlot | null, PhotoSlot | null]>([null, null]);
  const [extra, setExtra] = useState<PhotoSlot[]>([]);

  const primaryInputRefs = [useRef<HTMLInputElement>(null), useRef<HTMLInputElement>(null)];
  const addInputRef = useRef<HTMLInputElement>(null);

  const total = (primary[0] ? 1 : 0) + (primary[1] ? 1 : 0) + extra.length;

  useEffect(() => {
    onChange([primary[0], primary[1], ...extra].filter((p): p is PhotoSlot => p !== null));
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [primary, extra]);

  function replacePrimary(index: 0 | 1, file: File) {
    setPrimary((prev) => {
      const next = [...prev] as [PhotoSlot | null, PhotoSlot | null];
      if (next[index]) URL.revokeObjectURL(next[index]!.previewUrl);
      next[index] = makeSlot(file);
      return next;
    });
  }

  function removePrimary(index: 0 | 1) {
    setPrimary((prev) => {
      const next = [...prev] as [PhotoSlot | null, PhotoSlot | null];
      if (next[index]) URL.revokeObjectURL(next[index]!.previewUrl);
      next[index] = null;
      return next;
    });
  }

  function removeExtra(id: string) {
    setExtra((prev) => {
      const slot = prev.find((p) => p.id === id);
      if (slot) URL.revokeObjectURL(slot.previewUrl);
      return prev.filter((p) => p.id !== id);
    });
  }

  function handleAddFiles(fileList: FileList) {
    const files = Array.from(fileList).filter((f) => f.type.startsWith("image/"));
    let remaining = MAX_PHOTOS - total;
    if (remaining <= 0) return;

    setPrimary((prevPrimary) => {
      const nextPrimary = [...prevPrimary] as [PhotoSlot | null, PhotoSlot | null];
      const leftover: File[] = [];

      for (const file of files) {
        if (remaining <= 0) break;
        if (!nextPrimary[0]) {
          nextPrimary[0] = makeSlot(file);
          remaining--;
        } else if (!nextPrimary[1]) {
          nextPrimary[1] = makeSlot(file);
          remaining--;
        } else {
          leftover.push(file);
        }
      }

      if (leftover.length) {
        setExtra((prevExtra) => [
          ...prevExtra,
          ...leftover.slice(0, MAX_PHOTOS - (prevExtra.length + (nextPrimary[0] ? 1 : 0) + (nextPrimary[1] ? 1 : 0))).map(makeSlot),
        ]);
      }

      return nextPrimary;
    });
  }

  return (
    <div>
      <div className="flex items-baseline justify-between">
        <label className="text-sm font-medium text-ink">Property photos</label>
        <span className="text-xs text-muted">{total} / {MAX_PHOTOS}</span>
      </div>
      <p className="mt-1 text-xs text-muted">
        Add 2 or more — cover the whole listing for an accurate tour.
      </p>

      <div className="mt-3 grid grid-cols-2 gap-3">
        {[0, 1].map((i) => {
          const index = i as 0 | 1;
          const slot = primary[index];
          return (
            <div key={index} className="group relative">
              <input
                ref={primaryInputRefs[index]}
                type="file"
                accept="image/*"
                className="hidden"
                disabled={disabled}
                onChange={(e) => {
                  const file = e.target.files?.[0];
                  if (file) replacePrimary(index, file);
                  e.target.value = "";
                }}
              />
              <button
                type="button"
                disabled={disabled}
                onClick={() => primaryInputRefs[index].current?.click()}
                className="relative flex h-36 w-full items-center justify-center overflow-hidden rounded-2xl border border-dashed border-hairline bg-surface transition-colors hover:border-ink disabled:pointer-events-none"
              >
                {slot ? (
                  <>
                    {/* eslint-disable-next-line @next/next/no-img-element */}
                    <img src={slot.previewUrl} alt={`Photo ${index + 1}`} className="h-full w-full object-cover" />
                    <div className="absolute inset-0 hidden items-center justify-center gap-2 bg-black/50 text-sm font-medium text-white group-hover:flex">
                      <RefreshCw className="h-4 w-4" strokeWidth={1.75} />
                      Replace
                    </div>
                  </>
                ) : (
                  <span className="text-sm text-muted">Photo {index + 1}</span>
                )}
              </button>
              {slot && !disabled && (
                <button
                  type="button"
                  onClick={(e) => {
                    e.stopPropagation();
                    removePrimary(index);
                  }}
                  className="absolute -right-2 -top-2 hidden h-6 w-6 items-center justify-center rounded-full bg-ink text-white shadow-soft group-hover:flex"
                >
                  <X className="h-3.5 w-3.5" strokeWidth={2} />
                </button>
              )}
            </div>
          );
        })}
      </div>

      <div className="mt-3 flex flex-wrap gap-3">
        <input
          ref={addInputRef}
          type="file"
          accept="image/*"
          multiple
          className="hidden"
          disabled={disabled}
          onChange={(e) => {
            if (e.target.files) handleAddFiles(e.target.files);
            e.target.value = "";
          }}
        />
        <button
          type="button"
          disabled={disabled || total >= MAX_PHOTOS}
          onClick={() => addInputRef.current?.click()}
          className="flex h-16 w-16 items-center justify-center rounded-xl border border-dashed border-hairline text-muted transition-colors hover:border-ink hover:text-ink disabled:pointer-events-none disabled:opacity-40"
          title="Add photos"
        >
          <Plus className="h-5 w-5" strokeWidth={1.75} />
        </button>

        {extra.map((slot) => (
          <div key={slot.id} className="group relative h-16 w-16 shrink-0 overflow-hidden rounded-xl border border-hairline">
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img src={slot.previewUrl} alt="Additional property photo" className="h-full w-full object-cover" />
            {!disabled && (
              <button
                type="button"
                onClick={() => removeExtra(slot.id)}
                className="absolute -right-1.5 -top-1.5 hidden h-5 w-5 items-center justify-center rounded-full bg-ink text-white group-hover:flex"
              >
                <X className="h-3 w-3" strokeWidth={2} />
              </button>
            )}
          </div>
        ))}
      </div>
    </div>
  );
}
