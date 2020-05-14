const express = require('express');
const socketio = require('socket.io');
const http = require('http');
const cors = require('cors')

const { addUser, removeUser, getUser, getUsersInRoom } = require('./users.js')

const PORT = process.env.PORT || 5000

const router = require('./router');

const app = express();
const server = http.createServer(app);
const io = socketio(server)

app.use(cors())
app.use(router);


// When client connects
io.on('connection', (socket) => {

    // JOIN
    socket.on('join', ({ name, room }, callback) => {
        const { error, user } = addUser({ id: socket.id, name, room});
        console.log(`Just added user with socket id: ${socket.id}`)


        if (error) return callback(error)

        socket.emit('message', { user: 'admin', text: `Hi ${user.name}, welcome to ther room ${user.room}`})
        socket.broadcast.to(user.room).emit('message', { user: 'admin', text: `${user.name} has joined!`})

        socket.join(user.room)

        io.to(user.room).emit('roomData', { room: user.room, users: getUsersInRoom(user.room)})

        callback();
    })

    socket.on('sendMessage', (message, callback) => {
        const user = getUser(socket.id)

        console.log(socket.id)

        io.to(user.room).emit('message', { user: user.name, text: message})
        io.to(user.room).emit('roomData', { room: user.room, users: getUsersInRoom(user.room)})

        callback()
    })

    socket.on('disconnect', () => {
        const user = removeUser(socket.id)

        if(user){
            io.to(user.room).emit('message', { user: 'admin', text: `${user.name} has left.`})
        }
    })
})



server.listen(PORT, () => console.log(`Server has started on port ${PORT}`));