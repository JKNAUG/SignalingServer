module.exports = function(webSocketServer, heartBeatTime) {
	setInterval(() => {
		webSocketServer.clients.forEach(connection => {
			if (connection.isAlive === false) {
				return connection.terminate();
			}
	
			connection.isAlive = false;
			connection.ping("", false, true);
		});
	}, heartBeatTime);
};
