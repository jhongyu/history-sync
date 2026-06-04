<script lang="ts">
    import { Eye, EyeOff } from "@lucide/svelte";
    import { onMount } from "svelte";

    let error = $state<string | null>(null);
    let success = $state<string | null>(null);
    let successTimer: ReturnType<typeof setTimeout> | undefined;
    let showApiToken = $state(false);

    let config = $state({
        apiToken: "",
        accountId: "",
        databaseId: "",
    });

    function showSuccessMessage(message: string) {
        success = message;
        if (successTimer) {
            clearTimeout(successTimer);
        }
        successTimer = setTimeout(() => {
            success = null;
        }, 3000);
    }

    async function saveConfig(e: SubmitEvent) {
        e.preventDefault();
        if (!config.apiToken || !config.accountId || !config.databaseId) {
            error = "Please fill in all configuration fields";
            return;
        }

        try {
            await browser.storage.local.set({
                CLOUDFLARE_API_TOKEN: config.apiToken.trim(),
                CLOUDFLARE_ACCOUNT_ID: config.accountId.trim(),
                CLOUDFLARE_DATABASE_ID: config.databaseId.trim(),
            });

            error = null;
            showSuccessMessage("Configuration saved successfully");
        } catch (err) {
            success = null;
            error = "Failed to save configuration";
            console.error("Error saving config:", err);
        }
    }

    async function loadConfig() {
        try {
            let stored = (await browser.storage.local.get([
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
    });
</script>

<main>
    <header>
        <h1>History Sync</h1>
    </header>

    <form
        onsubmit={saveConfig}
        aria-describedby={error
            ? "config-error"
            : success
              ? "config-success"
              : undefined}
        aria-labelledby="config-title"
    >
        <h2 id="config-title">Cloudflare D1 Configuration</h2>

        <div class="form-group">
            <label for="token"
                >API Token <span aria-hidden="true">*</span></label
            >
            <div class="token-input" data-visible={showApiToken}>
                <input
                    name="token"
                    id="token"
                    class="token-input-field"
                    bind:value={config.apiToken}
                    type={showApiToken ? "text" : "password"}
                    placeholder="Your Cloudflare API Token"
                    required
                    autocomplete="off"
                    spellcheck="false"
                />

                <button
                    type="button"
                    class="token-input-toggle"
                    onclick={() => (showApiToken = !showApiToken)}
                    tabindex="-1"
                >
                    <span class="token-input-icon">
                        {#if showApiToken}
                            <EyeOff size={16} strokeWidth={2} />
                        {:else}
                            <Eye size={16} strokeWidth={2} />
                        {/if}
                    </span>
                </button>
            </div>
        </div>

        <div class="form-group">
            <label for="accountId"
                >Account ID <span aria-hidden="true">*</span></label
            >
            <input
                name="accountId"
                id="accountId"
                bind:value={config.accountId}
                type="text"
                placeholder="Your Cloudflare Account ID"
                required
                autocomplete="off"
                spellcheck="false"
            />
        </div>

        <div class="form-group">
            <label for="databaseId"
                >Database ID <span aria-hidden="true">*</span></label
            >
            <input
                name="databaseId"
                id="databaseId"
                bind:value={config.databaseId}
                type="text"
                placeholder="Your D1 Database ID"
                required
                autocomplete="off"
                spellcheck="false"
            />
        </div>

        <button class="submit-btn" type="submit">Save Configuration</button>
    </form>

    <div class="feedback">
        {#if success}
            <p
                id="config-success"
                class="feedback-message success-message"
                role="status"
                aria-live="polite"
            >
                {success}
            </p>
        {:else if error}
            <p
                id="config-error"
                class="feedback-message error-message"
                role="alert"
                aria-live="assertive"
            >
                {error}
            </p>
        {:else}
            <p class="feedback-message feedback-placeholder">&nbsp;</p>
        {/if}
    </div>
</main>

<style>
    main {
        margin: 0 auto;
        width: 32rem;
        min-height: 100%;
        display: flex;
        flex-direction: column;
        gap: 1.5rem;
    }

    header {
        display: flex;
        justify-content: flex-start;
        align-items: center;
    }

    form {
        display: flex;
        flex-direction: column;
        gap: 1rem;
    }

    .form-group {
        display: flex;
        flex-direction: column;
        & > input {
            height: 2.75rem;
            min-width: 2.75rem;
            line-height: 1.3;
            padding: 8px 10px;
            border: 1px solid var(--color-gray-400);
            outline: none;
            border-radius: 4px;
            &:focus {
                border-color: var(--color-seafoam-800);
                box-shadow: 0 0 0 1px var(--color-seafoam-800);
            }
        }
    }

    .token-input {
        position: relative;
        display: flex;
        align-items: center;
        background-color: white;
        border: 1px solid var(--color-gray-400);
        border-radius: 4px;
        &:focus-within {
            border-color: var(--color-seafoam-800);
            box-shadow: 0 0 0 1px var(--color-seafoam-800);
        }
    }

    .token-input-field {
        flex: 1;
        padding: 8px 10px;
        border: none;
        outline: none;
        background: transparent;
        line-height: 1.3;
        height: 2.75rem;
        min-width: 2.75rem;
    }

    .token-input-toggle {
        position: absolute;
        top: 50%;
        right: 0.5rem;
        transform: translateY(-50%);
        display: inline-flex;
        justify-content: center;
        align-items: center;
        border: none;
        background: transparent;
        color: var(--color-gray-600);
        cursor: pointer;
        height: 2rem;
        min-width: 2rem;
        border-radius: 4px;
        transition-duration: var(--duration-300);
        transition-property: background-color;
        transition-timing-function: var(--ease-out);

        &:hover {
            background-color: var(--color-gray-200);
        }
    }

    .token-input-icon {
        display: inline-flex;
        justify-content: center;
        align-items: center;

        & :global(svg) {
            width: 1em;
            height: 1em;
        }
    }

    .submit-btn {
        width: 100%;
        font-weight: bold;
        line-height: 1.3;
        padding: 12px 16px;
        background-color: var(--color-blue-900);
        color: white;
        border: none;
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

    .feedback-message {
        padding: 12px 16px;
    }

    .feedback-placeholder {
        visibility: hidden;
    }

    .success-message {
        background-color: var(--color-green-900);
        color: white;
    }

    .error-message {
        background-color: var(--color-red-900);
        color: white;
    }
</style>
