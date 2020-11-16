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
        $("#chatrooms").hide()
        $("#current-chatroom-div").show()
        $("#current-chatroom-name").text(current_chatroom)
        leaveButton = $("<button type='submit'>Leave</button>")
        leaveButton.click(function(event) {
            event.preventDefault()
            leaveCurrentChatroom()
        })
        $("#current-chatroom-leave-button-wrapper").empty()
        $("#current-chatroom-leave-button-wrapper").append(leaveButton)
        $("#current-chatroom-users-list").empty()
        for(let i = 0; i < data.chatroom.current_users.length; ++i) {
            $("#current-chatroom-users-list").append($("<li>" + data.chatroom.current_users[i] + "</li>"))
        }
        $("#current-chatroom-send-message").submit(function(event) {
            event.preventDefault()
            sendMessage()
        })
    } 
    else if(current_chatroom == data.chatroom.room_name) {
        $("#current-chatroom-users-list").empty()
        for(let i = 0; i < data.chatroom.current_users.length; ++i) {
            $("#current-chatroom-users-list").append($("<li>" + data.chatroom.current_users[i] + "</li>"))
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
        $("#current-chatroom-messages").append($("<div><img class='small-avatar-image' alt='" + data.avatar + "' src=/avatars/" + data.avatar + ".png><span class='message-div'>" + data.username + ": " + data.message + "</span></div>"))
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
        for(let i = 0; i < data.chatroom.current_users.length; ++i) {
            $("#current-chatroom-users-list").append($("<li>" + data.chatroom.current_users[i] + "</li>"))
        }
    }
})

function sendMessage(){
    var msg = $("#current-chatroom-message-input").val();
    $("#current-chatroom-message-input").val("")
    socketio.emit("message_to_server", {username: username, chatroom:current_chatroom, message:msg});
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