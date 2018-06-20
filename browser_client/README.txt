# How to deploy
1. Open Chrome browser.
2. Download Web Server for Chrome extension (https://chrome.google.com/webstore/detail/web-server-for-chrome/ofhbbkphhbklhfoeikjpcbhemlocgigb?hl=en).
3. Start the server extension, press "Choose Folder", and choose the folder containing the client application.
4. A new tab will open, running the web client app.

NOTE: If you wish to change the signaling server the client connects to by default, edit the "signalingServerUri" variable in webclient.js.

# How to use the client
It is generally a good idea to have the console open when using the app to see the logs. Press Ctrl+Shift+J to open the console in Chrome.
1. Keep the tab containing the web client open at all times.
2. If the client has problems connecting, it will be logged in the console. The client will automatically try to reconnect.
3. Choose a username for the dummy client and press "login".
4. The user will now be visible to other remote support users, and will automatically pick up any incoming calls.
5. You may select a video and audio source in the drop-down lists.

# How to use a virtual webcam
1. Download and install Webcamoid 32 bit (https://webcamoid.github.io/).
2. Open Webcamoid.
3. Press the "Configure sources" button. You can add an extra video source in the left menu, where you may stream any video file of your choosing.
4. Select the virtual cam from the "Video sources" list in the web client.

NOTE: A computer reboot might be required to see the virtual cam in the sources list.