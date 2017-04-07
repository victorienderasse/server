/**
 * Created by Victorien on 05-04-17.
 */

var userID = document.getElementById('userID').innerHTML;

//Ask camera to server
socket.emit('getCamera',userID);

socket.on('sendCamera',function(tbCamera){
    displayCamera(tbCamera);
});


function displayCamera(tbCamera){


    var nbRow = 0;
    var size = tbCamera.length;
    var display = document.getElementById('display');

    for(var i=0;i<tbCamera.length;i++){

        //NAME================================================================

        var nameDiv = document.createElement('div');
        nameDiv.id = 'camera'+tbCamera[i].cameraID+'-nameDiv';
        nameDiv.className = 'row';
        var nameH3 = document.createElement('h3');
        nameH3.id = 'camera'+tbCamera[i].cameraID+'-nameH3';
        var name = document.createTextNode(tbCamera[i].name);
        name.id = 'camera'+tbCamera[i].cameraID+'-name';

        nameH3.appendChild(name);
        nameDiv.appendChild(nameH3);

        nameDiv.setAttribute('style','background-color:#FF0000');

        //IMG==================================================================

        var imgDiv = document.createElement('img');
        imgDiv.id = 'camera'+tbCamera[i].cameraID+'-imgDiv';
        imgDiv.className = 'col-lg-6';
        var img = document.createElement('img');
        img.id = 'camera'+tbCamera[i].cameraID+'-img';

        imgDiv.appendChild(img);

        imgDiv.setAttribute('style','background-color:#00FF00');

        //REPLAY================================================================

        var replayDiv = document.createElement('div');
        replayDiv.id = 'camera'+tbCamera[i].cameraID+'-replayDiv';
        replayDiv.className = 'col-lg-6';
        var replay = document.createElement('button');
        replay.id = 'camera'+tbCamera[i].cameraID+'-replay';
        var replayIcon = document.createElement('span');
        replayIcon.id = 'camera'+tbCamera[i].cameraID+'-replayIcon';

        replay.appendChild(replayIcon);
        replayDiv.appendChild(replay);

        replayDiv.setAttribute('style','background-color:#0000FF');

        //TIMER================================================================

        var timerDiv = document.createElement('div');
        timerDiv.id = 'camera'+tbCamera[i].cameraID+'-timerDiv';
        timerDiv.className = 'col-lg-6';
        var timer = document.createElement('button');
        timer.id = 'camera'+tbCamera[i].cameraID+'-timer';
        var timerIcon = document.createElement('span');
        timerIcon.id = 'camera'+tbCamera[i].cameraID+'-timerIcon';

        timer.appendChild(timerIcon);
        timerDiv.appendChild(timer);

        timerDiv.setAttribute('style','background-color:#FFFF00');

        //DETECTION============================================================

        var detectionDiv = document.createElement('div');
        detectionDiv.id = 'camera'+tbCamera[i].cameraID+'-detectionDiv';
        detectionDiv.className = 'col-lg-6';
        var detection = document.createElement('button');
        detection.id = 'camera'+tbCamera[i].cameraID+'-detection';
        var detectionIcon = document.createElement('span');
        detectionIcon.id = 'camera'+tbCamera[i].cameraID+'-detectionIcon';

        detection.appendChild(detectionIcon);
        detectionDiv.appendChild(detection);

        detectionDiv.setAttribute('style','background-color:#FF00FF');

        //CONFIG===============================================================

        var configDiv = document.createElement('div');
        configDiv.id = 'camera'+tbCamera[i].cameraID+'-configDiv';
        configDiv.className = 'col-lg-6';
        var config = document.createElement('button');
        config.id = 'camera'+tbCamera[i].cameraID+'-config';
        var configIcon = document.createElement('span');
        configIcon.id = 'camera'+tbCamera[i].cameraID+'-configIcon';

        config.appendChild(configIcon);
        configDiv.appendChild(config);

        configDiv.setAttribute('style','background-color:#00FFFF');

        //DETECTION-TIMER=====================================================

        var detectionTimerDiv = document.createElement('div');
        detectionTimerDiv.id = 'camera'+tbCamera[i].cameraID+'-detectionTimerDiv';
        detectionTimerDiv.className = 'row';

        detectionTimerDiv.appendChild(detectionDiv);
        detectionTimerDiv.appendChild(timerDiv);

        detectionDiv.setAttribute('style','background-color:#880000');

        //REPLAY-CONFIG=======================================================

        var replayConfigDiv = document.createElement('div');
        replayConfigDiv.id = 'camera'+tbCamera[i].cameraID+'-replayConfigDiv';
        replayConfigDiv.className = 'row';

        replayConfigDiv.appendChild(replayDiv);
        replayConfigDiv.appendChild(configDiv);

        replayDiv.setAttribute('style','background-color:#008800');

        //BTN=================================================================

        var btnDiv = document.createElement('div');
        btnDiv.id = 'camera'+tbCamera[i].cameraID+'-btnDiv';
        btnDiv.className = 'col-lg-6';

        btnDiv.appendChild(detectionTimerDiv);
        btnDiv.appendChild(replayConfigDiv);

        btnDiv.setAttribute('style','background-color:#000088');

        //IMG-BTN============================================================

        var imgBtnDiv = document.createElement('div');
        imgBtnDiv.id = 'camera'+tbCamera[i].cameraID+'-imgBtnDiv';
        imgBtnDiv.className = 'row';

        imgBtnDiv.appendChild(imgDiv);
        imgBtnDiv.appendChild(btnDiv);

        imgBtnDiv.setAttribute('style','background-color:#888800');

        //CAMERA==============================================================

        var camera = document.createElement('div');
        camera.id = 'camera'+tbCamera[i].cameraID;
        camera.className = 'col-lg-offset-1 col-lg-3';
        camera.appendChild(nameDiv);
        camera.appendChild(imgBtnDiv);

        var row;

        if((nbRow == 0) || ((size %2) == 0)){
            nbRow = nbRow + 1;
            row = document.createElement('div');
            row.id = 'row'+nbRow;
            row.className = 'row';
            row.appendChild(camera);
            display.appendChild(row);
        }else{
            row = document.getElementById('row'+nbRow);
            row.appendChild(camera);
        }


    }

}