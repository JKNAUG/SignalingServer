const WebSocket = require("ws");

try {
	// var ws = new WebSocket("ws://80.243.175.50:8080/socket.io/?EIO=2&transport=websocket");
	// var ws = new WebSocket("ws://localhost:8080/socket.io/?EIO=2&transport=websocket");
	// var ws = new WebSocket("ws://signaling-server-webrtc.herokuapp.com/");
	// var ws = new WebSocket("ws://80.243.175.50:8080/");
	var ws = new WebSocket("ws://localhost:8080/");
} catch (e) {
	console.log("exception");
	console.log(e);	
}

ws.on("open", () => {
	console.log("open");
	const data = {
		Type: "Login",
		FromUserId: "test_client"
	};
	ws.send(JSON.stringify(data));

	setTimeout(() => {
		const msg = {
			Type: "Call",
			FromUserId: "test_client",
			ToUserId: "KVA"
		};
		ws.send(JSON.stringify(msg));
	}, 3000);

	ws.on("message", data => {
		console.log(data);
	});
});

ws.on("ping", () => {
	console.log("ping");
});

ws.on("error", error => {
	console.log(error);
});
