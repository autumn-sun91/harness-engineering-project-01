type DeleteResult = { error: unknown };

export interface AccountDeletionClient {
  from(table: string): {
    delete(): {
      eq(column: string, value: string): PromiseLike<DeleteResult>;
    };
  };
  auth: {
    admin: {
      deleteUser(userId: string): Promise<DeleteResult>;
    };
  };
}

const ACCOUNT_TABLES = [
  "analysis_results",
  "transactions",
  "csv_uploads",
  "subscriptions",
] as const;

async function deleteRowsForUser(client: AccountDeletionClient, table: string, userId: string): Promise<void> {
  const { error } = await client
    .from(table)
    .delete()
    .eq("user_id", userId);
  if (error) {
    throw new Error("account data deletion failed");
  }
}

export async function deleteAccountData(client: AccountDeletionClient, userId: string): Promise<void> {
  for (const table of ACCOUNT_TABLES) {
    await deleteRowsForUser(client, table, userId);
  }

  const { error } = await client.auth.admin.deleteUser(userId);
  if (error) {
    throw new Error("auth user deletion failed");
  }
}
