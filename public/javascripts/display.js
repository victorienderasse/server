/**
 * Created by Victorien on 17-06-16.
 */


//var userID = document.getElementById('userID').innerHTML;

//Ask camera to server
socket.emit('getCamera',userID);

socket.emit('getUserName',userID);

socket.on('getUserNameRes', function(name){
    $('#user-btn').html('<span class="glyphicon glyphicon-user"></span> '+name);
});

$(function(){

    $('#frequency').change(function(){
        if($(this).val() == '*'){
            $('#frequencyEnd').toggle('slow');
        }
    });

    $('#addCamera-btn').click(function(){
        redirectURL(serverURL+'/addCamera');
    });

    $('#multiLive-btn').click(function(){
        redirectURL(serverURL+'/multiLive');
    });

    $('#user-btn').click(function(){
        redirectURL(serverURL+'/user');
    });

    $('#disconnect-btn').click(function(){
        redirectURL(serverURL+'/logout');
    });

});


//Actions--------------------------------------

//set frequencyEnd select on Change
/*
document.getElementById('frequency').addEventListener('change',function(){
    var frequency = document.getElementById('timer-form').frequency.value;
    if(frequency == '*'){
        document.getElementById('frequencyEnd').style.display = 'none';
    }else{
        document.getElementById('frequencyEnd').style.display = 'block';
    }
});
*/

/*
//Add camera
document.getElementById('addCamera-btn').addEventListener('click',function(){
    console.log('addCamera-btn');
    redirectURL(serverURL+'/addCamera');
});

//MultiLive
document.getElementById('multiLive-btn').addEventListener('click',function(){
    console.log('multiLive-btn');
    redirectURL(serverURL+'/multiLive');
});

//User
document.getElementById('user-btn').addEventListener('click',function(){
    console.log('user-btn');
    redirectURL(serverURL+'/user');
});

//Disconnect
document.getElementById('disconnect-btn').addEventListener('click', function(){
    window.location = serverURL+'/logout';
});
*/


//EVENTS-----------------------------------------------------------------------------------------------------------------

socket.on('cameraUP', function(cameraID){
    var camera = document.getElementById('camera'+cameraID);
    if(camera != 'undefined' && camera != null){
        camera.setAttribute('style','border:1px solid #ddd;border-radius:4px; background-color:#fff');
    }
});


socket.on('sendCamera', function(tbCamera){
    console.log('sendCamera event');
    //displayScreens(tbCamera);
    displayCamera(tbCamera);
});


socket.on('sendRecords', function(tbRecord){
    console.log('sendRecords event');
    displayRecords(tbRecord);
});


socket.on('message',function(data){
    console.log('display message event');
    displayMessage(data);
});


socket.on('redirect', function(url){
    console.log('redirect event');
    redirectURL(url);
});


socket.on('updateRecordColor', function(data){
    console.log('setOldRecord event');
    
    var record = document.getElementById('record-'+data.recordID);
    
    if(record != 'undefined' && record != null){
        switch(data.state){
            case 0:
                record.setAttribute('style','background-color:#FFFFFF');
                break;
            case 1:
                record.setAttribute('style','background-color:#B9E9C4');
                break;
            case 2:
                record.setAttribute('style','background-color:#E1E099');
                break;
        }
    }
    
});


