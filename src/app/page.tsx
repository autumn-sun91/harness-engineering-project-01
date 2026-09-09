import Link from "next/link";

const analysisTypes = [
  {
    number: "01",
    title: "카테고리별 지출",
    description: "지출을 카테고리로 묶어 어디에 금액이 쓰였는지 확인합니다.",
  },
  {
    number: "02",
    title: "기간별 지출 추이",
    description: "월별 변화와 전체 기간의 소비 흐름을 살펴봅니다.",
  },
  {
    number: "03",
    title: "구독 누수·이상 거래",
    description: "반복 결제와 평소와 다른 거래 후보를 찾아봅니다.",
  },
  {
    number: "04",
    title: "AI 요약",
    description: "집계된 통계를 바탕으로 소비 흐름을 문장으로 정리합니다.",
  },
  {
    number: "05",
    title: "절약 인사이트",
    description: "반복 지출을 돌아볼 수 있는 확인 항목을 제시합니다.",
  },
] as const;

const planRows = [
  ["CSV 업로드", "월 5회", "월 30회"],
  ["동시 분석", "1건", "1건"],
  ["데이터 조회 범위", "최근 12개월", "전체 기간"],
  ["카테고리별 지출", "제공", "제공"],
  ["기간별 지출 추이", "제공", "제공"],
  ["AI 요약", "제공", "제공"],
  ["구독 누수·이상 거래", "건수 + 상세 최대 3건", "전체"],
  ["절약 인사이트", "최대 3개 중 1개", "전체"],
] as const;

function FeatureCard({
  number,
  title,
  description,
}: (typeof analysisTypes)[number]) {
  return (
    <article className="rounded-2xl border border-[var(--color-hairline)] bg-[var(--color-canvas)] p-7 sm:p-8">
      <p className="font-mono-ui text-xs text-[var(--color-muted)]">{number}</p>
      <h3 className="mt-8 text-lg font-semibold tracking-[-0.02em]">{title}</h3>
      <p className="mt-3 text-sm leading-6 text-[var(--color-body)]">{description}</p>
    </article>
  );
}

function ProductPreview() {
  return (
    <div className="relative mx-auto w-full max-w-[480px]" aria-label="TxAnalyzer 분석 화면 미리보기">
      <div className="absolute -right-3 -top-4 h-48 w-56 rounded-2xl border border-[var(--color-body)] bg-[var(--color-surface-dark-elevated)] p-5 sm:-right-8 sm:-top-8">
        <p className="font-mono-ui text-[11px] text-[var(--color-muted-soft)]">월별 추이</p>
        <div className="mt-7 flex h-20 items-end gap-2" aria-hidden="true">
          <span className="h-8 w-5 rounded-t bg-[#567fff]" />
          <span className="h-12 w-5 rounded-t bg-[#3c6cff]" />
          <span className="h-10 w-5 rounded-t bg-[#7396ff]" />
          <span className="h-16 w-5 rounded-t bg-[var(--color-primary)]" />
          <span className="h-14 w-5 rounded-t bg-[#3c6cff]" />
        </div>
      </div>
      <div className="relative rounded-2xl border border-[var(--color-body)] bg-[var(--color-surface-dark-elevated)] p-6 shadow-[0_4px_12px_rgba(0,0,0,.04)] sm:p-8">
        <div className="flex items-center justify-between border-b border-[var(--color-body)] pb-5">
          <p className="text-sm text-[var(--color-hairline)]">최근 분석</p>
          <span className="font-mono-ui text-[11px] text-[var(--color-muted-soft)]">TxAnalyzer</span>
        </div>
        <div className="mt-7 grid gap-4 sm:grid-cols-2">
          <div className="rounded-xl border border-[var(--color-body)] p-4">
            <p className="text-xs text-[var(--color-muted-soft)]">카테고리별 지출</p>
            <div className="mt-5 h-2 rounded-full bg-[var(--color-surface-dark)]"><div className="h-2 w-4/5 rounded-full bg-[var(--color-primary)]" /></div>
            <div className="mt-3 h-2 rounded-full bg-[var(--color-surface-dark)]"><div className="h-2 w-3/5 rounded-full bg-[#567fff]" /></div>
            <div className="mt-3 h-2 rounded-full bg-[var(--color-surface-dark)]"><div className="h-2 w-2/5 rounded-full bg-[#7396ff]" /></div>
          </div>
          <div className="rounded-xl border border-[var(--color-body)] p-4">
            <p className="text-xs text-[var(--color-muted-soft)]">AI 요약</p>
            <p className="mt-5 text-sm leading-6 text-[var(--color-hairline)]">소비 흐름을 통계와 문장으로 확인합니다.</p>
          </div>
        </div>
      </div>
    </div>
  );
}

