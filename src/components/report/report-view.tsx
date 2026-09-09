import type { CSSProperties } from "react";

import type { UploadReport } from "../../types";

interface ReportViewProps {
  report: UploadReport;
  skippedRowCount?: number;
  onRetry?: () => void;
  onUpgrade?: () => void;
}

function formatInteger(value: bigint): string {
  return value.toString().replace(/\B(?=(\d{3})+(?!\d))/g, ",");
}

function decimalToScaledInteger(value: string, scale = 2): bigint {
  const normalized = value.trim().replace(/,/g, "");
  const negative = normalized.startsWith("-");
  const unsigned = negative ? normalized.slice(1) : normalized;
  const [whole = "0", fraction = ""] = unsigned.split(".");
  const digits = `${fraction}${"0".repeat(scale)}`.slice(0, scale);
  const scaled = BigInt(whole || "0") * (BigInt(10) ** BigInt(scale)) + BigInt(digits || "0");
  return negative ? -scaled : scaled;
}

function formatWon(value: string): string {
  const scaled = decimalToScaledInteger(value);
  const negative = scaled < BigInt(0);
  const absolute = negative ? -scaled : scaled;
  const base = BigInt(100);
  const whole = absolute / base;
  const remainder = absolute % base;
  const roundedWhole = remainder >= BigInt(50) ? whole + BigInt(1) : whole;
  return `${negative ? "-" : ""}₩${formatInteger(roundedWhole)}`;
}

function safePercent(value: string): string {
  return /^\d{1,3}(?:\.\d{1,2})?$/.test(value) ? value : "0";
}

function ratioPercent(value: string, max: string): string {
  const scaledValue = decimalToScaledInteger(value);
  const scaledMax = decimalToScaledInteger(max);
  if (scaledValue <= BigInt(0) || scaledMax <= BigInt(0)) return "0";
  const scaledPercent = (scaledValue * BigInt(10_000)) / scaledMax;
  const whole = scaledPercent / BigInt(100);
  const fraction = (scaledPercent % BigInt(100)).toString().padStart(2, "0");
  return `${whole}.${fraction}`;
}

function Bar({ width }: { width: string }) {
  const style: CSSProperties = { width: `${width}%` };
  return (
    <div className="h-2 w-full rounded-full bg-[var(--color-hairline-soft)]" aria-hidden="true">
      <div className="h-2 rounded-full bg-[var(--color-primary)]" style={style} />
    </div>
  );
}

function Card({ children, className = "" }: { children: React.ReactNode; className?: string }) {
  return (
    <section className={`rounded-2xl border border-[var(--color-hairline-soft)] bg-[var(--color-canvas)] p-6 shadow-[0_4px_12px_rgba(0,0,0,.04)] sm:p-8 ${className}`}>
      {children}
    </section>
  );
}

function LockedTeaser({
  children,
  label,
  onUpgrade,
}: {
  children: React.ReactNode;
  label: string;
  onUpgrade?: () => void;
}) {
  return (
    <div className="mt-5 rounded-xl bg-[var(--color-surface-soft)] p-5">
      <div className="text-sm font-semibold text-[var(--color-ink)]">{label}</div>
      <div className="mt-3">{children}</div>
      <button
        type="button"
        onClick={onUpgrade}
        className="mt-5 text-sm font-semibold text-[var(--color-primary)] underline-offset-4 hover:underline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[var(--color-primary)]"
      >
        업그레이드
      </button>
    </div>
  );
}

function CategoryCard({ report }: { report: UploadReport }) {
  const categories = report.aggregates.categorySpending;
  return (
    <Card>
      <p className="font-mono-ui text-xs tracking-[0.12em] text-[var(--color-muted)]">01</p>
      <h2 className="mt-3 text-lg font-semibold">카테고리별 지출</h2>
      {categories.length === 0 ? (
        <p className="mt-6 text-sm text-[var(--color-body)]">카테고리별 지출이 없습니다.</p>
      ) : (
        <ul className="mt-6 space-y-5">
          {categories.map((item) => (
            <li key={item.category}>
              <div className="flex items-baseline justify-between gap-4 text-sm">
                <span className="font-medium text-[var(--color-ink)]">{item.category}</span>
                <span className="font-mono-ui text-[var(--color-ink)]">{formatWon(item.totalAmount)}</span>
              </div>
              <div className="mt-2"><Bar width={safePercent(item.percentage)} /></div>
              <div className="mt-2 flex justify-between text-xs text-[var(--color-muted)]">
                <span>{item.transactionCount}건</span>
                <span className="font-mono-ui">{item.percentage}%</span>
              </div>
            </li>
          ))}
        </ul>
      )}
    </Card>
  );
}

