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
        nameDiv.setAttribute('style','text-align:center;');
        var nameH3 = document.createElement('h3');
        nameH3.id = 'camera'+tbCamera[i].cameraID+'-nameH3';
        var name = document.createTextNode(tbCamera[i].name);
        name.id = 'camera'+tbCamera[i].cameraID+'-name';

        nameH3.appendChild(name);
        nameDiv.appendChild(nameH3);

        //IMG==================================================================

        var imgDiv = document.createElement('div');
        imgDiv.id = 'camera'+tbCamera[i].cameraID+'-imgDiv';
        imgDiv.className = 'col-lg-6';
        imgDiv.setAttribute('style','margin-bottom:2%;');
        //imgDiv.setAttribute('style','background-color:#FF0000;');
        var img = document.createElement('img');
        img.id = 'camera'+tbCamera[i].cameraID+'-img';
        img.src = '../cameras/camera'+tbCamera[i].cameraID+'/live/stream_camera_'+tbCamera[i].cameraID+'.jpg';
        img.setAttribute('height','100%');
        img.setAttribute('width','100%');
        img.setAttribute('alt','Click to display live session');

        imgDiv.appendChild(img);

        //REPLAY================================================================

        var replayDiv = document.createElement('div');
        replayDiv.id = 'camera'+tbCamera[i].cameraID+'-replayDiv';
        replayDiv.className = 'col-lg-6';
        var replay = document.createElement('button');
        replay.id = 'camera'+tbCamera[i].cameraID+'-replay';
        replay.className = 'btn btn-success';
        replay.setAttribute('style','border-radius:100%');
        var replayIcon = document.createElement('span');
        replayIcon.id = 'camera'+tbCamera[i].cameraID+'-replayIcon';
        replayIcon.className = 'glyphicon glyphicon-play';

        replay.appendChild(replayIcon);
        replayDiv.appendChild(replay);

        //TIMER================================================================

        var timerDiv = document.createElement('div');
        timerDiv.id = 'camera'+tbCamera[i].cameraID+'-timerDiv';
        timerDiv.className = 'col-lg-6';
        var timer = document.createElement('button');
        timer.id = 'camera'+tbCamera[i].cameraID+'-timer';
        timer.className = 'btn btn-primary';
        timer.setAttribute('style','border-radius:100%');
        var timerIcon = document.createElement('span');
        timerIcon.id = 'camera'+tbCamera[i].cameraID+'-timerIcon';
        timerIcon.className = 'glyphicon glyphicon-edit';

        timer.appendChild(timerIcon);
        timerDiv.appendChild(timer);

        //DETECTION============================================================

        var detectionDiv = document.createElement('div');
        detectionDiv.id = 'camera'+tbCamera[i].cameraID+'-detectionDiv';
        detectionDiv.className = 'col-lg-6';
        var detection = document.createElement('button');
        detection.id = 'camera'+tbCamera[i].cameraID+'-detection';
        detection.className = 'btn btn-danger';
        detection.setAttribute('style','border-radius:100%');
        var detectionIcon = document.createElement('span');
        detectionIcon.id = 'camera'+tbCamera[i].cameraID+'-detectionIcon';
        detectionIcon.className = 'glyphicon glyphicon-facetime-video';

        detection.appendChild(detectionIcon);
        detectionDiv.appendChild(detection);

        //CONFIG=============================================================

        var configDiv = document.createElement('div');
        configDiv.id = 'camera'+tbCamera[i].cameraID+'-configDiv';
        configDiv.className = 'col-lg-6';
        var config = document.createElement('button');
        config.id = 'camera'+tbCamera[i].cameraID+'-config';
        config.className = 'btn btn-warning';
        config.setAttribute('style','border-radius:100%');
        var configIcon = document.createElement('span');
        configIcon.id = 'camera'+tbCamera[i].cameraID+'-configIcon';
        configIcon.className = 'glyphicon glyphicon-wrench';

        config.appendChild(configIcon);
        configDiv.appendChild(config);

        //DETECTION-TIMER=====================================================

        var detectionTimerDiv = document.createElement('div');
        detectionTimerDiv.id = 'camera'+tbCamera[i].cameraID+'-detectionTimerDiv';
        detectionTimerDiv.className = 'row';

        detectionTimerDiv.appendChild(detectionDiv);
        detectionTimerDiv.appendChild(timerDiv);

        //REPLAY-CONFIG=======================================================

        var replayConfigDiv = document.createElement('div');
        replayConfigDiv.id = 'camera'+tbCamera[i].cameraID+'-replayConfigDiv';
        replayConfigDiv.className = 'row';

        replayConfigDiv.appendChild(replayDiv);
        replayConfigDiv.appendChild(configDiv);

        //BTN=================================================================

        var btnDiv = document.createElement('div');
        btnDiv.id = 'camera'+tbCamera[i].cameraID+'-btnDiv';
        btnDiv.className = 'col-lg-6';

        btnDiv.appendChild(detectionTimerDiv);
        btnDiv.appendChild(replayConfigDiv);

        //IMG-BTN============================================================

        var imgBtnDiv = document.createElement('div');
        imgBtnDiv.id = 'camera'+tbCamera[i].cameraID+'-imgBtnDiv';
        imgBtnDiv.className = 'row';

        imgBtnDiv.appendChild(imgDiv);
        imgBtnDiv.appendChild(btnDiv);

        //CAMERA==============================================================

        var camera = document.createElement('div');
        camera.id = 'camera'+tbCamera[i].cameraID;
        camera.setAttribute('style','border:1px solid #ddd;border-radius:4px; background-color:#E2E5E4');


        camera.appendChild(nameDiv);
        camera.appendChild(imgBtnDiv);

        var row;

        if((nbRow == 0) || ((i%2) == 0)){
            nbRow = nbRow + 1;
            row = document.createElement('div');
            row.id = 'row'+nbRow;
            row.className = 'row';
            camera.className = 'col-lg-offset-1 col-lg-4 camera-display';
            row.appendChild(camera);
            display.appendChild(row);
        }else{
            row = document.getElementById('row'+nbRow);
            camera.className = 'col-lg-offset-2 col-lg-4 camera-display';
            row.appendChild(camera);
        }


    }

}