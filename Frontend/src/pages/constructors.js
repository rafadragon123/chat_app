function Message(username, message, roomid, timestamp){
    this.username = username;
    this.message = message;
    this.roomid = roomid;
    this.timestamp = timestamp;
}

function User(username, room){
    this.username = username
    this.roomid = room
}


module.exports.Message = Message;
module.exports.User = User;

