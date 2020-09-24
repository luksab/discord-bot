module.exports = {
  name: "volume",
  description: "Adjust the volume",
  async execute(message) {
    try {
      message.delete();
      const args = message.content.split(" ");

      const serverQueue = message.client.queue.get(message.guild.id);
      if(!serverQueue) return;
      const dispatcher = serverQueue.dispatcher;
      const volume = parseFloat(args[1]);
      message.channel.send("setting volume to "+volume);
      dispatcher.setVolume(volume/100.);
    } catch (e) {
      console.log(e);
      message.author.send(e.message);
    }
  }
};
