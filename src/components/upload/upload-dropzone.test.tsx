import { renderToStaticMarkup } from "react-dom/server";
import { describe, expect, it } from "vitest";

import UploadDropzone from "./upload-dropzone";

describe("UploadDropzone", () => {
  it("renders the upload control", () => {
    const markup = renderToStaticMarkup(<UploadDropzone />);

    expect(markup).toContain("CSV 파일 업로드");
  });
});