function TrendCard({ report }: { report: UploadReport }) {
  const trends = report.aggregates.monthlyTrend;
  const max = trends.reduce((current, item) => {
    const currentValue = decimalToScaledInteger(current);
    const itemValue = decimalToScaledInteger(item.totalAmount);
    return itemValue > currentValue ? item.totalAmount : current;
  }, "0.00");

  return (
    <Card>
      <p className="font-mono-ui text-xs tracking-[0.12em] text-[var(--color-muted)]">02</p>
      <h2 className="mt-3 text-lg font-semibold">월별 추이</h2>
      {trends.length === 0 ? (
        <p className="mt-6 text-sm text-[var(--color-body)]">월별 지출 추이가 없습니다.</p>
      ) : (
        <ul className="mt-6 space-y-4">
          {trends.map((item) => (
            <li key={item.month}>
              <div className="flex items-baseline justify-between gap-4 text-sm">
                <span className="font-mono-ui text-[var(--color-body)]">{item.month}</span>
                <span className="font-mono-ui text-[var(--color-ink)]">{formatWon(item.totalAmount)}</span>
              </div>
              <div className="mt-2"><Bar width={ratioPercent(item.totalAmount, max)} /></div>
            </li>
          ))}
        </ul>
      )}
    </Card>
  );
}

function InterpretationFailure({ onRetry }: { onRetry?: () => void }) {
  return (
    <div className="mt-6 rounded-xl bg-[var(--color-surface-soft)] p-5">
      <p className="text-sm leading-6 text-[var(--color-body)]">AI 해석을 불러오지 못했습니다.</p>
      <button
        type="button"
        onClick={onRetry}
        className="mt-4 h-10 rounded-full border border-[var(--color-hairline)] px-4 text-sm font-medium text-[var(--color-ink)] hover:border-[var(--color-primary)] focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[var(--color-primary)]"
      >
        다시 시도
      </button>
    </div>
  );
}

function InterpretationCard({ report, onRetry }: { report: UploadReport; onRetry?: () => void }) {
  return (
    <Card>
      <p className="font-mono-ui text-xs tracking-[0.12em] text-[var(--color-muted)]">03</p>
      <h2 className="mt-3 text-lg font-semibold">AI 요약</h2>
      {report.interpretation ? (
        <p className="mt-6 whitespace-pre-line text-base leading-7 text-[var(--color-body)]">{report.interpretation.summary}</p>
      ) : (
        <InterpretationFailure onRetry={onRetry} />
      )}
    </Card>
  );
}

function AnomaliesCard({ report, onUpgrade, onRetry }: { report: UploadReport; onUpgrade?: () => void; onRetry?: () => void }) {
  const interpretation = report.interpretation;
  return (
    <Card>
      <p className="font-mono-ui text-xs tracking-[0.12em] text-[var(--color-muted)]">04</p>
      <h2 className="mt-3 text-lg font-semibold">이상 거래 및 구독 누수</h2>
      {interpretation === null ? (
        <InterpretationFailure onRetry={onRetry} />
      ) : (
        <>
          {interpretation.anomalies.locked ? (
            <LockedTeaser label={`${interpretation.anomalies.totalCount}건 발견`} onUpgrade={onUpgrade}>
              <p className="text-sm leading-6 text-[var(--color-body)]">
                상위 {interpretation.anomalies.items.length}건의 상세를 확인할 수 있습니다.
              </p>
              <ul className="mt-4 space-y-3">
                {interpretation.anomalies.items.map((item) => (
                  <li key={item.title} className="text-sm text-[var(--color-ink)]">{item.title}</li>
                ))}
              </ul>
            </LockedTeaser>
          ) : interpretation.anomalies.items.length === 0 ? (
            <p className="mt-6 text-sm text-[var(--color-body)]">확인이 필요한 이상 거래가 없습니다.</p>
          ) : (
            <ul className="mt-6 space-y-5">
              {interpretation.anomalies.items.map((item) => (
                <li key={item.title}>
                  <h3 className="text-sm font-semibold text-[var(--color-ink)]">{item.title}</h3>
                  <p className="mt-2 whitespace-pre-line text-sm leading-6 text-[var(--color-body)]">{item.description}</p>
                </li>
              ))}
            </ul>
          )}
          {report.aggregates.recurringPayments.length > 0 && (
            <div className="mt-8 border-t border-[var(--color-hairline-soft)] pt-6">
              <h3 className="text-sm font-semibold text-[var(--color-ink)]">반복 결제 후보</h3>
              <ul className="mt-4 space-y-3">
                {report.aggregates.recurringPayments.map((item) => (
                  <li key={`${item.merchantNormalized}-${item.lastOccurredOn}`} className="flex items-baseline justify-between gap-4 text-sm">
                    <span className="text-[var(--color-body)]">{item.merchantNormalized}</span>
                    <span className="font-mono-ui text-[var(--color-ink)]">{formatWon(item.averageAmount)}</span>
                  </li>
                ))}
              </ul>
            </div>
          )}
        </>
      )}
    </Card>
  );
}

