
socketio.on("create_chatroom_to_client", function(data) {
    if(data.username == username) {
        socketio.emit("join_chatroom_to_server", {username: username, chat_name: data.chatrooms, password:data.password})
    }
    else if(current_chatroom == "") {
        socketio.emit("get_chatrooms_to_server", {username:username})
    }
})

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
                passwordInput.hide()
            }
        }
    }
})

socketio.on("message_to_client", function(data) {
    if(data.chatroom == current_chatroom) {
        if(data.to_users == "all") {
            $("#current-chatroom-messages").append($("<div><img class='small-avatar-image' alt='" + data.avatar + "' src=/avatars/" + data.avatar + ".png><div class='message-div'>" + data.username + ": " + data.message + "</div></div>"))
        }
        else if(data.to_users == username || data.username == username) {
            $("#current-chatroom-messages").append($("<div><img class='small-avatar-image' alt='" + data.avatar + "' src=/avatars/" + data.avatar + ".png><div class='message-div'>PRIVATE - " + data.username + ": " + data.message + "</div></div>"))
        }
    }
})

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
            $("#current-chatroom-users-list").append($("<li>" + data.chatroom.current_users[i] + "</li>"))
            $("#current-chatroom-users-dropdown").append($("<option value='" + data.chatroom.current_users[i] + "'>" + data.chatroom.current_users[i] + "</option>"))
        }
    }
})

socketio.on("user_banned_to_client", function(data) {
    if(username == data.username) {
        alert("You are banned from chatroom " + data.chat_name + " and may not join")
    }
})

socketio.on("incorrect_password_to_client", function(data) {
    if(username == data.username) {
        alert("Incorrect password to join chatroom " + data.chat_name)
    }
})

function sendMessage(){
    var msg = $("#current-chatroom-message-input").val();
    if(msg.trim() != "" && msg) {
        $("#current-chatroom-message-input").val("")
        socketio.emit("message_to_server", {username: username, chatroom:current_chatroom, message:msg, to_users:$("#current-chatroom-users-dropdown").val()});
    }
}

function leaveCurrentChatroom() {
    socketio.emit("leave_chatroom_to_server", {username:username, chat_name:current_chatroom})
}

function sendCreateNewChat() {
    let newChatName = $("#create-chat-name").val().trim()
    $("#create-chat-name").val("")
    let newChatPass = $("#create-chat-password").val().trim()
    $("#create-chat-password").val("")
    if(newChatName != "" && newChatName) {
        socketio.emit("create_chatroom_to_server", {username:username, chat_name:newChatName, chat_password:newChatPass})
    }
}