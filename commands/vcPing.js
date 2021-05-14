const {
	invite,
} = require('../config.json');

let listeningUsers = {
	//serverId: Set(userId)
}

module.exports = {
	name: 'vcping',
	description: 'Get a ping when a vc starts.',
	execute(message) {
		if(!listeningUsers.hasOwnProperty(message.guild.id)){
			listeningUsers[message.guild.id] = new Set();
		}
		if(listeningUsers[message.guild.id].has(message.author.id)){
			listeningUsers[message.guild.id].delete(message.author.id);
			if(listeningUsers[message.guild.id].size==0)
				delete listeningUsers[message.guild.id];
			message.reply("I deleted you from the list.");
		}else{
			listeningUsers[message.guild.id].add(message.author.id);
			message.reply("I added you to the list.");
		}
	},
	listeningUsers: listeningUsers,
};
