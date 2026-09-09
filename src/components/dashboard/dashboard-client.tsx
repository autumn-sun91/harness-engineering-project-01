"use client";

import Link from "next/link";
import { useCallback, useState } from "react";

import { ReportView } from "../report/report-view";
import UploadDropzone from "../upload/upload-dropzone";
import { getUploadErrorMessage } from "../upload/upload-errors";
import type { UploadReport } from "../../types";
import type { DashboardUpload, DashboardUploadDetail, DashboardUploadStatus } from "../../types/dashboard";

interface DashboardClientProps {
  initialUploads: DashboardUpload[];
  initialReport: UploadReport | null;
  initialUploadId?: string | null;
  checkoutNotice?: string | null;
  subscriptionNotice?: string | null;
  isPro?: boolean;
  logoutAction?: () => Promise<void>;
}

const ACTIVE_STATUSES = new Set<DashboardUploadStatus>(["queued", "uploading", "parsing", "analyzing"]);

function statusLabel(status: DashboardUploadStatus): string {
  const labels: Record<DashboardUploadStatus, string> = {
    queued: "대기 중",
    uploading: "업로드 중",
    parsing: "파일 읽는 중",
    analyzing: "분석 중",
    partial: "부분 완료",
    completed: "완료",
    failed: "실패",
  };
  return labels[status];
}

function UpgradeModal({ onClose }: { onClose: () => void }) {
  return (
    <div className="fixed inset-0 z-20 flex items-center justify-center bg-[rgba(10,11,13,.28)] px-6" role="presentation">
      <div aria-labelledby="dashboard-upgrade-title" aria-modal="true" className="w-full max-w-md rounded-2xl bg-[var(--color-canvas)] p-8 shadow-[0_4px_12px_rgba(0,0,0,.04)]" role="dialog">
        <h2 id="dashboard-upgrade-title" className="text-lg font-semibold">Pro 리포트 열기</h2>
        <p className="mt-3 text-sm leading-6 text-[var(--color-body)]">전체 기간의 소비 흐름과 모든 인사이트를 확인할 수 있습니다.</p>
        <div className="mt-6 flex justify-end gap-3">
          <button type="button" onClick={onClose} className="h-11 rounded-full border border-[var(--color-hairline)] px-5 text-sm font-medium focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[var(--color-primary)]">닫기</button>
          <form action="/api/polar/checkout" method="post">
            <button type="submit" className="inline-flex h-11 items-center rounded-full bg-[var(--color-primary)] px-5 text-sm font-semibold text-white hover:bg-[var(--color-primary-active)] focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[var(--color-primary)]">업그레이드</button>
          </form>
        </div>
      </div>
    </div>
  );
}

function HistoryList({ uploads, selectedUploadId }: { uploads: DashboardUpload[]; selectedUploadId: string | null }) {
  return (
    <section className="mt-14" aria-labelledby="history-title">
      <div className="flex items-baseline justify-between gap-4">
        <h2 id="history-title" className="text-lg font-semibold">업로드 이력</h2>
        <span className="font-mono-ui text-xs text-[var(--color-muted)]">{uploads.length}건</span>
      </div>
      <ul className="mt-5 divide-y divide-[var(--color-hairline-soft)] border-y border-[var(--color-hairline-soft)]">
        {uploads.map((upload) => (
          <li key={upload.id}>
            <Link href={`/dashboard?uploadId=${encodeURIComponent(upload.id)}`} aria-current={upload.id === selectedUploadId ? "page" : undefined} className="flex flex-wrap items-center justify-between gap-4 py-5 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[var(--color-primary)]">
              <span>
                <span className="block text-sm font-medium text-[var(--color-ink)]">{upload.originalFilename}</span>
                <span className="mt-1 block font-mono-ui text-xs text-[var(--color-muted)]">{upload.scopeStart ?? "기간 없음"} — {upload.scopeEnd ?? "기간 없음"}</span>
              </span>
              <span className="flex items-center gap-4 text-sm">
                {upload.skippedRowCount > 0 && <span className="text-xs text-[var(--color-muted)]">{upload.skippedRowCount}행 누락</span>}
                <span className={upload.status === "failed" ? "text-[var(--color-semantic-down)]" : "text-[var(--color-body)]"}>{statusLabel(upload.status)}</span>
              </span>
            </Link>
          </li>
        ))}
      </ul>
    </section>
  );
}

