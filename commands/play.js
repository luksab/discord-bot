const ytdl = require("ytdl-core");
const yts = require('yt-search');

function validURL(str) {
  var pattern = new RegExp('^(https?:\\/\\/)?' + // protocol
    '((([a-z\\d]([a-z\\d-]*[a-z\\d])*)\\.)+[a-z]{2,}|' + // domain name
    '((\\d{1,3}\\.){3}\\d{1,3}))' + // OR ip (v4) address
    '(\\:\\d+)?(\\/[-a-z\\d%_.~+]*)*' + // port and path
    '(\\?[;&a-z\\d%_.~+=-]*)?' + // query string
    '(\\#[-a-z\\d_]*)?$', 'i'); // fragment locator
  return !!pattern.test(str);
}

let imagesToDelete = {};

module.exports = {
  name: "play",
  description: "Play a song in your channel!",
  async execute(message, client) {
    try {
      message.delete();
      const args = message.content.split(" ");
      const queue = message.client.queue;
      const serverQueue = message.client.queue.get(message.guild.id);

      const voiceChannel = message.member.voice.channel;
      if (!voiceChannel)
        return message.channel.send(
          "You need to be in a voice channel to play music!"
        );
      const permissions = voiceChannel.permissionsFor(message.client.user);
      if (!permissions.has("CONNECT") || !permissions.has("SPEAK")) {
        return message.channel.send(
          "I need the permissions to join and speak in your voice channel!"
        );
      }

      let songInfo;
      if (validURL(args[1])) {
        songInfo = await ytdl.getInfo(args[1]);
      } else {
        let video = await yts(message.content);
        songInfo = await ytdl.getInfo(video.videos[0].url);
      }
      if (Math.random() < client.rrRate && !message.dontGetRickRolled) {
        let video = await yts("never gonna give you up");
        songInfo = await ytdl.getInfo(video.videos[0].url);
        message.channel.send("get rickrolled!");
        setTimeout(()=>{
          message.dontGetRickRolled = true;
          this.execute(message, client)
        }, 1000)
      }
      const song = {
        title: songInfo.videoDetails.title,
        url: songInfo.videoDetails.video_url,
        thumbnail: songInfo.videoDetails.thumbnail.thumbnails.pop()
      };

      if (!serverQueue) {
        const queueContruct = {
          textChannel: message.channel,
          voiceChannel: voiceChannel,
          connection: null,
          songs: [],
          volume: 5,
          playing: true
        };

        queue.set(message.guild.id, queueContruct);

        queueContruct.songs.push(song);

        try {
          var connection = await voiceChannel.join();
          queueContruct.connection = connection;
          this.play(message, queueContruct.songs[0]);
        } catch (err) {
          console.log(err);
          queue.delete(message.guild.id);
          return message.channel.send(err);
        }
      } else {
        serverQueue.songs.push(song);
        return message.channel.send(
          `${song.title} has been added to the queue!`
        );
      }
    } catch (error) {
      console.log(error);
      message.channel.send(error.message);
    }
  },

  play(message, song) {
    const queue = message.client.queue;
    const guild = message.guild;
    const serverQueue = queue.get(message.guild.id);

    if (!song) {
      serverQueue.voiceChannel.leave();
      queue.delete(guild.id);
      return;
    }

    const dispatcher = serverQueue.connection
      .play(ytdl(song.url))
      .on("finish", () => {
        serverQueue.songs.shift();
        this.play(message, serverQueue.songs[0]);
      })
      .on("error", error => console.error(error));
    serverQueue.dispatcher = dispatcher;
    dispatcher.setVolume(0.5);
    serverQueue.textChannel.send(`Start playing: **${song.title}**`);
    serverQueue.textChannel.send(song.thumbnail.url).then(async (msg) => {
      if (guild.id in imagesToDelete && imagesToDelete[guild.id]) {
        imagesToDelete[guild.id].delete();
      }
      imagesToDelete[guild.id] = msg;
      console.log("reacting to message", msg.id);
      await msg.react('⏭️');
      await msg.react('⏹️');
      const filter = (reaction, user) => {
        return ['⏭️', '⏹️'].includes(reaction.emoji.name) && !user.bot;
      };

      msg.awaitReactions(filter, { max: 1, time: 600000, errors: ['time'] })
        .then(collected => {
          const reaction = collected.first();
          console.log("got reaction to message", reaction.message.id);
          console.log(reaction.emoji.name);
          const serverQueu = reaction.message.client.queue.get(reaction.message.guild.id);
          switch (reaction.emoji.name) {
            case '⏭️':
              if (!serverQueu) return reaction.message.channel.send('There is no song that I could skip!');
              serverQueu.connection.dispatcher.end();
              break;
            case '⏹️':
              serverQueu.songs = [];
              serverQueu.connection.dispatcher.end();
              imagesToDelete[guild.id] = null;
              msg.delete();
              break;
            default:
              break;
          }

        }).catch((e) => console.log(e))
    })
  }
};
