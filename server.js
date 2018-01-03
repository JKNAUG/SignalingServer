const app = require("http").createServer(handler);
const io = require("socket.io")(app);
const fs = require("fs");

app.listen(8080, "0.0.0.0");

io.on("connection", socket => {
	console.log("socket:");
	console.log(socket);
	socket.emit("message", "thanks");
});

function handler(req, res) {
	fs.readFile(__dirname + '/index.html',
		function (err, data) {
			if (err) {
				console.log(err);
				res.writeHead(500);
				return res.end('Error loading index.html');
			}

			res.writeHead(200);
			res.end(data);
		});
}
