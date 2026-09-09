import { renderToStaticMarkup } from "react-dom/server";
import { describe, expect, it } from "vitest";

import TermsPage from "./page";

describe("/terms", () => {
  it("states Polar billing and cancellation terms", () => {
    const markup = renderToStaticMarkup(TermsPage());

    expect(markup).toContain("Polar를 통한 결제");
    expect(markup).toContain("결제 주기 종료까지 이용할 수 있습니다");
    expect(markup).toContain("해지");
    expect(markup).toContain("Pro");
  });

  it("identifies the page as a prototype legal draft", () => {
    const markup = renderToStaticMarkup(TermsPage());

    expect(markup).toContain("법률 자문이 아닌 프로토타입용 초안");
    expect(markup).toContain("실제 서비스 전에 법률 검토가 필요합니다");
  });
});
