const mathjs = require('mathjs');
const { derivative } = require('mathjs');

module.exports = {
	name: 'derive',
	description: 'derive a math.js expression. Give the variable to derive after a comma, like `x^2, x`.',
	execute(message) {
		let expression = message.content.substring(message.content.indexOf(" ") + 1);
		expression = expression.split(",");
		if(expression.length != 2){
			return message.channel.send("There are not 2 parts to this command. The command should look like `x^2, x`.")
		}
		let derivative = mathjs.derivative(mathjs.parse(expression[0]), mathjs.parse(expression[1]));
		message.channel.send("`d/dx " + mathjs.parse(expression[0]) + " = " + derivative.toString() + "`")
	},
};
