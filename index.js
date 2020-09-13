const fs = require('fs')
const Discord = require('discord.js');
const Client = require('./client/Client');
const {
	prefix,
	token,
} = require('./config.json');

const client = new Client();
client.commands = new Discord.Collection();
client.rrRate = 0.05;

const commandFiles = fs.readdirSync('./commands').filter(file => file.endsWith('.js'));

for (const file of commandFiles) {
	const command = require(`./commands/${file}`);
	client.commands.set(command.name, command);
}

console.log(client.commands);

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
	const args = message.content.split(/ +/);
	if ((args[0] == "I'm" || args[0] == "i'm" || args[0] == "im" || args[0] == "Im") && args.length < 7) {
		args.shift();
		message.channel.send("Hello " + args.join(" ") + "! I'm dad.");
	}
	if (((args[0] == "I" || args[0] == "i") && args[1] == "am") && args.length < 7) {
		args.shift();
		args.shift();
		message.channel.send("Hello " + args.join(" ") + "! I'm dad.");
	}
});

client.on('message', async message => {
	if (message.author.bot) return;
	const args = message.content.slice(prefix.length).split(/ +/);
	const commandName = args.shift().toLowerCase();
	const command = client.commands.get(commandName);

	if (!message.content.startsWith(prefix)) return;
	if (!command) return message.reply("unknown command. Type " + prefix + "help for all commands.");


	try {
		command.execute(message, client);
	} catch (error) {
		console.error(error);
		message.reply('There was an error trying to execute that command!');
	}
});


client.login(token);
