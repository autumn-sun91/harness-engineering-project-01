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

export default function PrivacyPage() {
  return (
    <main className="min-h-screen bg-[var(--color-canvas)] px-6 py-6 text-[var(--color-ink)] sm:px-10 lg:px-16">
      <div className="mx-auto w-full max-w-[720px]">
        <header className="flex h-16 items-center justify-between border-b border-[var(--color-hairline-soft)]">
          <Link href="/" className="font-display text-2xl tracking-[-0.04em] text-[var(--color-primary)]">TxAnalyzer</Link>
          <Link href="/login" className="text-sm font-medium text-[var(--color-body)] underline-offset-4 hover:underline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[var(--color-primary)]">로그인</Link>
        </header>

        <article className="py-16 sm:py-20">
          <p className="font-mono-ui text-xs tracking-[0.14em] text-[var(--color-muted)]">LEGAL</p>
          <h1 className="mt-5 font-display text-4xl font-normal tracking-[-0.04em] sm:text-5xl">개인정보 처리방침</h1>
          <p className="mt-5 text-sm leading-6 text-[var(--color-muted)]">프로토타입용 초안 · 2026년 9월 9일</p>

          <aside className="mt-10 rounded-2xl bg-[var(--color-surface-soft)] p-6 text-sm leading-6 text-[var(--color-body)]">
            이 문서는 법률 자문이 아닌 프로토타입용 초안입니다. 실제 서비스 전에 법률 검토가 필요합니다.
          </aside>

          <div className="mt-12 space-y-10 text-base leading-7 text-[var(--color-body)]">
            <section>
              <h2 className="text-lg font-semibold text-[var(--color-ink)]">1. 수집하는 정보</h2>
              <p className="mt-4">TxAnalyzer는 Google 로그인으로 확인되는 계정 정보와 서비스 이용을 위해 업로드한 CSV에서 파생된 거래 정보를 처리합니다. 업로드 횟수와 분석 상태 같은 서비스 metadata도 함께 처리됩니다.</p>
            </section>

            <section>
              <h2 className="text-lg font-semibold text-[var(--color-ink)]">2. 거래 데이터의 분석과 전송</h2>
              <p className="mt-4">업로드한 거래 데이터는 분석을 위해 Anthropic API로 전송됩니다. 전송 범위는 컬럼 매핑용 헤더와 대표 행, 분류용 정규화된 가맹점명, 해석용 집계 통계뿐입니다. 거래 원본 전체는 전송하지 않습니다.</p>
              <p className="mt-4">분석 결과의 집계와 분류는 서비스 제공을 위해 처리됩니다. 금액 합계와 기간별 합계는 서비스 코드에서 계산하며, Claude는 컬럼 매핑·가맹점 분류·통계 해석에 사용됩니다.</p>
            </section>

            <section>
              <h2 className="text-lg font-semibold text-[var(--color-ink)]">3. 보관과 삭제</h2>
              <p className="mt-4">원본 CSV는 보관하지 않습니다. 파일은 메모리에서만 처리합니다. 분석을 위해 생성된 파생 데이터와 결과는 계정이 유지되는 동안 서비스 제공 목적으로 보관합니다.</p>
              <p className="mt-4">계정을 삭제하면 계정에 연결된 구독 정보와 파생 데이터, 분석 결과를 파기합니다. 원본 CSV는 애초에 보관하지 않으므로 삭제할 원본 파일이 없습니다.</p>
            </section>

            <section>
              <h2 className="text-lg font-semibold text-[var(--color-ink)]">4. 이용자의 선택</h2>
              <p className="mt-4">거래 내역을 업로드하지 않으면 거래 데이터 분석 기능을 이용할 수 없습니다. 계정 삭제와 서비스 이용 중단은 설정 화면에서 요청할 수 있습니다.</p>
            </section>
          </div>

          <LegalFooter />
        </article>
      </div>
    </main>
  );
}
