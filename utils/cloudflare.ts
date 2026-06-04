export interface PageRecord {
  id?: number;
  url: string;
  title: string;
  timestamp: number;
}

class CloudflareD1Service {
  private apiToken: string;
  private accountId: string;
  private databaseId: string;
  private baseUrl: string;

  constructor(apiToken: string, accountId: string, databaseId: string) {
    this.apiToken = apiToken;
    this.accountId = accountId;
    this.databaseId = databaseId;
    this.baseUrl = `https://api.cloudflare.com/client/v4/accounts/${accountId}/d1/database/${databaseId}`;
  }

  async insertRecord(record: PageRecord): Promise<void> {
    const sql = `
      INSERT INTO pages (url, title, timestamp)
      VALUES (?, ?, ?)
    `;

    await this.executeQuery(sql, [record.url, record.title, record.timestamp]);
  }

  async getAllRecords(limit: number = 100): Promise<PageRecord[]> {
    const sql = `
      SELECT id, url, title, timestamp FROM pages
      ORDER BY timestamp DESC
      LIMIT ?
    `;

    const response = await this.executeQuery(sql, [limit]);
    return response.results || [];
  }

  async cleanupOldRecords(keepCount: number = 100): Promise<void> {
    const sql = `
      DELETE FROM pages WHERE id NOT IN (
        SELECT id FROM pages ORDER BY timestamp DESC LIMIT ?
      )
    `;

    await this.executeQuery(sql, [keepCount]);
  }

  private async executeQuery(sql: string, params?: any[]): Promise<any> {
    try {
      const response = await fetch(`${this.baseUrl}/query`, {
        method: "POST",
        headers: {
          Authorization: `Bearer ${this.apiToken}`,
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          sql,
          params,
        }),
      });

      if (!response.ok) {
        const errorBody = await response.text();
        throw new Error(
          `Cloudflare API error: ${response.status}: ${errorBody}`,
        );
      }

      const data = await response.json();

      if (data.success) {
        return data.result?.[0];
      } else {
        throw new Error(
          `Query failed: ${data.errors?.[0]?.message || "Unknown error"}`,
        );
      }
    } catch (error) {
      console.error("Cloudflare D1 error:", error);
      throw error;
    }
  }
}

export async function getCloudflareService(): Promise<CloudflareD1Service> {
  const stored = (await browser.storage.local.get([
    "CLOUDFLARE_API_TOKEN",
    "CLOUDFLARE_ACCOUNT_ID",
    "CLOUDFLARE_DATABASE_ID",
  ])) as Record<string, string>;

  if (
    !stored.CLOUDFLARE_API_TOKEN ||
    !stored.CLOUDFLARE_ACCOUNT_ID ||
    !stored.CLOUDFLARE_DATABASE_ID
  ) {
    throw new Error(
      "Cloudflare configuration not found. Please set API credentials in extension settings.",
    );
  }

  return new CloudflareD1Service(
    stored.CLOUDFLARE_API_TOKEN,
    stored.CLOUDFLARE_ACCOUNT_ID,
    stored.CLOUDFLARE_DATABASE_ID,
  );
}

export default CloudflareD1Service;
