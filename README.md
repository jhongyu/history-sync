# History Sync

History Sync is a browser extension that syncs browsing history to a Cloudflare D1 database.

## Features

- Syncs URL, title, and timestamp to Cloudflare D1
- Displays synced history records in the extension popup
- Opens history entries in a new browser tab

## Tech Stack

- [WXT](https://wxt.dev/) for browser extension development
- [Svelte](https://svelte.dev/) for UI
- TypeScript
- Cloudflare D1
- pnpm

## Cloudflare D1 Setup

### 1. Create a D1 database

Open the Cloudflare Dashboard and go to:

```text
Workers & Pages → D1
```

Create a new D1 database.

### 2. Initialize the database schema

Run the SQL in `schema.sql` from the Cloudflare D1 console or another supported D1 SQL execution method.

Current schema:

```sql
CREATE TABLE IF NOT EXISTS pages (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  url TEXT NOT NULL,
  title TEXT,
  timestamp INTEGER NOT NULL,
  created_at DATETIME DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX IF NOT EXISTS idx_pages_timestamp ON pages(timestamp DESC);

CREATE INDEX IF NOT EXISTS idx_pages_url ON pages(url);
```

### 3. Collect Cloudflare credentials

You will need:

- API Token
- Account ID
- Database ID

The API Token must have permission to access and write to the target D1 database.

## Configuration

Open the extension options page and fill in:

- **API Token**: your Cloudflare API Token
- **Account ID**: your Cloudflare Account ID
- **Database ID**: your Cloudflare D1 Database ID

The configuration is stored locally using `browser.storage.local`.

Once the configuration is saved, new browsing records can be synced to Cloudflare D1.

## Usage

1. Configure Cloudflare D1 credentials from the options page.
2. Browse HTTP/HTTPS websites normally.
3. The extension records page visits from browser navigation events.
4. Open the extension popup to view synced records.
5. Click a history record to open it in a new tab.

## License

[MIT](LICENSE)
