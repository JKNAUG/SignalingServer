// WebSocket server for WebRTC signaling.
// Reference implementation: https://www.tutorialspoint.com/webrtc/webrtc_signaling.htm
const WebSocket = require("ws");
const httpServer = require("./server");
const log = require("./log");
const sendUserList = require("./sendUserList");
const heartbeat = require("./heartbeat");
const User = require("./user");

// All connected users.
const users = [];

// Start the WebSocket server.
const server = httpServer.createServer();
const wss = new WebSocket.Server({ server });
server.startServer(wss, users);

// Every 25 seconds, we must send a heartbeat to all clients so the
// connection does not time out.
heartbeat(wss, 25000);

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
					const loginArgs = JSON.parse(message.Payload);
					const username = loginArgs.Username;
					// If the user is not logged in yet.
					if (!findUser(username)) {
						log(`Logging in ${username} (profile ${loginArgs.ProfileName})...`);
						const user = new User(connection, username, loginArgs.ProfileName);
						users.push(user);
						broadcastUserList();
					} else {
						log(`${username} is already logged in.`);
					}
				}
				break;

			case "Call":
				let callingUser = findUserByConnection(connection);
				let userToCall = findUser(message.ToUserId);
				let successfulConnection = false;
				if (callingUser && userToCall) {
					if (userToCall.isAvailable()) {
						// Connect both users. They will be disconnect or reject or hangup.
						callingUser.setConnectedUser(userToCall);
						userToCall.setConnectedUser(callingUser);
						
						if (forwardMessage(message)) {
							successfulConnection = true;
							broadcastUserList();
						}
					}
					else if (userToCall.getConnectedUser() === callingUser) {
						// We were already connected to the other user.
						successfulConnection = true;
					}
				}

				if (!successfulConnection && callingUser) {
					hangup(callingUser, {
						Type: "Hangup",
						FromUserId: message.FromUserId,
						ToUserId: message.FromUserId
					});
				}
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
					if (forwardMessage(message)) {
						broadcastUserList();
					}
				}
				break;

			case "Hangup":
				{
					let user = findUserByConnection(connection);
					if (user.getConnectedUser()) {
						hangup(user, message);
						broadcastUserList();
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
	});
	broadcastUserList();
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
		broadcastUserList();
	} else {
		log("Closing connection without login.");
	}
}

function hangup(user, message) {
	log("Hangup user " + user.name);

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

function broadcastUserList() {
	log("Broadcasting updated user list...");
	sendUserList(users);
}
