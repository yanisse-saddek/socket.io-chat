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
var tokenAdmin = ['admin']
var images = [
    "https://theawesomedaily.com/wp-content/uploads/2018/03/cats-wearing-glassess-29-1.jpg",
    "https://theawesomedaily.com/wp-content/uploads/2018/03/cats-wearing-glassess-28-1.jpeg",
    "https://theawesomedaily.com/wp-content/uploads/2018/03/cats-wearing-glassess-27-1.jpeg",
    "https://theawesomedaily.com/wp-content/uploads/2018/03/cats-wearing-glassess-26-1.jpeg",
    "https://theawesomedaily.com/wp-content/uploads/2018/03/cats-wearing-glassess-25-1.jpeg",
];
var listMsg = []
var usersWriting = []
io.on('connection', (socket)=>{
    socket.on('get-token', ()=>{
        tokenList.push(socket.id)
        socket.emit('get-token', socket.id)
        if(listMsg){
            listMsg.map(message=>{
                var messageInfo = message
                socket.emit('newUserMessage', {messageInfo})
            })
        }
    })
    socket.on('dataPseudo', dataPseudo=>{
        var isNew = true
        userArrayList.map(user=>{
            if(user.id == dataPseudo.id){
                isNew = false
            }
        })        
        if(tokenList.includes(dataPseudo.id)){
            if(isNew && dataPseudo.pseudo.length > 4){
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
            }
        }
    })
    socket.on('newMessage', dataMessage=>{
        if(tokenList.includes(dataMessage.id)){
            if(dataMessage.message || dataMessage.files){
                console.log("en dehors nn", getUser(dataMessage.id))
                if(getUser(dataMessage.id) !== undefined){
                    console.log("c bon laaaaaaaaaaaaaaaaaaaaaaaaa ------>" , getUser(dataMessage.id))
                    var messageInfo = {
                        message:escapeHtml(dataMessage.message),
                        date:getDate(),
                        user:getUser(dataMessage.id),
                        image:getImage(dataMessage.id),
                        room:escapeHtml(dataMessage.room),
                        files:dataMessage.files
                    }
                    if(messageInfo.room == "global"){
                        listMsg.push(messageInfo)
                    }
                    io.emit('newUserMessage', {messageInfo})
                    socket.broadcast.emit('room-msg', dataMessage.room)        
                }
                else{
                    socket.emit('deco')
                }
            }
        }
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
    socket.on('is-writing', dataWriting=>{
        if(tokenList.includes(dataWriting.id)){
            var writingUser = null
            var writingUserIndex = null
            userArrayList.map((user, index)=>{
                if(user.id == dataWriting.id){
                    writingUser = user.pseudo
                    writingUserIndex = index
                }
            })
            if(dataWriting.write){
                if(!usersWriting.includes(writingUser)){
                    usersWriting.push(writingUser)
                }
            }else{
                usersWriting.splice(writingUserIndex, 1)
            }
                socket.broadcast.emit('is-writing', usersWriting)
        }
    })
    socket.on('deco', ()=>{
        userArrayList.map((user, index)=>{
            if(user.id == socket.id){
             userArrayList.splice(index, 1)
            }
         })
         console.log("USER MACHINNNN" , userArrayList)
    })
    socket.on('disconnect', () =>{
        userArrayList.map((user, index)=>{
           if(user.id == socket.id){
            userArrayList.splice(index, 1)
           }
        })
        io.emit('user-count', userArrayList.length)
    })
})

server.listen(process.env.PORT || 3000, () => {
});

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
    var hour = date.getHours()+2;
    var minutes = date.getMinutes();
    var heureMinute = hour.toString() + ":" + minutes.toString();
    return heureMinute  
}
function getUser(id){
    var userPseudo = null
    userArrayList.map(user=>{
        if(user.id == id){
            userPseudo =  user.pseudo
        }
    })
    if(userPseudo !== null){
        return userPseudo
    }
}
function getImage(id){
    var userImage = null
    userArrayList.map(user=>{
        if(user.id == id){
            userImage=  user.image
        }
    })
    return userImage
}
