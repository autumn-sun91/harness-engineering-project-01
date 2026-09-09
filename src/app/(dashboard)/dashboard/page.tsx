import { redirect } from "next/navigation";

import { signOut } from "../../login/actions";
import { createServerSupabaseClient } from "../../../services/supabase/server";

export default async function DashboardPage() {
  const supabase = await createServerSupabaseClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    redirect("/login?next=%2Fdashboard");
  }

  return (
    <main className="min-h-screen bg-[var(--color-canvas)] px-6 py-8 text-[var(--color-ink)] sm:px-10 lg:px-16">
      <div className="mx-auto flex w-full max-w-[1200px] flex-col gap-12">
        <header className="flex items-center justify-between border-b border-[var(--color-hairline-soft)] pb-5">
          <p className="font-display text-2xl tracking-[-0.04em] text-[var(--color-primary)]">TxAnalyzer</p>
          <form action={signOut}>
            <button
              type="submit"
              className="rounded-full border border-[var(--color-hairline)] px-5 py-2.5 text-sm font-medium text-[var(--color-ink)] focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[var(--color-primary)]"
            >
              로그아웃
            </button>
          </form>
        </header>

        <section>
          <p className="font-mono-ui text-xs uppercase tracking-[0.16em] text-[var(--color-muted)]">대시보드</p>
          <h1 className="mt-5 font-display text-5xl font-normal tracking-[-0.04em]">분석을 시작할 준비가 되었습니다</h1>
          <p className="mt-6 text-base leading-7 text-[var(--color-body)]">CSV 거래 내역을 업로드하면 이곳에 분석 결과가 표시됩니다.</p>
        </section>
      </div>
    </main>
  );
}
