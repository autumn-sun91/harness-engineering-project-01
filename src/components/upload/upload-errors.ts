const ERROR_MESSAGES: Record<string, string> = {
  unauthorized: "로그인이 필요합니다.",
  invalid_file_type: "CSV 파일만 올릴 수 있습니다.",
  file_too_large: "파일이 4MB를 넘습니다.",
  empty_file: "파일에 거래 내역이 없습니다.",
  encoding_error: "파일 인코딩을 읽지 못했습니다. UTF-8로 저장한 뒤 다시 올려주세요.",
  parse_failed: "파일을 읽지 못했습니다.",
  column_mapping_failed: "컬럼을 인식하지 못했습니다. 날짜·내용·금액 컬럼이 있는지 확인해주세요.",
  mixed_currency: "한 파일에 여러 통화가 섞여 있습니다. 통화별로 나눠서 올려주세요.",
  unsupported_transaction_semantics: "거래 유형을 구분하지 못했습니다.",
  upload_limit_reached: "이번 달 업로드 횟수를 모두 썼습니다.",
  analysis_in_progress: "이미 분석 중인 파일이 있습니다. 완료된 뒤 다시 시도해주세요.",
  retry_limit_exceeded: "재시도 횟수를 모두 썼습니다.",
  analysis_timeout: "분석 시간이 초과됐습니다.",
  analysis_failed: "분석에 실패했습니다.",
  not_found: "리포트를 찾을 수 없습니다.",
};

export function getUploadErrorMessage(code: string | null | undefined): string {
  return ERROR_MESSAGES[code ?? ""] ?? ERROR_MESSAGES.analysis_failed;
}
