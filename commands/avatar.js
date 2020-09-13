const { getUserFromMention } = require('../util/getUser')

module.exports = {
	name: 'avatar',
	description: 'Get the users avatar.',
	execute(message, client) {
		const split = message.content.split(/ +/);
		const args = split.slice(1);
		const user = getUserFromMention(args[0], client);
		if (user)
			return message.reply(user.displayAvatarURL({ dynamic: true }));
		message.reply(message.author.displayAvatarURL());
	},
};
