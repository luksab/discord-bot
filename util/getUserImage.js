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

exports.getUserImageFromUser = async (user, client) => {
    if (!user) return;
    if (typeof user == "string") {
        user = client.users.cache.get(user);
        //console.log(user);
    }
    let path = './files/userImages/' + user.id + ".png";
    if (fs.existsSync(path)) {
        return path
    }

    const imageBuf = await getBuffer(user.displayAvatarURL());
    let image = sharp(imageBuf)
    await image.toFile(path);
    return path;
}
