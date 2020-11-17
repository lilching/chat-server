var socketio = io.connect()
let avatarColors = ["black", "blue", "brown", "cyan", "green", "lime", "orange", "pink", "purple", "red", "white", "yellow"]
let selected_color = "black" 
let username = ""
let current_chatroom = ""

// $(window).bind('beforeunload', function() {
//     alert("Hello!!! Refreshing")
// })

// if (1 == event.currentTarget.performance.navigation.type){
//     alert("Hello!!! Refreshing")
// }

// if(sessionStorage.reload) { 
//     sessionStorage.reload = true;
//     // alert("Hello!!! Refreshing")
//     sendLeaveAndLogout();
// } else {
//     alert("Hello!!! not refreshing")
//     sessionStorage.setItem('reload', false);
// }


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
        console.log("submitted")
        event.preventDefault()
        sendMessage()
    })
}

function sendLeaveAndLogout() {
    console.log("leave and logout")
    if(username != "" && username) {
        if(current_chatroom != "" && current_chatroom) {
            leaveCurrentChatroom()
        }
        socketio.emit("logout_to_server", {username:username, chatroom:current_chatroom})
    } 
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
    $("#chatrooms").show()
    
    socketio.emit("get_chatrooms_to_server", {username:username})
}

