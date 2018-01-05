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
	const user2name = "test_client";
	const username = "test_client2";

	const data = {
		Type: "Login",
		FromUserId: username
	};
	ws.send(JSON.stringify(data));

	// setInterval(() => {
	// 	const msg = {
	// 		Type: "Call",
	// 		FromUserId: username,
	// 		ToUserId: user2name
	// 	};
	// 	ws.send(JSON.stringify(msg));

	// 	setTimeout(() => {
	// 		const msg = {
	// 			Type: "Hangup",
	// 			FromUserId: username,
	// 			ToUserId: user2name
	// 		};
	// 		ws.send(JSON.stringify(msg));
	// 	}, 4000);
	// }, 8000);

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
