var socketio = io.connect()
let avatarColors = ["black", "blue", "brown", "cyan", "green", "lime", "orange", "pink", "purple", "red", "white", "yellow"]
let selected_color = "black" 
let username = ""

function init() {
    $("#chatrooms").hide()
    $("#logged-in-as").hide()
    
    addAvatarRadio()
    $("#username-form").submit(checkUsername)
}

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
            console.log(selected_color)
            $(".selected-avatar").removeClass("selected-avatar")
            $("#"+selected_color + "-avatar-img").addClass("selected-avatar")
        })
        radioDiv.append(avatar_image)
    }
}

init();


socketio.on("message_to_client",function(data) {
    //Append an HR thematic break and the escaped HTML of the new message
    document.getElementById("chatlog").appendChild(document.createElement("hr"));
    document.getElementById("chatlog").appendChild(document.createTextNode(data['message']));
});
socketio.on("chatrooms_to_client", function(data) {
    chatrooms = data["chatrooms"]
    for(let i = 0; i < chatrooms.length; ++i){
        button = $("<button type='submit'>Join</button")
        button.submit({chatroom_name: chatrooms[i]}, sendJoinChatroom(event))
        document.getElementById("chatrooms-list").appendChild($(chatrooms[i] + button))
    }
})

function sendJoinChatroom(event) {
    event.preventDefault()
    console.log("trying to join " + event.data.chatroom_name)
}

function sendMessage(){
    var msg = document.getElementById("message_input").value;
    socketio.emit("message_to_server", {message:msg});
}

function sendLogin(){
    socketio.emit("login_to_server", {username:username, color:selected_color})
}

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

function login(event) {
    event.preventDefault()
    sendLogin()
    $("#logged-in-as").text($("#logged-in-as").text() + " " + username)
    $("#logged-in-as").show()
    $("#username-form").hide()

    //call to socket to log in and get chatrooms

    $("#chatrooms").show()
}

