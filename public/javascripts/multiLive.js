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

    var row = 0;
    console.log('row = '+row);

    var multiLive = document.getElementById('multiLive');

    for(var i=0;i<tbCamera.length;i++){

        var img = document.createElement('img');
        img.id = 'player'+tbCamera[i].cameraID;
        img.src = '../images/zelda1.png';

        var btnDiv = document.createElement('div');
        btnDiv.id = 'player'+tbCamera[i].cameraID+'-btn';
        btnDiv.setAttribute('style','padding:5px;');

        var play = document.createElement('button');
        play.id = 'player'+tbCamera[i].cameraID+'-play';
        play.setAttribute('onclick','play('+tbCamera[i].cameraID+');');
        play.setAttribute('style','background-color:#B9E9C4;');

        var playIcon = document.createElement('span');
        playIcon.id = 'player'+tbCamera[i].cameraID+'-playIcon';
        //playIcon.className = 'glyphicon glyphicon-play';
        playIcon.className = 'glyphicon glyphicon-stop';

        play.appendChild(playIcon);

        var record = document.createElement('button');
        record.id = 'player'+tbCamera[i].cameraID+'-record';
        record.setAttribute('style','background-color:#FAECEC;');
        record.setAttribute('onclick','record('+tbCamera[i].cameraID+');');

        var recordIcon = document.createElement('span');
        recordIcon.id = 'player'+tbCamera[i].cameraID+'-recordIcon';
        recordIcon.className = 'glyphicon glyphicon-record';
        //recordIcon.className = 'glyphicon glyphicon-stop';

        record.appendChild(recordIcon);

        var colDiv = document.createElement('div');
        colDiv.id = 'colDiv'+tbCamera[i].cameraID;
        colDiv.className = 'col-lg-4';

        btnDiv.appendChild(play);
        btnDiv.appendChild(record);
        colDiv.appendChild(img);
        colDiv.appendChild(btnDiv);

        var rowDiv;

        if(((i%3) == 0) || row == 0){
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
    }
}


function play(cameraID){
    console.log('play camera '+cameraID);

    var player = document.getElementById('player'+cameraID);
    var icon = document.getElementById('player'+cameraID+'-playIcon');
    if(player.src == '../images/zelda3.jpg'){
        player.src = '../images/zelda1.png';
        icon.className = 'glyphicon glyphicon-play';
    }else{
        player.src = '../images/zelda3.jpg';
        icon.className = 'glyphicon glyphicon-stop';
    }
}


function record(cameraID){
    console.log('record camera '+cameraID);
}
