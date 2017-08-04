const WebSocket = require("ws");

var ws = new WebSocket("ws://localhost:3000/");

ws.onopen = (event) => {
	console.log("connection opened");
	ws.send("Hello from meee");
};

ws.onmessage = (event) => {
	console.log(event);
	ws.close();
};
