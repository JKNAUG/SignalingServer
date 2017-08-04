const express = require("express");
const bodyParser = require("body-parser");

let app = express();
app.use(bodyParser.urlencoded({ extended: true }));

let connectedPeers = [];

app.get("/sign_in", (req, res) => {
	let peerName = req._parsedUrl.query;
	let foundPeer = connectedPeers.find(p => p.name === peerName);
	if (!foundPeer) {
		let peer = {
			name: peerName,
			id: connectedPeers.length
		};
		connectedPeers.push(peer);
		res.header("Pragma", peer.id);
		console.log("Signed in peer " + peer.name);

		let connectedPeersString = "";
		for (let p in connectedPeers) {
			// build the string
			// send it with the body
		}

		res.send("Signed in peer " + peer.name);
	} else {
		res.sendStatus(403);
	}
});

app.get("/wait", (req, res) => {
	console.log("Wait: " + req.query);
	res.header("Pragma", "1");
	// name, id, connection status
	res.send("Peer 1, 1, 1");
});

app.get("/*", (req, res) => {
	// console.log(req);
	console.log(req.url);
});

app.listen(8888);