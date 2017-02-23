/**
 * Created by Victorien on 23-02-17.
 */

//Connection to the server------------------
var socket = io.connect(serverURL);

//Events------------------------------------
socket.emit('client','display');

//message
socket.on('message',function(data){
    console.log('display message');
    //action
    if (data.action == "redirect-index"){
        redirectURL(serverURL);
    }
    //type
    if (data.title == 'Alerte'){
        document.getElementById('message-div').className = 'alert alert-danger';
    }
    if (data.title == 'Bravo'){
        document.getElementById('message-div').className = 'alert alert-success';
    }
    if (data.title == 'Info'){
        document.getElementById('message-div').className = 'alert alert-info';
    }
    //add message and title
    document.getElementById('message-title').innerHTML = data.title;
    document.getElementById('message-body').innerHTML = data.message;
});


socket.on('displayAdmin', function(){
    document.getElementById('admin').style.display = 'block';
});

//Actions-----------------------------------

//Check if admin password is correct
var password = prompt('Entrez password admin');

socket.emit('checkAdminPassword',password);

//Add-camera-btn
document.getElementById('add-camera-btn').addEventListener('click',function(){
    console.log('add-camera-btn clicked');
    var form = document.getElementById('add-camera-form');
    var serial = form.serial.value;
    var code = form.code.value;
    socket.emit('addCameraAdmin',{serial:serial, code: code});
});


//Fonctions

function redirectURL(url){
    window.location = url;
}