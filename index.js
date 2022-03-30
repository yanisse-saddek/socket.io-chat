const app = require('express')();
const server = require('http').createServer(app);
const io = require('socket.io')(server)

var userArrayList = []
app.get('/', (req, res)=>{
    res.sendFile(`${__dirname}/index.html`)
})
app.get('/*', (req, res)=>{
    res.sendFile(`${__dirname}/${req.path}`)
})

var tokenList = ["token"]
var images = [
    "https://theawesomedaily.com/wp-content/uploads/2018/03/cats-wearing-glassess-29-1.jpg",
    "https://theawesomedaily.com/wp-content/uploads/2018/03/cats-wearing-glassess-28-1.jpeg",
    "https://theawesomedaily.com/wp-content/uploads/2018/03/cats-wearing-glassess-27-1.jpeg",
    "https://theawesomedaily.com/wp-content/uploads/2018/03/cats-wearing-glassess-26-1.jpeg",
    "https://theawesomedaily.com/wp-content/uploads/2018/03/cats-wearing-glassess-25-1.jpeg",
];

io.on('connection', (socket)=>{
    socket.on('get-token', ()=>{
        tokenList.push(socket.id)
        socket.emit('get-token', socket.id)
    })

    socket.on('dataPseudo', dataPseudo=>{
        var isNew = true
        userArrayList.map(user=>{
            if(user.id == dataPseudo.id){
                isNew = false
            }
        })        
        if(tokenList.includes(dataPseudo.id) && isNew && dataPseudo.pseudo.length > 4){
            var rand = Math.floor(Math.random() * images.length)
            var randImg = images[rand]
            var newUser = {
                id:escapeHtml(socket.id), 
                pseudo:escapeHtml(dataPseudo.pseudo),
                image:randImg,
            }
            var Bot = {
                pseudo:"Bot", 
                image:"https://theawesomedaily.com/wp-content/uploads/2018/03/cats-wearing-glassess-25-1.jpeg",
                date:getDate()
            }
            userArrayList.push(newUser)
            socket.emit('join', {newUser, Bot})
            socket.broadcast.emit('newUserJoin', {newUser, Bot})
            io.emit('user-count', userArrayList.length)
            console.log(userArrayList)
        }
    })
    socket.on('newMessage', dataMessage=>{
        if(tokenList.includes(dataMessage.id) && dataMessage.message || dataMessage.files){
            var messageInfo = {
                message:escapeHtml(dataMessage.message),
                date:getDate(),
                user:getUser(dataMessage.id),
                image:getImage(dataMessage.id),
                room:escapeHtml(dataMessage.room),
                files:dataMessage.files
            }
            io.emit('newUserMessage', {messageInfo})
            socket.broadcast.emit('room-msg', dataMessage.room)
        }
    })
    
    socket.on('is-active', dataActive=>{
        if(tokenList.includes(dataActive.id)){
            userArrayList.map((user, index)=>{
                if(user.id == dataActive.id){
                    userArrayList[index].actif = dataActive.actif
                }
            })
            io.emit('is-active', userArrayList)
        }
    })

    socket.on('disconnect', () =>{
        userArrayList.map((user, index)=>{
           if(user.id == socket.id){
            userArrayList.splice(index, 1)
           }
        })
        // countConnected--
        io.emit('user-count', userArrayList.length)
        // io.emit('leave-message', socket.leaveMsg)
    })
    socket.on('new-mp', (dataNewMp)=>{
        if(tokenList.includes(dataNewMp.id)){
            userArrayList.map(user=>{
            if(user.id == dataNewMp.id){
                io.to(dataNewMp.data.data.id).emit('new-mp', {dataNewMp, user})
            }
        })
        }
    })

})

server.listen(3000, ()=>{
    console.log('serveur demarré sur le port 3000')
})

function escapeHtml(text) {
    var map = {
        "&": "&amp;",
        "<": "&lt;",
        ">": "&gt;",
        '"': "&quot;",
        "'": "&#039;",
    };

    return text.replace(/[&<>"']/g, function (m) {
        return map[m];
    });
}
function getDate(){
    var date = new Date();
    var hour = date.getHours();
    var minutes = date.getMinutes();
    var heureMinute = hour.toString() + ":" + minutes.toString();
    return heureMinute
}
function getUser(id){
    var userPseudo = null
    userArrayList.map(user=>{
        if(user.id == id){
            console.log('-------------')
            console.log("oui c bueno la", user.pseudo)
            userPseudo =  user.pseudo
        }
    })
    return userPseudo
}
function getImage(id){
    var userImage = null
    userArrayList.map(user=>{
        if(user.id == id){
            console.log('-------------')
            console.log("oui c bueno la", user)
            userImage=  user.image
        }
    })
    return userImage
}