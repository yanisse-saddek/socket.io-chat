var socket = io()
setInterval(() => {
    console.log(socket.id)
}, 1000);

var token = null;
var imageId = [];
var filesList = [];
var room = "global";
var lastMsg = "";
var lastMsgPv = null;
var chatActive = false;
var userCount = 0
socket.emit("get-token");
socket.on("get-token", (newToken) => {
    token = newToken;
});

$("html").keydown(function (e) {
    if (e.which == 13 && chatActive) {
        socket.emit("newMessage", {
            room: room,
            message: $("#message").val(),
            files: filesList,
            id: token,
        });
        $("#message").val("");
        $(".file-preview").empty();
        filesList = [];
        imageid = [];
        socket.emit('is-writing', {write:false, id:token})
    } 
    else if (e.which == 13 && chatActive == false) {
        socket.emit("dataPseudo", { pseudo: $("#pseudo").val(), id: token });
        $("#pseudo").val("");
    }
});

$("#logBtn").click((e) => {
        socket.emit("dataPseudo", { pseudo: $("#pseudo").val(), id: token });
        $("#pseudo").val("");
        console.log('ok')
});

socket.on("join", (data) => {
    lastMsg = data.pseudo
    $(".login").css("display", "none");
    $(".msg-list>.global").append(`
            <div class="msg-line ${data.pseudo} actual">
            <div class="message">
                <div class="user">
                    <img  height="50px" src=${data.image} />
                    <div class="name">${data.pseudo}</div>
                    <p>${data.date}</p>
                </div>
                <div class="text">
                <p>${data.message2}</p>
                </div>
            </div>
            </div>
        `);
    chatActive = true;
});
socket.on("bot-msg", (data) => {
    lastMsg = data.pseudo
    $(".msg-list>.global").append(`
        <div class="msg-line ${data.pseudo} actual">
        <div class="message">
            <div class="user">
                <img  height="50px" src=${data.image} />
                <div class="name">${data.pseudo}</div>
                <p>${data.date}</p>
            </div>
            <div class="text">
            <p>${data.message}</p>
            </div>
            </div>
        </div>
    `);
});


$("#btn").click(() => {
    socket.emit("newMessage", {
        room: room,
        message: $("#message").val(),
        files: filesList,
        id: token,
    });
    $("#message").val("");
    $(".file-preview").empty();
    filesList = [];
    imageid = [];
});

socket.on("newUserMessage", (data) => {
        var files = null;
        if (data.messageInfo.files) {
            files = data.messageInfo.files;
        }
        message = data.messageInfo.message.split(" ");
        var messageHTML = "";
        var imageHTML = "";
        var PictureHTML = "";
        message.map((word) => {
            var checkLink = word.split("");
            var isLink = false;
            var isImage = false;
            var wordLowerCase = word.toLowerCase();
            if (
            word.substring(word.length - 4) == ".jpg" ||
            word.substring(word.length - 4) == ".png"
            ) {
                isImage = true;
            } else if (checkLink.includes(".")) {
            isLink = true;
        }
        if (
            (wordLowerCase.startsWith("http://") ||
            wordLowerCase.startsWith("https://")) &&
            isLink
        ) {
            messageHTML +=
            "<a href=" + word + " target='_blank'>" + word + "</a>" + " ";
        } else if (
            (wordLowerCase.startsWith("http://") ||
            wordLowerCase.startsWith("https://")) &&
            isImage
        ) {
            imageHTML += "<img class='messageImg' src=" + word + " />";
        } else {
            messageHTML += word + " ";
        }
    });
    if (files) {
        files.map((file) => {
            imageHTML += "<img class='messageImg' src=" + file + " />";
        });
    }
    if(data.messageInfo.id !== token){
        PictureHTML = '<img  height="50px" src='+data.messageInfo.image+' />'
    }
    if (data.messageInfo.room == "global") {
        if (data.messageInfo.user !== lastMsg) {
            lastMsg = data.messageInfo.user;
            $(".global> .actual").removeClass("actual");
            $(".msg-list>.global").append(`
                    <div class="msg-line ${data.messageInfo.user} ${data.messageInfo.id == token?"right":null} actual">
                    <div class="${data.messageInfo.id == token?"me":"null"} message">
                            <div class="user ${data.messageInfo.id == token ? "me": null}">
                                ${PictureHTML}
                            <div class="name" style="margin-right:20px">${data.messageInfo.user}</div>
                                    <p>${data.messageInfo.date}</p>
                                </div>
                            <div class="text">
                            <p>
                            ${messageHTML}
                            <div>
                            ${imageHTML}
                            </div>
                            </p>
                            </div>
                        </div>
                    </div>
                `);
        } else {
            $(".msg-list> .global >.actual").append(`
            <div style="margin-top:10px;" class="${data.messageInfo.id == token?"me":"null"} message">
            <p>
                    ${messageHTML}
                    <div>
                    ${imageHTML}
                    </div>
                </p>
            </div>
                `);
        }
    } else {
        if (data.messageInfo.user !== lastMsgPv) {
            lastMsgPv = data.messageInfo.user;
            $("." + data.messageInfo.room + "> .actuale").removeClass("actuale");
            $(".msg-list> ." + data.messageInfo.room + "").append(`
            <div class="msg-line ${data.messageInfo.user} ${data.messageInfo.id == token?"right":null} actuale">
                <div class="${data.messageInfo.id == token?"me":"null"} message">
                    <div class="user ${data.messageInfo.id == token ? "me": null}">
                        <img  height="50px" src=${data.messageInfo.image} />
                        <div class="name" style="margin-right:20px" >${data.messageInfo.user}</div>
                            <p>${data.messageInfo.date}</p>
                        </div>
                        <div class="text">
                        <p>
                            ${messageHTML}
                            <div>
                            ${imageHTML}
                            </div>
                        </p>
                        </div>
                    </div>
                    </div>
            </div>`);
        } else {
            $(".msg-list> ." + data.messageInfo.room + " > .actuale").append(`
            <div style="margin-top:10px;" class="${data.messageInfo.id == token?"me":"null"} message">
            <p>
            ${messageHTML}
            <div>
                    ${imageHTML}
                    </div>
                    </p>
                    </div>
                    `);
                }
            }
            
            var chatHistory = document.getElementById("msg-list");
            chatHistory.scrollTop = chatHistory.scrollHeight;
});

