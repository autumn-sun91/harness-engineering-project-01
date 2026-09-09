import { redirect } from "next/navigation";

import { signOut } from "../../login/actions";
import { syncSubscriptionFromCheckout } from "../../../lib/billing/checkout-sync";
import { isProSubscription } from "../../../lib/billing/subscription";
import DashboardClient from "../../../components/dashboard/dashboard-client";
import { createServerSupabaseClient } from "../../../services/supabase/server";
import type { UploadReport, UploadStatus } from "../../../types";
import type { DashboardUpload } from "../../../types/dashboard";

const METADATA_COLUMNS = [
  "id",
  "user_id",
  "original_filename",
  "file_size",
  "row_count",
  "skipped_row_count",
  "status",
  "error_code",
  "scope_start",
  "scope_end",
  "currency",
  "retry_count",
  "uploaded_at",
  "started_at",
  "completed_at",
].join(",");

type MetadataRow = Record<string, unknown>;

function stringValue(value: unknown): string | null {
  return typeof value === "string" ? value : null;
}

function numberValue(value: unknown): number {
  return typeof value === "number" && Number.isFinite(value) ? value : 0;
}

function statusValue(value: unknown): UploadStatus {
  if (value === "queued" || value === "parsing" || value === "analyzing" || value === "partial" || value === "completed" || value === "failed") {
    return value;
  }
  return "failed";
}

function toDashboardUpload(row: MetadataRow): DashboardUpload {
  return {
    id: stringValue(row.id) ?? "",
    userId: stringValue(row.user_id) ?? "",
    originalFilename: stringValue(row.original_filename) ?? "이름 없는 파일",
    fileSize: numberValue(row.file_size),
    rowCount: numberValue(row.row_count),
    skippedRowCount: numberValue(row.skipped_row_count),
    status: statusValue(row.status),
    errorCode: stringValue(row.error_code),
    scopeStart: stringValue(row.scope_start),
    scopeEnd: stringValue(row.scope_end),
    currency: stringValue(row.currency),
    retryCount: numberValue(row.retry_count),
    uploadedAt: stringValue(row.uploaded_at) ?? "",
    startedAt: stringValue(row.started_at),
    completedAt: stringValue(row.completed_at),
  };
}

function isReportAvailable(status: UploadStatus): boolean {
  return status === "completed" || status === "partial";
}

function subscriptionFromRow(row: Record<string, unknown> | null, userId: string) {
  if (!row) {
    return null;
  }
  const plan = row.plan === "pro" ? "pro" : "free";
  const polarStatus = typeof row.polar_status === "string" ? row.polar_status : null;
  const currentPeriodEnd = typeof row.current_period_end === "string" ? row.current_period_end : null;
  const cancelAtPeriodEnd = row.cancel_at_period_end === true;
  return {
    userId,
    plan,
    polarStatus,
    cancelAtPeriodEnd,
    currentPeriodEnd,
  } as const;
}

function formatPeriodEnd(value: string): string {
  const date = new Date(value);
  if (!Number.isFinite(date.getTime())) {
    return value;
  }
  return new Intl.DateTimeFormat("ko-KR", {
    dateStyle: "medium",
    timeZone: "Asia/Seoul",
  }).format(date);
}

export default async function DashboardPage({
  searchParams,
}: {
  searchParams?: Promise<{
    uploadId?: string | string[];
    checkout?: string | string[];
    checkout_id?: string | string[];
  }>;
}) {
  const supabase = await createServerSupabaseClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    redirect("/login?next=%2Fdashboard");
  }

  const params = searchParams ? await searchParams : {};
  const checkoutStatus = typeof params.checkout === "string" ? params.checkout : null;
  const checkoutId = typeof params.checkout_id === "string" ? params.checkout_id : null;
  if (checkoutStatus === "success" && checkoutId) {
    try {
      await syncSubscriptionFromCheckout({
        checkoutId,
        userId: user.id,
        supabase,
      });
    } catch {
      // The webhook remains the durable backup path if the immediate sync fails.
    }
  }

  const { data: subscriptionData } = await supabase
    .from("subscriptions")
    .select("plan,polar_status,cancel_at_period_end,current_period_end")
    .eq("user_id", user.id)
    .maybeSingle();
  const subscriptionRow = typeof subscriptionData === "object" && subscriptionData !== null
    ? subscriptionData as Record<string, unknown>
    : null;
  const subscription = subscriptionFromRow(subscriptionRow, user.id);
  const isPro = subscription ? isProSubscription(subscription) : false;
  const subscriptionNotice = subscription
    && isPro
    && subscription.cancelAtPeriodEnd
    && subscription.currentPeriodEnd
    ? `현재 결제 주기(${formatPeriodEnd(subscription.currentPeriodEnd)})까지 Pro를 이용할 수 있어요`
    : null;

  const { data } = await supabase
    .from("csv_uploads")
    .select(METADATA_COLUMNS)
    .eq("user_id", user.id)
    .order("uploaded_at", { ascending: false });
  const rawData: unknown = data;
  const rows = Array.isArray(rawData)
    ? rawData.filter((row): row is MetadataRow => typeof row === "object" && row !== null)
    : [];
  const uploads = rows.map(toDashboardUpload).filter((upload) => upload.id.length > 0);
  const requestedUploadId = typeof params.uploadId === "string" ? params.uploadId : null;
  const selectedUpload = (requestedUploadId ? uploads.find((upload) => upload.id === requestedUploadId) : null) ?? uploads[0] ?? null;
  let report: UploadReport | null = null;

  if (selectedUpload && isReportAvailable(selectedUpload.status)) {
    const result = await supabase.rpc("get_upload_report", { upload_id: selectedUpload.id });
    if (!result.error && result.data && typeof result.data === "object") {
      report = result.data as UploadReport;
    }
  }

  return (
    <DashboardClient
      initialUploads={uploads}
      initialReport={report}
      initialUploadId={selectedUpload?.id ?? null}
      checkoutNotice={checkoutStatus === "cancelled" ? "업그레이드가 취소되었어요" : null}
      subscriptionNotice={subscriptionNotice}
      isPro={isPro}
      logoutAction={signOut}
    />
  );
}
