let connection = new WebSocket('ws://localhost:8080');
let name = "";

var loginInput = document.querySelector('#loginInput');
var loginBtn = document.querySelector('#loginBtn');
let localVideo = document.querySelector("#localVideo"); 
let remoteVideo = document.querySelector("#remoteVideo");

let connectedUser, myConnection;

loginBtn.addEventListener("click", function (event) {
	name = loginInput.value;
	if (name.length > 0) {
		send({
			Type: "Login",
			Payload: JSON.stringify({
				Username: name,
				ProfileName: "demo_profile"
			})
		});
	}
});

// Handle messages from the server.
connection.onmessage = function (rawMessage) {
	let message;
	try {
		message = JSON.parse(rawMessage.data);
	} catch (exception) {
		log(exception);
		return;
	}

	switch (message.Type) {
		case "Call":
			onCall(message);
			break;
		case "SdpOffer":
			onOffer(message);
			break;
		case "IceCandidate":
			onCandidates(message);
			break;
		case "Hangup":
			onHangup(message);
			break;
		default:
			break;
	}
};

function onCall(message) {
	// Accept all incoming call immediately.
	send({
		Type: "CallAccept",
		FromUserId: name,
		ToUserId: message.FromUserId
	});
}

async function onOffer(message) {
	log("Received offer from " + message.FromUserId);
	createLocalPeerConnection();

	connectedUser = message.FromUserId;

	// Parse offer
	let rawDesc = JSON.parse(message.Payload);
	const offer = {
		sdp: rawDesc.Sdp,
		type: rawDesc.Type === 0 ? "offer" : rawDesc.Type === 1 ? "pranswer" : "answer"
	}
	await myConnection.setRemoteDescription(offer);

	// Media
	const stream = await initializeMedia();
	myConnection.addStream(stream);

	// Send answer
	sendAnswer(message.FromUserId);
}

async function sendAnswer(toUser) {
	const answer = await myConnection.createAnswer();
	log("Sending answer to " + toUser);
	await myConnection.setLocalDescription(answer);
	send({
		Type: "SdpAnswer",
		FromUserId: name,
		ToUserId: toUser,
		Payload: JSON.stringify(answer)
	});
}

async function initializeMedia() {
	const videoSource = videoInputSelect.value;
	const audioSource = audioInputSelect.value;
	const constraints = {
		video: { deviceId: { exact: videoSource } },
		audio: { deviceId: { exact: audioSource } }
	};
	const devices = await navigator.mediaDevices.enumerateDevices();
	const stream = await navigator.mediaDevices.getUserMedia(constraints);
	localVideo.srcObject = stream;
	return stream;
}

function createLocalPeerConnection() {
	myConnection = new webkitRTCPeerConnection()
	const configuration = {
		"iceServers": [
			{ "url": "stun:stun.1.google.com:19302" },
			{ "url": "stun:stun1.1.google.com:19302" },
			{ "url": "stun:stun2.1.google.com:19302" },
			{ "url": "stun:stun3.1.google.com:19302" }
		]
	};

	myConnection = new webkitRTCPeerConnection(configuration);
	console.log("RTCPeerConnection object was created.");

	// When the browser finds an ice candidate we send it to the connected peer.
	myConnection.onicecandidate = event => {
		if (event.candidate) {
			send({
				Type: "IceCandidate",
				FromUserId: name,
				ToUserId: connectedUser,
				// Candidates are expected to be sent as a list.
				Payload: JSON.stringify([event.candidate])
			});
		}
	};

	myConnection.onaddstream = event => {
		remoteVideo.srcObject = event.stream;
	};
}

connection.onopen = () => {
	console.log("Connected");
};

connection.onerror = err => {
	console.log("Got error", err);
};

connection.onclose = () => {

};

function send(message) {
	connection.send(JSON.stringify(message));
};

function log(message) {
	console.log(message);
}

// When we got ice candidate from another user.
function onCandidates(message) {
	log("Received ICE candidates from " + message.FromUserId);
	const candidates = JSON.parse(message.Payload);
	for (const rawCandidate of candidates) {
		const iceCandidate = {
			candidate: rawCandidate.Candidate,
			sdpMLineIndex: rawCandidate.SdpMLineIndex,
			sdpMid: rawCandidate.SdpMid
		};
		myConnection.addIceCandidate(iceCandidate);
	}
}

function onHangup(message) {
	if (myConnection) {
		myConnection.close();
		myConnection = null;

		remoteVideo.srcObject = null;
		localVideo.srcObject = null;
	}
}
