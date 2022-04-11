const app = require('express')();
const server = require('http').createServer(app);
const io = require('socket.io')(server, {pingInterval:5000})

var userArrayList = []
app.get('/', (req, res)=>{
    res.sendFile(`${__dirname}/index.html`)
})
app.get('/*', (req, res)=>{
    res.sendFile(`${__dirname}/${req.path}`)
})

var tokenList = []
// var tokenAdmin = ['admin']
var images = [
    "https://theawesomedaily.com/wp-content/uploads/2018/03/cats-wearing-glassess-29-1.jpg",
    "https://media.discordapp.net/attachments/931498624024715319/949347645305012224/Snapchat-1670430018.jpg?width=420&height=596",
];
var listMsg = []
var usersWriting = []
io.on('connection', (socket)=>{
    var address = socket.handshake.address;
    console.log(address)
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
            if(!isNew){
                socket.emit('already-exist')
            }
            else if(dataPseudo.pseudo.length > 18){
                socket.emit('too-long')
            }
            else if(dataPseudo.pseudo.length < 3){
                socket.emit('too-short')
            }
            else if(isNew && dataPseudo.pseudo.length > 4){
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
                    message:newUser.pseudo + " à rejoinds le tchat!",
                    message2:newUser.pseudo + "  bienvenue !",
                    date:getDate()
                }
                userArrayList.push(newUser)
                socket.emit('join', Bot)
                socket.broadcast.emit('bot-msg', Bot)
                io.emit('user-count', userArrayList.length)  
            }
        }
    })
    socket.on('newMessage', dataMessage=>{
        if(tokenList.includes(dataMessage.id)){
            if(getUser(dataMessage.id) !== undefined){
                if(dataMessage.message.length|| dataMessage.files){
                    var test = dataMessage.message.substring(0, 4)
                    var isCommand =false 
                    var messageInfo = {
                        message:escapeHtml(dataMessage.message),
                        date:getDate(),
                        user:getUser(dataMessage.id),
                        image:getImage(dataMessage.id),
                        room:escapeHtml(dataMessage.room),
                        files:dataMessage.files,
                        id:dataMessage.id
                    }
                    if(test == "!ban"){
                        isCommand = true
                    }
                    if(isCommand && messageInfo.user == "eugne"){
                        var banInfo = dataMessage.message.split('!ban')
                        userArrayList.map((user, index)=>{
                            console.log(user.pseudo, banInfo[1])
                            if(user.pseudo ==  banInfo[1].replace(' ', '')){
                                socket.to(user.id).emit('refresh')
                                tokenList.splice(index, 1)
                                console.log(tokenList, index)
                                console.log(banInfo[1], "banned")
                                var botMsg ={
                                    pseudo:"Bot",
                                    message:user.pseudo + " a as été banni",
                                    image:"https://theawesomedaily.com/wp-content/uploads/2018/03/cats-wearing-glassess-25-1.jpeg",
                                    date:getDate()
                                }
                                io.emit('bot-msg', botMsg)
                            }
                        })
                    }else{   
                        if(messageInfo.room == "global"){
                            listMsg.push(messageInfo)
                        }
                        if(messageInfo.message.length > 0 || messageInfo.files.length>0){
                            io.emit('newUserMessage', {messageInfo})
                            socket.broadcast.emit('room-msg', dataMessage.room)        
                        }
                    }
                }
                }else{
                socket.emit('deco')
            }
        }
    })
    socket.on('deco', ()=>{
        userArrayList.map((user, index)=>{
            if(user.id == socket.id){
             userArrayList.splice(index, 1)
            }
         })
         socket.emit('deco')
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
    if(userPseudo !== null && userPseudo !== undefined){
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
