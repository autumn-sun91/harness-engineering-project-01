import { renderToStaticMarkup } from "react-dom/server";
import { describe, expect, it } from "vitest";

import DashboardClient from "./dashboard-client";

describe("DashboardClient", () => {
  it("renders the empty dashboard", () => {
    const markup = renderToStaticMarkup(
      <DashboardClient initialUploads={[]} initialReport={null} />,
    );

    expect(markup).toContain("CSV 파일을 업로드해 분석을 시작하세요");
  });
});
