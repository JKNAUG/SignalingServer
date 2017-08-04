// WebSocket server for WebRTC signaling.
// Reference implementation: https://www.tutorialspoint.com/webrtc/webrtc_signaling.htm

const WebSocket = require("ws");

// Start the WebSocket server on port 8080.
// const wss = new WebSocket.Server({ server: httpServer });
// const wss = new WebSocket.Server({ host: "192.168.0.105", port: 8080 });
const wss = new WebSocket.Server({ port: 8080 });

// All connected users.
let users = {};

// class User {
// 	constructor(username, connection) {
// 		this.username = username;
// 		this.connection = connection;
// 		this.state = "idle";
// 	}
// }

wss.on("error", error => {
	log("WebSocket Server error: " + error);
});

wss.on("connection", (connection) => {
	// Start listening for message when a connection is made.
	connection.on("message", (rawMessage) => {
		let message;
		try {
			message = JSON.parse(rawMessage);
		} catch (error) {
			log(error);
			return;
		}

		switch (message.Type) {
			case "Login":
				{
					let username = message.FromUserId;
					// If the user is not logged in yet.
					if (!users[username]) {
						log("Logging in " + username);
						// Store the connection by the username as a key in the users list.
						users[username] = connection;
						// Store our username on the connection object.
						connection.username = username;
						// alternative
						// const user = new User(username, connection);
						// users[username] = user;
						// connection.user = user;
					}
				}
				break;

			case "Call":
			case "CallReject":
			case "SdpOffer":
			case "SdpAnswer":
			case "IceCandidate":
				forwardMessage(message);
				break;

			case "CallAccept":
				// Set "other username" on both connections.
				connection.otherUsername = message.ToUserId;
				users[message.ToUserId].otherUsername = connection.username;
				forwardMessage(message);
				break;

			case "Hangup":
				if (connection.otherUsername) {
					// Clear both connections' "other username".
					// This could be a bit more elegant with some sort of "ongoing calls" list.
					hangup(connection, message);
				}
				break;
		}
	});

	connection.on("error", error => {
		log("Connection " + connection.username + "error:\n" + error);
	});

	connection.on("close", (code, message) => {
		close(connection);
	});
});

function forwardMessage(message) {
	let receivingUsername = message.ToUserId;
	let userToForwardTo = users[receivingUsername];
	if (userToForwardTo) {
		log(`Sending message ${message.Type} to user ${receivingUsername}.`);
		sendTo(userToForwardTo, message);
		return true;
	}

	log(`Could not forward message ${message.Type} to user ${receivingUsername}.`);
	return false;
}

function close(connection) {
	if (connection.username) { // If logged in
		if (connection.otherUsername) {
			hangup(connection, {
				Type: "Hangup",
				FromUserId: connection.username,
				ToUserId: connection.otherUsername
				// Might need to add payload later
			});
		}
		log("Closing: " + connection.username);
		delete users[connection.username]; // Remove this user from the list.
	}
}

function hangup(connection, message) {
	// Clear "other username" on both connections.
	// This could be a bit more elegant with some sort of "ongoing calls" list.
	users[connection.otherUsername].otherUsername = null;
	connection.otherUsername = null;
	forwardMessage(message);
}

function sendTo(connection, message) {
	connection.send(JSON.stringify(message));
}

function log(message) {
	console.log(message);
}