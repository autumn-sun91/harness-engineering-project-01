import { renderToStaticMarkup } from "react-dom/server";
import { describe, expect, it } from "vitest";

import HomePage from "./page";

describe("home page", () => {
  it("introduces TxAnalyzer and provides a login action", () => {
    const markup = renderToStaticMarkup(HomePage());

    expect(markup).toContain("TxAnalyzer");
    expect(markup).toContain("거래 내역을 읽고 소비 흐름을 확인합니다");
    expect(markup).toContain("로그인");
  });
});
