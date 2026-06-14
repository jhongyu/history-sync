import { defineConfig } from "wxt";

// See https://wxt.dev/api/config.html
export default defineConfig({
  modules: ["@wxt-dev/module-svelte"],
  manifest: {
    name: "History Sync",
    version: "0.0.1",
    permissions: ["webNavigation", "tabs", "storage"],
    host_permissions: ["https://history-sync-api.jhy.workers.dev/*"],
    browser_specific_settings: {
      gecko: {
        id: "@history-sync",
        data_collection_permissions: {
          required: ["none"],
        },
      },
    },
  },
});
