var socketio = io.connect()
let avatarColors = ["black", "blue", "brown", "cyan", "green", "lime", "orange", "pink", "purple", "red", "white", "yellow"]
let emojis = ["angry", "surprised", "blushing", "dead", "evil", "sus"]
let selected_color = "black" 
let username = ""
let current_chatroom = ""

init();

//init runs on start. Makes sure the correct things are visible on the html, as well as sets up preliminary event listeners
function init() {
    $("#chatrooms").hide()
    $("#logged-in-as").hide()
    $("#current-chatroom-div").hide()
    addAvatarRadio()
    $("#username-form").submit(checkUsername)

    $("#current-chatroom-leave-button").click(function(event) {
        event.preventDefault()
        leaveCurrentChatroom()
    })
    $("#current-chatroom-send-message").on("submit", function(event) {
        event.preventDefault()
        sendMessage()
    })
    $("#create-chat-form").submit(function(event) {
        event.preventDefault();
        sendCreateNewChat();
    })
    for(let i = 0; i < emojis.length; ++i) {
        $("#"+emojis[i]+"-emoji").click(function(event) {
            event.preventDefault()
            socketio.emit("emoji_to_server", {username: username, chatroom:current_chatroom, emoji:$("#"+emojis[i]+"-emoji").attr('src'), to_users:$("#current-chatroom-users-dropdown").val()});
        })
    }
}

//inserts the avatar options as a 'radio' (not a real radio form element but established in a similar manual way with a red border on the selected avatar)
function addAvatarRadio() {    
    radioDiv = $("#avatar-choice-radio-div")
    for(let i = 0; i < avatarColors.length; ++i) {
        //radioDiv.append($("<input type='radio' name='avatar' value='" + avatarColors[i] + "'>" + "<img class='avatar-img' src='avatars/" + avatarColors[i] + ".png' alt='avatar'>"))
        avatar_image = $("<img id='" + avatarColors[i] + "-avatar-img' class='avatar-img' src='avatars/" + avatarColors[i] + ".png' alt='avatar'>")
        if(i==0) {
            avatar_image.addClass("selected-avatar")
        }
        avatar_image.click({input_color: avatarColors[i]}, function(event){
            selected_color = event.data.input_color
            $(".selected-avatar").removeClass("selected-avatar")
            $("#"+selected_color + "-avatar-img").addClass("selected-avatar")
        })
        radioDiv.append(avatar_image)
    }
}


//send the login attempt to the server
function sendLogin(){
    socketio.emit("login_to_server", {username:username, color:selected_color})
}

//makes sure hte username is not blank or a space
function checkUsername(event){
    username = $("#username-input").val().trim()
    event.preventDefault()
    if (username != ""){
        login(event)
    }
    else{
        alert("you must enter a username")
    }
}

//if a user is successfully logged in, then display the appropriate things and get the list of chatrooms
function login(event) {
    event.preventDefault()
    sendLogin()
    $("#logged-in-as").text($("#logged-in-as").text() + " " + username)
    $("#logged-in-as").show()
    $("#username-form").hide()
    $("#chatrooms").show()
    
    socketio.emit("get_chatrooms_to_server", {username:username})
}

