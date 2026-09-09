import { renderToStaticMarkup } from "react-dom/server";
import { describe, expect, it } from "vitest";

import AccountDeleteForm from "./account-delete-form";

describe("AccountDeleteForm", () => {
  it("requires the explicit account deletion confirmation before submission", () => {
    const markup = renderToStaticMarkup(<AccountDeleteForm />);

    expect(markup).toContain("계정 삭제");
    expect(markup).toContain("되돌릴 수 없습니다");
    expect(markup).toContain('name="confirmation"');
    expect(markup).toContain('action="/api/account/delete"');
    expect(markup).toContain("disabled");
  });
});
