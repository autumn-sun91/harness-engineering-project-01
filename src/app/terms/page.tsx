import Link from "next/link";

function LegalFooter() {
  return (
    <footer className="mt-20 border-t border-[var(--color-hairline-soft)] pt-6 text-sm text-[var(--color-body)]">
      <nav aria-label="법적 문서" className="flex gap-5">
        <Link href="/privacy" className="underline-offset-4 hover:underline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[var(--color-primary)]">개인정보 처리방침</Link>
        <Link href="/terms" className="underline-offset-4 hover:underline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[var(--color-primary)]">이용약관</Link>
      </nav>
      <p className="mt-4 text-xs leading-5 text-[var(--color-muted)]">TxAnalyzer는 프로토타입 단계의 서비스입니다.</p>
    </footer>
  );
}

export default function TermsPage() {
  return (
    <main className="min-h-screen bg-[var(--color-canvas)] px-6 py-6 text-[var(--color-ink)] sm:px-10 lg:px-16">
      <div className="mx-auto w-full max-w-[720px]">
        <header className="flex h-16 items-center justify-between border-b border-[var(--color-hairline-soft)]">
          <Link href="/" className="font-display text-2xl tracking-[-0.04em] text-[var(--color-primary)]">TxAnalyzer</Link>
          <Link href="/login" className="text-sm font-medium text-[var(--color-body)] underline-offset-4 hover:underline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[var(--color-primary)]">로그인</Link>
        </header>

        <article className="py-16 sm:py-20">
          <p className="font-mono-ui text-xs tracking-[0.14em] text-[var(--color-muted)]">LEGAL</p>
          <h1 className="mt-5 font-display text-4xl font-normal tracking-[-0.04em] sm:text-5xl">이용약관</h1>
          <p className="mt-5 text-sm leading-6 text-[var(--color-muted)]">프로토타입용 초안 · 2026년 9월 9일</p>

          <aside className="mt-10 rounded-2xl bg-[var(--color-surface-soft)] p-6 text-sm leading-6 text-[var(--color-body)]">
            이 문서는 법률 자문이 아닌 프로토타입용 초안입니다. 실제 서비스 전에 법률 검토가 필요합니다.
          </aside>

          <div className="mt-12 space-y-10 text-base leading-7 text-[var(--color-body)]">
            <section>
              <h2 className="text-lg font-semibold text-[var(--color-ink)]">1. 서비스 이용</h2>
              <p className="mt-4">TxAnalyzer는 업로드한 CSV 거래 내역을 분석해 카테고리별 지출, 기간별 추이, 반복 결제와 이상 거래 후보, AI 요약, 절약 인사이트를 제공하는 서비스입니다. 분석 결과는 거래 내역을 정리하기 위한 참고 정보이며 금융·투자 조언이 아닙니다.</p>
            </section>

            <section>
              <h2 className="text-lg font-semibold text-[var(--color-ink)]">2. 플랜과 결제</h2>
              <p className="mt-4">Free 플랜은 월 5회의 업로드와 최근 12개월 범위의 분석을 제공합니다. Pro 플랜은 월 $9이며 월 30회의 업로드와 전체 기간의 분석, 모든 구독 누수·이상 거래 및 절약 인사이트를 제공합니다. 모든 플랜은 동시에 한 건만 분석합니다.</p>
              <p className="mt-4">Pro 플랜 결제는 Merchant of Record인 Polar를 통한 결제로 처리됩니다. 결제와 영수증, 고객 정보 관리는 Polar의 결제 화면과 고객 포털을 통해 이루어집니다.</p>
            </section>

            <section>
              <h2 className="text-lg font-semibold text-[var(--color-ink)]">3. 해지</h2>
              <p className="mt-4">Pro 구독은 Polar 고객 포털에서 해지할 수 있습니다. 해지해도 이미 결제된 결제 주기 종료까지 이용할 수 있습니다. 결제 주기가 끝나면 Free 플랜으로 전환되며, 이후 조회 범위와 티저 정책이 Free 플랜에 맞게 적용됩니다.</p>
            </section>

            <section>
              <h2 className="text-lg font-semibold text-[var(--color-ink)]">4. 데이터와 이용자의 책임</h2>
              <p className="mt-4">업로드할 파일에 대한 권리와 정확성은 이용자에게 있습니다. 서비스는 원본 CSV를 보관하지 않으며, 분석을 위해 전송되는 데이터의 범위와 처리 방식은 개인정보 처리방침에 설명되어 있습니다.</p>
            </section>

            <section>
              <h2 className="text-lg font-semibold text-[var(--color-ink)]">5. 서비스의 변경</h2>
              <p className="mt-4">TxAnalyzer는 프로토타입 서비스의 안정성과 범위를 위해 기능을 변경하거나 중단할 수 있습니다. 중요한 변경은 서비스 화면을 통해 안내합니다.</p>
            </section>
          </div>

          <LegalFooter />
        </article>
      </div>
    </main>
  );
}
