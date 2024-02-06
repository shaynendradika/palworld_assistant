# Palworld Assistant

This repository contains the code for a Discord bot designed for the Palworld game. The bot includes features such as simple whitelist and autosave, integrated seamlessly with Discord bot for ease of use.

## Features

- **Whitelist:** Easily manage whitelist entries for your Palworld server directly from Discord.
- **Autosave:** Ensure regular autosaving of game progress every 30 minutes to prevent loss of data.

## Getting Started

To use this bot for your Palworld server, follow these steps:

1. Clone this repository to your local machine.
2. Install the required dependencies using `npm install`.
3. Configure the bot token and other settings in `config.json`.
4. Run the bot using `node index.js` or pm2.

## Configuration

```json
{
    "discord": {
        "token": "YOUR_DISCORD_TOKEN",
        "guild": "YOUR_DISCORD_GUILD_ID",
        "prefix": "!",
        "member_roles": "YOUR_DISCORD_MEMBER_ROLE_TO_ACCESS_WHITELIST_COMMAND",
        "channel_cmd": "YOUR_DISCORD_CHANNEL_FOR_COMMANDS",
        "channel_whitelist_log": "YOUR_DISCORD_CHANNEL_FOR_WHITELIST_LOG",
        "channel_kick_log": "YOUR_DISCORD_CHANNEL_FOR_KICK_LOG"
    },
    "game": {
        "host": "127.0.0.1",
        "game_port": 8211,
        "rcon_port": 25575,
        "rcon_password": "YOUR_GAME_RCON_PASSWORD"
    }
}
```

## Usage

Once the bot is running and added to your Discord server, you can use the following commands:

- `!palworld whitelist <steam_id>`: Add your Steam ID to the whitelist.

## Support

If you find this bot useful and would like to support its development or sponsor additional features, consider visiting [Sociabuzz](https://sociabuzz.com/shaynendradika) for more information.

## Contributing

Contributions are welcome! If you have any suggestions, bug fixes, or improvements, feel free to open an issue or submit a pull request.

## License

This project is licensed under the MIT License - see the [LICENSE](LICENSE) file for details.