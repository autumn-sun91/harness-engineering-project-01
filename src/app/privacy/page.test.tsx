import { renderToStaticMarkup } from "react-dom/server";
import { describe, expect, it } from "vitest";

import PrivacyPage from "./page";

describe("/privacy", () => {
  it("states the LLM transfer scope and retention policy", () => {
    const markup = renderToStaticMarkup(PrivacyPage());

    expect(markup).toContain("업로드한 거래 데이터는 분석을 위해 Anthropic API로 전송됩니다");
    expect(markup).toContain("컬럼 매핑용 헤더와 대표 행");
    expect(markup).toContain("분류용 정규화된 가맹점명");
    expect(markup).toContain("해석용 집계 통계");
    expect(markup).toContain("거래 원본 전체는 전송하지 않습니다");
    expect(markup).toContain("원본 CSV는 보관하지 않습니다");
    expect(markup).toContain("계정 삭제");
    expect(markup).toContain("파생 데이터");
  });

  it("identifies the page as a prototype legal draft", () => {
    const markup = renderToStaticMarkup(PrivacyPage());

    expect(markup).toContain("법률 자문이 아닌 프로토타입용 초안");
    expect(markup).toContain("실제 서비스 전에 법률 검토가 필요합니다");
  });
});
