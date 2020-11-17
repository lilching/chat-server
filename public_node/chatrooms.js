$("#create-chat-form").submit(function(event) {
    event.preventDefault();
    sendCreateNewChat();
})


socketio.on("create_chatroom_to_client", function(data) {
    if(data.username == username) {
        socketio.emit("join_chatroom_to_server", {username: username, chat_name: data["chatrooms"]})
    }
    else if(current_chatroom == "") {
        socketio.emit("get_chatrooms_to_server", {username:username})
    }
})

socketio.on("join_chatroom_to_client", function(data) {
    if(data.username == username) {
        current_chatroom = data.chatroom.room_name
        console.log(data.chatroom)
        $("#current-chatroom-messages").empty();
        $("#chatrooms").hide()
        $("#current-chatroom-div").show()
        $("#current-chatroom-name").text(current_chatroom)
        // leaveButton = $("")
       
        // $("#current-chatroom-leave-button-wrapper").empty()
        // $("#current-chatroom-leave-button-wrapper").append(leaveButton)
        // $("#current-chatroom-users-list").empty()
        // $("#current-chatroom-users-dropdown").empty()
        // $("#current-chatroom-users-dropdown").append("Send to:<option value='all'>Everyone</option>")
        // for(let i = 0; i < data.chatroom.current_users.length; ++i) {
        //     $("#current-chatroom-users-list").append($("<li>" + data.chatroom.current_users[i] + "</li>"))
        //     $("#current-chatroom-users-dropdown").append($("<option value='" + data.chatroom.current_users[i] + "'>" + data.chatroom.current_users[i] + "</option>"))
        // }
        
        
        // $("#message-form-wrapper").children().off("submit")

        // $("#message-form-wrapper").empty()
        // messageForm = $('<form id="current-chatroom-send-message"> <input type="text" id="current-chatroom-message-input" maxlength="80"> <button type="submit">Send</button><br><select id="current-chatroom-users-dropdown"> Send to: <option value="all">Everyone</option> </select> </form>')
        // messageForm.off("submit")
        // messageForm.on("submit", function(event) {
        //     console.log("submitted")
        //     event.preventDefault()
        //     sendMessage()
        // })
        // $("#message-form-wrapper").append(messageForm)
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
                        socketio.emit("kick_to_server", {username: data.chatroom.current_users[i], chatroom: current_chatroom})
                    })
                    newListItem.append(kickButton)
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
            joinButton = $("<button type='submit'>Join</button>")
            joinButton.click(function(event) {
                event.preventDefault()
                socketio.emit("join_chatroom_to_server", {username: username, chat_name: data.available_chatrooms[i]})
            })
            $("#chatrooms-list").append($("<li>" + data.available_chatrooms[i] + "</li>")).append(joinButton)
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
    if(data.username == username) {
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

function sendMessage(){
    console.log("sendMessage JS")
    var msg = $("#current-chatroom-message-input").val();
    if(msg.trim() != "" && msg) {
        $("#current-chatroom-message-input").val("")
        socketio.emit("message_to_server", {username: username, chatroom:current_chatroom, message:msg, to_users:$("#current-chatroom-users-dropdown").val()});
    }
}

function leaveCurrentChatroom() {
    socketio.emit("leave_chatroom_to_server", {username:username, chatroom:current_chatroom})
}

function sendCreateNewChat() {
    let newChatName = $("#create-chat-name").val().trim()
    if(newChatName != "" && newChatName) {
        socketio.emit("create_chatroom_to_server", {username:username, chat_name:newChatName})
    }
}