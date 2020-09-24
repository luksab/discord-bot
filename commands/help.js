const fs = require('fs')
const {
	prefix,
	token,
} = require('../config.json');

module.exports = {
	name: 'help',
	description: 'List all available commands.',
	execute(message) {
		let str = 'My prefix is `' + prefix + '`.\n';
		const commandFiles = fs.readdirSync('./commands').filter(file => file.endsWith('.js'));

		for (const file of commandFiles) {
			const command = require(`./${file}`);
			if (!command.noHelp)
				str += `\`${command.name}\`: ${command.description} \n`;
		}

		message.channel.send(str);
	},
};