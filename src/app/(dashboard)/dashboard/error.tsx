"use client";

export default function DashboardError({ reset }: { reset: () => void }) {
  return (
    <main className="min-h-screen bg-[var(--color-canvas)] px-6 py-16 text-[var(--color-ink)] sm:px-10 lg:px-16">
      <div className="mx-auto max-w-[720px]">
        <p className="font-mono-ui text-xs tracking-[0.14em] text-[var(--color-muted)]">대시보드</p>
        <h1 className="mt-5 font-display text-4xl font-normal tracking-[-0.04em]">대시보드를 불러오지 못했습니다</h1>
        <p className="mt-5 text-base leading-7 text-[var(--color-body)]">잠시 후 다시 시도해주세요.</p>
        <button type="button" onClick={reset} className="mt-8 h-11 rounded-full bg-[var(--color-primary)] px-6 text-sm font-semibold text-white hover:bg-[var(--color-primary-active)] focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[var(--color-primary)]">다시 시도</button>
      </div>
    </main>
  );
}
