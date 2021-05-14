const {
	invite,
} = require('../config.json');

const fs = require('fs');

let listeningUsers = {
	//serverId: Set(userId)
}

const objectMap = (obj, fn) =>
			Object.fromEntries(
				Object.entries(obj).map(
				([k, v], i) => [k, fn(v, k, i)]
				)
			)

try {
	listeningUsers = JSON.parse(fs.readFileSync('listeningUsers.json'));	
	console.log(listeningUsers);
	listeningUsers = objectMap(listeningUsers, a => new Set(a));
	console.log(listeningUsers);
} catch (e) {
	console.error(e);
	listeningUsers = {
		//serverId: Set(userId)
	}		
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
		console.log(listeningUsers);

		fs.writeFile("listeningUsers.json", 
			JSON.stringify(objectMap(listeningUsers, s => Array.from(s))), function (err,data) {});
	},
	listeningUsers: listeningUsers,
};
