import Link from "next/link";

export default function HomePage() {
  return (
    <main className="min-h-screen bg-[var(--color-canvas)] text-[var(--color-ink)]">
      <div className="mx-auto flex min-h-screen w-full max-w-[1200px] flex-col px-6 py-8 sm:px-10 lg:px-16">
        <header className="flex h-11 items-center justify-between">
          <p className="font-display text-2xl tracking-[-0.04em] text-[var(--color-primary)]">
            TxAnalyzer
          </p>
          <Link
            href="/login"
            className="h-11 rounded-full bg-[var(--color-primary)] px-6 text-sm font-semibold text-white transition-colors hover:bg-[var(--color-primary-active)] focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[var(--color-primary)]"
          >
            로그인
          </Link>
        </header>

        <section className="flex flex-1 items-center py-24 sm:py-32">
          <div className="max-w-3xl">
            <p className="mb-6 font-mono-ui text-xs uppercase tracking-[0.16em] text-[var(--color-muted)]">
              거래 흐름 분석
            </p>
            <h1 className="max-w-2xl font-display text-5xl font-normal leading-[1.08] tracking-[-0.04em] sm:text-6xl">
              거래 내역을 읽고 소비 흐름을 확인합니다
            </h1>
            <p className="mt-8 max-w-xl text-base leading-7 text-[var(--color-body)]">
              CSV 거래 내역을 바탕으로 반복되는 지출과 월별 흐름을 정리합니다.
            </p>
          </div>
        </section>

        <footer className="border-t border-[var(--color-hairline-soft)] py-6">
          <p className="text-xs leading-5 text-[var(--color-muted)]">
            원본 CSV는 저장하지 않으며 분석에 필요한 데이터만 처리합니다.
          </p>
        </footer>
      </div>
    </main>
  );
}
