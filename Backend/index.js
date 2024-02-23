const http = require("http");
const app = require("express")();
const cors = require("cors");
const {Server} = require("socket.io");
const {MongoClient} = require("mongodb");

const server = http.createServer(app)
const dbuser = process.env.DB_USER
const dbpass = process.env.DB_PASS  
const mongouri = `mongodb+srv://${dbuser}:${dbpass}${process.env.MONGO_URI}`
const dbName = "test"
const dbCol = "rooms"
const client = new MongoClient(mongouri);
const io = new Server(server, {
    cors:{
        origin: "*"
    }
});
app.use(cors());
// function Messages(msgid, msg){
//     this.msgid = msgid;
//     this.msg = msg;
//     this.ack = false;
// }
//console.log(mongouri)

function Room(roomid){
    this.roomid = roomid;
    this.members = [];
    this.msgs = [];
}

//var rooms = []

// client.connect()
//     .then(cl=>{
//         const db = cl.db(dbName);
//         // if it doesn't exist, it will get created.
//         db.collection(dbCol).find({}).toArray()
//             .then((res)=>{
//                 rooms = res.slice();
//             })
//     })



async function main(){
    await client.connect()
    const db = client.db(dbName);
    // if it doesn't exist, it will get created.
    let rooms = await db.collection(dbCol).find({}).toArray();
    // setInterval(async ()=>{
    //     console.log("Syncing with DB.")
    //     rooms = await db.collection(dbCol).find({}).toArray(); 
    // }, 120000)

    app.get('/getUser/:roomid', async (req, res)=>{
        //let r = rooms.find((ele)=>ele.roomid == req.params.roomid)
        let r = await db.collection(dbCol).findOne({ roomid: req.params.roomid});
        //console.log(r)
        if(r){
            res.json({users: r.members, status: 200})
        }
        else{
            res.json({users: [], status: 404})
        }
        res.end()
    })

    app.get('/getMessages/:roomid', async (req, res)=>{
        let r = await db.collection(dbCol).findOne({ roomid: req.params.roomid});
        if(r){
            res.json({messages: r.msgs, status: 200})
        }
        else{
            res.json({messages: [], status: 404})
        }
    })

    io.on("connection", (socket) => {
        let l_username = '';
        let l_roomid = '';
        console.log("Connection Established", socket.id);
        socket.on("hello", ()=>{
            console.log("Event Received");
        })
        socket.on("disconnect", async ()=>{
            console.log("Disconnected ", socket.id);
            let r = await db.collection(dbCol).findOne({roomid: l_roomid});
            if(r){
                let prevM = r.members;
                prevM = prevM.filter((ele)=>ele!=l_username);
                const searchQ = {roomid: l_roomid};
                const updateQ = {$set:{members: prevM.slice()}};
                db.collection(dbCol).updateOne(searchQ, updateQ)
                    .then(()=>console.log("Deleted User"))
                io.to(l_roomid).emit('userLeft')
                if(prevM.length == 0){
                    console.log("empty room")
                    setTimeout(()=>{
                        db.collection(dbCol).deleteOne({roomid: l_roomid}).then(()=>{console.log("Deleted Room")});
                    }, 180000)
                }
            }
        })
        socket.on("join", async (roomid, user)=>{
            let r = await db.collection(dbCol).findOne({ roomid: roomid })
            //console.log(r) 
            if(r && !r.members.find(ele=>ele==user.username)){
                //console.log("Can Join.")
                //console.log(`${user.username}`)
                l_username = user.username
                l_roomid = roomid
                const searchQ = {roomid : roomid};
                let prevM = r.members
                prevM.push(user.username)
                const updateQ = { $set: {members: prevM.slice()}}
                await db.collection(dbCol).updateOne(searchQ, updateQ)
                socket.join(roomid);
                socket.emit("joined", roomid, user.username);
                io.to(roomid).emit("newUser")
            }
            else{
                console.log("Does not exist or User exists")
                socket.emit("dne");
            }
        })
        socket.on("create", async (roomid)=>{
            console.log("Create", roomid);
            if(await db.collection(dbCol).findOne({roomid: roomid})){
                console.log("Dup.");
                socket.emit("roomExists");
            }
            else{
                let tempObj = new Room(roomid)
                db.collection(dbCol).insertOne(tempObj)
                    .then(()=>console.log("Room registered on DB"));
                rooms.push(tempObj);
                socket.emit("created", roomid);
            }
        })

        socket.on("sendMsg", async (msg)=>{
            //console.log(msg)
            let r = await db.collection(dbCol).findOne({roomid: msg.roomid})
            //console.log(r)
            pmessages = r.msgs.slice();
            pmessages.push(msg);
            pmessages.sort((a,b)=>a.timestamp-b.timestamp)
            const findQ = {roomid: msg.roomid}
            const setQ = {$set:{msgs: pmessages.slice()}}
            db.collection(dbCol).updateOne(findQ, setQ)
                .then(()=>console.log("DB updated"))
            socket.emit("received")
            io.to(msg.roomid).emit("newMsg");
        })
        socket.on("userLeftRoom", async (roomid, username)=>{
            console.log("user left room")
            socket.leave(roomid)
            l_roomid = ''
            l_username = ''
            let r = await db.collection(dbCol).findOne({roomid: roomid});
            let pUsers = r.members;
            pUsers = pUsers.filter((ele)=>ele != username)
            const searchQ = {roomid: roomid};
            const updateQ = {$set:{members: pUsers.slice()}};
            console.log(pUsers);
            await db.collection(dbCol).updateOne(searchQ, updateQ)
                .then(()=>console.log("Deleted User"))
            io.to(roomid).emit("userLeft")
        })
    })
}

main()

server.listen(process.env.port || 3000 , ()=>{
    console.log("App Started")
});