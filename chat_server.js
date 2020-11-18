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
let usersDict = {} //dictionary that tracks users username to their avatar 
let chatroomsDict = {} //dictionary with keys of chat names to values of the chatroom object
let chatroomsList = [] //array of chatroom names

//chatroom class contains owner, room name, current users, banned users, muted users, and the password (if any), and whether the password exists
class Chatroom {
    constructor(room_name, owner, password) {
        this.owner = owner
        this.room_name = room_name
        this.current_users = []
        this.banned_users = []
        this.muted_users = []
        this.password = password
        chatroomsDict[room_name] = this;
        let passExists = false;
        if(password != "") {
            passExists = true;
        }
        chatroomsList.push([room_name, passExists])
    }
}

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


    //when a user enter the username form and selects an avatar, log them in (assuming the username doesn't exist already), and listne for other things 
    socket.on("login_to_server", function(data) {
        if(usersDict[data["username"]]) {
            socket.emit("invaid_username_to_client", {username: data["username"]})
        }
        else {
            console.log("New user logged in, username: " + data["username"] + " and color: " + data["color"]);
            usersDict[data["username"]] = data["color"]
            // socket.emit("chatrooms_to_client", {chatrooms: chatrooms})

            //get the list of chatrooms for displaying to allow users to join a chatroom
            socket.on("get_chatrooms_to_server", function(data) {
                console.log("user " + data["username"] + " getting list of available chatrooms")
                socket.emit("get_chatrooms_to_client", {username: data["username"], available_chatrooms: chatroomsList})
            })

            //create a new chatroom and make yourself hte owner
            socket.on("create_chatroom_to_server", function(data) {
                console.log("New chat created by " + data["username"] + " with chat name " + data["chat_name"]);
                newChatroom = new Chatroom(data["chat_name"], data["username"], data["chat_password"]);
                io.sockets.emit("create_chatroom_to_client", {username: data["username"], chatrooms: newChatroom.room_name, password:data["chat_password"]})
            })

            //join a chatroom, send that back to you so your page updates and to everyone else to update their list of users in the room
            socket.on("join_chatroom_to_server", function(data) {
                let joinedChatroom = chatroomsDict[data["chat_name"]]
                if(joinedChatroom) {
                    if(!joinedChatroom.banned_users.includes(data["username"])){
                        if(joinedChatroom.password == data["password"] || joinedChatroom.password == "") {
                            console.log(data["username"] + " joining chatroom " + data["chat_name"]);
                            joinedChatroom.current_users.push(data["username"])
                            io.sockets.emit("join_chatroom_to_client", {username: data["username"], chatroom: joinedChatroom})
                        }
                        else {
                            socket.emit("incorrect_password_to_client", {username: data["username"], chat_name: data["chat_name"]})
                        }
                    }
                    else {
                        socket.emit("user_banned_to_client", {username: data["username"], chat_name: data["chat_name"]})
                    } 
                }
            }) 

            //message to a chatroom and send it out to everyone in the room
            socket.on('message_to_server', function (data) {
                if(!chatroomsDict[data["chatroom"]].muted_users.includes(data["username"])) {
                    console.log("message from " + data["username"] + " to " + data["to_users"] + " in " + data["chatroom"] + ": " + data["message"]); 
                    io.sockets.emit("message_to_client", {username: data["username"], avatar: usersDict[data["username"]], chatroom: data["chatroom"], message: data["message"], to_users: data["to_users"]}) 
                }
                else {
                    io.sockets.emit("muted_to_client", {username: data["username"]})
                }
            });


            //receiving an emoji sent  to a chatroom and send it to everyone in the room
            socket.on('emoji_to_server', function (data) {
                console.log("emoji from " + data["username"] + " to " + data["to_users"] + " in " + data["chatroom"] + ": " + data["emoji"]); 
                io.sockets.emit("message_to_client", {username: data["username"], avatar: usersDict[data["username"]], chatroom: data["chatroom"], message: "", to_users: data["to_users"], emoji:data["emoji"]}) 
            });

            //leave a chatroom on the server, let everyone else know to remove you from the list of users 
            socket.on("leave_chatroom_to_server", function (data) {
                console.log(data["username"] + " leaving chatroom " + data["chat_name"])
                let chatroomToLeave = chatroomsDict[data["chat_name"]]
                if(chatroomToLeave.owner == data["username"]){
                    io.sockets.emit("leave_chatroom_to_client", {username:"all", chatroom:chatroomToLeave})
                    delete chatroomsDict[data["chat_name"]]

                    let newChatroomsList = []
                    for(let i = 0; i < chatroomsList.length; ++i) {
                        if(data["chat_name"] != chatroomsList[i][0]) {
                            newChatroomsList.push([chatroomsList[i][0], chatroomsList[i][1]])
                        }
                    }
                    chatroomsList = newChatroomsList
                    
                }
                else {
                    let newCurrentUsers = []
                    for(let i = 0; i < chatroomToLeave.current_users.length; ++i) {
                        if(data["username"] != chatroomToLeave.current_users[i]) {
                            newCurrentUsers.push(chatroomToLeave.current_users[i])
                        }
                    }
                    chatroomToLeave.current_users = newCurrentUsers
                    io.sockets.emit("leave_chatroom_to_client", {username:data["username"], chatroom:chatroomToLeave})
                }
                
            })

            //recieve a room owner banning users, send it out to the banned user and update everyones list of users, also add the username ot hte banned user list
            socket.on("ban_to_server", function(data) {
                console.log(data["username"] + " being banned from chatroom " + data["chat_name"]);
                let joinedChatroom = chatroomsDict[data["chat_name"]]
                joinedChatroom.banned_users.push(data["username"])
            })

            //recieve a room owner muting a user, ensure the user is added to the muted users list so they cannot message the chatroom.
            socket.on("mute_to_server", function(data) {
                console.log(data["username"] + " being muted in chatroom " + data["chat_name"]);
                let joinedChatroom = chatroomsDict[data["chat_name"]]
                joinedChatroom.muted_users.push(data["username"])
            })
        }

    })
});