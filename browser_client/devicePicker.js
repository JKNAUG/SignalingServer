const audioInputSelect = document.querySelector("#audioSource");
const videoInputSelect = document.querySelector("#videoSource");

(async function() {
	const devices = await navigator.mediaDevices.enumerateDevices();
	for (const device of devices) {
		let option = document.createElement("option");
		option.value = device.deviceId;
		if (device.kind === "audioinput") {
			option.text = device.label || "Microphone " + (audioInputSelect.length + 1);
			audioInputSelect.add(option);
		} else if (device.kind == "videoinput") {
			option.text = device.label || "Camera " + (videoInputSelect.length + 1);
			videoInputSelect.add(option);
		}
	}
})();