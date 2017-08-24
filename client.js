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
});

ws.on("ping", () => {
	console.log("ping");
});

ws.on("error", error => {
	console.log(error);
});
