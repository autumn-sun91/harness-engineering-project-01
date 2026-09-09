"use client";

import { useCallback, useEffect, useRef, useState } from "react";

import { MAX_FILE_SIZE_BYTES } from "../../types";
import type { DashboardUploadDetail } from "../../types/dashboard";
import { getUploadErrorMessage } from "./upload-errors";

const ACTIVE_STATUSES = new Set(["queued", "uploading", "parsing", "analyzing"]);
const POLL_TIMEOUT_MS = 2 * 60 * 1_000;

interface UploadDropzoneProps {
  initialUploadId?: string | null;
  initialErrorCode?: string | null;
  retryUploadId?: string | null;
  retryNonce?: number;
  onStarted?: (uploadId: string, filename: string) => void;
  onDetail?: (detail: DashboardUploadDetail) => void;
}

interface ApiErrorBody {
  error?: {
    code?: unknown;
  };
}

function errorCodeFromBody(value: unknown): string {
  if (typeof value === "object" && value !== null) {
    const error = (value as ApiErrorBody).error;
    if (error && typeof error.code === "string") {
      return error.code;
    }
  }
  return "analysis_failed";
}

function statusFromValue(value: unknown): DashboardUploadDetail["status"] {
  if (
    value === "queued" ||
    value === "uploading" ||
    value === "parsing" ||
    value === "analyzing" ||
    value === "partial" ||
    value === "completed" ||
    value === "failed"
  ) {
    return value;
  }
  return "failed";
}

function detailFromBody(value: unknown): DashboardUploadDetail | null {
  if (typeof value !== "object" || value === null) {
    return null;
  }
  const body = value as Record<string, unknown>;
  if (typeof body.uploadId !== "string") {
    return null;
  }
  return {
    uploadId: body.uploadId,
    status: statusFromValue(body.status),
    errorCode: typeof body.errorCode === "string" ? body.errorCode : null,
    report: (body.report ?? null) as DashboardUploadDetail["report"],
  };
}

function wait(milliseconds: number): Promise<void> {
  return new Promise((resolve) => setTimeout(resolve, milliseconds));
}

function validateFile(file: File): string | null {
  if (!file.name.toLowerCase().endsWith(".csv")) {
    return "invalid_file_type";
  }
  if (file.size > MAX_FILE_SIZE_BYTES) {
    return "file_too_large";
  }
  if (file.size === 0) {
    return "empty_file";
  }
  return null;
}

function Spinner() {
  return (
    <span
      aria-hidden="true"
      className="inline-block h-4 w-4 animate-spin rounded-full border-2 border-[var(--color-primary-disabled)] border-t-[var(--color-primary)]"
    />
  );
}

function UpgradeModal({ onClose }: { onClose: () => void }) {
  return (
    <div className="fixed inset-0 z-20 flex items-center justify-center bg-[rgba(10,11,13,.28)] px-6" role="presentation">
      <div
        aria-labelledby="upgrade-title"
        aria-modal="true"
        className="w-full max-w-md rounded-2xl bg-[var(--color-canvas)] p-8 shadow-[0_4px_12px_rgba(0,0,0,.04)]"
        role="dialog"
      >
        <h2 id="upgrade-title" className="text-lg font-semibold text-[var(--color-ink)]">
          업로드 한도에 도달했습니다
        </h2>
        <p className="mt-3 text-sm leading-6 text-[var(--color-body)]">
          Pro로 업그레이드하면 이번 달에 더 많은 파일을 분석할 수 있습니다.
        </p>
        <div className="mt-6 flex items-center justify-end gap-3">
          <button
            type="button"
            onClick={onClose}
            className="h-11 rounded-full border border-[var(--color-hairline)] px-5 text-sm font-medium text-[var(--color-ink)] focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[var(--color-primary)]"
          >
            닫기
          </button>
          <form action="/api/polar/checkout" method="post">
            <button
              type="submit"
              className="inline-flex h-11 items-center rounded-full bg-[var(--color-primary)] px-5 text-sm font-semibold text-white hover:bg-[var(--color-primary-active)] focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[var(--color-primary)]"
            >
              업그레이드
            </button>
          </form>
        </div>
      </div>
    </div>
  );
}

