import express from 'express';
import { createServer } from 'http';
import { Server } from 'socket.io';

const app = express();
const httpServer = createServer(app);
const io = new Server(httpServer, {
  cors: {
    origin: "http://localhost:5173",
    methods: ["GET", "POST"]
  }
});

const users = new Map();
const typingUsers = new Set();

io.on('connection', (socket) => {
  console.log('User connected:', socket.id);

  socket.on('join', ({ username, room }) => {
    users.set(socket.id, { username, room });
    socket.join(room);
    
    socket.broadcast.to(room).emit('message', {
      type: 'system',
      content: `${username} has joined the chat`,
      timestamp: new Date(),
    });

    io.to(room).emit('userList', Array.from(getUsersInRoom(room)));
  });

  socket.on('message', ({ content, room }) => {
    const user = users.get(socket.id);
    if (user) {
      io.to(room).emit('message', {
        type: 'user',
        username: user.username,
        content,
        timestamp: new Date(),
      });
    }
  });

  socket.on('typing', ({ isTyping, room }) => {
    const user = users.get(socket.id);
    if (user) {
      if (isTyping) {
        typingUsers.add(socket.id);
      } else {
        typingUsers.delete(socket.id);
      }
      
      const typingUsernames = Array.from(typingUsers)
        .map(id => users.get(id)?.username)
        .filter(username => username !== user.username);
      
      socket.broadcast.to(room).emit('typingUsers', typingUsernames);
    }
  });

  socket.on('disconnect', () => {
    const user = users.get(socket.id);
    if (user) {
      const { username, room } = user;
      users.delete(socket.id);
      typingUsers.delete(socket.id);
      
      io.to(room).emit('message', {
        type: 'system',
        content: `${username} has left the chat`,
        timestamp: new Date(),
      });
      
      io.to(room).emit('userList', Array.from(getUsersInRoom(room)));
    }
  });
});

function getUsersInRoom(room) {
  return Array.from(users.entries())
    .filter(([_, user]) => user.room === room)
    .map(([_, user]) => user.username);
}

const PORT = 3000;
httpServer.listen(PORT, () => {
  console.log(`Server running on port ${PORT}`);
});