import { redirect } from "next/navigation";

import { signOut } from "../../login/actions";
import DashboardClient from "../../../components/dashboard/dashboard-client";
import { createServerSupabaseClient } from "../../../services/supabase/server";
import type { UploadReport } from "../../../types";
import type { DashboardUpload, DashboardUploadStatus } from "../../../types/dashboard";

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

function statusValue(value: unknown): DashboardUploadStatus {
  if (value === "queued" || value === "uploading" || value === "parsing" || value === "analyzing" || value === "partial" || value === "completed" || value === "failed") {
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

function isReportAvailable(status: DashboardUploadStatus): boolean {
  return status === "completed" || status === "partial";
}

export default async function DashboardPage({
  searchParams,
}: {
  searchParams?: Promise<{ uploadId?: string | string[] }>;
}) {
  const supabase = await createServerSupabaseClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    redirect("/login?next=%2Fdashboard");
  }

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
  const params = searchParams ? await searchParams : {};
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
      logoutAction={signOut}
    />
  );
}
