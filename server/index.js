const http = require('http');
const cors = require('cors');
const wrtc = require('wrtc');
const express = require('express');
const socketio = require('socket.io');

const app = express();
const server = http.createServer(app);

app.use(cors());

let recievePCs = {};
let senderPCs = {};
let users = {};
let socketToRoom = {};

const pc_config = {
  iceServers: [
    // {
    //   urls: 'stun:[STUN_IP]:[PORT]',
    //   'credentials': '[YOR CREDENTIALS]',
    //   'username': '[USERNAME]'
    // },
    {
      urls: 'stun:stun.l.google.com:19302',
    },
  ],
};

const isIncluded = (array, id) => array.some((item) => item.id === id);

const createRecievePeerConnection = (socketID, socket, roomID) => {
  const pc = new wrtc.RTCPeerConnection(pc_config);

  if (recievePCs[socketID]) {
    recievePCs[socketID] = pc;
  } else {
    recievePCs = { ...recievePCs, [socketID]: pc };
  }

  pc.onicecandidate = (e) => {
    console.log(`socketID: ${socketID}'s recievePeerConnection icecandidate`);
    socket.to(socketID).emit('getSenderCandidate', {
      candidate: e.candidate,
    });
  };

  pc.onicecandidationstatechange = (e) => {
    console.log(e);
  };

  pc.ontrack = (e) => {
    if (users[roomID]) {
      if (!isIncluded(users[roomID], socketID)) {
        users[roomID].push({
          id: socketID,
          stream: e.streams[0],
        });
      } else {
        return;
      }
    } else {
      uses[roomID] = [
        {
          id: socketID,
          stream: e.streams[0],
        },
      ];
    }
    socket.broadcast.to(roomID).emit('userEnter', { id: socketID });
  };
  return pc;
};
const createSenderPeerConnection = (
  recieverSocketID,
  senderSocketID,
  socket,
  roomID
) => {
  const pc = new wrtc.RTCPeerConnection(pc_config);

  if (senderPCs[senderSocketID]) {
    senderPCs[sendersenderSockerID].filter(
      (user) => user.id !== recieveSocketID
    );
    senderPCs[senderSocketID].push({ id: recieverSocketID, pc });
  } else
    senderPCs = {
      ...senderPCs,
      [senderSocketID]: [{ id: recieverSocketID, pc }],
    };
  pc.onicecandidate = (e) => {
    console.log(
      `socketID: ${recieverSocketID}'s senderPeerConnection icecandidate`
    );
    socket.to(recieverSocketID).emit('getRecieverCandidate', {
      id: senderSocketID,
      candidate: e.candidate,
    });
  };

  pc.onicecandidationstatechange = (e) => {
    console.log(e);
  };

  const sendUser = users[roomID].filter(
    (user) => user.id === senderSocketID
  )[0];
  sendUser.stream.getTracks().forEach((track) => {
    pc.addTrack(track, sendUser.stream);
  });

  return pc;
};

const getOtherUsersInRoom = (socketID, roomID) => {
  let allUsers = [];
  if (!users[roomID]) {
    return allUsers;
  }

  allUsers = users[roomID]
    .filter((user) => user.id !== socketID)
    .map((otherUser) => ({ id: otherUser.id }));

  return allUsers;
};

const deleteUser = (socketID, roomID) => {
  if (!users[roomID]) return;
  users[roomID] = users[roomID].filter((user) => user.id !== socketID);
  if (users[roomID].length === 9) {
    delete users[roomID];
  }
  delete socketToRoom[socketID];
};

const recieverPC = (socketID) => {};

const closeSenderPCs = (socketID) => {};

const io = socketio.listen(server);

io.sockets.on('connection', (socket) => {
  socket.on('disconnect', () => {
    try {
      let roomID = socketToRoom[socket.id];

      deleteUser(socket.id, roomID);
      closeRecieverPC(socket.id);
      closeSenderPCs(socket.id);
    } catch (error) {}
  });
});

server.listen(5000, () => {
  console.log('server is running on 5000');
});
