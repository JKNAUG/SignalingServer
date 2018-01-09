const express = require("express");
const fs = require("fs");
const log = require("./log");

const app = express();

module.exports.createServer = function(users) {
	const PORT = process.env.PORT || 8080;
	const server = app.listen(PORT, () => {
		fs.writeFileSync(__dirname + "/logs.html", "");
		log(`Listening on port ${PORT}.`);
	});

	server.startServer = function(users) {
		app.get("/", (req, res) => {
			try {
				res.send(`Signaling server active with ${users.length} connected users.`);
			} catch (e) {
				res.send("Error: " + e.message);
			}
		});
		
		// Send the logs file when requested.
		app.get("/logs", (req, res) => {
			res.sendFile("logs.html", { root: __dirname });
		});
		
		app.get("/clients", (req, res) => {
			try {
				let str = "Logged in users:<br>";
				for (const user of users) {
					str += user.name + "<br>";
				}
				res.send(str);
			} catch (e) {
				res.send("Error: " + e.message);
			}
		});
	};

	return server;
};
