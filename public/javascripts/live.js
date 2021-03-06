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
        nameH3.title = 'Click to update your camera name';
        nameH3.setAttribute('onclick','setName('+tbCamera[i].cameraID+');');
        var name = document.createTextNode(tbCamera[i].name);
        name.id = 'camera'+tbCamera[i].cameraID+'-name';

        nameH3.appendChild(name);
        nameDiv.appendChild(nameH3);

        //IMG==================================================================

        var liveDiv = document.createElement('div');
        liveDiv.id = 'camera'+tbCamera[i].cameraID+'-liveDiv';
        liveDiv.className = 'col-lg-6';
        liveDiv.setAttribute('style','margin-bottom:2%;');
        var liveBtn = document.createElement('button');
        liveBtn.id = 'camera'+tbCamera[i].cameraID+'-liveBtn';
        liveBtn.setAttribute('style','border:0px; background-color:#fff;');
        liveBtn.setAttribute('onclick','runLive('+tbCamera[i].cameraID+');');
        liveBtn.setAttribute('data-toggle','modal');
        liveBtn.setAttribute('data-target','#modal-live');
        var live = document.createElement('img');
        live.id = 'camera'+tbCamera[i].cameraID+'-live';
        live.src = '../cameras/camera'+tbCamera[i].cameraID+'/live/stream_camera_'+tbCamera[i].cameraID+'.jpg';
        live.title = 'Click to start live';
        live.setAttribute('style','border:5px solid #ddd;border-radius:8px;height:100%;width:100%');
        live.setAttribute('alt','Click to display live session');

        liveBtn.appendChild(live);
        liveDiv.appendChild(liveBtn);

        //REPLAY================================================================

        var replayDiv = document.createElement('div');
        replayDiv.id = 'camera'+tbCamera[i].cameraID+'-replayDiv';
        replayDiv.className = 'col-lg-6';
        var replay = document.createElement('button');
        replay.id = 'camera'+tbCamera[i].cameraID+'-replay';
        replay.className = 'btn btn-lg btn-success btn-display';
        replay.title = 'Click to open the replay interface';
        replay.setAttribute('style','border-radius:100%;margin-left:20%');
        replay.setAttribute('onclick','runReplay('+tbCamera[i].cameraID+');');
        replay.setAttribute('data-toggla','modal');
        replay.setAttribute('data-target','#modal-replay');
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
        timer.className = 'btn btn-lg btn-primary btn-display';
        timer.title = 'Click to open the timer interface';
        timer.setAttribute('style','border-radius:100%');
        timer.setAttribute('onclick','runTimer('+tbCamera[i].cameraID+');');
        timer.setAttribute('data-toggle','modal');
        timer.setAttribute('data-target','#modal-timer');
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
        detection.className = 'btn btn-lg btn-danger btn-display';
        detection.title = 'Click to start the motion detector';
        detection.setAttribute('style','border-radius:100%;margin-left:20%');
        detection.setAttribute('onclick','runDetection('+tbCamera[i].cameraID+');');
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
        config.className = 'btn btn-lg btn-warning btn-display';
        config.title = 'Click to update camera settings';
        config.setAttribute('style','border-radius:100%');
        config.setAttribute('onclick','runConfig('+tbCamera[i].cameraID+');');
        config.setAttribute('data-toggle','modal');
        config.setAttribute('data-target','#modal-config');
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
        btnDiv.setAttribute('style','');

        btnDiv.appendChild(detectionTimerDiv);
        btnDiv.appendChild(replayConfigDiv);

        //IMG-BTN============================================================

        var imgBtnDiv = document.createElement('div');
        imgBtnDiv.id = 'camera'+tbCamera[i].cameraID+'-imgBtnDiv';
        imgBtnDiv.className = 'row';

        imgBtnDiv.appendChild(liveDiv);
        imgBtnDiv.appendChild(btnDiv);

        //CAMERA==============================================================

        var hr = document.createElement('hr');
        var camera = document.createElement('div');
        camera.id = 'camera'+tbCamera[i].cameraID;
        camera.setAttribute('style','border:1px solid #ddd;border-radius:4px; background-color:#fff');


        camera.appendChild(nameDiv);
        camera.appendChild(hr);
        camera.appendChild(imgBtnDiv);

        if(tbCamera[i].enable == 0) {
            camera.setAttribute('style', 'background-color:#FAECEC;');
            timer.disabled = true;
            config.disabled = true;
            detection.disabled = true;
            liveBtn.disabled = true;
        }

        var row;
        if((nbRow == 0) || ((i%2) == 0)){
            nbRow = nbRow + 1;
            row = document.createElement('div');
            row.id = 'row'+nbRow;
            row.className = 'row';
            row.setAttribute('style','margin-bottom:3%;');
            camera.className = 'col-lg-offset-1 col-lg-4 camera-display';
            row.appendChild(camera);
            display.appendChild(row);
        }else{
            row = document.getElementById('row'+nbRow);
            row.setAttribute('style','margin-bottom:3%;');
            camera.className = 'col-lg-offset-2 col-lg-4 camera-display';
            row.appendChild(camera);
        }


    }

}