export default function DashboardClient({ initialUploads, initialReport, initialUploadId = null, checkoutNotice = null, subscriptionNotice = null, isPro = false, logoutAction }: DashboardClientProps) {
  const [uploads, setUploads] = useState(initialUploads);
  const [selectedUploadId, setSelectedUploadId] = useState(initialUploadId ?? initialUploads[0]?.id ?? null);
  const [report, setReport] = useState(initialReport);
  const [retryNonce, setRetryNonce] = useState(0);
  const [upgradeOpen, setUpgradeOpen] = useState(false);

  const selectedUpload = uploads.find((upload) => upload.id === selectedUploadId) ?? null;
  const activeUploadId = uploads.find((upload) => ACTIVE_STATUSES.has(upload.status))?.id ?? null;

  const handleStarted = useCallback((uploadId: string, filename: string) => {
    const now = new Date().toISOString();
    const nextUpload: DashboardUpload = {
      id: uploadId,
      userId: "",
      originalFilename: filename,
      fileSize: 0,
      rowCount: 0,
      skippedRowCount: 0,
      status: "queued",
      errorCode: null,
      scopeStart: null,
      scopeEnd: null,
      currency: null,
      retryCount: 0,
      uploadedAt: now,
      startedAt: null,
      completedAt: null,
    };
    setUploads((current) => [nextUpload, ...current.filter((upload) => upload.id !== uploadId)]);
    setSelectedUploadId(uploadId);
    setReport(null);
  }, []);

  const handleDetail = useCallback((detail: DashboardUploadDetail) => {
    setSelectedUploadId(detail.uploadId);
    setReport(detail.report);
    setUploads((current) => current.map((upload) => upload.id === detail.uploadId ? { ...upload, status: detail.status, errorCode: detail.errorCode } : upload));
  }, []);

  const empty = uploads.length === 0;
  return (
    <main className="min-h-screen bg-[var(--color-canvas)] px-6 py-6 text-[var(--color-ink)] sm:px-10 lg:px-16">
      <div className="mx-auto w-full max-w-[1200px]">
        <header className="flex h-16 items-center justify-between border-b border-[var(--color-hairline-soft)]">
          <Link href="/dashboard" className="font-display text-2xl tracking-[-0.04em] text-[var(--color-primary)]">TxAnalyzer</Link>
          <div className="flex items-center gap-4">
            {isPro && <a href="/api/polar/portal" className="text-sm font-medium text-[var(--color-body)] underline-offset-4 hover:underline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[var(--color-primary)]">결제 관리</a>}
            <form action={logoutAction}>
              <button type="submit" className="rounded-full border border-[var(--color-hairline)] px-5 py-2.5 text-sm font-medium focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[var(--color-primary)]">로그아웃</button>
            </form>
          </div>
        </header>

        {(checkoutNotice || subscriptionNotice) && (
          <div className="space-y-2 pt-6" role="status">
            {checkoutNotice && <p className="text-sm text-[var(--color-body)]">{checkoutNotice}</p>}
            {subscriptionNotice && <p className="text-sm text-[var(--color-body)]">{subscriptionNotice}</p>}
          </div>
        )}

        <section className="py-12 sm:py-16">
          <p className="font-mono-ui text-xs tracking-[0.14em] text-[var(--color-muted)]">대시보드</p>
          <div className="mt-4 flex flex-wrap items-end justify-between gap-6">
            <div>
              <h1 className="font-display text-4xl font-normal tracking-[-0.04em] sm:text-5xl">{empty ? "분석을 시작하세요" : "최근 분석"}</h1>
              <p className="mt-5 max-w-xl text-base leading-7 text-[var(--color-body)]">{empty ? "거래 내역을 올리면 소비 흐름과 반복되는 지출을 확인할 수 있습니다." : "새 CSV를 올리거나 이전 분석을 선택해 결과를 확인할 수 있습니다."}</p>
            </div>
            {!empty && <span className="rounded-full bg-[var(--color-surface-soft)] px-4 py-2 text-xs font-medium text-[var(--color-body)]">원본 CSV 미보관</span>}
          </div>
        </section>

        {empty ? (
          <section className="max-w-2xl" aria-labelledby="empty-state-title">
            <h2 id="empty-state-title" className="sr-only">첫 분석</h2>
            <p className="mb-5 text-base text-[var(--color-body)]">CSV 파일을 업로드해 분석을 시작하세요</p>
            <UploadDropzone onStarted={handleStarted} onDetail={handleDetail} />
          </section>
        ) : (
          <>
            <section aria-labelledby="new-upload-title" className="max-w-2xl">
              <h2 id="new-upload-title" className="mb-5 text-lg font-semibold">새 분석</h2>
              <UploadDropzone initialUploadId={activeUploadId} retryUploadId={selectedUploadId} retryNonce={retryNonce} initialErrorCode={selectedUpload?.status === "failed" ? selectedUpload.errorCode : null} onStarted={handleStarted} onDetail={handleDetail} />
            </section>
            <section className="mt-14" aria-labelledby="report-title">
              <h2 id="report-title" className="sr-only">분석 결과</h2>
              {report ? (
                <ReportView report={report} skippedRowCount={selectedUpload?.skippedRowCount ?? 0} onRetry={() => setRetryNonce((current) => current + 1)} onUpgrade={() => setUpgradeOpen(true)} />
              ) : selectedUpload?.status === "failed" ? (
                <div className="rounded-2xl bg-[var(--color-surface-soft)] p-6"><p className="text-sm leading-6 text-[var(--color-body)]">{getUploadErrorMessage(selectedUpload.errorCode)}</p></div>
              ) : (
                <div className="rounded-2xl bg-[var(--color-surface-soft)] p-6"><p className="text-sm leading-6 text-[var(--color-body)]">분석 결과를 준비하고 있습니다.</p></div>
              )}
            </section>
            <HistoryList uploads={uploads} selectedUploadId={selectedUploadId} />
          </>
        )}
      </div>
      {upgradeOpen && <UpgradeModal onClose={() => setUpgradeOpen(false)} />}
    </main>
  );
}
