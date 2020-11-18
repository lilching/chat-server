//catches if a chatroom is created. Appends to list of chatrooms if not the user that created. or joins the room if you are the user that created the chatroom. 
socketio.on("create_chatroom_to_client", function(data) {
    if(data.username == username) {
        socketio.emit("join_chatroom_to_server", {username: username, chat_name: data.chatrooms, password:data.password})
    }
    else if(current_chatroom == "") {
        socketio.emit("get_chatrooms_to_server", {username:username})
    }
})

//catched a join chatroom from the server. If you are the user that joined, displays the appropirate elemnts. If not, updates the list of users in the chatroom if you are the in chatroom the new user joined
socketio.on("join_chatroom_to_client", function(data) {
    if(data.username == username) {
        current_chatroom = data.chatroom.room_name
        $("#current-chatroom-messages").empty()
        $("#chatrooms").hide()
        $("#current-chatroom-div").show()
        $("#current-chatroom-name").text(current_chatroom)
    } 
    if(current_chatroom == data.chatroom.room_name) {
        $("#current-chatroom-users-list").empty()
        $("#current-chatroom-users-dropdown").empty()
        $("#current-chatroom-users-dropdown").append("Send to:<option value='all'>Everyone</option>")
        for(let i = 0; i < data.chatroom.current_users.length; ++i) {
            if(data.chatroom.owner == username) {
                newListItem = $("<li>" + data.chatroom.current_users[i] + "</li>")
                if(data.chatroom.current_users[i] != username) {
                    kickButton = $("<button type='submit'>Kick</button>")
                    kickButton.click(function(event) {
                        event.preventDefault()
                        socketio.emit("leave_chatroom_to_server", {username: data.chatroom.current_users[i], chat_name: current_chatroom})
                    })
                    newListItem.append(kickButton)

                    banButton = $("<button type='submit'>Ban</button>")
                    banButton.click(function(event) {
                        event.preventDefault()
                        socketio.emit("ban_to_server", {username: data.chatroom.current_users[i], chat_name: current_chatroom})
                        socketio.emit("leave_chatroom_to_server", {username: data.chatroom.current_users[i], chat_name: current_chatroom})
                    })
                    newListItem.append(banButton)
                    muteButton = $("<button type='submit'> Mute</button>")
                    muteButton.click(function(event) {
                        event.preventDefault()
                        socketio.emit("mute_to_server", {username: data.chatroom.current_users[i], chat_name: current_chatroom})
                    })
                    newListItem.append(muteButton)
                }
                $("#current-chatroom-users-list").append(newListItem)
            }
            else {
                $("#current-chatroom-users-list").append($("<li>" + data.chatroom.current_users[i] + "</li>"))
            }
            $("#current-chatroom-users-dropdown").append($("<option value='" + data.chatroom.current_users[i] + "'>" + data.chatroom.current_users[i] + "</option>"))
        }
    }
})
//if a username is already taken, alerts the user that they cannot use that username. Since the username is the primary identifier of a user, it is important that not two users may have the same username. 
socketio.on("invalid_username_to_client", function(data) {
    alert("that username is already taken")
})

//recieves the list of chatrooms from the server and appends it to the html
socketio.on("get_chatrooms_to_client", function(data) {
    if(data.username == username) {
        $("#chatrooms-list").empty()
        for(let i = 0; i < data.available_chatrooms.length; ++i){
            joinForm = $("<form><button type='submit'>Join</button></form>")
            joinFormPasswordInput = $("<input type='password' placeholder='password' value=''>")
            joinForm.prepend(joinFormPasswordInput)
            joinForm.submit(function(event) {
                event.preventDefault()
                pass = joinFormPasswordInput.val()
                joinFormPasswordInput.val("")
                socketio.emit("join_chatroom_to_server", {username: username, chat_name: data.available_chatrooms[i][0], password:pass})
            })
            
            $("#chatrooms-list").append($("<li>" + data.available_chatrooms[i][0] + "</li>")).append(joinForm)
            if(!data.available_chatrooms[i][1]) {
                joinFormPasswordInput.hide()
            }
        }
    }
})


//recieves a message from the server. If you are in the chatroom it is intended for, displays to you if you are the inteneded private message user, or if the message is inteded to all users. Also catches emoji sends. 
socketio.on("message_to_client", function(data) {
    if(data.chatroom == current_chatroom) {
        if(data.to_users == "all") {
            if(data.emoji) {
                $("#current-chatroom-messages").append($("<div><img class='small-avatar-image' alt='" + data.avatar + "' src=/avatars/" + data.avatar + ".png><div class='message-div2'>" + data.username + ": " + "</div><img class='message-emoji' src='"+data.emoji+"' alt='" + data.emoji + "'></img>" + "</div>"))
            }
            else {
                $("#current-chatroom-messages").append($("<div><img class='small-avatar-image' alt='" + data.avatar + "' src=/avatars/" + data.avatar + ".png><div class='message-div'>" + data.username + ": " + data.message + "</div></div>"))
            }
        }
        else if(data.to_users == username || data.username == username) {
            if(data.emoji) {
                $("#current-chatroom-messages").append($("<div><img class='small-avatar-image' alt='" + data.avatar + "' src=/avatars/" + data.avatar + ".png><div class='message-div2'>PRIVATE - " + data.username + ": " + "</div><img class='message-emoji' src='"+data.emoji+"' alt='" + data.emoji + "'></img>" + "</div>"))
            }
            else {
                $("#current-chatroom-messages").append($("<div><img class='small-avatar-image' alt='" + data.avatar + "' src=/avatars/" + data.avatar + ".png><div class='message-div'>PRIVATE - " + data.username + ": " + data.message + "</div></div>"))
            }
        }
        $("#current-chatroom-messages").scrollTop($("#current-chatroom-messages")[0].scrollHeight);
    }
})


