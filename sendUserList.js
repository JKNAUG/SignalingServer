const log = require("./log");
const User = require("./user");

const AVAILABLE_STATUS = "Available";
const BUSY_STATUS = "Busy";

module.exports = function(users) {
	// testing
	// var nusers = users.slice();
	// nusers.push(new User(null, "Mister User"));
	// let newUser = new User(null, "Nice Guy");
	// newUser.connectedUser = {};
	// nusers.push(newUser);
	// nusers.push(new User(null, "A User"));
	
	for (const userToSendTo of users) {
		// Put all users except the current one in the list.
		// We don't want to include a user in their own online users list.
		const userList = users.reduce((list, user) => {
			if (user !== userToSendTo) {
				list.push({
					Name: user.name,
					Status: user.isAvailable() ? AVAILABLE_STATUS : BUSY_STATUS
				});
			}
			return list;
		}, []);

		const message = {
			Type: "UserList",
			Payload: JSON.stringify(userList)
		};
		userToSendTo.send(message);
	}
};
