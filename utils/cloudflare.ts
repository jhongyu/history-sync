export interface PageRecord {
  id?: number;
  url: string;
  title: string;
  timestamp: number;
  created_at?: string;
}

class HistoryApiService {
  private apiBaseUrl: string;
  private bearerToken: string;

  constructor(apiBaseUrl: string, bearerToken: string) {
    this.apiBaseUrl = apiBaseUrl.replace(/\/$/, "");
    this.bearerToken = bearerToken;
  }

  private async request<T = unknown>(path: string, init: RequestInit = {}) {
    const response = await fetch(`${this.apiBaseUrl}${path}`, {
      ...init,
      headers: {
        Authorization: `Bearer ${this.bearerToken}`,
        "Content-Type": "application/json",
        ...init.headers,
      },
    });

    if (!response.ok) {
      const errorBody = await response.text();
      throw new Error(`History API error: ${response.status}: ${errorBody}`);
    }

    return response.json() as Promise<T>;
  }

  async insertRecord(record: PageRecord): Promise<void> {
    await this.request("/record", {
      method: "POST",
      body: JSON.stringify(record),
    });
  }

  async getAllRecords(
    limit: number = 100,
    offset: number = 0,
  ): Promise<PageRecord[]> {
    const data = await this.request<{
      success: boolean;
      data: {
        items: PageRecord[];
        pagination: {
          limit: number;
          offset: number;
          totle?: number;
          count: number;
        };
      };
    }>(`/records?limit=${limit}&offset=${offset}`);

    if (data.success) {
      return data.data.items;
    }

    return [];
  }
}

export async function getHistoryApiService(): Promise<HistoryApiService> {
  const stored = (await browser.storage.local.get([
    "HISTORY_API_BASE_URL",
    "HISTORY_API_BEARER_TOKEN",
  ])) as Record<string, string>;

  if (!stored.HISTORY_API_BASE_URL || !stored.HISTORY_API_BEARER_TOKEN) {
    throw new Error(
      "History API configuration not found. Please set API URL and bearer token in extension settings.",
    );
  }

  return new HistoryApiService(
    stored.HISTORY_API_BASE_URL,
    stored.HISTORY_API_BEARER_TOKEN,
  );
}

export default HistoryApiService;