//catches if a user leaves a chatroom. Removes you and displays the appropriate things if you are the user that left, removes you from the appropriate lists of users in chatrooms if not.
socketio.on("leave_chatroom_to_client", function(data) {
    if(data.username == "all" && data.chatroom.room_name == current_chatroom) {

        if(data.chatroom.owner != username) {
            alert("owner of chatroom " + data.chatroom.room_name + " closed the room")
        }
        $("#current-chatroom-div").hide()
        $("#chatrooms").show()
        current_chatroom = "";
        socketio.emit("get_chatrooms_to_server", {username:username})
    }
    else if(data.username == "all" && current_chatroom == "") {
        socketio.emit("get_chatrooms_to_server", {username:username})
    }
    else if(data.username == username) {
        $("#current-chatroom-div").hide()
        $("#chatrooms").show()
        current_chatroom = ""
        socketio.emit("get_chatrooms_to_server", {username:username})
    }
    else if(data.chatroom.room_name == current_chatroom) {
        $("#current-chatroom-users-list").empty()
        $("#current-chatroom-users-dropdown").empty()
        $("#current-chatroom-users-dropdown").append("Send to:<option value='all'>Everyone</option>")
        for(let i = 0; i < data.chatroom.current_users.length; ++i) {
            if(data.chatroom.owner == username) {
                newListItem = $("<li>" + data.chatroom.current_users[i] + "</li>")
                if(data.chatroom.current_users[i] != username) {
                    kickButton = $("<button type='submit'>Kick</button>")
                    kickButton.click(function(event) {
                        event.preventDefault()
                        socketio.emit("leave_chatroom_to_server", {username: data.chatroom.current_users[i], chat_name: current_chatroom})
                    })
                    newListItem.append(kickButton)

                    banButton = $("<button type='submit'>Ban</button>")
                    banButton.click(function(event) {
                        event.preventDefault()
                        socketio.emit("ban_to_server", {username: data.chatroom.current_users[i], chat_name: current_chatroom})
                        socketio.emit("leave_chatroom_to_server", {username: data.chatroom.current_users[i], chat_name: current_chatroom})
                    })
                    newListItem.append(banButton)
                }
                $("#current-chatroom-users-list").append(newListItem)
            }
            else {
                $("#current-chatroom-users-list").append($("<li>" + data.chatroom.current_users[i] + "</li>"))
            }


            //$("#current-chatroom-users-list").append($("<li>" + data.chatroom.current_users[i] + "</li>"))
            $("#current-chatroom-users-dropdown").append($("<option value='" + data.chatroom.current_users[i] + "'>" + data.chatroom.current_users[i] + "</option>"))
        }
    }
    
})

//returns to a user who is banned from a chatroom  and alerts them that they cannot join the room. 
socketio.on("user_banned_to_client", function(data) {
    if(username == data.username) {
        alert("You are banned from chatroom " + data.chat_name + " and may not join")
    }
})

//return to a user who submits a bad password. 
socketio.on("incorrect_password_to_client", function(data) {
    if(username == data.username) {
        alert("Incorrect password to join chatroom " + data.chat_name)
    }
})


//lets a user know if they were muted and cannot message to a chatroom. 
socketio.on("muted_to_client", function(data) {
    if(username == data.username) {
        alert("You were muted. Messages you send in this chatroom will not be seen by others")
    }
})


//helper method for sending messages to a chatroom or privately to a user. 
function sendMessage(){
    var msg = $("#current-chatroom-message-input").val();
    if(msg.trim() != "" && msg) {
        $("#current-chatroom-message-input").val("")
        socketio.emit("message_to_server", {username: username, chatroom:current_chatroom, message:msg, to_users:$("#current-chatroom-users-dropdown").val()});
    }
}

//helper method for leaving a chatroom and sending this to the server
function leaveCurrentChatroom() {
    socketio.emit("leave_chatroom_to_server", {username:username, chat_name:current_chatroom})
}


//helper method to create a new chat and send that information to the server so others can join
function sendCreateNewChat() {
    let newChatName = $("#create-chat-name").val().trim()
    $("#create-chat-name").val("")
    let newChatPass = $("#create-chat-password").val().trim()
    $("#create-chat-password").val("")
    if(newChatName != "" && newChatName) {
        socketio.emit("create_chatroom_to_server", {username:username, chat_name:newChatName, chat_password:newChatPass})
    }
}