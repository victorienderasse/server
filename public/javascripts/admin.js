/**
 * Created by Victorien on 23-02-17.
 */

//Connection to the server
var socket = io.connect(serverURL);
socket.emit('client','display');

//Get admin password
var password = prompt('Entrez password admin');

//Send password to server
socket.emit('checkAdminPassword',password);

//Events------------------------------------

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