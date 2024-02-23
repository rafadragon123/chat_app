import React, {useState} from "react"
import './App.css';
import { io } from 'socket.io-client';
import Home from './pages/home'
import Room from './pages/room'
import {
  BrowserRouter as Router,
  Route,
  Routes,
  Navigate
} from "react-router-dom"

const socket = io("https://chat-backend-w1tg.onrender.com/");
//const socket = io("http://localhost:8000")
// // socket.on("connect", ()=>{
// //   console.log("Connection Established",);
// // })
// socket.emit("create", "testRoom1");
function App() {
  const [appState, setAppState] = useState({
    roomid: null,
    username: null
  })
  // let gotUser = (user) => {
  //   setUsername(user);
  // }
  return (
    <div>
      <Router>
        <Routes>
          <Route path='/room/:roomid' element={(appState.roomid)?(<Room setAppState={setAppState} username={appState.username} socket={socket}/>):(<Navigate to={'/'}></Navigate>)}></Route>
          <Route path='/' element={(appState.roomid)?(<Navigate to={'/room/'+appState.roomid}></Navigate>):(<Home socket={socket} setAppState={setAppState}/>)} />
        </Routes>
      </Router>
    </div>
  );
}

export default App;
