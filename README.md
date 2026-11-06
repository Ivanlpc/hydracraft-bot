# Discord Bot Project

## Introduction

This project involves a Discord bot implemented in JavaScript, designed to facilitate the management of a Discord server and interaction with a MySQL database. The main features include permission management, command cooldowns, user and staff management, as well as an advanced logging system. This bot is especially useful for automating administrative tasks and enhancing the experience for its members.

## Features

### Permission Management

- **/perm**: Allows administrators to manage the bot's permissions directly from Discord, using slash commands. Permissions are stored and retrieved from a MySQL database, ensuring centralized and secure management.

### Command Cooldowns

- **Cooldowns**: Prevents command abuse by establishing a cooldown period after each use, ensuring users do not overload the bot with requests.

### User Management

1. **Password Change**: Allows users to change their password to a temporary one, ensuring account security.
2. **Username Update**: Users can update their usernames directly through commands.
3. **Account Merging**: Facilitates the merging of different users' accounts and, optionally, name changes in their Tebex purchases.
4. **Account Information**: Displays detailed account information of a user.

### Staff Management

1. **Sanction Charts**: Creates charts showing the sanctions made in a defined period, as well as the evolution of sanctions given by a particular staff member. This allows for efficient visual tracking of staff activities.

### Logging System

1. **MySQL Logs**: Listens to MySQL binary logs to create records on Discord of certain changes in the server, allowing real-time tracking of significant modifications.
2. **Console Logs**: Generates custom logs sorted by date on each bot restart, facilitating debugging and system maintenance.

## Requirements

- Node.js 24.22.2 or higher (`.nvmrc` selects the tested Node 24 release)
- MySQL (v5.7 or higher)
- A Discord server and administrative permissions to add bots

## Installation

For automatic production deployment using a self-hosted GitHub Actions runner,
Docker, follow [the deployment guide](docs/deploy.md). Each validated push to main
builds a new image and replaces the running container.

1. Clone the repository:
   ```bash
   git clone https://github.com/ivanlpc/hydracraft-bot.git
   ```
2. Install the dependencies:
   ```bash
   cd hydracraft-bot
   npm ci
   ```
3. Configure the `.env` file with your MySQL credentials and your bot's Discord token.
4. Run the bot:
   ```bash
   npm start
   ```

## Development and testing

Install development dependencies with `npm ci`. `npm start` and `npm run dev`
do not install or update packages at startup. For production, install with
`npm ci --omit=dev` before starting the bot.

```bash
npm run check
npm run test:coverage
npm audit
```

The suite uses Node's built-in test runner. It covers permissions and cooldowns,
interaction failures, dates and profiles, command reloading, confirmation buttons,
attachment filtering, mention moderation, payment lookup and binlog processing.
HTTP tests run the real fetch client against a local HTTP server. Agent tests use
a real local WebSocket server and verify JWT signatures, scope, process, origin,
authentication errors, response IDs, disconnects, deadlines and no retry after
dispatch. Other external boundaries use test doubles;
tests do not need tokens, a live database or a Discord connection.

GitHub Actions runs lint, tests, coverage and dependency auditing on Node 24 and 26.
The workflow runs after the changes are pushed; local validation uses Node 24.
Coverage is diagnostic and only includes loaded modules; it does not measure
untested startup paths or prove live-service compatibility.

The minimatch override selects patched version 11.0.4 or newer, avoiding the
globparts amplification advisory affecting the versions requested by ESLint and
nodemon. Keep the lockfile committed so installs remain reproducible.

Before deploying, validate database permissions/schema, binlog replication,
Discord role permissions and webhooks, Tebex responses and agent console commands
in a staging environment. Local tests do not establish compatibility with the
live services or with the server's MySQL authentication configuration.

## Bungeecord through Hydra Agent

The bot uses the existing agent's `/ws` protocol. No agent changes are required.
Copy `example.env` to `.env` and fill in:

```dotenv
AGENT_PROXY_URL=wss://your-agent.example.com/ws
AGENT_PROXY_ID=your-existing-agent-id
AGENT_PROXY_PROCESS_ID=your-existing-bungee-process-id
AGENT_PROXY_JWT_SECRET=
AGENT_PROXY_ORIGIN=https://your-existing-panel.example.com
AGENT_JWT_ISSUER=https://your-existing-panel.example.com
AGENT_JWT_AUDIENCE=java-node-agent
AGENT_JWT_SUBJECT=hydracraft-bot
AGENT_TIMEOUT_MS=10000
```

Set `AGENT_PROXY_JWT_SECRET` locally to the agent's existing `security.jwt_secret`
(at least 32 UTF-8 bytes). `ID` must match `agent_id`, `PROCESS_ID` must match the
configured process ID, and issuer/audience must match the agent's existing JWT
settings. Origin must be an exact origin already allowed by the agent. It is a
WebSocket handshake header, not an additional authentication factor. Do not put
tokens in the URL. The bot validates this configuration before logging into Discord.

Remote connections require WSS with normal certificate/hostname verification;
redirects are disabled. Plain WS is accepted only for numeric loopback addresses
(`127.0.0.1` or `[::1]`), for a bot on the same host or local tests. Keep the agent's
current network restrictions and TLS proxy. Store `.env` outside version control
and restrict access to the bot's OS account (for example `chmod 600 .env` on Linux).

Each command opens a separate connection, sends a freshly signed HS256 JWT in the
first `auth` message, waits for `auth.ok`, then sends `command.exec` with a unique
request ID. Tickets last 60 seconds, contain a unique `jti`, a dedicated bot `sub`,
only the `command:exec` scope and exactly the configured process. The bot checks
the acknowledged agent, subject, expiry and process before sending the command.
It closes the connection after the response or deadline, so it needs no persistent
heartbeat or token refresh. Commands cannot contain control characters or exceed
the agent's 4096-byte limit. Java account operations validate nicknames as 1–16
ASCII letters, digits or underscores before interpolating them into commands.
Errors never include JWTs, commands or remote error text.

The HMAC secret is signing authority: the agent currently shares one key with its
trusted issuers. A dedicated subject and restricted ticket limit normal bot use;
they cannot prevent a holder of that secret from signing broader permissions.
This integration does not add server-side command allowlists or per-bot keys.

A successful response confirms that the agent delivered the command to Screen;
it does not confirm that Bungee executed the requested action. A disconnect or
timeout after dispatch has an unknown outcome. The bot never automatically retries
commands, including password changes and account merges, to avoid duplicate actions.

`config/agent.json` maps trusted aliases to environment prefixes. `Proxy` is the
default Bungee alias. For another process, add an alias such as
`"Survival": { "env_prefix": "AGENT_SURVIVAL" }` under `targets` and set its `_URL`,
`_ID`, `_PROCESS_ID`, `_JWT_SECRET` and `_ORIGIN` environment variables. Optional
`AGENT_SURVIVAL_JWT_ISSUER` and `AGENT_SURVIVAL_JWT_AUDIENCE` override the global
values. Each target requires an explicit process ID; wildcards are rejected.

If binlog automation is enabled, map each `schemaServer` entry in
`config/binarylogs.json` to one of these aliases. Empty/unknown aliases fail closed;
the bot never guesses a destination. The old panel URLs, server IDs and client key
are no longer read. The agent must already have the Bungee Screen session configured
and accessible; a running HTTP healthcheck alone does not prove that console access works.


