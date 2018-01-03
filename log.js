const moment = require("moment");
const fs = require("fs");

module.exports = function(message) {
	const dateStr = moment().format("DD/MM/YYYY HH:mm:ss");
	const logMessage = `[${dateStr}] ${message}`;
	console.log(logMessage);
	fs.appendFile(__dirname + "/logs.html", logMessage + "</br>", () => {});
};
