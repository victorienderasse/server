/**
 * Created by Victorien on 05-04-17.
 */
//Connection to the server
var socket = io.connect(serverURL);
socket.emit('client','multiLive');

var userID = document.getElementById('userID').innerHTML;

socket.emit('getCamera',userID);


//EVENTS===============================================================================

socket.on('sendCamera', function(tbCamera){
    console.log('sendCamera event');
    displayCamera(tbCamera);
});


//Functions============================================================================

function displayCamera(tbCamera){
    console.log('displayCamera function');

    //var size = tbCamera.length;
    var size = 16;

    var nbRow = size % 3;
    size = size - nbRow;
    nbRow = nbRow + (size / 3);
    
    console.log('nb Row : '+nbRow);
}
