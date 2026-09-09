import "server-only";

import { Polar } from "@polar-sh/sdk";
import { validateEvent } from "@polar-sh/sdk/webhooks";

export interface PolarCheckoutResult {
  id: string;
  status: string;
  url: string;
  subscriptionId: string | null;
  customerId: string | null;
  externalCustomerId: string | null;
  metadata: Record<string, unknown>;
  modifiedAt: Date | string | null;
}

export interface PolarSubscriptionResult {
  id: string;
  status: string;
  customerId: string;
  currentPeriodEnd: Date | string;
  cancelAtPeriodEnd: boolean;
  metadata: Record<string, unknown>;
}

function requiredEnv(name: "POLAR_ACCESS_TOKEN" | "POLAR_PRODUCT_ID" | "POLAR_WEBHOOK_SECRET"): string {
  const value = process.env[name];
  if (!value) {
    throw new Error(`${name} is not configured`);
  }
  return value;
}

function polarServer(): "sandbox" | "production" {
  const value = process.env.POLAR_SERVER;
  if (value === "sandbox" || value === "production") {
    return value;
  }
  throw new Error("POLAR_SERVER is not configured");
}

function appUrl(): string {
  const value = process.env.NEXT_PUBLIC_APP_URL ?? "http://localhost:3000";
  return value.replace(/\/$/, "");
}

export function createPolarClient(): Polar {
  return new Polar({
    accessToken: requiredEnv("POLAR_ACCESS_TOKEN"),
    server: polarServer(),
  });
}

export async function createPolarCheckout(userId: string, successUrl: string): Promise<Pick<PolarCheckoutResult, "url">> {
  const checkout = await createPolarClient().checkouts.create({
    products: [requiredEnv("POLAR_PRODUCT_ID")],
    externalCustomerId: userId,
    metadata: { user_id: userId },
    successUrl,
    returnUrl: `${appUrl()}/dashboard?checkout=cancelled`,
  });

  return { url: checkout.url };
}

export async function getPolarCheckout(checkoutId: string): Promise<PolarCheckoutResult> {
  return await createPolarClient().checkouts.get({ id: checkoutId }) as unknown as PolarCheckoutResult;
}

export async function getPolarSubscription(subscriptionId: string): Promise<PolarSubscriptionResult> {
  return await createPolarClient().subscriptions.get({ id: subscriptionId }) as unknown as PolarSubscriptionResult;
}

function isRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === "object" && value !== null;
}

function isAlreadyCanceledSubscriptionError(error: unknown): boolean {
  if (!isRecord(error)) {
    return false;
  }

  const nested = isRecord(error.data$) ? error.data$ : null;
  return error.name === "AlreadyCanceledSubscription"
    || error.error === "AlreadyCanceledSubscription"
    || nested?.error === "AlreadyCanceledSubscription";
}

/**
 * Revokes the subscription immediately as part of account deletion.
 * Polar's already-canceled response is a successful retry outcome.
 */
export async function cancelPolarSubscription(subscriptionId: string): Promise<void> {
  try {
    await createPolarClient().subscriptions.revoke({ id: subscriptionId });
  } catch (error) {
    if (isAlreadyCanceledSubscriptionError(error)) {
      return;
    }
    throw error;
  }
}

export async function createCustomerPortalSession(userId: string, returnUrl: string): Promise<{ customerPortalUrl: string }> {
  const session = await createPolarClient().customerSessions.create({
    externalCustomerId: userId,
    returnUrl,
  });

  return { customerPortalUrl: session.customerPortalUrl };
}

export async function verifyPolarWebhook(body: string, headers: Headers): Promise<unknown> {
  const headerRecord = Object.fromEntries(headers.entries());
  return validateEvent(body, headerRecord, requiredEnv("POLAR_WEBHOOK_SECRET"));
}

export function billingSuccessUrl(): string {
  return `${appUrl()}/dashboard?checkout=success&checkout_id={CHECKOUT_ID}`;
}

export function billingReturnUrl(): string {
  return `${appUrl()}/dashboard`;
}
