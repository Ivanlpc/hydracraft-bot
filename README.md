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

- Node.js (v20 or higher)
- MySQL (v5.7 or higher)
- A Discord server and administrative permissions to add bots

## Installation

1. Clone the repository:
   ```bash
   git clone https://github.com/ivanlpc/hydracraft-bot.git
   ```
2. Install the dependencies:
   ```bash
   cd hydracraft-bot
   npm install
   ```
3. Configure the `.env` file with your MySQL credentials and your bot's Discord token.
4. Run the bot:
   ```bash
   node index.js
   ```