function Footer() {
  return (
    <footer className="border-t border-[var(--color-hairline-soft)]">
      <div className="mx-auto flex w-full max-w-[1200px] flex-col gap-5 px-6 py-8 sm:flex-row sm:items-center sm:justify-between sm:px-10 lg:px-16">
        <div>
          <p className="font-display text-xl tracking-[-0.04em] text-[var(--color-primary)]">TxAnalyzer</p>
          <p className="mt-2 text-xs leading-5 text-[var(--color-muted)]">원본 CSV는 저장하지 않으며 분석에 필요한 데이터만 처리합니다.</p>
        </div>
        <nav aria-label="법적 문서" className="flex gap-5 text-sm text-[var(--color-body)]">
          <Link href="/privacy" className="underline-offset-4 hover:underline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[var(--color-primary)]">개인정보 처리방침</Link>
          <Link href="/terms" className="underline-offset-4 hover:underline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[var(--color-primary)]">이용약관</Link>
        </nav>
      </div>
    </footer>
  );
}

export default function HomePage() {
  return (
    <main className="bg-[var(--color-canvas)] text-[var(--color-ink)]">
      <header className="mx-auto flex h-16 w-full max-w-[1200px] items-center justify-between px-6 sm:px-10 lg:px-16">
        <Link href="/" className="font-display text-2xl tracking-[-0.04em] text-[var(--color-primary)]">TxAnalyzer</Link>
        <nav aria-label="주요 메뉴" className="flex items-center gap-5 sm:gap-8">
          <Link href="#analysis" className="hidden text-sm text-[var(--color-body)] underline-offset-4 hover:underline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[var(--color-primary)] sm:inline">분석 항목</Link>
          <Link href="#plans" className="hidden text-sm text-[var(--color-body)] underline-offset-4 hover:underline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[var(--color-primary)] sm:inline">요금제</Link>
          <Link href="/login" className="inline-flex h-11 items-center rounded-full bg-[var(--color-primary)] px-6 text-sm font-semibold text-white transition-colors hover:bg-[var(--color-primary-active)] focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[var(--color-primary)]">로그인</Link>
        </nav>
      </header>

      <section className="bg-[var(--color-surface-dark)] text-white" aria-labelledby="hero-title">
        <div className="mx-auto grid w-full max-w-[1200px] items-center gap-16 px-6 py-20 sm:px-10 sm:py-28 lg:grid-cols-[1fr_0.9fr] lg:gap-20 lg:px-16 lg:py-32">
          <div>
            <p className="font-mono-ui text-xs tracking-[0.14em] text-[var(--color-muted-soft)]">개인 거래 분석</p>
            <h1 id="hero-title" className="mt-7 max-w-2xl font-display text-5xl font-normal leading-[1.08] tracking-[-0.05em] sm:text-6xl lg:text-[64px]">거래 내역에서 소비 흐름을 읽습니다</h1>
            <p className="mt-8 max-w-xl text-base leading-7 text-[var(--color-hairline)]">CSV 거래 내역을 바탕으로 지출의 구성과 변화를 정리하고, 반복되는 거래를 확인할 수 있습니다.</p>
            <Link href="/login" className="mt-10 inline-flex h-14 items-center rounded-full bg-[var(--color-primary)] px-7 text-base font-semibold text-white transition-colors hover:bg-[var(--color-primary-active)] focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[var(--color-primary)]">분석 시작하기</Link>
          </div>
          <ProductPreview />
        </div>
      </section>

      <section id="analysis" className="mx-auto w-full max-w-[1200px] px-6 py-24 sm:px-10 sm:py-28 lg:px-16 lg:py-32" aria-labelledby="analysis-title">
        <div className="max-w-2xl">
          <p className="font-mono-ui text-xs tracking-[0.14em] text-[var(--color-muted)]">분석 범위</p>
          <h2 id="analysis-title" className="mt-5 font-display text-4xl font-normal tracking-[-0.04em] sm:text-5xl">한 번의 업로드로 확인하는 다섯 가지</h2>
          <p className="mt-6 text-base leading-7 text-[var(--color-body)]">금액 집계는 코드로 계산하고, Claude는 분류와 해석을 돕습니다.</p>
        </div>
        <div className="mt-12 grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {analysisTypes.map((item) => <FeatureCard key={item.number} {...item} />)}
        </div>
      </section>

      <section id="plans" className="bg-[var(--color-surface-soft)]" aria-labelledby="plans-title">
        <div className="mx-auto w-full max-w-[1200px] px-6 py-24 sm:px-10 sm:py-28 lg:px-16 lg:py-32">
          <div className="max-w-2xl">
            <p className="font-mono-ui text-xs tracking-[0.14em] text-[var(--color-muted)]">요금제</p>
            <h2 id="plans-title" className="mt-5 font-display text-4xl font-normal tracking-[-0.04em] sm:text-5xl">필요한 범위에 맞는 플랜</h2>
            <p className="mt-6 text-base leading-7 text-[var(--color-body)]">Free에서 최근 12개월을 확인하고, Pro에서 전체 기간과 모든 인사이트를 엽니다.</p>
          </div>
          <div className="mt-12 overflow-x-auto rounded-2xl border border-[var(--color-hairline)] bg-[var(--color-canvas)]">
            <table className="w-full min-w-[680px] border-collapse text-left">
              <caption className="sr-only">TxAnalyzer Free와 Pro 요금제 비교</caption>
              <thead>
                <tr className="border-b border-[var(--color-hairline)]">
                  <th scope="col" className="w-[42%] px-6 py-5 text-sm font-semibold sm:px-8">기능</th>
                  <th scope="col" className="px-6 py-5 text-sm font-semibold sm:px-8">Free</th>
                  <th scope="col" className="bg-[var(--color-surface-dark)] px-6 py-5 text-sm font-semibold text-white sm:px-8">Pro <span className="ml-1 font-mono-ui text-xs font-normal text-[var(--color-muted-soft)]">$9/월</span></th>
                </tr>
              </thead>
              <tbody>
                {planRows.map(([feature, free, pro]) => (
                  <tr key={feature} className="border-b border-[var(--color-hairline-soft)] last:border-b-0">
                    <th scope="row" className="px-6 py-5 text-sm font-medium sm:px-8">{feature}</th>
                    <td className="px-6 py-5 text-sm text-[var(--color-body)] sm:px-8">{free}</td>
                    <td className="bg-[var(--color-surface-dark)] px-6 py-5 text-sm text-[var(--color-hairline)] sm:px-8">{pro}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
          <p className="mt-5 text-xs leading-5 text-[var(--color-muted)]">분석 결과는 업로드별로 제공됩니다.</p>
        </div>
      </section>

      <section className="bg-[var(--color-surface-dark)] text-white" aria-labelledby="cta-title">
        <div className="mx-auto flex w-full max-w-[1200px] flex-col items-start justify-between gap-8 px-6 py-24 sm:px-10 sm:py-28 lg:flex-row lg:items-center lg:px-16">
          <div>
            <p className="font-mono-ui text-xs tracking-[0.14em] text-[var(--color-muted-soft)]">TxAnalyzer</p>
            <h2 id="cta-title" className="mt-5 max-w-2xl font-display text-4xl font-normal tracking-[-0.04em] sm:text-5xl">거래 내역을 기준으로 소비를 살펴보세요</h2>
          </div>
          <Link href="/login" className="inline-flex h-14 shrink-0 items-center rounded-full bg-[var(--color-primary)] px-7 text-base font-semibold text-white transition-colors hover:bg-[var(--color-primary-active)] focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[var(--color-primary)]">시작하기</Link>
        </div>
      </section>

      <Footer />
    </main>
  );
}