socket.on('setReplays',function(data){
    /*
    -> create elements
    -> set first video ready on player
     */
    console.log('setReplay');
    var table = document.getElementById('table-replay');

    for(var i=0;i<data.tbReplay.length;i++){
        var tr = document.createElement('tr');
        var name = document.createElement('td');
        var edit = document.createElement('td');
        var remove = document.createElement('td');
        var editIcon = document.createElement('span');
        var removeIcon = document.createElement('span');
        var bold = document.createElement('b');
        var nameText = document.createTextNode(data.tbReplay[i]);

        tr.className = 'form-group';
        tr.setAttribute('style','background-color:#F1E9E9;')
        tr.id = 'table-replay-tr'+i;
        name.id = 'table-replay-'+i;
        name.title = 'Click to play';
        name.setAttribute('onclick','playReplay({cameraID:'+data.cameraID+', replayID: '+i+'});');
        editIcon.className = 'glyphicon glyphicon-edit';
        editIcon.title = 'Click to rename the replay';
        editIcon.setAttribute('onclick','editReplay({cameraID: '+data.cameraID+', replayID: '+i+'});');
        removeIcon.className = 'glyphicon glyphicon-remove-circle';
        removeIcon.title = 'Click to delete the replay';
        removeIcon.setAttribute('onclick','removeReplay({cameraID: '+data.cameraID+', replayID: '+i+'});');

        edit.appendChild(editIcon);
        remove.appendChild(removeIcon);
        bold.appendChild(nameText);
        name.appendChild(bold);
        tr.appendChild(name);
        tr.appendChild(edit);
        tr.appendChild(remove);
        table.appendChild(tr);
    }

    var video = document.createElement('video');
    video.setAttribute('controls',true);
    video.setAttribute('width','500px');
    var source = document.createElement('source');
    source.setAttribute('src','../cameras/camera'+data.cameraID+'/videos/'+data.tbReplay[0]);
    source.setAttribute('type','video/mp4');
    video.appendChild(source);
    document.getElementById('player-replay-div').appendChild(video);
});


socket.on('updateStream', function(cameraID){
    var img = document.getElementById('live-stream-camera'+cameraID);
    if (img != 'undefined'){
        img.src = '../cameras/camera'+cameraID+'/live/stream_camera_'+cameraID+'.jpg?v='+ new Date().getTime();
    }
});


socket.on('getLiveRecordingDone', function(cameraID){
    /*
    -> Check if user concerné
    -> Enable btn
     */
    var img = document.getElementById('live-stream-camera'+cameraID);
    if(img != 'undefined'){
        document.getElementById('modal-live-record').disabled = false;
        document.getElementById('modal-live-close').disabled = false;
        document.getElementById('modal-live-x').disabled = false;
        document.getElementById('modal-live-record').innerHTML = 'Record';
    }
});


socket.on('updateLiveRecordingBtn', function(cameraID){
    /*
    When user close live interface while liveRecording
     */
    console.log('updateLiveRecordingBtn')
    document.getElementById('modal-live-record').innerHTML = 'Record';
    document.getElementById('modal-live-record').setAttribute('onclick','stopLiveRecording('+cameraID+');');
});


socket.on('editReplayOK', function(data){
    console.log('editReplayOK event');
    var replay = document.getElementById('table-replay-'+data.replayID).firstChild;
    replay.innerHTML = data.name;
});


socket.on('displayCameraState',function(data){
    /*
     -> get camera data.cameraID
     -> getstate data.state
     -> switch
     */
    var camera = document.getElementById('camera'+data.cameraID);
    if(camera != 'undefined' && camera != null){
        var timer = document.getElementById('camera'+data.cameraID+'-timer');
        var live = document.getElementById('camera'+data.cameraID+'-liveBtn');
        var detection = document.getElementById('camera'+data.cameraID+'-detection');

        switch(data.state){
            case 1:
                live.disabled = true;
                timer.disabled = true;
                detection.disabled = false;
                detection.firstElementChild.className = 'glyphicon glyphicon-stop';
                break;
            case 2:
                timer.disabled = true;
                detection.disabled = true;
                live.disabled = true;
                break;
            case 3:
                detection.disabled = true;
                live.disabled = true;
                timer.disabled = false;
                break;
            case 4:
                timer.disabled = true;
                detection.disabled = true;
                live.disabled = true;
                break;
            default:
                timer.disabled = false;
                detection.disabled = false;
                detection.firstElementChild.className = 'glyphicon glyphicon-facetime-video';
                live.disabled = false;
        }
    }
});


socket.on('setConfig', function(data){
    console.log('setConfig');

    var title = document.getElementById('config-title');
    if(title.innerHTML == 'Settings - '+data.cameraName){

        var resolution;
        switch(parseInt(data.width)){
            case 640:
                resolution = 'Low';
                document.getElementById('resolution').setAttribute('value','1');
                break;
            case 1200:
                resolution = 'Medium';
                document.getElementById('resolution').setAttribute('value','2');
                break;
            case 1600:
                resolution = 'High';
                document.getElementById('resolution').setAttribute('value','3');
        }

        document.getElementById('brightness').setAttribute('value',data.brightness);
        document.getElementById('contrast').setAttribute('value',data.contrast);
        document.getElementById('fps').setAttribute('value',data.fps);

        document.getElementById('resolutionValue').innerHTML = resolution;
        document.getElementById('fpsValue').innerHTML = data.fps;
        document.getElementById('brightnessValue').innerHTML = data.brightness;
        document.getElementById('contrastValue').innerHTML = data.contrast;

    }

});


