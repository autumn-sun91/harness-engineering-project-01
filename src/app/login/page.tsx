import Link from "next/link";
import { redirect } from "next/navigation";

import { getSafeRedirectPath } from "../../lib/auth/redirect";
import { createServerSupabaseClient } from "../../services/supabase/server";

import { signInWithGoogle } from "./actions";

type LoginPageProps = {
  searchParams: Promise<{
    error?: string | string[];
    next?: string | string[];
  }>;
};

function firstSearchParam(value: string | string[] | undefined): string | undefined {
  return Array.isArray(value) ? value[0] : value;
}

function getErrorMessage(error: string | undefined): string | null {
  switch (error) {
    case "access_denied":
    case "oauth_cancelled":
      return "Google 로그인을 취소했습니다.";
    case "oauth_failed":
      return "Google 로그인에 실패했습니다. 다시 시도해주세요.";
    default:
      return null;
  }
}

export default async function LoginPage({ searchParams }: LoginPageProps) {
  const params = await searchParams;
  const nextPath = getSafeRedirectPath(firstSearchParam(params.next));
  const supabase = await createServerSupabaseClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (user) {
    redirect(nextPath);
  }

  const errorMessage = getErrorMessage(firstSearchParam(params.error));

  return (
    <main className="flex min-h-screen items-center justify-center bg-[var(--color-canvas)] px-6 py-12 text-[var(--color-ink)]">
      <section className="w-full max-w-md rounded-3xl border border-[var(--color-hairline)] bg-white p-8 shadow-[0_4px_12px_rgba(0,0,0,0.04)] sm:p-10">
        <p className="font-display text-3xl tracking-[-0.04em] text-[var(--color-primary)]">TxAnalyzer</p>
        <h1 className="mt-8 font-display text-4xl font-normal tracking-[-0.04em]">로그인</h1>
        <p className="mt-4 text-sm leading-6 text-[var(--color-body)]">Google 계정으로 TxAnalyzer를 시작합니다.</p>

        {errorMessage ? (
          <p role="alert" className="mt-6 rounded-xl bg-[var(--color-surface-soft)] px-4 py-3 text-sm leading-6 text-[var(--color-body)]">
            {errorMessage}
          </p>
        ) : null}

        <form action={signInWithGoogle} className="mt-8">
          <input type="hidden" name="next" value={nextPath} />
          <button
            type="submit"
            className="h-12 w-full rounded-full bg-[var(--color-primary)] px-6 text-base font-semibold text-white transition-colors hover:bg-[var(--color-primary-active)] focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[var(--color-primary)]"
          >
            Google로 로그인
          </button>
        </form>
        <p className="mt-6 text-xs leading-5 text-[var(--color-muted)]">
          거래 데이터가 분석을 위해 Anthropic API로 전송됩니다. 전송 범위와 보관 방식은 <Link href="/privacy" className="text-[var(--color-body)] underline underline-offset-4 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[var(--color-primary)]">개인정보 처리방침</Link>에서 확인할 수 있습니다.
        </p>
      </section>
    </main>
  );
}
