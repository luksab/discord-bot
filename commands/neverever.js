const fs = require('fs');
const play = require('./play');

const UserImage = require("../util/getUserImage");
const { MessageAttachment } = require('discord.js');

const { createCanvas, loadImage } = require('canvas');
const { Pool } = require('pg');
const { arg } = require('mathjs');
const pool = new Pool({
  user: 'node',
  host: 'localhost',
  database: 'neverever',
  password: 'System5362<cut<<',
  port: 5432,
})

async function drawCanvas(game) {
  const canvas = createCanvas(500, 500)
  const ctx = canvas.getContext('2d')

  ctx.fillStyle = "white";
  ctx.fillRect(0, 0, canvas.width, canvas.height);

  ctx.fillStyle = "black";
  // Write "Awesome!"
  ctx.font = '40px Impact'
  //ctx.rotate(0.1)
  ctx.fillText('Scores!', 50, 40)

  // Draw line under text
  var text = ctx.measureText('Scores!')
  ctx.strokeStyle = 'rgba(0,0,0,0.5)'
  ctx.beginPath()
  ctx.lineTo(45, 42)
  ctx.lineTo(55 + text.width, 42)
  ctx.stroke()


  let start = canvas.height - 20;
  let end = 70;
  ctx.strokeStyle = 'rgba(0,0,0,1.0)';
  ctx.beginPath();
  ctx.lineTo(20, start);
  ctx.lineTo(20, end);
  ctx.stroke();

  let maxScore = 10
  let step = ((start - end) / maxScore);
  for (let i = 0; i <= maxScore; i++) {
    ctx.strokeStyle = 'rgba(0,0,0,1.0)';
    ctx.beginPath()
    ctx.lineTo(20, start - step * i)
    ctx.lineTo(45, start - step * i)
    ctx.stroke()
    ctx.strokeStyle = 'rgba(0,0,0,0.25)';
    ctx.beginPath()
    ctx.lineTo(45, start - step * i)
    ctx.lineTo(canvas.width, start - step * i)
    ctx.stroke()
    ctx.fillStyle = "black";
    ctx.font = '20px Impact'
    ctx.fillText(i, 25, start - step * i - 5)
  }


  let playerSize = Math.min(70, (70 * 6) / Object.keys(game.players).length)
  let i = 1;
  for (const id in game.players) {
    if (game.players.hasOwnProperty(id)) {
      const player = game.players[id];
      let image = await UserImage.getUserImageFromUser(id, game.client);
      image = await loadImage(image)
      ctx.drawImage(image, (playerSize + 5) * i++, start - step * player.score - playerSize / 2, playerSize, playerSize);
    }
  }

  // Object.entries(game.players).forEach(async (player, id) => {
  //   console.log(player);
  //   let image = await UserImage.getUserImageFromUser(player[0], game.client);
  //   console.log(image);
  //   ctx.drawImage(await loadImage(image), 50, 100, 70, 70)
  // })


  return canvas;
}


let questions = {};
let NSFWquestions = {};
function readFiles(dirname, q, onError) {
  fs.readdir(dirname, function (err, filenames) {
    if (err) {
      onError(err);
      return;
    }
    filenames.forEach(function (filename) {
      fs.readFile(dirname + filename, 'utf-8', function (err, content) {
        // if (err) {
        //   onError(err);
        // }
        try {
          q[filename] = content.split("\n");
        } catch (e) { }
      });
    });
  });
}
setTimeout(() => {
  readFiles("./files/nevrevr/", questions, console.log);
  readFiles("./files/nevrevr/nsfw/", NSFWquestions, console.log);
}, 1000);


function randomProperty(obj) {
  var keys = Object.keys(obj);
  return obj[keys[keys.length * Math.random() | 0]];
};


// Tables: 
//  Questions: Question, Categorie, nsfw
// function getQuestion(nsfw) {
//   let qs = nsfw ? Object.assign({}, questions, NSFWquestions) : Object.assign({}, questions);
//   let q = randomProperty(qs);
//   return q[Math.floor(Math.random() * q.length)]
// }

