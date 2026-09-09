import Link from "next/link";
import { redirect } from "next/navigation";

import AccountDeleteForm from "../../../components/account/account-delete-form";
import { isProSubscription } from "../../../lib/billing/subscription";
import { signOut } from "../../login/actions";
import { createServerSupabaseClient } from "../../../services/supabase/server";

type SubscriptionView = {
  plan: "free" | "pro";
  polarStatus: string | null;
  cancelAtPeriodEnd: boolean;
  currentPeriodEnd: string | null;
  userId: string;
};

function subscriptionFromRow(row: Record<string, unknown> | null, userId: string): SubscriptionView | null {
  if (!row) {
    return null;
  }
  return {
    userId,
    plan: row.plan === "pro" ? "pro" : "free",
    polarStatus: typeof row.polar_status === "string" ? row.polar_status : null,
    cancelAtPeriodEnd: row.cancel_at_period_end === true,
    currentPeriodEnd: typeof row.current_period_end === "string" ? row.current_period_end : null,
  };
}

function formatPeriodEnd(value: string | null): string | null {
  if (!value) {
    return null;
  }
  const date = new Date(value);
  if (!Number.isFinite(date.getTime())) {
    return value;
  }
  return new Intl.DateTimeFormat("ko-KR", {
    dateStyle: "medium",
    timeZone: "Asia/Seoul",
  }).format(date);
}

export default async function SettingsPage() {
  const supabase = await createServerSupabaseClient();
  const { data: userData } = await supabase.auth.getUser();
  const user = userData.user;
  if (!user) {
    redirect("/login?next=%2Fsettings");
  }

  const { data } = await supabase
    .from("subscriptions")
    .select("plan,polar_status,cancel_at_period_end,current_period_end")
    .eq("user_id", user.id)
    .maybeSingle();
  const row = typeof data === "object" && data !== null ? data as Record<string, unknown> : null;
  const subscription = subscriptionFromRow(row, user.id);
  const isPro = subscription ? isProSubscription(subscription) : false;
  const endDate = isPro && subscription?.cancelAtPeriodEnd
    ? formatPeriodEnd(subscription.currentPeriodEnd)
    : null;

  return (
    <main className="min-h-screen bg-[var(--color-canvas)] px-6 py-6 text-[var(--color-ink)] sm:px-10 lg:px-16">
      <div className="mx-auto w-full max-w-[720px]">
        <header className="flex h-16 items-center justify-between border-b border-[var(--color-hairline-soft)]">
          <Link href="/dashboard" className="font-display text-2xl tracking-[-0.04em] text-[var(--color-primary)]">TxAnalyzer</Link>
          <form action={signOut}>
            <button type="submit" className="rounded-full border border-[var(--color-hairline)] px-5 py-2.5 text-sm font-medium focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[var(--color-primary)]">로그아웃</button>
          </form>
        </header>

        <section className="py-12 sm:py-16">
          <p className="font-mono-ui text-xs tracking-[0.14em] text-[var(--color-muted)]">설정</p>
          <h1 className="mt-4 font-display text-4xl font-normal tracking-[-0.04em]">계정 설정</h1>
          <p className="mt-5 text-base leading-7 text-[var(--color-body)]">플랜과 계정 정보를 관리합니다.</p>
        </section>

        <section className="rounded-2xl border border-[var(--color-hairline)] p-6 sm:p-8" aria-labelledby="billing-title">
          <h2 id="billing-title" className="text-lg font-semibold">플랜</h2>
          <dl className="mt-6 grid gap-5 sm:grid-cols-2">
            <div>
              <dt className="text-sm text-[var(--color-muted)]">현재 플랜</dt>
              <dd className="mt-2 font-mono-ui text-lg">{isPro ? "Pro" : "Free"}</dd>
            </div>
            <div>
              <dt className="text-sm text-[var(--color-muted)]">상태</dt>
              <dd className="mt-2 text-base">{endDate ? "종료 예정" : isPro ? "사용 중" : "사용 중"}</dd>
            </div>
          </dl>
          {endDate ? <p className="mt-6 text-sm leading-6 text-[var(--color-body)]">Pro는 {endDate}에 종료됩니다.</p> : null}
          <div className="mt-6">
            {isPro ? (
              <a href="/api/polar/portal" className="inline-flex h-11 items-center rounded-full bg-[var(--color-primary)] px-5 text-sm font-semibold text-white hover:bg-[var(--color-primary-active)] focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[var(--color-primary)]">결제 관리</a>
            ) : (
              <form action="/api/polar/checkout" method="post">
                <button type="submit" className="inline-flex h-11 items-center rounded-full bg-[var(--color-primary)] px-5 text-sm font-semibold text-white hover:bg-[var(--color-primary-active)] focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[var(--color-primary)]">업그레이드</button>
              </form>
            )}
          </div>
        </section>

        <AccountDeleteForm />
      </div>
    </main>
  );
}
