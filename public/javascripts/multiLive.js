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

        //IMG

        var img = document.createElement('img');
        img.id = 'player'+tbCamera[i].cameraID;
        img.src = '../images/zelda1.png';

        var imgDiv = document.createElement('div');
        imgDiv.id = 'player'+tbCamera[i].cameraID+'-imgDiv';
        imgDiv.className = 'col-lg-10';
        imgDiv.setAttribute('style','background-color:#FF0000;');

        imgDiv.appendChild(img);

        //PLAY

        var play = document.createElement('button');
        play.id = 'player'+tbCamera[i].cameraID+'-play';
        play.setAttribute('onclick','play('+tbCamera[i].cameraID+');');
        play.setAttribute('style','background-color:#B9E9C4;');
        play.className = 'btn-multiLive';

        var playIcon = document.createElement('span');
        playIcon.id = 'player'+tbCamera[i].cameraID+'-playIcon';
        //playIcon.className = 'glyphicon glyphicon-play';
        playIcon.className = 'glyphicon glyphicon-stop';

        var playDiv = document.createElement('div');
        playDiv.id = 'player'+tbCamera[i].cameraID+'-playDiv';
        playDiv.className = 'row';
        playDiv.setAttribute('style','background-color:#00FF00;');

        play.appendChild(playIcon);
        playDiv.appendChild(play);

        //RECORD

        var record = document.createElement('button');
        record.id = 'player'+tbCamera[i].cameraID+'-record';
        record.setAttribute('style','background-color:#FAECEC;');
        record.setAttribute('onclick','record('+tbCamera[i].cameraID+');');
        record.className = 'btn-multiLive';

        var recordIcon = document.createElement('span');
        recordIcon.id = 'player'+tbCamera[i].cameraID+'-recordIcon';
        recordIcon.className = 'glyphicon glyphicon-record';
        //recordIcon.className = 'glyphicon glyphicon-stop';

        var recordDiv = document.createElement('div');
        recordDiv.id = 'player'+tbCamera[i].cameraID+'-recordDiv';
        recordDiv.className = 'row';
        recordDiv.setAttribute('style','background-color:#0000FF;');

        record.appendChild(recordIcon);
        recordDiv.appendChild(record);

        //BTN DIV

        var btnDiv = document.createElement('div');
        btnDiv.id = 'player'+tbCamera[i].cameraID+'-btn';
        btnDiv.className = 'col-lg-2';
        btnDiv.setAttribute('style','background-color:#000088;');

        btnDiv.appendChild(playDiv);
        btnDiv.appendChild(recordDiv);

        //NAME

        var name = document.createTextNode(tbCamera[i].name);
        name.id = 'player'+tbCamera[i].cameraID+'-name';

        var nameDiv = document.createElement('div');
        nameDiv.id = 'player'+tbCamera[i].cameraID+'-nameDiv';
        nameDiv.className = 'row';
        nameDiv.setAttribute('style','text-align:center;');
        nameDiv.setAttribute('style','background-color:#880000;');

        nameDiv.appendChild(name);

        //ACTION

        var actionDiv = document.createElement('div');
        actionDiv.id = 'player'+tbCamera[i].cameraID+'-actionDiv';
        actionDiv.className = 'row';
        actionDiv.setAttribute('style','background-color:#008800;');

        actionDiv.appendChild(imgDiv);
        actionDiv.appendChild(btnDiv);

        //COL

        var colDiv = document.createElement('div');
        colDiv.id = 'colDiv'+tbCamera[i].cameraID;
        colDiv.className = 'col-lg-4';
        colDiv.setAttribute('style','border:solid;');

        colDiv.appendChild(nameDiv);
        colDiv.appendChild(actionDiv);

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
    var play = document.getElementById('player'+cameraID+'-playIcon');
    var record = document.getElementById('player'+cameraID+'-record');
    if(play.className == 'glyphicon glyphicon-play'){
        player.src = '../images/zelda1.png?v='+ new Date().getTime();
        play.className = 'glyphicon glyphicon-stop';
        record.disabled = false;
    }else{
        player.src = '../images/zelda3.jpg?v='+ new Date().getTime();
        play.className = 'glyphicon glyphicon-play';
        record.disabled = true;
    }
}


function record(cameraID){
    console.log('record camera '+cameraID);

    var icon = document.getElementById('player'+cameraID+'-recordIcon');
    if(icon.className == 'glyphicon glyphicon-record'){
        icon.className = 'glyphicon glyphicon-stop';
    }else{
        icon.className = 'glyphicon glyphicon-record';
    }
}
