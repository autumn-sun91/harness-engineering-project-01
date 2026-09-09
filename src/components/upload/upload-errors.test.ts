import { describe, expect, it } from "vitest";

import { getUploadErrorMessage } from "./upload-errors";

describe("upload error messages", () => {
  it("maps an error code to a user-facing message", () => {
    expect(getUploadErrorMessage("file_too_large")).toContain("파일이 4MB를 넘습니다.");
  });
});
