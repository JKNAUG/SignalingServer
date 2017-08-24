// WebSocket server for WebRTC signaling.
// Reference implementation: https://www.tutorialspoint.com/webrtc/webrtc_signaling.htm

const WebSocket = require("ws");
const express = require("express");
const moment = require("moment");

// const wss = new WebSocket.Server({ host: "192.168.0.105", port: 8080 });
const PORT = process.env.PORT || 8080;
const server = express()
	.use((req, res) => {
		res.send(`Signaling server active with ${wss.clients.size} connected clients.`);
		// Send back index.html for any http request.
		// res.sendFile("index.html", { root: __dirname });
	})
	.listen(PORT, () => {
		log(`Listening on port ${PORT}.`);
	});

// const wss = new WebSocket.Server({ host: "0.0.0.0", port: PORT });
// Start the WebSocket server.
var wss = new WebSocket.Server({ server });

// All connected users.
const users = [];

class User {
	constructor(connection, name) {
		this.connection = connection;
		this.name = name;
	}

	setConnectedUser(user) {
		// Add some validation...
		this.connectedUser = user;
	}

	getConnectedUser() {
		return this.connectedUser;
	}

	send(message) {
		this.connection.send(JSON.stringify(message));
	}
}

wss.on("listening", () => {
	log("WebSocket server listening...");
});

wss.on("error", error => {
	log(`WebSocket Server error:\n${error}`);
});

function findUser(name) {
	return users.find(user => user.name === name);
}

function findUserByConnection(connection) {
	return users.find(user => user.connection === connection);
}

wss.on("connection", (connection) => {
	log("New WebSocket connection...");

	// Start listening for message when a connection is made.
	connection.on("message", (rawMessage) => {
		let message;
		try {
			message = JSON.parse(rawMessage);
		} catch (exception) {
			log(exception);
			return;
		}

		switch (message.Type) {
			case "Login":
				{
					const username = message.FromUserId;
					// If the user is not logged in yet.
					log(`Logging in ${username}...`);
					if (!findUser(username)) {
						const user = new User(connection, username);
						users.push(user);
					} else {
						log(`${username} is already logged in.`);
					}
				}
				break;

			case "Call":
				let callingUser = findUserByConnection(connection);
				callingUser.setConnectedUser(findUser(message.ToUserId));
				forwardMessage(message);
				break;

			case "CallReject":
			case "SdpOffer":
			case "SdpAnswer":
			case "IceCandidate":
				forwardMessage(message);
				break;

			case "CallAccept":
				{
					let user = findUserByConnection(connection);
					user.setConnectedUser(findUser(message.ToUserId));
					forwardMessage(message);
				}
				break;

			case "Hangup":
				{
					let user = findUserByConnection(connection);
					if (user.getConnectedUser()) {
						hangup(user, message);
					}
				}
				break;
		}
	});

	connection.on("error", error => {
		log(`Connection ${connection.username} error:\n${error}`);
	});

	connection.on("close", (/*code, message*/) => {
		close(connection);
	});

	// When we receive the heartbeat back from the client,
	// the connection is still alive.
	connection.on("pong", () => {
		connection.isAlive = true;
	});
});

// Every 30 seconds, we must send a heartbeat to all clients so the
// connection does not time out.
setInterval(() => {
	wss.clients.forEach(connection => {
		if (connection.isAlive === false) {
			return connection.terminate();
		}

		connection.isAlive = false;
		connection.ping("", false, true);
	});
}, 30000);

function forwardMessage(message) {
	const receivingUsername = message.ToUserId;
	const userToForwardTo = findUser(receivingUsername);
	if (userToForwardTo) {
		log(`${message.FromUserId}: Sending message ${message.Type} to ${receivingUsername}.`);
		userToForwardTo.send(message);
		return true;
	}

	// User to send message to is not online.
	log(`${message.FromUserId}: Could not forward message ${message.Type} to ${receivingUsername}. Hanging up.`);
	hangup(findUser(message.FromUserId), {
		Type: "Hangup", // Could change this type to "User not available" or something.
		FromUserId: message.FromUserId,
		ToUserId: message.FromUserId
	})
	return false;
}

function close(connection) {
	let user = findUserByConnection(connection);
	if (user) { // If logged in
		const connectedUser = user.getConnectedUser();
		if (connectedUser) {
			hangup(user, {
				Type: "Hangup",
				FromUserId: user.name,
				ToUserId: connectedUser.name
				// Might need to add payload later
			});
		}
		log(`Closing user ${user.name}.`);
		users.splice(users.indexOf(user), 1);
	} else {
		log("Closing connection without login.");
	}
}

function hangup(user, message) {
	// Clear "other username" on both connections.
	// This could be a bit more elegant with some sort of "ongoing calls" list.
	// let otherConnection = users[connection.otherUsername];
	let otherUser = user.getConnectedUser();
	if (otherUser) {
		otherUser.setConnectedUser(null);
	}
	user.setConnectedUser(null);
	forwardMessage(message);
}

function log(message) {
	const dateStr = moment().format("DD/MM/YYYY HH:mm:ss");
	console.log(`[${dateStr}] ${message}`);
}
