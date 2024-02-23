import React, { useEffect, useRef, useState } from 'react'
import {TextField} from '@mui/material'
import { ArrowCircleRight, Cancel} from '@mui/icons-material'
import MessageHolder from "./message"
import "./room.css"
import {Link} from "react-router-dom" 
//import { io } from 'socket.io-client'
import { Message } from './constructors'
import { useParams } from "react-router-dom";

const serverURL = 'https://chat-backend-w1tg.onrender.com/'
// const serverURL = "http://localhost:8000/";

export default (props)=>{
    const [messages, setMessages] = useState([]);
    const [users, setUsers] = useState([])
    const [message, setMessage] = useState('')
    const [rec, setRec] = useState(true);
    const sendButt = useRef(null)
    const socket = props.socket
    let {roomid} = useParams()  

    const handleLeave = () =>{
        socket.emit("userLeftRoom", roomid, props.username);
        props.setAppState({
            roomid: null,
            username: null
        })
    }

    const fetchUser = ()=>{
        fetch(serverURL + 'getUser/' + roomid)
            .then((res)=> {console.log(res); return res.json()})
            .then((res)=>{
                if(res.status == 200){
                    setUsers(res.users)
                }
            })
    }
    
    const fetchMessages = () => {
        console.log("New Message")
        fetch(serverURL+'getMessages/' + roomid)
            .then(res=>res.json())
            .then(res=>{console.log(res); setMessages(res.messages.slice())})
    }

    useEffect(()=>{
        socket.on('newMsg', fetchMessages);
        socket.on('newUser', fetchUser);
        socket.on('userLeft', fetchUser);

        socket.on('received', ()=>{
            setRec(true);
        })  
        socket.on('disconnect', (reason)=>{
            if(reason == "transport close" || reason == "ping timeout"){
                console.log(reason)
                console.log("Retrying Join")
                socket.emit('join', roomid, {username: props.username});
            }
        })
    },[])
    
    useEffect(fetchUser,[])
    useEffect(fetchMessages,[])
    const handleSend = (ev) => {
        {
            if(message){
                let msg = new Message(props.username, message, roomid, new Date());
                socket.emit("sendMsg", msg);
                setMessage('')
            } 
        }
        
    }

    return(
        <div className='room'>
            <div className='infoArea' style={{textAlign: "left", backgroundColor: "#7ed6df"}}>
                <div>
                    <div id='infoText'>User List</div>
                    <div className='userList'>{users.map((ele, idx)=><div style={{width:"50%"}} key={ele}>{ele}</div>)}</div>
                </div>
                <Cancel onClick={handleLeave} sx={{ cursor: "pointer",fontSize:"2.5em"}}></Cancel>
            </div>
            <div className='chatArea' style={{backgroundColor: "#fff"}}>
                <div className='messageGroup' style={{width:"100%", marginBottom:"20px"}}>
                    <div className='messagesArea'>
                        {messages.map((ele, idx)=><MessageHolder key={idx} username={ele.username} message={ele.message} timestamp={ele.timestamp}></MessageHolder>)}
                    </div>
                    <div className='messageBox' style={{width:"100%"}}>
                        <TextField onKeyPress={(ev)=>{
                            if(ev.key == 'Enter'){   
                                sendButt.current.dispatchEvent(
                                    new MouseEvent('click', {
                                      view: window,
                                      bubbles: true,
                                      cancelable: true,
                                      buttons: 1,
                                    }),
                                );
                            }
                        }} onChange={(ev => setMessage(ev.target.value))} value={message} variant='filled' label={"Message"} sx={{width:"70%"}}> </TextField>
                        <ArrowCircleRight ref={sendButt} id = 'sendButton' sx={{fontSize:"3.5em", color:"#686de0"}} onClick={(rec)?handleSend:()=>{console.log("Disabled")}}></ArrowCircleRight>
                    </div>
                </div>
            </div>
        </div>
    )
}