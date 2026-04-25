// app/page.tsx — Landing page
// Premium, focused landing. Linear-inspired restraint with just enough visual punch.
import Link from "next/link";

export default function Home() {
  return (
    <main className="min-h-screen flex items-center justify-center relative overflow-hidden bg-grid">
      {/* Radial glow behind the wordmark */}
      <div
        className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[600px] h-[600px] rounded-full pointer-events-none"
        style={{
          background: `radial-gradient(circle, rgba(var(--accent-glow), 0.06) 0%, transparent 70%)`,
        }}
      />

      <div className="text-center relative z-10 px-6">
        {/* Wordmark */}
        <h1 className="font-display text-6xl sm:text-7xl font-semibold tracking-tight mb-4">
          patrolprep<span className="accent-glow" style={{ color: "var(--accent)" }}>.</span>
        </h1>

        {/* Tagline */}
        <p
          className="text-base sm:text-lg mb-4 max-w-md mx-auto leading-relaxed"
          style={{ color: "var(--fg-secondary)" }}
        >
          Pass the Alberta security guard exam in your language.
          <br />
          Learn the concepts in any.
        </p>

        {/* Sub-context */}
        <p
          className="text-xs mb-10 max-w-sm mx-auto"
          style={{ color: "var(--fg-tertiary)" }}
        >
          30 questions · 6 topics · 4 languages · powered by AI
        </p>

        {/* CTA */}
        <Link
          href="/practice"
          className="inline-flex items-center gap-2 px-8 py-3.5 rounded-xl text-white font-medium text-[15px] transition-all duration-200 hover:scale-[1.02] active:scale-[0.98]"
          style={{
            background: "var(--accent)",
            boxShadow: `0 0 20px rgba(var(--accent-glow), 0.3), 0 4px 12px rgba(0,0,0,0.4)`,
          }}
        >
          Start Practice Exam
          <svg width="16" height="16" viewBox="0 0 16 16" fill="none" className="opacity-70">
            <path d="M6 3l5 5-5 5" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
          </svg>
        </Link>

        {/* AWS badge */}
        <div
          className="mt-16 text-xs flex items-center justify-center gap-2"
          style={{ color: "var(--fg-tertiary)" }}
        >
          <span className="inline-block w-1.5 h-1.5 rounded-full" style={{ background: "var(--status-live)" }} />
          Built on AWS Bedrock · Polly · Transcribe
        </div>
      </div>
    </main>
  );
}