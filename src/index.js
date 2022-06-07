const path = require ("path")
const http = require ("http")
const express= require ("express")
const socketio= require ("socket.io")
const Filter= require ("bad-words")
const {generateMessage, generateLocationMessage}= require ("./utils/messages.js")
const {addUser,removeUser,getUser,getUsersInRoom}= require ("./utils/users.js")


const app = express()
const server = http.createServer(app)
const io = socketio(server)

const port = process.env.PORT|| 3000
const publicDiretoryPath = path.join(__dirname,"../public")

app.use(express.static(publicDiretoryPath))

//let count= 0

io.on ("connection",(socket)=>{
    console.log("New websocket connection")

    
    socket.on ("join",({username,room}, callback)=>{
        const {error,user}= addUser({id:socket.id, username, room})

        if (error){
            return callback(error)
        }

        socket.join(user.room)

        socket.emit("message",generateMessage("Admin","Welcome!"))
        socket.broadcast.to(user.room).emit("message",generateMessage("Admin",`${user.username} has joined!`))
        io.to(user.room).emit("roomData",{
            room: user.room,
            users: getUsersInRoom(user.room) 
        })

        callback()


        //socket.emit, io.emit, socket.broadcast.emit
        // io.to.emit, io.boadcast.to.emit

    })

    socket.on ("sendMessage",(message,callback)=>{
        const user= getUser(socket.id)

        const filter = new Filter()
        if (filter.isProfane(message)){
            return callback("Profane message is not allowed")
        }
        io.to(user.room).emit("message",generateMessage(user.username , message))
        callback()
    })

    socket.on ("sendLocation",(coords,callback)=>{
        //io.emit("message",`Location:  ${coords.latitud},${coords.longitud}`)
        const user= getUser(socket.id)

        io.to(user.room).emit("messageLocation",generateLocationMessage(user.username,`https://google.com/maps?q=${coords.latitud},${coords.longitud}`))
        callback()
    })
    socket.on ("disconnect",()=>{
       const user= removeUser(socket.id)

       if (user){
            io.to(user.room).emit("message",generateMessage("Admin", `${user.username} ha salido!`))
            io.to(user.room).emit("roomData",{
                room: user.room,
                users: getUsersInRoom(user.room) 
            })
    
       } 
    })
})

server.listen(port,()=>{
     console.log("Server is up on port "+ port)
})