const { Client, Events, GatewayIntentBits, ActivityType, Partials } = require('discord.js')
const fs = require('fs')
const schedule = require('node-schedule');
const sqlite3 = require('sqlite3').verbose()
const { GameDig } = require('gamedig'); 
const { Rcon } = require('minecraft-rcon-client');

const db = new sqlite3.Database('./palworld.db')
const configRaw = fs.readFileSync('config.json')
const config = JSON.parse(configRaw)

const query = { type: 'palworld', host: config.game.host, port: config.game.game_port }

const client = new Client({
    intents: [
        GatewayIntentBits.Guilds,
        GatewayIntentBits.GuildMessages,
        GatewayIntentBits.MessageContent,
        GatewayIntentBits.GuildMembers
    ],
    partials: [Partials.Message, Partials.Channel, Partials.Reaction],
})

client.once(Events.ClientReady, (client) => {
    console.log(`Bot Ready!`)
    
    schedule.scheduleJob('*/30 * * * *', async function(){
        await executeRCON('Save');
        await executeRCON('Broadcast Game_Saved!');
    });

    setInterval(() => {
        GameDig.query(query).then((state) => {
            client.user.setPresence({
                activities: [{ name: `(${state.numplayers}/${state.maxplayers})`, type: ActivityType.Watching }],
            });
        }).catch((error) => {
            console.log(`Server is offline, error: ${error}`);
        });
    }, 30 * 1000);

    setInterval(() => {
        checkWhitelist()
    }, 5000);
});

client.on(Events.MessageCreate, (message) => {
    if (!message.content.startsWith(config.discord.prefix) || message.author.bot) return;
    if (!message.member.roles.cache.some(r => config.discord.member_roles.includes(r.name))) return;

    const args = message.content.slice(1).trim().split(/ +/);
    const command = args.shift().toLowerCase();

    if (command === 'palworld') {
        if(args[0] === 'whitelist') {
            const steamid = args[1]
            const discordid = message.author.id
            const timestamp = Math.floor(Date.now() / 1000)
            const channel = client.guilds.cache.get(config.discord.guild).channels.cache.get(config.discord.channel_whitelist_log);

            if(steamid.split("").length < 17) {
                message.reply("https://tenor.com/view/ngada-ngada-lu-anwar-bab-starhits-sembarangan-aja-jangan-bohong-deh-gif-19874811")
                return
            }; 
                    
            db.get('SELECT * FROM whitelist WHERE discord_id = ?', [discordid], (err, row) => {
                if (err) {
                    console.error(err.message);
                    return;
                }
                
                if(row){
                    db.run('UPDATE whitelist SET steam_id = ?, created_at = ? WHERE discord_id = ?', [steamid, timestamp, discordid], function(err) {
                        if (err) {
                            return console.error(err.message);
                        }

                        message.reply(`Steam ID ${steamid} is now updated on whitelist.`);
                        channel.send(`[NEW] <@${discordid}> (Discord ID: ${discordid}) whitelist Steam ID **${steamid}**.`)
                        console.log(`[NEW] ${message.author.name} (Discord ID: ${discordid}) whitelist Steam ID ${steamid}.`)
                    });
                } else {
                    db.run('INSERT INTO whitelist (steam_id, discord_id, created_at) VALUES (?, ?, ?)', [steamid, discordid, timestamp], function(err) {
                        if (err) {
                            return console.error(err.message);
                        }

                        message.reply(`Steam ID ${steamid} is now added to whitelist.`);
                        channel.send(`[UPDATE] <@${discordid}> (Discord ID: ${discordid}) whitelist Steam ID **${steamid}**.`)
                        console.log(`[UPDATE] ${message.author.name} (Discord ID: ${discordid}) whitelist Steam ID ${steamid}.`)
                    });
                }
            });
        }
    }
});

async function checkWhitelist() {
    try {
        const players = await executeRCON('ShowPlayers');
        players.forEach(player => {
            const timestamp = Math.floor(Date.now() / 1000); 
            db.run('INSERT OR REPLACE INTO online_players (steam_id, name, last_seen) VALUES (?, ?, ?)', [player.steamid, player.name, timestamp], function(err) {
                if (err) {
                    return console.error(err.message);
                }
            });

            db.get('SELECT * FROM whitelist WHERE steam_id = ?', [player.steamid], async (err, row) => {
                if (err) {
                    console.error(err.message);
                    return;
                }
                
                if(!row){
                    const channel = client.guilds.cache.get(config.discord.guild).channels.cache.get(config.discord.channel_kick_log);
                    channel.send(`**${player.name}** (Steam ID: ${player.steamid}) kicked from server. Reason: Not whitelisted.`)
                    console.log(`${player.name} (Steam ID: ${player.steamid}) kicked from server: Not whitelisted.`)
                    await executeRCON(`KickPlayer ${player.steamid}`);
                    await executeRCON(`Broadcast TEST_WHITELIST_${player.steamid}_kicked_from_server`);
                }
            });
        });
    } catch (err) {
        console.error('Error: ', err);
    }
}

function executeRCON(...args) {
    const command = args.join(" ");
    const rcon = new Rcon({ port: config.game.rcon_port, host: config.game.host, password: config.game.rcon_password })

    return new Promise((resolve, reject) => {
        rcon.connect().then(() => {
            rcon.send(command).then((response) => {
                rcon.disconnect();
                if(command === 'ShowPlayers'){
                    const players = response.split('\n')
                        .map(line => line.split(',')) 
                        .slice(1)
                        .map(([ name, pid, steamid ]) => ({ name, pid, steamid }))
                        .map(obj => ({ name: obj.name, pid: obj.pid, steamid: obj.steamid }))
                        .filter(({ name }) => name.trim() !== "\x00\x00");
                        resolve(players);
                }

                resolve(response);
            }).catch((err) => {
                rcon.disconnect();
                reject(err);
            });
        }).catch((err) => {
            reject(err);
        });
    });
}

client.login(config.discord.token)