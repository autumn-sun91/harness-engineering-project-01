export default function DashboardNotFound() {
  return (
    <main className="min-h-screen bg-[var(--color-canvas)] px-6 py-16 text-[var(--color-ink)] sm:px-10 lg:px-16">
      <div className="mx-auto max-w-[720px]">
        <p className="font-mono-ui text-xs tracking-[0.14em] text-[var(--color-muted)]">404</p>
        <h1 className="mt-5 font-display text-4xl font-normal tracking-[-0.04em]">리포트를 찾을 수 없습니다</h1>
        <p className="mt-5 text-base leading-7 text-[var(--color-body)]">선택한 업로드가 존재하지 않거나 접근할 수 없습니다.</p>
      </div>
    </main>
  );
}
