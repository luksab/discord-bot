"use strict";
const crypto = require('crypto');
const { Pool } = require('pg')

const pool = new Pool({
    user: 'node',
    host: 'localhost',
    database: 'neverever',
    password: 'System5362<cut<<',
    port: 5432,
})
async function startDB() {
    console.log((await pool.query('SELECT NOW()')).rows[0].now);
}
startDB();


var sha512 = function (username, password) {
    var hash = crypto.createHmac('sha512', username); /** Hashing algorithm sha512 */
    hash.update(password);
    return hash.digest('base64');
};

async function isAllowed(ws, question) {
    if (ws.admin)
        return true;
    if (ws.DiscordID === question.creator)
        return true;
    return (await pool.query("SELECT * from useringuild WHERE userid = $1 LIMIT 1;", [ws.DiscordID])).rowCount
}

async function request(message, ws) {
    if (message.guild) {
        //TODO: check permission!
        let guild = message.guild || "private";
        let num = message.num || 100;
        let category = message.category || "general";
        let questions = (await pool.query('SELECT * FROM questions WHERE guild = $1 AND category = $2 LIMIT $3', [guild, category, num])).rows;
        return ws.send(JSON.stringify({ "message-id": message["message-id"], type: "questions", data: questions }));
    }
    //return ws.send(JSON.stringify({ "message-id": message["message-id"], type: "questions", data: (await pool.query('SELECT * FROM questions WHERE creator = $1 LIMIT 100', [ws.DiscordID])).rows }));
}

function updateQuestion(question, ws) {
    if (!isAllowed(ws, question))
        return false;
    pool.query('UPDATE questions SET question = $1, explicitness = $2 WHERE id = $3;', [question.question, question.explicitness, question.id]);
}

function addQuestion(question, userID, ws) {
    if (!isAllowed(ws, question))
        return false;
    if (question.category === "add new") {
        return false;
    } else if (question.category.indexOf(",") !== -1) {
        return false;
    } else if (question.question && question.category && question.explicitness && userID && question.guild) {
        return pool.query('INSERT INTO questions (question, category, explicitness, creator, guild) VALUES ($1, $2, $3, $4, $5);', [question.question, question.category, question.explicitness, userID, question.guild]);
    }
    else {
        console.log(question);
        return false;
    }
}

async function deleteQuestion(question, ws) {
    if (!isAllowed(ws, question))
        return false;
    return (await pool.query('DELETE FROM questions WHERE id = $1;', [question.id]));
}


const fs = require('fs');
const mime = require('mime-types');
require('uWebSockets.js').App({}).ws('/*', {
    /* Options */
    compression: 1,
    maxPayloadLength: 16 * 1024 * 1024,
    idleTimeout: 3600000,
    /* Handlers */
    open: (ws, req) => {
        console.log('A WebSocket connected !');
    },
    message: async (ws, message, isBinary) => {
        if (bufToStr(message) === "ping")
            return;

        /*console.log(isBinary);
        console.log(bufToStr(message));
        console.log(new Uint8Array(message));*/
        if (!isBinary) {
            message = bufToStr(message);
            message = JSON.parse(message);
            switch (message.type) {
                case "login": //{name, password}
                    {
                        console.log("new login:", message.name);

                        if (message["name"] === "" || message["name"] === null || !(/^[a-z0-9]+$/i.test(message["name"]))) {
                            return ws.send(JSON.stringify({ "message-id": message["message-id"], "success": false, "message": "name not alphanumeric" }));
                        }

                        let user = await pool.query("SELECT * FROM users WHERE name = '" + message["name"] + "'");
                        if (user.rowCount === 0) return ws.send(JSON.stringify({ "message-id": message["message-id"], "success": false, "message": "no such user" }));
                        user = user.rows[0];

                        if (sha512(user.name, message["password"]) === user.password) {
                            ws["name"] = message["name"];
                            ws["DiscordID"] = user.id;
                            ws["admin"] = user.admin;
                            return ws.send(JSON.stringify({ "message-id": message["message-id"], "success": true, "message": "login" }));
                        } else {
                            return ws.send(JSON.stringify({ "message-id": message["message-id"], "success": false, "message": "wrong password" }));
                        }
                    }
                case "getGuilds":
                    let guilds = (await pool.query("SELECT * FROM guilds WHERE guildid IN (SELECT guildid FROM useringuild WHERE userid = $1);", [ws.DiscordID])).rows;
                    return ws.send(JSON.stringify({ "message-id": message["message-id"], "guilds": guilds }));
                case "getCategories":
                    let categories = (await pool.query("SELECT DISTINCT category FROM questions WHERE guild = $1", [message.guild])).rows;
                    return ws.send(JSON.stringify({ "message-id": message["message-id"], "categories": categories }));
                case "request":
                    request(message, ws);
                    break;
                case "updateQuestion":
                    ws.send(JSON.stringify({ "message-id": message["message-id"], type: "questionUpdated", success: Boolean(await updateQuestion(message, ws)) }));
                    break;
                case "addQuestion":
                    return ws.send(JSON.stringify({ "message-id": message["message-id"], success: Boolean(await addQuestion(message, ws.DiscordID, ws)) }));
                    break;
                case "deleteQuestion":
                    deleteQuestion(message, ws);
                    return ws.send(JSON.stringify({ "message-id": message["message-id"] }));
                    break;
                default:
                    break;
            }
            //console.log(JSON.parse(message));
            //fs.appendFileSync('ratings.txt', message + '\n');
        }
    }
}).any('/*', (res, req) => {
    let data;
    if (req.getUrl() == "/")
        data = fs.readFileSync('./static/index.html');
    else
        try {
            data = fs.readFileSync('./static' + req.getUrl());
            const mimeType = mime.lookup('./static' + req.getUrl()) || 'application/octet-stream';
            res.writeHeader('Content-Type', mimeType);
        } catch (error) {
            data = error.message;
        }
    if (data == null) {
        res.end("nö");
    }
    res.end(data);
}).listen(5000, (token) => {
    if (token) {
        console.log('Listening to port ' + 5000);
    } else {
        console.log('Failed to listen to port ' + 5000);
    }
});


let bufToStr = (message) => Buffer.from(message).toString();