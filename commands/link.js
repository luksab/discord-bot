const {
	invite,
} = require('../config.json');

module.exports = {
	name: 'link',
	description: 'Get invite link.',
	execute(message) {
		message.channel.send(invite);
	},
};
