# How to deploy
1. Download and install Node.js (https://nodejs.org/en/).
2. Open a command line in the server project root folder.
3. Write "npm i" in the command line and press enter.
   * This installs dependent modules and only needs to be done once.
   * This can take a few minutes to complete.
4. Write "npm start" in the command line and press enter.
   * This starts up the WebRTC server on port 8080 by default.
   * You can view the state of the server by navigating to localhost:8080 in your browser.
   * You can also use the URL's localhost:8080/clients and localhost:8080/logs.
5. If the server ever fails or crashes, restart it by running "npm start" again.

# Info
* The signaling-server relevant code is found in socket.js.
* The http-server relevant code is found in server.js.
* A browser client for testing the server is available under /browser_client. Instructions can be found in the README there.