socket.on('updatePreview', function(cameraID){
    var img = document.getElementById('previewImg'+cameraID);
    if(img != null && img != 'undefined'){
        img.src = '../cameras/camera'+cameraID+'/live/preview.jpg?v='+ new Date().getTime();
    }
});






//Functions-----------------------------------


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
        nameH3.setAttribute('onclick','setName('+tbCamera[i].cameraID+');');
        var name = document.createTextNode(tbCamera[i].name);
        name.id = 'camera'+tbCamera[i].cameraID+'-name';
        name.title = 'Click to update your camera name';

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
        replay.setAttribute('data-toggle','modal');
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
            camera.setAttribute('style', 'background-color:#FAECEC; border:1px solid #ddd;border-radius:4px;');
            timer.disabled = true;
            detection.disabled = true;
            liveBtn.disabled = true;
        }else{
            switch(tbCamera[i].state){
                case 1:
                    liveBtn.disabled = true;
                    timer.disabled = true;
                    break;
                case 2:
                    timer.disabled = true;
                    detection.disabled = true;
                    break;
                case 3:
                    detection.disabled = true;
                    liveBtn.disabled = true;
                    break;
                case 4:
                    timer.disabled = true;
                    detection.disabled = true;
            }
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


function displayScreens(tbScreen){
    console.log('displayScreens function');

    var tbCamera = document.getElementById('tbody-camera');

    //for each screen
    for(var i=0;i<tbScreen.length;i++) {

        //Create Elements
        var screen = document.createElement('tr');
        var screen_live = document.createElement('td');
        var screen_live_btn = document.createElement('button');
        var screen_name = document.createElement('td');
        var screen_notif = document.createElement('td');
        var screen_notif_check = document.createElement('input');
        var screen_timer = document.createElement('td');
        var screen_timer_btn = document.createElement('button');
        var screen_timer_btn_icon = document.createElement('span');
        var screen_replay = document.createElement('td');
        var screen_replay_btn = document.createElement('button');
        var screen_replay_btn_icon = document.createElement('span');
        var screen_img = document.createElement('img');

        //Create text
        var name = document.createTextNode(tbScreen[i].name);
        var bold = document.createElement('b');
        bold.appendChild(name);

        //Add text
        screen_name.appendChild(bold);

        //Add attributes
        screen.id = 'screen-' + tbScreen[i].cameraID;
        screen_live.id = 'screen-' + tbScreen[i].cameraID + '-live';
        screen_live.title = 'Watch your camera online';
        screen_live_btn.id = 'screen-' + tbScreen[i].cameraID + '-live-link';
        screen_live_btn.setAttribute('onclick','runLive(' + tbScreen[i].cameraID + ');');
        screen_live_btn.setAttribute('data-toggle','modal');
        screen_live_btn.setAttribute('data-target','#modal-live');
        screen_name.id = 'screen-' + tbScreen[i].cameraID + '-name';
        screen_name.title = 'Click to change the name';
        screen_name.setAttribute('onclick','setName(' + tbScreen[i].cameraID + ');');
        screen_notif.id = 'screen-' + tbScreen[i].cameraID + '-notif';
        screen_notif.title = 'Activate start motion detection';
        screen_notif_check.id = 'screen-' + tbScreen[i].cameraID + '-notif-check';
        screen_notif_check.type = 'checkbox';
        screen_notif_check.setAttribute('onchange','runDetection(' + tbScreen[i].cameraID + ');');
        screen_timer.id = 'screen-' + tbScreen[i].cameraID + '-timer';
        screen_timer.title = 'manage your timers';
        screen_timer_btn.id = 'screen-' + tbScreen[i].cameraID + '-timer-btn';
        screen_timer_btn.title ='Manage the timers of the camera';
        screen_timer_btn.setAttribute('data-toggle','modal');
        screen_timer_btn.setAttribute('data-target','#modal-timer');
        screen_timer_btn.setAttribute('onclick','runTimer('+tbScreen[i].cameraID+');');
        screen_replay.id = 'screen-' + tbScreen[i].cameraID + '-replay';
        screen_replay.title = 'Watch the replay of this camera';
        screen_replay_btn.id = 'screen-' + tbScreen[i].cameraID + '-replay-btn';
        screen_timer_btn.title ='Replay of the camera';
        screen_replay_btn.setAttribute('onclick','runReplay(' + tbScreen[i].cameraID + ');');
        screen_replay_btn.setAttribute('data-toggle','modal');
        screen_replay_btn.setAttribute('data-target','#modal-replay2');
        //Screen_img
        screen_img.id = 'screen-'+tbScreen[i].cameraID+'-image';
        screen_img.setAttribute('src','../cameras/camera'+tbScreen[i].cameraID+'/live/stream_camera_'+tbScreen[i].cameraID+'.jpg');
        screen_img.setAttribute('height','150px');
        screen_img.setAttribute('width','200px');
        screen_img.setAttribute('alt','Click to display live session');

        //Add Class
        screen_timer_btn.className = 'btn btn-primary form-control';
        screen_replay_btn.className = 'btn btn-success form-control';
        screen_timer_btn_icon.className = 'glyphicon glyphicon-edit';
        screen_replay_btn_icon.className = 'glyphicon glyphicon-play';
        screen.className = 'form-group';
        screen_live.className = 'col-lg-2';
        screen_name.className = 'row col-lg-1';
        screen_notif.className = 'row col-lg-1';
        screen_replay.className = 'row col-lg-1';
        screen_timer.className = 'row col-lg-1';

        //get state -> diabled btn
        var state = tbScreen[i].state;
        var enable = tbScreen[i].enable;

        if(enable == 1){
            
            switch(state){
                case 1:
                    screen_live_btn.disabled = true;
                    screen_timer_btn.disabled = true;
                    screen_notif_check.checked = true;
                    break;
                case 2:
                    screen_notif_check.disabled = true;
                    screen_timer_btn.disabled = true;
                    break;
                case 3:
                    screen_live_btn.disabled = true;
                    screen_notif_check.disabled = true;
                    break;
                default :

            }
        }else{
            screen.setAttribute('style','background-color:#FAECEC;');
            screen_live_btn.disabled = true;
            screen_timer_btn.disabled = true;
            screen_notif_check.disabled = true;
        }


        //Insert Element
        screen_timer_btn.appendChild(screen_timer_btn_icon);
        screen_replay_btn.appendChild(screen_replay_btn_icon);
        screen_live_btn.appendChild(screen_img);
        screen_live.appendChild(screen_live_btn);
        screen_notif.appendChild(screen_notif_check);
        screen_timer.appendChild(screen_timer_btn);
        screen_replay.appendChild(screen_replay_btn);
        screen.appendChild(screen_live);
        screen.appendChild(screen_name);
        screen.appendChild(screen_notif);
        screen.appendChild(screen_replay);
        screen.appendChild(screen_timer);
        tbCamera.appendChild(screen);
    }
}


function runTimer(cameraID){
    /*
    -> update timer-confirm-btn
    -> update timer modal title
    -> remove old record
    -> empty timer form
     */
    console.log('runTimer function');
    
    var title = document.getElementById('timer-title');
    var name = document.getElementById('camera'+cameraID+'-nameH3').innerHTML;
    title.innerHTML = 'Timer - '+name;

    var timerBtn = document.getElementById('timer-confirm-btn');
    timerBtn.setAttribute('onclick','applyTimer('+cameraID+');');

    var tbRecord = document.getElementById('timer-records-tbody');
    while(tbRecord.firstChild){
        tbRecord.removeChild(tbRecord.firstChild);
    }

    emptyTimerForm();

    socket.emit('getRecords', cameraID);
}


function applyTimer(cameraID){
    console.log('applyTimer function');
    var timer_form = document.getElementById("timer-form");
    var beginHour = timer_form.beginHour.value;
    var beginMinute = timer_form.beginMinute.value;
    var endHour = timer_form.endHour.value;
    var endMinute = timer_form.endMinute.value;
    var type, once;

    if(document.getElementById('timerDetection').checked){
        type = 'detection';
    }else{
        type = 'record';
    }

    once = document.getElementById('timerOnce').checked;

    var frequencyEnd;
    if(timer_form.frequency.value == '*'){
        frequencyEnd = '*';
    }else{
        frequencyEnd = timer_form.frequencyEnd.value;
    }


    socket.emit('setTimer', {
        begin_hour: beginHour,
        begin_minute: beginMinute,
        end_hour: endHour,
        end_minute: endMinute,
        frequency: timer_form.frequency.value,
        frequencyEnd: frequencyEnd,
        cameraID: cameraID,
        type: type,
        once: once
    });
}


function displayRecords(tbRecord){
    console.log('displayRecord function');
    var tb = document.getElementById('timer-records-tbody');
    while(tb.firstChild){
        tb.removeChild(tb.firstChild);
    }


    for(var i=0;i<tbRecord.length;i++){
        //Create elements
        var record = document.createElement('tr');
        var beginTD = document.createElement('td');
        var endTD = document.createElement('td');
        var frequencyTD = document.createElement('td');
        var frequencyEndTD = document.createElement('td');
        var typeTD = document.createElement('td');
        var apply = document.createElement('td');
        var remove = document.createElement('td');

        var frequency, frequencyEnd;
        switch(tbRecord[i].frequency){
            case '1':
                frequency = document.createTextNode('Monday');
                break;
            case '2':
                frequency = document.createTextNode('Tuesday');
                break;
            case '3':
                frequency = document.createTextNode('Wednesday');
                break;
            case '4':
                frequency = document.createTextNode('Thursday');
                break;
            case '5':
                frequency = document.createTextNode('Friday');
                break;
            case '6':
                frequency = document.createTextNode('Saturday');
                break;
            case '7':
                frequency = document.createTextNode('Sunday');
                break;
            default:
                frequency = document.createTextNode('Every Day');
                break;
        }
        switch(tbRecord[i].frequencyEnd){
            case '1':
                frequencyEnd = document.createTextNode('Monday');
                break;
            case '2':
                frequencyEnd = document.createTextNode('Tuesday');
                break;
            case '3':
                frequencyEnd = document.createTextNode('Wednesday');
                break;
            case '4':
                frequencyEnd = document.createTextNode('Thursday');
                break;
            case '5':
                frequencyEnd = document.createTextNode('Friday');
                break;
            case '6':
                frequencyEnd = document.createTextNode('Saturday');
                break;
            case '7':
                frequencyEnd = document.createTextNode('Sunday');
                break;
            default:
                frequencyEnd = document.createTextNode('Every Day');
                break;
        }

        var beginMinute = (tbRecord[i].begin % 60);
        var beginHour = ((tbRecord[i].begin - beginMinute) / 60);
        if(beginMinute < 10){
            beginMinute = '0'+beginMinute;
        }
        if(beginHour < 10){
            beginHour = '0'+beginHour;
        }
        var begin = document.createTextNode(beginHour+':'+beginMinute);
        var endMinute = (tbRecord[i].end % 60);
        var endHour = ((tbRecord[i].end - endMinute) / 60);
        if(endMinute < 10){
            endMinute = '0'+endMinute;
        }
        if(endHour < 10){
            endHour = '0'+endHour;
        }
        var end = document.createTextNode(endHour+':'+endMinute);
        var type = document.createTextNode(tbRecord[i].type);
        var applyBtn = document.createElement('button');
        var applyBtnIcon = document.createElement('span');
        var removeBtn = document.createElement('button');
        var removeBtnIcon = document.createElement('span');

        //Add Attributes
        record.id = 'record-'+tbRecord[i].recordID;
        applyBtn.id = 'record-'+tbRecord[i].recordID+'-apply';
        applyBtn.title = 'Click to apply this record';
        applyBtn.setAttribute('onclick','applyRecord('+ tbRecord[i].recordID +');');
        removeBtn.id = 'record-'+tbRecord[i].recordID+'-remove';
        removeBtn.title = 'Click to delete this record';
        removeBtn.setAttribute('onclick', 'deleteRecord('+ tbRecord[i].recordID +');');
        applyBtn.className = 'btn btn-primary';
        removeBtn.className = 'close';
        applyBtnIcon.id = 'record-'+tbRecord[i].recordID+'-apply-icon';
        applyBtnIcon.className = 'glyphicon glyphicon-ok';
        removeBtnIcon.className = 'glyphicon glyphicon-remove';

        if(tbRecord[i].state == 1){
            record.setAttribute('style','background-color:#B9E9C4;');
            //applyBtn.disabled = true;
        }



        //add Elements to table
        applyBtn.appendChild(applyBtnIcon);
        removeBtn.appendChild(removeBtnIcon);
        beginTD.appendChild(begin);
        endTD.appendChild(end);
        frequencyTD.appendChild(frequency);
        frequencyEndTD.appendChild(frequencyEnd);
        typeTD.appendChild(type);
        apply.appendChild(applyBtn);
        remove.appendChild(removeBtn);
        record.appendChild(frequencyTD);
        record.appendChild(beginTD);
        record.appendChild(frequencyEndTD);
        record.appendChild(endTD);
        record.appendChild(typeTD);
        record.appendChild(apply);
        record.appendChild(remove);
        tb.appendChild(record);
    }
}


function runReplay(cameraID){
    /*
    -> Add camera name to modal
    -> empty old replays
    -> Remove old player
    -> send request to server
     */
    console.log('testReplay pressed');

    var title = document.getElementById('replay-title');
    var name = document.getElementById('camera'+cameraID+'-nameH3').innerHTML;
    title.innerHTML = 'Replay - '+name;


    var table = document.getElementById('table-replay');
    while(table.firstChild){
        table.removeChild(table.firstChild);
    }

    var playerReplay = document.getElementById('player-replay-div');
    if(playerReplay.firstChild){
        playerReplay.removeChild(playerReplay.firstChild);
    }

    socket.emit('getReplays',cameraID);
}


function addReplay(replay_id){
    console.log('addReplay function');
    var opt = document.createElement('option');
    var name = document.createTextNode('replay '+replay_id);

    opt.value = 'replay-'+replay_id;
    opt.appendChild(name);

    document.getElementById('select-replay').appendChild(opt);

}


function runLive(cameraID){
    /*
     1. Make the 'X' and 'close' buttons stop the stream
     2. Make the 'record' button record the selected camera
     -> update live title
     4. remove old <img> and create a new one
     5. Send command to server
     */
    console.log('runLive function');

    document.getElementById('modal-live-close').setAttribute('onclick','stopStream('+cameraID+');');
    document.getElementById('modal-live-x').setAttribute('onclick','stopStream('+cameraID+');');
    
    document.getElementById('modal-live-record').setAttribute('onclick','startLiveRecording('+cameraID+');');

    var title = document.getElementById('live-title');
    var name = document.getElementById('camera'+cameraID+'-nameH3').innerHTML;
    title.innerHTML = 'Live - '+name;

    var liveDiv = document.getElementById('live-stream');
    if (liveDiv.firstChild){
        liveDiv.removeChild(liveDiv.firstChild);
    }
    var img = document.createElement('img');
    img.id = 'live-stream-camera'+cameraID;
    liveDiv.appendChild(img);

    socket.emit('startStream',cameraID);
}


function stopStream(screen_id){
    /*
    1. Send command to server to stop the stream
    2. Remove <img>
     */
    console.log('stopStream function');
    socket.emit('stopStream', screen_id);
    
    var liveDiv = document.getElementById('live-stream');
    liveDiv.removeChild(liveDiv.firstChild);

}


function runDetection(cameraID){
    /*
    -> update detection button
    -> Start or stop motion detection
     */
    console.log('runDetection  function');

    var detection = document.getElementById('camera'+cameraID+'-detectionIcon');
    if(detection.className == 'glyphicon glyphicon-facetime-video'){
        socket.emit('startDetection', cameraID);
    }else{
        socket.emit('stopDetection', cameraID);
    }

}


function runConfig(cameraID){
    /*
    -> Update title of config modal
    -> Set confirm and preview btn
    -> set oninput
     */
    console.log('runConfig function');

    var title = document.getElementById('config-title');
    var name = document.getElementById('camera'+cameraID+'-nameH3').innerHTML;
    title.innerHTML = 'Settings - '+name;

    var preview = document.getElementById('preview');
    if(preview.firstChild){
        preview.removeChild(preview.firstChild);
    }
    
    document.getElementById('modal-config-confirm').setAttribute('onclick','applyConfig({cameraID:'+cameraID+',action:"applyConfig"});');
    document.getElementById('modal-config-preview').setAttribute('onclick','applyConfig({cameraID:'+cameraID+',action:"previewConfig"});');

    document.getElementById('resolution').setAttribute('oninput','updateConfigValue({value:this.value,input:this.id});');
    document.getElementById('fps').setAttribute('oninput','updateConfigValue({value:this.value,input:this.id});');
    document.getElementById('brightness').setAttribute('oninput','updateConfigValue({value:this.value,input:this.id});');
    document.getElementById('contrast').setAttribute('oninput','updateConfigValue({value:this.value,input:this.id});');

    socket.emit('startConfig',cameraID);
}


function applyConfig(data){
    /*
    -> Get data
    -> Set brightness good value
    -> Send to server
     */
    console.log('applyConfig function');
    var resolution = document.getElementById('resolution').value;
    var fps = document.getElementById('fps').value;
    var brightness = document.getElementById('brightness').value;
    var contrast = document.getElementById('contrast').value;
    
    var arg = {
        cameraID: data.cameraID,
        resolution: resolution,
        fps: fps,
        brightness: brightness,
        contrast: contrast
    };
    
    socket.emit(data.action,arg);

    if(data.action == 'previewConfig'){
        var preview = document.getElementById('preview');
        if(preview.firstChild){
            preview.removeChild(preview.firstChild);
        }
        var img = document.createElement('img');
        img.id = 'previewImg'+data.cameraID;
        img.setAttribute('style','width:200px;height:150px');
        preview.appendChild(img);
    }
}


function setName(cameraID){
    /*
    -> display prompt to get new camera name
    -> check name not empty or null
    -> replace old name to new name
    -> send request to server
     */
    var getName = prompt('Nouveau nom : ');
    if (getName != '' && getName != null){
        var nameH3 = document.getElementById('camera'+cameraID+'-nameH3');
        var name = document.createTextNode(getName);
        name.id = 'camera'+cameraID+'-name';
        nameH3.replaceChild(name, nameH3.firstChild);
        socket.emit('changeCameraName', {cameraID: cameraID, name: getName});
    }
}


function setTimer(){
    console.log('setTimer function');
    var timer_form = document.getElementById("timer-form");
    socket.emit('setTimer', {begin_hour: timer_form.begin-hour.value, begin_minute: timer_form.begin-minute.value, end_hour: timer_form.end-hour.value, end_minute: timer_form.end-minute.value, frequency: timer_form.frequency.value});
}


function applyRecord(recordID){
    console.log('applyRecord function');
    socket.emit('applyRecord',recordID);
}


function deleteRecord(recordID){
    console.log('deleteRecord function');
    socket.emit('deleteRecord',recordID);
    var record = document.getElementById('record-'+recordID);
    document.getElementById('timer-records-tbody').removeChild(record);
}


function emptyTimerForm(){
    console.log('emptyTimerForm function');
    var myForm = document.getElementById('timer-form');
    myForm.beginHour.value = 0;
    myForm.beginMinute.value = 0;
    myForm.endHour.value = 0;
    myForm.endMinute.value = 0;
    myForm.frequency.value = 1;
    myForm.frequencyEnd.value = 1;
    myForm.timerDetection.checked = false;
    myForm.timerOnce.checked = false;
}


function stopRecording(cameraID, recordID){
    console.log('stopRecording function');
    document.getElementById('screen-'+data.cameraID+'-notif-check').disabled = false;
    document.getElementById('screen-'+data.cameraID+'-live-link').disabled = false;
    document.getElementById('record-'+data.recordID+'-apply').className = 'btn btn-primary';
    document.getElementById('record-'+data.recordID+'-apply').title = 'Click to apply this record';
    document.getElementById('record-'+data.recordID+'-apply').setAttribute('onclick','applyRecord('+data.recordID+');');
    document.getElementById('record-'+data.recordID+'-apply-icon').className = 'glyphicon glyphicon-ok';
    socket.emit('killProcess',cameraID);
}


function startLiveRecording(cameraID){
    /*
    1. Update recording btn for user and add a new listener
    2. Send command to server
     */
    console.log('startLiveRecording function');
    
    var recordBtn = document.getElementById('modal-live-record');
    recordBtn.innerHTML = 'Recording ..';
    recordBtn.setAttribute('onclick','stopLiveRecording('+cameraID+');');
    
    socket.emit('startLiveRecording', cameraID);
}


function stopLiveRecording(cameraID) {
    /*
    1. Update Record btn
    2. Disable btns while no receive video
    3. Send command to server
     */
    console.log('stopLiveRecording');
    
    var recordBtn = document.getElementById('modal-live-record');
    recordBtn.innerHTML = 'Sending file..';
    recordBtn.setAttribute('onclick','startLiveRecording('+cameraID+');');

    document.getElementById('modal-live-record').disabled = true;
    document.getElementById('modal-live-close').disabled = true;
    document.getElementById('modal-live-x').disabled = true;

    socket.emit('stopLiveRecording', cameraID);
}


function displayLiveMessage(data){
    console.log('displayLiveMessage function');
    //Action
    //type
    if (data.title == 'Alerte'){
        document.getElementById('messageLive-camera'+data.cameraID).className = 'alert alert-danger';
    }
    if (data.title == 'Bravo'){
        document.getElementById('messageLive-camera'+data.cameraID).className = 'alert alert-success';
    }
    if (data.title == 'Info'){
        document.getElementById('messageLive-camera'+data.cameraID).className = 'alert alert-info';
    }
    //add message and title
    document.getElementById('messageLive-title-camera'+data.cameraID).innerHTML = data.title;
    document.getElementById('messageLive-body-camera'+data.cameraID).innerHTML = data.message;
}


function resetLiveMessage(){
    console.log('resetLiveMessage function');
    document.getElementById('messageLive').className = '';
    document.getElementById('messageLive-title').innerHTML = '';
    document.getElementById('messageLive-body').innerHTML = '';
}


function playReplay(data){
    var replay = document.getElementById('table-replay-'+data.replayID).firstChild;
    var name = replay.innerHTML;
    console.log('play replay : '+name);

    var playerDiv = document.getElementById('player-replay-div');
    var video = document.createElement('video');
    var source = document.createElement('source');

    playerDiv.removeChild(playerDiv.firstChild);
    video.setAttribute('controls',true);
    video.setAttribute('width','500px');
    source.setAttribute('type','video/mp4');
    source.setAttribute('src','../cameras/camera'+data.cameraID+'/videos/'+name);

    video.appendChild(source);
    playerDiv.appendChild(video);
}


function editReplay(data){
    var replay = document.getElementById('table-replay-'+data.replayID).firstChild;
    var name = replay.innerHTML;
    console.log('edit replay '+name);

    var newName = prompt('New name : ',name);
    console.log(newName);
    if (newName != null && newName != ''){

        var end = newName.slice(-4);
        if (end != '.mp4') {
            newName = newName + '.mp4';
        }

        socket.emit('editReplay', {cameraID: data.cameraID, oldName: name, newName: newName, replayID: data.replayID});
    }
}


function removeReplay(data){
    var replay = document.getElementById('table-replay-'+data.replayID).firstChild;
    var name = replay.innerHTML;
    console.log('remove replay '+name);

    var Table = document.getElementById('table-replay');
    Table.removeChild(document.getElementById('table-replay-tr'+data.replayID));

    socket.emit('removeReplay',{cameraID: data.cameraID, name: name});
}


function updateConfigValue(data){
    console.log('updateConfigValue');
    
    if(data.input == 'resolution'){
        switch(parseInt(data.value)){
            case 1:
                document.getElementById(data.input+'Value').innerHTML = 'Low';
                break;
            case 2:
                document.getElementById(data.input+'Value').innerHTML = 'Medium';
                break;
            case 3:
                document.getElementById(data.input+'Value').innerHTML = 'High';
        }
    }else{
        document.getElementById(data.input+'Value').innerHTML = data.value;
    }
}



//BTN TEST
document.getElementById('btnTest').addEventListener('click',function(){
    console.log('TEST BTN');
});


