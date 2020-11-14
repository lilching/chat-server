// Require the packages we will use:
// Require the functionality we need to use:
const { SSL_OP_NO_TICKET } = require('constants');
var http = require('http'),
	url = require('url'),
	path = require('path'),
	mime = require('mime'),
	fs = require('fs');

const port = 80;
const file = "login.html";
let usersDict = {}
let chatrooms = []

class chatroom {
    constructor(room_name, owner) {
        this.owner = owner;
        this.room_name = room_name;
        this.current_users = [owner]
        chatrooms.append(this.room_name)
    }
}
//servers <- contains owner, ban list, present users


// Listen for HTTP connections.  This is essentially a miniature static file server that only serves our one file, client.html, on port 3456:
const server = http.createServer(function (req, resp) {
    // This callback runs when a new connection is made to our HTTP server.
    let f = url.parse(req.url).pathname;
    if (f == "" || f == "/") {
        f = file;
    }
    var filename = path.join(__dirname, "public_node", f);
	(fs.exists || path.exists)(filename, function(exists){
		if (exists) {
			fs.readFile(filename, function(err, data){
				if (err) {
					// File exists but is not readable (permissions issue?)
					resp.writeHead(500, {
						"Content-Type": "text/plain"
					});
					resp.write("Internal server error: could not read file");
					resp.end();
					return;
				}
				
				// File exists and is readable
				var mimetype = mime.getType(filename);
				resp.writeHead(200, {
					"Content-Type": mimetype
				});
				resp.write(data);
				resp.end();
				return;
			});
		}else{
			// File does not exist
			resp.writeHead(404, {
				"Content-Type": "text/plain"
			});
			resp.write("Requested file not found: "+filename);
			resp.end();
			return;
		}
	    });
    // fs.readFile(file, function (err, data) {
    //     // This callback runs when the client.html file has been read from the filesystem.

    //     if (err) return res.writeHead(500);
    //     res.writeHead(200);
    //     res.end(data);
    // });
});
console.log("Server now running on port " + port)
server.listen(port);

// Import Socket.IO and pass our HTTP server object to it.
const socketio = require("socket.io")(server, {
    wsEngine: 'ws'
});

// Attach our Socket.IO server to our HTTP server to listen
const io = socketio.listen(server);
io.sockets.on("connection", function (socket) {
    // This callback runs when a new Socket.IO connection is established.

    socket.on('message_to_server', function (data) {
        // This callback runs when the server receives a new message from the client.

        console.log("message: " + data["message"]); // log it to the Node.JS output
        io.sockets.emit("message_to_client", { message: data["message"] }) // broadcast the message to other users
    });

    socket.on("login_to_server", function(data) {
        console.log("New user logged in, username: " + data["username"] + " and color: " + data["color"]);
        usersDict[data["username"]] = data["color"]
        for(var key in usersDict){
            console.log(usersDict[key])
        }
        io.sockets.emit("chatrooms_to_client", {chatrooms: chatrooms})
    })
});