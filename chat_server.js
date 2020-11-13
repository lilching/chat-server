var http = require("http"),
    socket = require("socket.io"),
    fs = require("fs");

var app = http.createServer(function(req, resp){
    fs.readFile("client", function(err,data){
        if(err) return resp.writeHead(500);
        resp.writeHead(500);
        resp.end(data);
    });
});
app.listen(80);

var io = socketio.listen(app);
io.sockets.on("connection", function(socket){
    socket.on('message_on_server', function(data){
        console.log("message: "+data["message"]);
        io.sockets.emit("message_to_client", {message:data["message"]})
    })
})
