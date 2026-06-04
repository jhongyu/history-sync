<script lang="ts">
    import { onMount } from "svelte";
    import { getCloudflareService, type PageRecord } from "@/utils/cloudflare";
    import { CloudSync } from "@lucide/svelte";

    let records = $state<PageRecord[]>([]);
    let loading = $state(false);
    let error = $state<string | null>(null);

    let config = $state({
        apiToken: "",
        accountId: "",
        databaseId: "",
    });

    let hasConfig = $derived(
        config.apiToken && config.accountId && config.databaseId,
    );

    async function fetchRecords() {
        loading = true;
        error = null;

        try {
            const service = await getCloudflareService();
            records = await service.getAllRecords();
        } catch (err) {
            error =
                err instanceof Error ? err.message : "Failed to fetch records";
            console.error("Error fetching records:", err);
        } finally {
            loading = false;
        }
    }

    async function loadConfig() {
        try {
            const stored = (await browser.storage.local.get([
                "CLOUDFLARE_API_TOKEN",
                "CLOUDFLARE_ACCOUNT_ID",
                "CLOUDFLARE_DATABASE_ID",
            ])) as Record<string, string>;

            if (stored.CLOUDFLARE_API_TOKEN) {
                config.apiToken = stored.CLOUDFLARE_API_TOKEN;
                config.accountId = stored.CLOUDFLARE_ACCOUNT_ID;
                config.databaseId = stored.CLOUDFLARE_DATABASE_ID;
            }
        } catch (err) {
            console.error("Error loading config:", err);
        }
    }

    onMount(async () => {
        await loadConfig();
        if (hasConfig) {
            await fetchRecords();
        }
    });
</script>

<main aria-labelledby="history-title">
    <header>
        <h1 id="history-title">History</h1>
    </header>

    {#if error}
        <p class="error-message" role="alert" aria-live="assertive">
            {error}
        </p>
    {/if}

    {#if loading}
        <p class="loading" role="status" aria-live="polite">
            Loading history...
        </p>
    {:else if !hasConfig}
        <section class="no-records" aria-labelledby="config-required-title">
            <h2 id="config-required-title">Configuration required</h2>
            <p>
                Cloudflare D1 credentials are not configured. Please open the
                options page to configure them.
            </p>
            <button
                type="button"
                onclick={() => browser.runtime.openOptionsPage()}
            >
                Open Settings
            </button>
        </section>
    {:else}
        <section
            class="records"
            aria-labelledby="records-title"
            aria-busy={loading}
        >
            <div class="refresh-bar">
                <button
                    onclick={() => fetchRecords()}
                    class="refresh-btn"
                    disabled={loading}
                    aria-label="Refresh browsing history"
                >
                    Refresh
                </button>
                <span class="record-count" aria-live="polite"
                    >{records.length} records
                </span>
            </div>

            {#if records.length === 0}
                <p class="no-records">
                    No browsing history yet. Start browsing to see records here.
                </p>
            {:else}
                <ul class="records-list" aria-label="Browsing history records">
                    {#each records as record (record.id ?? `${record.url}-${record.timestamp}`)}
                        <li class="record-item">
                            <a
                                class="record-content"
                                href={record.url}
                                onclick={(e) => {
                                    e.preventDefault();
                                    browser.tabs.create({ url: record.url });
                                }}
                            >
                                <h3 class="record-title">{record.title}</h3>
                                <p class="record-url">{record.url}</p>
                                <time
                                    class="record-time"
                                    datetime={new Date(
                                        record.timestamp,
                                    ).toISOString()}
                                >
                                    {new Date(
                                        record.timestamp,
                                    ).toLocaleDateString()}
                                </time>
                            </a>
                        </li>
                    {/each}
                </ul>
            {/if}
        </section>
    {/if}
</main>

<style>
    main {
        width: 32rem;
        min-height: 100%;
        display: flex;
        flex-direction: column;
        gap: 1.5rem;
        padding: 1rem;
    }

    header {
        display: flex;
        justify-content: flex-start;
        align-items: center;
    }

    .error-message {
        background-color: var(--color-red-900);
        color: white;
        padding: 12px 16px;
    }

    .loading,
    .no-records {
        padding: 32px 16px;
        text-align: center;
    }

    .refresh-bar {
        display: flex;
        justify-content: space-between;
        align-items: center;
    }

    .refresh-btn {
        max-width: 100%;
        font-weight: bold;
        line-height: 1.3;
        background-color: var(--color-blue-900);
        color: white;
        border: none;
        padding: 6px 12px;
        border-radius: 4px;
        cursor: pointer;

        &:hover {
            background-color: var(--color-blue-1000);
        }

        &:focus {
            outline: 2px solid var(--color-seafoam-800);
            outline-offset: 2px;
        }
    }

    .records {
        display: flex;
        flex-direction: column;
        gap: 1rem;
    }

    .records-list {
        list-style: none;
        padding: 0;
        display: flex;
        flex-direction: column;
        gap: 0.75rem;
    }

    .record-item:not(:last-of-type) {
        border-bottom: 1px solid var(--color-gray-300);
    }

    .record-content {
        display: block;
        cursor: pointer;
        text-decoration: none;
    }

    .record-content:hover {
        background-color: var(--color-gray-200);
    }

    .record-content:focus-visible {
        outline: 2px solid var(--color-seafoam-800);
    }

    .record-title {
        color: var(--color-gray-800);
        overflow: hidden;
        text-overflow: ellipsis;
        white-space: nowrap;
    }

    .record-url {
        overflow: hidden;
        text-overflow: ellipsis;
        white-space: nowrap;
    }

    .record-url,
    .record-time {
        color: var(--color-gray-700);
    }
</style>
