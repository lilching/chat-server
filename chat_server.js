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
let chatroomsDict = {}
let chatroomsList = []

class Chatroom {
    constructor(room_name, owner) {
        this.owner = owner
        this.room_name = room_name
        this.current_users = []
        chatroomsDict[room_name] = this;
        chatroomsList.push(room_name)
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

    socket.on("login_to_server", function(data) {
        console.log("New user logged in, username: " + data["username"] + " and color: " + data["color"]);
        usersDict[data["username"]] = data["color"]
        // io.sockets.emit("chatrooms_to_client", {chatrooms: chatrooms})

        socket.on("get_chatrooms_to_server", function(data) {
            console.log("user " + data["username"] + " getting list of available chatrooms")
            io.sockets.emit("get_chatrooms_to_client", {username: data["username"], available_chatrooms: chatroomsList})
        })

        socket.on("create_chatroom_to_server", function(data) {
            console.log("New chat created by " + data["username"] + " with chat name " + data["chat_name"]);
            newChatroom = new Chatroom(data["chat_name"], data["username"]);
            io.sockets.emit("create_chatroom_to_client", {username: data["username"], chatrooms: newChatroom.room_name})
        })

        
        socket.on("join_chatroom_to_server", function(data) {
            console.log(data["username"] + " joining chatroom " + data["chat_name"]);
            let joinedChatroom = chatroomsDict[data["chat_name"]]
            joinedChatroom.current_users.push(data["username"])
            io.sockets.emit("join_chatroom_to_client", {username: data["username"], chatroom: joinedChatroom})
        
            
            socket.on('message_to_server', function (data) {
                // This callback runs when the server receives a new message from the client.
                console.log("message from " + data["username"] + " to " + data["to_users"] + " in " + data["chatroom"] + ": " + data["message"]); 
                io.sockets.emit("message_to_client", {username: data["username"], avatar: usersDict[data["username"]], chatroom: data["chatroom"], message: data["message"], to_users: data["to_users"]}) 
            });

            socket.on("leave_chatroom_to_server", function (data) {
                console.log(data["username"] + " leaving chatroom " + data["chatroom"])
                let chatroomToLeave = chatroomsDict[data["chatroom"]]
                let newCurrentUsers = []
                for(let i = 0; i < chatroomToLeave.current_users.length; ++i) {
                    if(data["username"] != chatroomToLeave.current_users[i]) {
                        newCurrentUsers.push(chatroomToLeave.current_users[i])
                    }
                }
                chatroomToLeave.current_users = newCurrentUsers
                io.sockets.emit("leave_chatroom_to_client", {username:data["username"], chatroom:chatroomToLeave})
            })
        }) 
    })
});