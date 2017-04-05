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
    var size = 6;

    var nbRow = size % 3;
    size = size - nbRow;
    nbRow = nbRow + (size / 3);

    console.log('nb Row : '+nbRow);

    var row = 0;

    var multiLive = document.getElementById('multiLive');

    for(var i=0;i<size;i++){

        var img = document.createElement('img');
        img.id = 'player'+i;
        img.src = '../images/zelda1.png';
        var colDiv = document.createElement('div');
        colDiv.id = 'colDiv'+i;
        colDiv.className = 'col-lg-4';

        colDiv.appendChild(img);

        var rowDiv;

        if((size%3) == 0){
            row = row + 1;
            rowDiv = document.createElement('div');
            rowDiv.id = 'rowDiv'+row;
            rowDiv.className = 'row';
            rowDiv.appendChild(colDiv);
            multiLive.appendChild(rowDiv);
        }else{
            rowDiv = document.getElementById('rowDiv'+row);
            rowDiv.appendChild(colDiv);
        }
        size = size - 1;
    }
}
