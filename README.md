# CSE330
Laney Ching 463883
Ethan Sauerberg 466408

Link to chat server: http://ec2-3-136-23-127.us-east-2.compute.amazonaws.com/

For our creative portion, we implemented 3 things:
1) users are asked to pick an avatar (from Among Us) when signing on to our chat server. The same 
avatars are then displayed when they message in a chat room. This was done by adding a folder of 
pre-created avatars, and tracking the selected avatar on the server side to enable sending the avatar to other users. 
2) we allowed the owner of a chat room to mute other users in the chatroom. Other users are then 
messaged if they try to send a message while muted. This was implemented in a similar way to 
implementing banning and kicking users. 
3) We allowed users to send 6 different emojis (also from the game Among Us :)). This was done through 
the same io.on as regular text messages, but if data.emoji existed, it displays the emoji image
to other users instead of displaying a normal message. 
