import Link from "next/link";
import { Aperture } from "lucide-react";

export function Footer() {
  return (
    <footer className="border-t border-hairline">
      <div className="mx-auto flex max-w-6xl flex-col gap-6 px-6 py-10 sm:flex-row sm:items-center sm:justify-between">
        <Link href="/" className="flex items-center gap-2 text-sm font-semibold text-ink">
          <Aperture className="h-4 w-4 text-accent" strokeWidth={1.75} />
          Vantage
        </Link>
        <p className="text-sm text-muted">© {new Date().getFullYear()} Vantage. All rights reserved.</p>
        <div className="flex gap-6 text-sm text-muted">
          <a href="#how-it-works" className="hover:text-ink">
            How it works
          </a>
          <a href="#pricing" className="hover:text-ink">
            Pricing
          </a>
          <Link href="/login" className="hover:text-ink">
            Sign in
          </Link>
        </div>
      </div>
    </footer>
  );
}
