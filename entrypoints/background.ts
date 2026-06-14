import { getHistoryApiService, type PageRecord } from "@/utils/cloudflare";

const RECENT_RECORD_TTL = 10_000;
const recentRecords = new Map<string, number>();

function normailizeUrl(url: string): string {
  try {
    const parsed = new URL(url);
    parsed.hash = "";
    return parsed.toString();
  } catch {
    return url;
  }
}

function shouldSkipRecord(tabId: number, url: string): boolean {
  const normalizedUrl = normailizeUrl(url);
  const key = `${tabId}:${normalizedUrl}`;
  const now = Date.now();
  const lastRecordedAt = recentRecords.get(key);

  if (lastRecordedAt && now - lastRecordedAt < RECENT_RECORD_TTL) {
    return true;
  }

  recentRecords.set(key, now);

  for (const [recordKey, timestamp] of recentRecords) {
    if (now - timestamp > RECENT_RECORD_TTL) {
      recentRecords.delete(recordKey);
    }
  }

  return false;
}

export default defineBackground(() => {
  async function record(tabId: number) {
    try {
      const tab = await browser.tabs.get(tabId);

      if (tab.url?.startsWith("http://") || tab.url?.startsWith("https://")) {
        if (shouldSkipRecord(tabId, tab.url)) {
          return;
        }

        const pageRecord: PageRecord = {
          url: tab.url,
          title: tab.title || "No title",
          timestamp: Date.now(),
        };

        try {
          const service = await getHistoryApiService();
          await service.insertRecord(pageRecord);
          console.log("Record saved to Cloudflare D1:", pageRecord);
        } catch (error) {
          console.error("Failed to save to Cloudflare D1:", error);
        }
      }
    } catch (error) {
      console.error("Error recording page:", error);
    }
  }

  browser.webNavigation.onCompleted.addListener((detail) => {
    if (detail.frameId === 0) {
      record(detail.tabId);
    }
  });

  browser.webNavigation.onHistoryStateUpdated.addListener((detail) => {
    if (detail.frameId === 0) {
      record(detail.tabId);
    }
  });
});
