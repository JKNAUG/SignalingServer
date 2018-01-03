const log = require("./log");
const User = require("./user");

module.exports = function(users) {
	// testing
	var nusers = users.slice();
	nusers.push(new User(null, "Mister User"));
	nusers.push(new User(null, "Nice Guy"));

	for (const userToSendTo of nusers) {
		// Put all users except the current one in the list.
		// We don't want to include a user in their own online users list.
		const userList = nusers.reduce((list, user) => {
			if (user !== userToSendTo) {
				list.push({
					Name: user.name,
					Status: user.getConnectedUser() ? "Busy" : "Available"
				});
			}
			return list;
		}, []);

		const message = {
			Type: "UserList",
			Payload: JSON.stringify(userList)
		};
		log(message.Payload);
		userToSendTo.send(message);
	}
};