function getQuestion(gameID) {
  if (games[gameID].questions.length)
    return games[gameID].questions.pop().question;
  else {
    games[gameID].questions = getQuestions(gameID);
    return games[gameID].questions.pop().question;
  }
}


async function getQuestions(gameID) {
  const game = games[gameID];
  let query = "SELECT * FROM questions WHERE (";

  let queryParts = [];
  let args = [];
  for (const category of game.categories) {
    queryParts.push("category = $" + (args.length + 1).toString() +
      " AND (guild = '" + game.guild + "' OR guild = 'global' OR (guild = 'private' AND creator = '" + game.creator + "'))");
    args.push(category);
  }

  query += queryParts.join(" OR ") + ")";

  query += " ORDER BY RANDOM() LIMIT 100";

  // console.log(query);
  // console.log(args);
  return (await pool.query(query, args)).rows;
}

async function sendQuestion(channel, question) {
  message = await channel.send(question)
  await message.react("👍");
  await message.react("👎");

  const filter = (reaction, user) => {
    return ['👍', '👎'].includes(reaction.emoji.name) && !user.bot;
  };

  const collector = message.createReactionCollector(filter, { time: 60000 * 10 });
  collector.on('collect', async reaction => {
    let react;
    if (reaction.emoji.name === '👍') {
      games[message.channel.id].reactP = [];
      react = games[message.channel.id].reactP;
    } else if (reaction.emoji.name === '👎') {
      games[message.channel.id].reactN = [];
      react = games[message.channel.id].reactN;
    }
    reaction.users.cache.forEach((user) => {
      if (user.id in games[message.channel.id].players)
        react.push(user.id);
    })

    let reactAll = games[message.channel.id].reactN.concat(games[message.channel.id].reactP);
    let finished = Object.keys(games[message.channel.id].players).every(p => reactAll.includes(p));

    if (finished) {
      games[message.channel.id].reactP.forEach(pID => games[message.channel.id].players[pID].score++);
      // message.channel.send(Object.values(games[message.channel.id].players).map(player => player.name + ": " + player.score).join("\n"));
      games[message.channel.id].reactN = [];
      games[message.channel.id].reactP = [];
      let canvas = await drawCanvas(games[message.channel.id]);
      if (games[message.channel.id].toDelteI) {
        games[message.channel.id].toDelteI.delete();
      }
      let image = await message.channel.send(new MessageAttachment(canvas.toBuffer('image/png', { compressionLevel: 6, filters: canvas.PNG_ALL_FILTERS })));
      //let image = await message.channel.send(new MessageAttachment(canvas.toBuffer('image/jpeg', { quality: 0.5 })));
      games[message.channel.id].toDelteI = image;

      //let maxPlayer = Object.values(games[message.channel.id].players).reduce((maxP, player) => player.score > maxP.score ? player : maxP);
      let maxPlayers = Object.values(games[message.channel.id].players).filter(player => player.score >= 10);
      if (maxPlayers.length) {
        if (maxPlayers.length == 1)
          message.channel.send(maxPlayers[0].name + " has finished first with " + 10 + " points.");
        else
          message.channel.send(maxPlayers.map((player, i) => i == maxPlayers.length - 1 ? "and " + player.name : player.name).join(", ") + " have finished first with " + 10 + " points.");
      } else
        sendQuestion(message.channel, getQuestion(message.channel.id));
    }
  });

  collector.on('end', reaction => {
    message.channel.send("No reactions, so I assume you're not gonna play.");
  });
}