function SavingsCard({ report, onUpgrade, onRetry }: { report: UploadReport; onUpgrade?: () => void; onRetry?: () => void }) {
  const interpretation = report.interpretation;
  return (
    <Card>
      <p className="font-mono-ui text-xs tracking-[0.12em] text-[var(--color-muted)]">05</p>
      <h2 className="mt-3 text-lg font-semibold">절약 인사이트</h2>
      {interpretation === null ? (
        <InterpretationFailure onRetry={onRetry} />
      ) : interpretation.savings.locked ? (
        <LockedTeaser label={`${interpretation.savings.totalCount}개 중 ${interpretation.savings.items.length}개 표시`} onUpgrade={onUpgrade}>
          <ul className="space-y-4">
            {interpretation.savings.items.map((item) => (
              <li key={item.title}>
                <h3 className="text-sm font-semibold text-[var(--color-ink)]">{item.title}</h3>
                <p className="mt-2 whitespace-pre-line text-sm leading-6 text-[var(--color-body)]">{item.description}</p>
              </li>
            ))}
          </ul>
        </LockedTeaser>
      ) : interpretation.savings.items.length === 0 ? (
        <p className="mt-6 text-sm text-[var(--color-body)]">표시할 절약 인사이트가 없습니다.</p>
      ) : (
        <ul className="mt-6 space-y-5">
          {interpretation.savings.items.map((item) => (
            <li key={item.title}>
              <h3 className="text-sm font-semibold text-[var(--color-ink)]">{item.title}</h3>
              <p className="mt-2 whitespace-pre-line text-sm leading-6 text-[var(--color-body)]">{item.description}</p>
            </li>
          ))}
        </ul>
      )}
    </Card>
  );
}

export function ReportView({ report, skippedRowCount = 0, onRetry, onUpgrade }: ReportViewProps) {
  const { summary } = report.aggregates;
  return (
    <div>
      <div className="mb-6 flex flex-wrap items-end justify-between gap-4">
        <div>
          <p className="font-mono-ui text-xs tracking-[0.12em] text-[var(--color-muted)]">{report.scope === "full" ? "전체 기간" : "최근 12개월"}</p>
          <h2 className="mt-3 font-display text-3xl font-normal tracking-[-0.04em]">소비 흐름</h2>
        </div>
        <div className="text-right">
          <p className="font-mono-ui text-2xl text-[var(--color-ink)]">{formatWon(summary.totalSpending)}</p>
          <p className="mt-1 text-xs text-[var(--color-muted)]">{summary.transactionCount}건</p>
        </div>
      </div>
      {skippedRowCount > 0 && (
        <p className="mb-6 text-xs leading-5 text-[var(--color-muted)]">{skippedRowCount}행을 읽지 못했습니다.</p>
      )}
      <div className="grid gap-6 lg:grid-cols-2">
        <CategoryCard report={report} />
        <TrendCard report={report} />
        <InterpretationCard report={report} onRetry={onRetry} />
        <AnomaliesCard report={report} onUpgrade={onUpgrade} onRetry={onRetry} />
        <SavingsCard report={report} onUpgrade={onUpgrade} onRetry={onRetry} />
      </div>
    </div>
  );
}
