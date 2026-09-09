import { describe, expect, it, vi } from "vitest";

import { deleteAccountData } from "./delete-account";

const userId = "00000000-0000-0000-0000-000000000001";

function accountClient() {
  const queries: Array<{ table: string; column: string; value: string }> = [];
  const order: string[] = [];
  const from = vi.fn((table: string) => ({
    delete: vi.fn(() => ({
      eq: vi.fn(async (column: string, value: string) => {
        queries.push({ table, column, value });
        order.push(`delete:${table}`);
        return { error: null };
      }),
    })),
  }));
  const deleteUser = vi.fn(async (id: string) => {
    order.push(`auth:${id}`);
    return { error: null };
  });

  return {
    client: {
      from,
      auth: { admin: { deleteUser } },
    },
    queries,
    order,
    deleteUser,
  };
}

describe("deleteAccountData", () => {
  it("deletes only the authenticated user's rows in the required order", async () => {
    const database = accountClient();

    await deleteAccountData(database.client, userId);

    expect(database.queries).toEqual([
      { table: "analysis_results", column: "user_id", value: userId },
      { table: "transactions", column: "user_id", value: userId },
      { table: "csv_uploads", column: "user_id", value: userId },
      { table: "subscriptions", column: "user_id", value: userId },
    ]);
    expect(database.order).toEqual([
      "delete:analysis_results",
      "delete:transactions",
      "delete:csv_uploads",
      "delete:subscriptions",
      `auth:${userId}`,
    ]);
    expect(database.queries.every((query) => query.value === userId)).toBe(true);
    expect(database.deleteUser).toHaveBeenCalledWith(userId);
  });

  it("continues cleanly when the user's rows are already absent", async () => {
    const database = accountClient();

    await expect(deleteAccountData(database.client, userId)).resolves.toBeUndefined();
  });
});
