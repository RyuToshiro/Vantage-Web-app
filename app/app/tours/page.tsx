"use client";

import { MyToursStrip } from "@/components/app/MyToursStrip";

export default function MyToursPage() {
  return (
    <div className="mx-auto max-w-6xl px-8 py-10">
      <div className="mb-8">
        <h1 className="text-2xl font-semibold tracking-tight text-ink">My Tours</h1>
        <p className="mt-1 text-sm text-muted">Every tour you&apos;ve rendered, newest first.</p>
      </div>
      <MyToursStrip />
    </div>
  );
}
