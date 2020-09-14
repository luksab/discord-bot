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
client.rrRate = 0.05;

const commandFiles = fs.readdirSync('./commands').filter(file => file.endsWith('.js'));

for (const file of commandFiles) {
	const command = require(`./commands/${file}`);
	client.commands.set(command.name, command);
}

// console.log(client.commands);

client.once('ready', () => {
	console.log('Ready!');
});

client.once('reconnecting', () => {
	console.log('Reconnecting!');
});

client.once('disconnect', () => {
	console.log('Disconnect!');
});

client.on('message', async message => {
	if (message.author.bot) return;
	let found = message.content.match(new RegExp(/(?:^| |\.)([Ii](?:'?m| am))((?: \w+){1,3})(?:\.|$)/));
	if (found)
		message.channel.send("Hello" + found[2] + "! " + found[1] + " dad.");
});

client.on('message', async message => {
	if (message.author.bot) return;
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
		message.reply('There was an error trying to execute that command!');
	}
});


client.login(token);
