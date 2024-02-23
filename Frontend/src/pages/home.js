import React, {useEffect, useRef, useState} from "react";
import {Button, TextField} from "@mui/material"
//import { io } from "socket.io-client";
import "./home.css"
import {User} from "./constructors"


export default (props)=>{
    const [roomID, setroomID] = useState('');
    const [username, setusername] = useState('');
    const [error, setError]  = useState(false);
    const [inpNAllow, setinpNAllow] = useState(false);
    const textRef = useRef(null)
    const socket = props.socket
    const user = new User(username, roomID);
    
    let handleClick = (create, roomid) =>{
        if(roomID == '' || username == ''){
            setError(true);
        }
        else if(create){
            socket.emit("create", roomid, user);
            setinpNAllow(true)
        }
        else{
            socket.emit('join', roomid, user);
            setinpNAllow(true)
        }
    }
    useEffect(()=>{
        props.setAppState({
            roomid: null,
            username: null
        })
        socket.on('joined', (roomid, user)=>{
            console.log("hello")
            props.setAppState({
                roomid: roomid,
                username: user
            })
        })
        socket.on('created', (roomid)=>{
            if(textRef.current){
                console.log(textRef.current)
                textRef.current.innerHTML = "Created Room " + roomid;
                textRef.current.style.display = "block";
                setinpNAllow(false);
            }
        })
        socket.on('dne', ()=>{
            if(textRef.current){
                console.log(textRef.current)
                textRef.current.innerHTML = "Room Not Found";
                textRef.current.style.display = "block";
                setinpNAllow(false);
            }
        })
        socket.on('roomExists', ()=>{
            if(textRef.current){
                console.log(textRef.current)
                textRef.current.innerHTML = "Room Already Exists";
                textRef.current.style.display = "block";
                setinpNAllow(false);
            }
        })
    }, [])
    return(
      <div className="home">
        <div className='buttonHolder'>
            <Button disabled={inpNAllow} variant='contained' onClick={()=>{
                handleClick(0, roomID);
            }}>Join Room</Button>
            <Button disabled={inpNAllow} variant='outlined' onClick={()=>{
                handleClick(1, roomID);
            }}>Create Room</Button>
        </div>
        <TextField disabled={inpNAllow} error={error} value={roomID} onChange={(ev)=>{setroomID(ev.target.value)}} id ='roomIDtext' label='roomID' variant='outlined'></TextField>
        <TextField disabled={inpNAllow} error={error} value={username} onChange={(ev)=>{setusername(ev.target.value)}} id ='usernametext' label='username' variant='outlined'></TextField>
        <div ref={textRef} className="status"></div>
      </div>  
    );
}