export default function UploadDropzone({
  initialUploadId = null,
  initialErrorCode = null,
  retryUploadId = null,
  retryNonce = 0,
  onStarted,
  onDetail,
}: UploadDropzoneProps) {
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [errorCode, setErrorCode] = useState<string | null>(initialErrorCode);
  const [dragging, setDragging] = useState(false);
  const [busy, setBusy] = useState(Boolean(initialUploadId));
  const [timedOut, setTimedOut] = useState(false);
  const [upgradeOpen, setUpgradeOpen] = useState(false);
  const inputRef = useRef<HTMLInputElement>(null);
  const mountedRef = useRef(true);
  const lastRetryNonce = useRef(0);

  useEffect(() => {
    mountedRef.current = true;
    return () => {
      mountedRef.current = false;
    };
  }, []);

  useEffect(() => {
    setErrorCode(initialErrorCode);
  }, [initialErrorCode]);

  const showError = useCallback((code: string) => {
    if (!mountedRef.current) return;
    setErrorCode(code);
    setTimedOut(false);
    if (code === "upload_limit_reached") {
      setUpgradeOpen(true);
    }
  }, []);

  const pollUpload = useCallback(async (uploadId: string, cancelled: () => boolean): Promise<void> => {
    setBusy(true);
    setTimedOut(false);
    const startedAt = Date.now();
    let attempt = 0;

    try {
      while (!cancelled() && mountedRef.current) {
        await wait(attempt === 0 ? 2_000 : attempt === 1 ? 4_000 : 5_000);
        if (cancelled() || !mountedRef.current) return;

        let response: Response;
        try {
          response = await fetch(`/api/uploads/${encodeURIComponent(uploadId)}`);
        } catch {
          showError("analysis_failed");
          return;
        }

        let body: unknown = null;
        try {
          body = await response.json();
        } catch {
          body = null;
        }

        if (!response.ok) {
          showError(errorCodeFromBody(body));
          return;
        }

        const detail = detailFromBody(body);
        if (!detail) {
          showError("analysis_failed");
          return;
        }

        onDetail?.(detail);
        if (!ACTIVE_STATUSES.has(detail.status) || detail.status === "partial" || detail.status === "completed") {
          if (detail.status === "failed") {
            showError(detail.errorCode ?? "analysis_failed");
          }
          return;
        }

        attempt += 1;
        if (Date.now() - startedAt >= POLL_TIMEOUT_MS) {
          setTimedOut(true);
          return;
        }
      }
    } finally {
      if (mountedRef.current && !cancelled()) {
        setBusy(false);
      }
    }
  }, [onDetail, showError]);

  const submitFile = useCallback(async (file: File) => {
    const localError = validateFile(file);
    setSelectedFile(file);
    if (localError) {
      showError(localError);
      return;
    }

    setErrorCode(null);
    setTimedOut(false);
    setBusy(true);
    const formData = new FormData();
    formData.append("file", file);

    let response: Response;
    try {
      response = await fetch("/api/analyze", { method: "POST", body: formData });
    } catch {
      showError("analysis_failed");
      setBusy(false);
      return;
    }

    let body: unknown = null;
    try {
      body = await response.json();
    } catch {
      body = null;
    }

    if (!response.ok) {
      showError(errorCodeFromBody(body));
      setBusy(false);
      return;
    }

    const uploadId = typeof body === "object" && body !== null && typeof (body as Record<string, unknown>).uploadId === "string"
      ? (body as Record<string, unknown>).uploadId as string
      : null;
    if (!uploadId) {
      showError("analysis_failed");
      setBusy(false);
      return;
    }

    onStarted?.(uploadId, file.name);
    await pollUpload(uploadId, () => false);
  }, [onStarted, pollUpload, showError]);

  useEffect(() => {
    if (!initialUploadId) return;
    void pollUpload(initialUploadId, () => false);
  }, [initialUploadId, pollUpload]);

  useEffect(() => {
    if (!retryUploadId || retryNonce === 0 || lastRetryNonce.current === retryNonce) return;
    lastRetryNonce.current = retryNonce;
    let cancelled = false;

    const retry = async () => {
      setErrorCode(null);
      setTimedOut(false);
      setBusy(true);
      let response: Response;
      try {
        response = await fetch(`/api/analyze/${encodeURIComponent(retryUploadId)}/retry`, { method: "POST" });
      } catch {
        showError("analysis_failed");
        setBusy(false);
        return;
      }

      let body: unknown = null;
      try {
        body = await response.json();
      } catch {
        body = null;
      }
      if (!response.ok) {
        showError(errorCodeFromBody(body));
        setBusy(false);
        return;
      }
      await pollUpload(retryUploadId, () => cancelled);
    };

    void retry();
    return () => {
      cancelled = true;
    };
  }, [pollUpload, retryNonce, retryUploadId, showError]);

  const handleInputChange = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (file) void submitFile(file);
  };

  const handleDrop = (event: React.DragEvent<HTMLLabelElement>) => {
    event.preventDefault();
    setDragging(false);
    const file = event.dataTransfer.files[0];
    if (file) void submitFile(file);
  };

  const isBusy = busy;

  return (
    <>
      <div className="rounded-2xl border border-[var(--color-hairline)] bg-[var(--color-canvas)] p-5 sm:p-6">
        <label
          htmlFor="csv-upload"
          onDragOver={(event) => {
            event.preventDefault();
            setDragging(true);
          }}
          onDragLeave={() => setDragging(false)}
          onDrop={handleDrop}
          className={`flex min-h-36 cursor-pointer flex-col items-center justify-center rounded-xl border border-dashed px-6 py-8 text-center transition-colors focus-within:outline-2 focus-within:outline-offset-2 focus-within:outline-[var(--color-primary)] ${dragging ? "border-[var(--color-primary)] bg-[var(--color-surface-soft)]" : "border-[var(--color-hairline)]"}`}
        >
          <span className="text-base font-semibold text-[var(--color-ink)]">CSV 파일 업로드</span>
          <span className="mt-2 text-sm leading-6 text-[var(--color-body)]">파일을 선택하거나 이곳으로 끌어오세요. 4MB 이하의 CSV만 지원합니다.</span>
          <input
            ref={inputRef}
            id="csv-upload"
            type="file"
            accept=".csv,text/csv"
            onChange={handleInputChange}
            disabled={isBusy}
            className="sr-only"
          />
        </label>

        <div className="mt-4 flex flex-wrap items-center gap-3">
          <button
            type="button"
            onClick={() => inputRef.current?.click()}
            disabled={isBusy}
            className="h-11 rounded-full bg-[var(--color-primary)] px-6 text-sm font-semibold text-white hover:bg-[var(--color-primary-active)] disabled:cursor-not-allowed disabled:bg-[var(--color-primary-disabled)] focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[var(--color-primary)]"
          >
            파일 선택
          </button>
          {selectedFile && !isBusy && !errorCode && (
            <span className="text-sm text-[var(--color-body)]">{selectedFile.name}</span>
          )}
        </div>

        {isBusy && (
          <div className="mt-5 flex items-center gap-3 text-sm text-[var(--color-body)]" role="status" aria-live="polite">
            <Spinner />
            <span>분석 중입니다. 최대 1분 정도 걸려요</span>
          </div>
        )}
        {timedOut && !isBusy && (
          <p className="mt-5 text-sm leading-6 text-[var(--color-body)]" role="status">
            분석은 계속됩니다. 나중에 다시 확인하세요.
          </p>
        )}
        {errorCode && !isBusy && (
          <p className="mt-5 text-sm leading-6 text-[var(--color-semantic-down)]" role="alert">
            {getUploadErrorMessage(errorCode)}
          </p>
        )}
        <p className="mt-5 text-xs leading-5 text-[var(--color-muted)]">
          원본 CSV는 저장하지 않습니다. 분석을 위해 컬럼 헤더·대표 행·정규화된 가맹점명·집계 통계만 Anthropic API로 전송합니다.
        </p>
      </div>
      {upgradeOpen && <UpgradeModal onClose={() => setUpgradeOpen(false)} />}
    </>
  );
}
