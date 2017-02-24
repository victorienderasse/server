/**
 * Created by Victorien on 23-02-17.
 */

//Connection to the server------------------

var socket = io.connect(serverURL);

//Events------------------------------------

socket.emit('client','display');


//message
//If password admin is wrong -> alert message
socket.on('message',function(data){
    console.log('display message');
    displayMessage(data);

});

//If admin password is correct -> display content + success message
//Message vanished after 5 sec
socket.on('displayAdmin', function(){
    console.log('displayAdmin Event');
    displayMessage({title: 'Info', message: 'Accès à l\'interface administrateur !', action: 'resetMessage'});
    document.getElementById('admin').style.display = 'block';
});


//Actions-----------------------------------

//Check if admin password is correct
var password = prompt('Entrez password admin');

//Send password to server
socket.emit('checkAdminPassword',password);

//Add-camera-btn
//Allow add camera to DB
document.getElementById('add-camera-btn').addEventListener('click',function(){
    console.log('add-camera-btn clicked');
    var form = document.getElementById('add-camera-form');
    var serial = form.serial.value;
    var cameraCode = form.cameraCode.value;
    socket.emit('addCameraAdmin',{serial:serial, cameraCode: cameraCode});
});


//Fonctions

function redirectURL(url){
    console.log('redirectURL function');
    window.location = url;
}


function displayMessage(data){
    console.log('displayMessage function');
    //Action
    if (data.action == "redirect-index"){
        redirectURL(serverURL);
    }
    if (data.action == 'resetMessage'){
        setTimeout(function(){
            resetMessage();
        },5000)
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
}


function resetMessage(){
    document.getElementById('message-div').className = '';
    document.getElementById('message-title').innerHTML = '';
    document.getElementById('message-body').innerHTML = '';
}