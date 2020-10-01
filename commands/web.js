"use strict";
const crypto = require('crypto');
const { Pool } = require('pg')
const GuildImage = require("../util/getGuildImage");

const pool = new Pool({
    user: 'node',
    host: 'localhost',
    database: 'neverever',
    password: 'System5362<cut<<',
    port: 5432,
})

var sha512 = function (username, password) {
    var hash = crypto.createHmac('sha512', username); /** Hashing algorithm sha512 */
    hash.update(password);
    return hash.digest('base64');
};

async function saveUser(name, pw, id) {
    let q = `
    INSERT INTO users (name, password, id)
    VALUES($1, $2, $3)
    ON CONFLICT(id) DO UPDATE
        SET name = excluded.name,
        password = excluded.password;
        `;
    await pool.query(q, [name, sha512(name, pw), id]);
    // await pool.query("INSERT INTO users (name, password, id) VALUES ($1, $2, $3)", [name, sha512(name, pw), id]);
}

module.exports = {
    name: "web",
    description: "Configure your web interface.\n Create a new user by typing `$web [username] [password]`",
    async execute(message, client) {
        if (message.channel.type !== 'dm') return message.author.send("Please configure your web interface here.");
        const args = message.content.split(" ");
        if (args[1] === "update") {
            message.channel.send("Updating your guilds...");
            client.guilds.cache.array().forEach(async guild => {
                let q = `
                    INSERT INTO guilds (guildID, name, iconPath)
                    VALUES($1, $2, $3)
                    ON CONFLICT(guildID) DO UPDATE
                        SET name = excluded.name,
                        iconPath = excluded.iconPath;
                        `;
                await pool.query(q, [guild.id, guild.name, await GuildImage.getGuildImageFromGuild(guild, client)]);

                guild.members.cache.array().forEach(async member => {
                    let q = `
                        INSERT INTO userInGuild (guildID, userID)
                        VALUES($1, $2) 
                        ON CONFLICT ON CONSTRAINT user_in_guild_unique DO NOTHING;
                            `;
                await pool.query(q, [guild.id, member.id]);
                })
            });
            return;
        }
        if (!args[1] || !args[2]) return message.channel.send("Please provide a user name and a password like `$web [name] [password]`.");
        try {
            await saveUser(args[1], args[2], message.author.id);
            message.channel.send("Success!");
        } catch (e) {
            console.log(e);
            if (e.constraint === "name_unique")
                return message.channel.send("Someone took that username already.");
            message.channel.send("Something went wrong...");
        }
    }
};