socket.on("user-count", (count) => {
    userCount = count
});

setInterval(() => {
    if(chatActive){
        if (!document.hidden) {
            socket.emit("is-active", { pseudo: pseudo, actif: "actif", id: token });
        } else {
            socket.emit("is-active", { pseudo: pseudo, actif: "inactif", id: token });
        }
    }
}, 1000);

socket.on("is-active", (data) => {
    $(".user-list").empty();
    $('.user-list').append(`
    <div class="user-count">
        <p>Utilisateurs connect??s (<span class="count-user">${userCount}</span>)</p>
    </div>
    `)
    for (i = 0; i < data.length; i++) {
        var infoData = {
            data: data[i],
            senderID: token,
        };
        infoData = JSON.stringify(infoData);
        if (data[i].id == token) {
            $(".user-list").prepend(`
                <div style="border-bottom:2px solid black"class="user-card">
                    <div class="info">
                        <img class="pdp" src='${data[i].image}'/>
                        <p>${data[i].pseudo}</p>
                    </div>
                    <svg onClick="disconnect()" height="15px" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 512 512"><path d="M160 416H96c-17.67 0-32-14.33-32-32V128c0-17.67 14.33-32 32-32h64c17.67 0 32-14.33 32-32S177.7 32 160 32H96C42.98 32 0 74.98 0 128v256c0 53.02 42.98 96 96 96h64c17.67 0 32-14.33 32-32S177.7 416 160 416zM502.6 233.4l-128-128c-12.51-12.51-32.76-12.49-45.25 0c-12.5 12.5-12.5 32.75 0 45.25L402.8 224H192C174.3 224 160 238.3 160 256s14.31 32 32 32h210.8l-73.38 73.38c-12.5 12.5-12.5 32.75 0 45.25s32.75 12.5 45.25 0l128-128C515.1 266.1 515.1 245.9 502.6 233.4z"/></svg>
                </div>
                `);
        } else {
            $(".user-list").append(`
                <div class="user-card ${data[i].pseudo} ">
                    <div class="info">
                        <div class="state">
                            <div class="${data[i].actif}"></div>
                        </div>
                        <img class="pdp" src='${data[i].image}'/>
                        <p>${data[i].pseudo}</p>
                    </div>
    
                    <div class="action-btn">
                        <img src="https://cdn-icons-png.flaticon.com/512/773/773652.png" onclick='newMP(${infoData})'/>
                    </div>
                </div>
                `);
        }
    }
});


function newMP(data) {
    console.log(data)
    socket.emit("new-mp", { data: data, id: token });
    var className = data.senderID + data.data.id;
    var className2 = data.data.id + data.senderID;
    var checkDiv = $(".select-room> ." + className + "").attr("class");
    var checkDiv2 = $(".select-room> ." + className2 + "").attr("class");

    if ($(".msg-list> ." + className + "").length) {
        $(".select-room> ." + className + "").css("display", "flex");
    } else {
        if (
            $(".select-room> ." + className + "").length ||
            $(".select-room> ." + className2 + "").length
        ) {
            $(".select-room> ." + className2 + "").css("display", "flex");
        } else {
            $(".select-room").append(`
            <div class="${className2} room" onclick="openMP('${className2}')" >
            <img src="${data.data.image}" />
            <div class="flex">
                <p>${data.data.pseudo}</p>
            </div>
            </div>
            `);
        }

        if (
            $(".msg-list> ." + className + "").length ||
            $(".msg-list> ." + className2 + "").length
        ) {
        } else {
            $(".msg-list").append(`
            <div class="${className2} room-chat"> 
            <p class="close" onClick="closeMP('${className2}')">X</p>
            <div/>
            `);
            $(".msg-list> ." + className + ", .room-chat").css("display", "none");
        }
    }
}

