module.exports = class User {
	constructor(connection, name, profileName) {
		this.connection = connection;
		this.name = name;
		this.profileName = profileName;
	}

	setConnectedUser(user) {
		// Add some validation...
		this.connectedUser = user;
	}

	getConnectedUser() {
		return this.connectedUser;
	}

	isAvailable() {
		return !this.getConnectedUser();
	}

	send(message) {
		if (this.connection) {
			this.connection.send(JSON.stringify(message));
		}
	}
};