games = {};
module.exports = {
  name: 'neverever',
  description: 'Send a "never have I ever" question.',
  help: `usage for \`neverever\`:
        \`init\` to make a game
        \`start\` to start the current game
        \`categories\` to get all categories
        `,
  async execute(message) {
    const args = message.content.split(" ");
    if (!args.shift()) {
      return message.channel.send(this.help)
    }
    let canvas;

    switch (args[0]) {
      case "categories":
        var keys = Object.keys(message.channel.nsfw ? Object.assign({}, questions, NSFWquestions) : Object.assign({}, questions));
        return message.channel.send(keys.join("\n"), { split: { "maxLength": 2000 } });
        break;
      case "init":
        games[message.channel.id] = { state: "starting", starter: message.author.id, players: {}, guild: message.guild.id };
        args.shift();
        games[message.channel.id].categories = args;
        console.log(await getQuestions(message.channel.id));
        games[message.channel.id].questions = await getQuestions(message.channel.id);
        message.channel.send("Everyone who wants to play, react here!").then(async (msg) => {
          let reactG = await msg.react("🎮");
          let reactS = await msg.react("⭐");
          const filter = (reaction, user) => {
            return ['⭐'].includes(reaction.emoji.name) && !user.bot;
          };

          const collector = msg.createReactionCollector(filter, { time: 5 * 60000 });
          collector.on('collect', async reaction => {
            if (games[message.channel.id].state !== "starting") return;
            if (reaction.users.cache.has(games[message.channel.id].starter)) {
              if (!games[message.channel.id])
                return message.channel.send("No game initialized. Initalize a game with `$neverever init`.");
              if (!games[message.channel.id].state == "starting")
                return message.channel.send("The game is not in the starting phase");
              games[message.channel.id].state = "running";
              games[message.channel.id].message.reactions.cache.forEach(reaction =>
                reaction.users.cache.forEach(user => {
                  if (user.bot) return;
                  games[message.channel.id].players[user.id] = { name: user.username, score: 0 };
                })
              );
              message.channel.send(Object.keys(games[message.channel.id].players).length + " players are playing.");
              canvas = await drawCanvas(games[message.channel.id]);
              //let image = await message.channel.send(new MessageAttachment(canvas.toBuffer('image/jpeg', { quality: 0.5 })));
              let image = await message.channel.send(new MessageAttachment(canvas.toBuffer('image/png', { compressionLevel: 6, filters: canvas.PNG_ALL_FILTERS })));
              games[message.channel.id].toDelteI = image;
              sendQuestion(message.channel, getQuestion(message.channel.id));
            }
          })
          // collector.on("end", () => { console.log("collector ended."); reactG.remove(); reactS.remove(); })

          games[message.channel.id].players[message.author.id] = { name: message.author.username, score: 0 };
          games[message.channel.id].message = msg;
          games[message.channel.id].reactP = [];
          games[message.channel.id].reactN = [];
          games[message.channel.id].client = message.client;
        });
        break;
      case "start":
        if (!games[message.channel.id])
          return message.channel.send("No game initialized. Initalize a game with `$neverever init`.");
        if (!games[message.channel.id].starter == message.author.id)
          return message.channel.send("Only the starter can start the game.");
        if (!games[message.channel.id].state == "starting")
          return message.channel.send("The game is not in the starting phase");
        games[message.channel.id].state = "running";
        games[message.channel.id].message.reactions.cache.forEach(reaction =>
          reaction.users.cache.forEach(user => {
            if (user.bot) return;
            games[message.channel.id].players[user.id] = { name: user.username, score: 0 };
          })
        );
        message.channel.send(Object.keys(games[message.channel.id].players).length + " players are playing.");
        canvas = await drawCanvas(games[message.channel.id]);
        //let image = await message.channel.send(new MessageAttachment(canvas.toBuffer('image/jpeg', { quality: 0.5 })));
        let image = await message.channel.send(new MessageAttachment(canvas.toBuffer('image/png', { compressionLevel: 6, filters: canvas.PNG_ALL_FILTERS })));
        games[message.channel.id].toDelteI = image;
        sendQuestion(message.channel, getQuestion(message.channel.id));
        break;
      default:
        return message.channel.send(this.help)
        break;
    }
  },
};