socket.on("new-mp", (data) => {
    var sender = data.dataNewMp.data;
    var receiver = data.dataNewMp.data.data;
    var className = sender.senderID + receiver.id;
    var className2 = receiver.id + sender.senderID;
    console.log(data)
    if ($(".msg-list> ." + className + "").length) {
        $(".select-room> ." + className + "").css("display", "flex");
    } else {
        if (
            $(".select-room> ." + className + "").length ||
            $(".select-room> ." + className2 + "").length
        ) {
            $(".select-room> ." + className2 + "").css("display", "flex");
        } else {
            $(".select-room").append(`
            <div class="${className2} room" onclick="openMP('${className2}')">
                <img src="${data.user.image}" />
                <div class="flex">
                    <p>${data.user.pseudo}</p>
                </div>
            </div>
            `);
        }
        if (
            $(".msg-list> ." + className + "").length ||
            $(".msg-list> ." + className2 + "").length
        ) {
        } else {
            $(".msg-list").append(`
            <div class="${className2} room-chat"> 
            <p class="close" onClick="closeMP('${className2}')">X</p>
            <div/>
            `);
            $(".msg-list> ." + className2 + ".room-chat").css("display", "none");
        }
    }
});
function openMP(className) {
    var oldRoomIDS = room;
    room = className;
    lastMsgPv = null;
    $(".select-room > ." + room + "> .flex > .new-msg").remove();
    $(".msg-list> .global").css("display", "none");
    $(".msg-list> ." + oldRoomIDS + "").css("display", "none");
    $(".msg-list> ." + className + "").css("display", "block");
    var chatHistory = document.getElementById("msg-list");
    chatHistory.scrollTop = chatHistory.scrollHeight;
}
function closeMP(className) {
    lastMsgPv = null;
    room = "global";
    var checkDiv = $("." + className + "").attr("class");
    if (checkDiv) {
        $(".select-room> ." + className + "").css("display", "none");
        $(".msg-list> ." + className + "").css("display", "none");
        $(".msg-list>.global").css("display", "block");
    }
}   
socket.on("room-msg", (roomMsg) => {
    if (roomMsg !== room && !$(".select-room> ." + roomMsg + "> .flex > .new-msg").length) {
        $(".select-room > ." + roomMsg + "> .flex").append(`
            <div class="new-msg">
            </div>
        `);
    }
});
function validateAndUpload(input){
    var URL = window.URL || window.webkitURL;
    var file = input.files[0];

    if (file){
        console.log(typeof file.size)
        if(file.size > 600000){
            console.log('image trop lourde !')
        } else{
            var image = new Image();
            image.onload = function() {
            if (this.width) {
                var uploaded_image = "";
                const reader = new FileReader();
                reader.addEventListener("load", () => {
                    uploaded_image = reader.result;
                    var newImgId = "image" + (imageId.length + 1);
                    imageId.push(newImgId);
                    filesList.push(uploaded_image);
                    $(".file-preview").append(`
                    <div class="image-preview ${newImgId}">
                    <div class="close close-btn" onClick="removeFile('${newImgId}')">x</div>
                        <img height="80px" src="${uploaded_image}"/>
                    </div>
                    `);
                });
                reader.readAsDataURL(file);
            }
        };

        image.src = URL.createObjectURL(file);
        }
    }
}
function removeFile(id) {
    filesList.splice(id - 1, 1);
    $("." + id + "").remove();
}
socket.on('deco', ()=>{
    $(".user-list").empty();
    $(".login").css("display", "flex");
    chatActive = false
})
function disconnect(){
    socket.emit('deco')
}
socket.on('refresh', ()=>{
    location.reload()
})

function showUserList(){
    $('.chat').toggleClass('dark')

    if ($(".user-section").hasClass('load')) {
        $(".user-section").addClass( "unload" );
        $(".user-section").removeClass( "load" );
      } else {
        $(".user-section").addClass( "load" );
        $(".user-section").removeClass( "unload" );
      }
      
}

socket.on('already-exist', ()=>{
    $('.already-exist').css('display', 'flex')
})
socket.on('too-short', ()=>{
    $('.too-short').css('display', 'flex')
})
socket.on('too-long', ()=>{
    $('.too-long').css('display', 'flex')
})