// Our WebSocket object.
let webSocket;
// Our local username.
let name = "";

// Get some elements from our HTML.
let loginInput = document.querySelector("#loginInput");
let loginBtn = document.querySelector("#loginBtn");
let connectingText = document.querySelector("#connectingText");
let localVideo = document.querySelector("#localVideo"); 
let remoteVideo = document.querySelector("#remoteVideo");

// Username of the user we have a P2P connection with, or null.
let connectedUser
// Our own RTCPeerConnection object.
let myConnection;
const signalingServerUri = "ws://signaling-server-webrtc-2.herokuapp.com";

// Shows the login text input and button.
function setLoginUIEnabled(enabled) {
	loginInput.disabled = !enabled;
	loginBtn.disabled = !enabled;
	connectingText.style.display = enabled ? "none" : "inline";
}

setLoginUIEnabled(false);

// Establish WebSocket connection to the signaling server.
function connect() {
	// const signalingServerUri = "ws://localhost:8080";
	// "onClose" will be called shortly after this if the connection fails.
	webSocket = new WebSocket(signalingServerUri);
	initWebSocketEvents();
	loginBtn.addEventListener("click", login);
}

connect();

// Sends login message to signaling server.
function login() {
	if (loginInput.value || name.length > 0) {
		name = loginInput.value;
		log("Logging in " + name);
		send({
			Type: "Login",
			Payload: JSON.stringify({
				Username: name,
				ProfileName: "demo_profile"
			})
		});
	}
}

function initWebSocketEvents() {
	webSocket.onopen = () => {
		log("Connected.");
		setLoginUIEnabled(true);
		// Try to login automatically (if we already previously entered a username).
		login();
	};

	// Handle messages from the server.
	webSocket.onmessage = rawMessage => {
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

	webSocket.onerror = err => {
		log(err);
	};
	
	webSocket.onclose = onClose;
}

// Accept all incoming calls immediately.
function onCall(message) {
	send({
		Type: "CallAccept",
		FromUserId: name,
		ToUserId: message.FromUserId
	});
}

// After accepting a call, we will receive an SDP Offer.
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

// Sends an SDP Answer to the client calling us.
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

// Returns our local media stream.
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
	log("RTCPeerConnection object was created.");

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

function onClose() {
	setLoginUIEnabled(false);	
	const retryMs = 2000;
	log("Connection closed. Retrying in " + retryMs + "ms...");
	onHangup();
	loginBtn.removeEventListener("click", login);

	// Retry the WebSocket connection after a few seconds.
	setTimeout(() => {
		connect();
	}, retryMs)
}

function send(message) {
	webSocket.send(JSON.stringify(message));
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
		// Close the P2P connection, but not the WebSocket connection to the server.
		log("Call hung up.");
		myConnection.close();
		myConnection = null;

		// Stop the streams.
		if (remoteVideo.srcObject) {
			for (const track of remoteVideo.srcObject.getTracks()) {
				track.stop();
			}
			remoteVideo.srcObject = null;
		}
		if (localVideo.srcObject) {
			for (const track of localVideo.srcObject.getTracks()) {
				track.stop();
			}
			localVideo.srcObject = null;
		}
	}
}
