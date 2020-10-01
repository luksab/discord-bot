const fs = require("fs");
const request = require('request').defaults({ encoding: null });
const sharp = require('sharp');

function getBuffer(url) {
    return new Promise(function (resolve, reject) {
        request(url, function (error, res, body) {
            if (!error && res.statusCode == 200) {
                resolve(body);
            } else {
                reject(error);
            }
        });
    });
}

exports.getGuildImageFromGuild = async (guild, client) => {
    if (!guild) return;
    if (typeof guild == "string") {
        guild = client.guilds.cache.get(guild);
        //console.log(user);
    }
    let path = './files/guildImages/' + guild.icon + ".png";
    if (fs.existsSync(path)) {
        return path
    }

    const imageBuf = await getBuffer(guild.iconURL());
    let image = sharp(imageBuf)
    await image.toFile(path);
    return path;
}
