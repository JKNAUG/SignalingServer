module.exports = class User {
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
		if (this.connection) {
			this.connection.send(JSON.stringify(message));
		}
	}
};
