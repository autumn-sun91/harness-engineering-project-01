import { renderToStaticMarkup } from "react-dom/server";
import { describe, expect, it } from "vitest";

import HomePage from "./page";

describe("home page", () => {
  it("explains the product and provides a login action", () => {
    const markup = renderToStaticMarkup(HomePage());

    expect(markup).toContain("TxAnalyzer");
    expect(markup).toContain("거래 내역에서 소비 흐름을 읽습니다");
    expect(markup).toContain('href="/login"');
    expect(markup).toContain("분석 시작하기");
  });

  it("introduces all five analysis types", () => {
    const markup = renderToStaticMarkup(HomePage());

    for (const label of [
      "카테고리별 지출",
      "기간별 지출 추이",
      "구독 누수·이상 거래",
      "AI 요약",
      "절약 인사이트",
    ]) {
      expect(markup).toContain(label);
    }
  });

  it("shows the PRD plan limits and links to legal pages", () => {
    const markup = renderToStaticMarkup(HomePage());

    for (const value of [
      "월 5회",
      "월 30회",
      "최근 12개월",
      "전체 기간",
      "상세 최대 3건",
      "최대 3개 중 1개",
      "$9/월",
    ]) {
      expect(markup).toContain(value);
    }
    expect(markup).toContain('href="/privacy"');
    expect(markup).toContain('href="/terms"');
  });

  it("does not advertise excluded product features", () => {
    const markup = renderToStaticMarkup(HomePage());

    expect(markup).not.toContain("PDF 내보내기");
    expect(markup).not.toContain("원본 다운로드");
    expect(markup).not.toContain("통합 대시보드");
  });
});
