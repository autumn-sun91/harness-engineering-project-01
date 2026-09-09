"use client";

import { useState } from "react";

const CONFIRMATION_TEXT = "계정 삭제";

export default function AccountDeleteForm() {
  const [confirmation, setConfirmation] = useState("");
  const isConfirmed = confirmation === CONFIRMATION_TEXT;

  return (
    <section className="mt-12 rounded-2xl border border-[var(--color-hairline)] p-6 sm:p-8" aria-labelledby="account-delete-title">
      <h2 id="account-delete-title" className="text-lg font-semibold">계정 삭제</h2>
      <p className="mt-3 text-sm leading-6 text-[var(--color-body)]">
        계정과 분석 결과가 모두 삭제되며 되돌릴 수 없습니다.
      </p>
      <form action="/api/account/delete" method="post" className="mt-6 max-w-md">
        <label htmlFor="account-delete-confirmation" className="text-sm font-medium">확인 문구</label>
        <input
          id="account-delete-confirmation"
          name="confirmation"
          required
          value={confirmation}
          onChange={(event) => setConfirmation(event.target.value)}
          className="mt-2 h-12 w-full rounded-xl border border-[var(--color-hairline)] bg-white px-4 text-base outline-none focus:border-[var(--color-primary)] focus:ring-2 focus:ring-[var(--color-primary)]"
        />
        <p className="mt-2 text-xs text-[var(--color-muted)]">계정 삭제를 입력하세요.</p>
        <button
          type="submit"
          disabled={!isConfirmed}
          className="mt-5 h-11 rounded-full border border-[var(--color-hairline)] px-5 text-sm font-semibold text-[var(--color-body)] disabled:cursor-not-allowed disabled:text-[var(--color-muted-soft)] enabled:border-[var(--color-semantic-down)] enabled:text-[var(--color-semantic-down)] focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[var(--color-primary)]"
        >
          계정 삭제
        </button>
      </form>
    </section>
  );
}
