const fs = require('fs')
const Discord = require('discord.js');
const Client = require('./client/Client');
const {
	prefix,
	token,
} = require('./config.json');
const { PassThrough } = require('stream');

const client = new Client();
client.commands = new Discord.Collection();
client.rrRate = 0.01;
client.owner = "393450329724682240";

const commandFiles = fs.readdirSync('./commands').filter(file => file.endsWith('.js'));

for (const file of commandFiles) {
	const command = require(`./commands/${file}`);
	client.commands.set(command.name, command);
}

// console.log(client.commands);

client.once('ready', () => {
	console.log('Ready!');
	client.users.fetch(client.owner).then(user => {
		user.send("Ready!");
	});
});

client.once('reconnecting', () => {
	console.log('Reconnecting!');
});

client.once('disconnect', () => {
	console.log('Disconnect!');
});

client.on('voiceStateUpdate', (oldState, newState) => {
	let listeningUsers = client.commands.get("vcping").listeningUsers;

	if (oldState.channel === null && newState.channel !== null && newState.channel.members.size === 1) {
		// User Joins a voice channel
		if (listeningUsers.hasOwnProperty(newState.guild.id)) {
			newState.channel.createInvite().then(link => {
				const vcJoinEmbed = new Discord.MessageEmbed()
					.setTitle(newState.guild.name)
					.setURL(link.url)
					.setAuthor(newState.member.displayName, newState.member.user.avatarURL(), link.url)
					.setDescription(`${newState.member.displayName} Started VC in ${newState.channel.name}`)
					.setThumbnail(newState.guild.iconURL())
				listeningUsers[newState.guild.id].forEach(userId => {
					if (userId !== newState.member.id)
						client.users.fetch(userId).then(user => {
							user.send(vcJoinEmbed);
						})
				});
			});
		}
	} else if (newState.channel === null) {
		// User leaves a voice channel
		if (oldState.channel && oldState.channel.members.size === 0) {
			if (listeningUsers.hasOwnProperty(oldState.guild.id)) {
				const vcLeaveEmbed = new Discord.MessageEmbed()
					.setTitle(newState.guild.name)
					.setAuthor(newState.member.displayName, newState.member.user.avatarURL())
					.setDescription(`Everyone left VC in ${oldState.channel.name}`)
					.setThumbnail(oldState.guild.iconURL())
				listeningUsers[oldState.guild.id].forEach(userId => {
					if (userId !== newState.member.id)
						client.users.fetch(userId).then(user => {
							user.send(vcLeaveEmbed);
						});
				});
			}
		}
	}
})

client.on('message', async message => {
	if (message.author.bot) return;
	if (message.channel.type !== 'dm') return;
	if (message.content.match(/^help([\.\!\?]|$)/im))
		client.commands.get("help").execute(message, client);
});

client.on('message', async message => {
	if (message.author.bot) return;
	let found = message.content.match(new RegExp(/(?:^| |\.)(i(?:['`´‘’]?m| am))((?: \w+){1,3})(?:\.|\!|$)/im));
	if (found)
		message.channel.send("Hello" + found[2] + "! " + found[1] + " dad.");
});

client.on('message', async message => {
	if (message.author.bot) return;
	if (message.channel.type === 'dm' && message.author.id != client.owner) client.users.cache.get(client.owner).send("dm from " + message.author.username + "!\n" + message.content);
	const args = message.content.slice(prefix.length).split(/ +/);
	const commandName = args.shift().toLowerCase();
	const command = client.commands.get(commandName);

	if (!message.content.startsWith(prefix)) return;
	if (!command) {
		console.log("unknown command. Type " + prefix + "help for all commands.")
		return message.channel.send("unknown command. Type " + prefix + "help for all commands.");
	}


	try {
		command.execute(message, client);
	} catch (error) {
		console.error(error);
		client.users.cache.get(client.owner).send('Problem with command: \n' + error, { split: { "maxLength": 2000 } });
		message.reply('There was an error trying to execute that command!');
	}
});


client.login(token);

process.on('uncaughtException', function (err) {
	try {
		client.users.cache.get(client.owner).send('Caught exception: \n' + err, { split: { "maxLength": 2000 } });
	} catch (e) { }
	console.log('Caught exception: ', err);
});

process.on('unhandledRejection', err => {
	try {
		client.users.cache.get(client.owner).send('Caught rejection: \n' + err, { split: { "maxLength": 2000 } });
	} catch (e) { }
	console.log('Caught rejection: ', err);
});