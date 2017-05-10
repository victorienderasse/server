/**
 * Created by Victorien on 17-06-16.
 */


//var userID = document.getElementById('userID').innerHTML;

var myTbReplay = [];
var cameraIDReplay;

//Ask camera to server
socket.emit('getCamera',userID);

socket.emit('getUserName',userID);

socket.on('getUserNameRes', function(name){
    $('#user-btn').html('<span class="glyphicon glyphicon-user"></span> '+name);
});

$(function(){

    $('#addCamera-btn').click(function(){
        redirectURL(serverURL+'/addCamera');
    });

    $('#buyCamera-btn').click(function(){
        redirectURL(serverURL+'/purchase');
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

    $('#detectionFilterReplay, #recordFilterReplay, #liveFilterReplay').change(function(){
        console.log('checked box change');
        var filesReplay = document.getElementById('files-replay');
        while(filesReplay.firstChild){
            filesReplay.removeChild(filesReplay.firstChild);
        }
        var player = document.getElementById('player-replay-div');
        while(player.firstChild){
            player.removeChild(player.firstChild);
        }
        var det,rec,live = false;
        if($('#detectionFilterReplay')[0].checked){
            console.log('det true;');
            det = true;
        }
        if($('#recordFilterReplay')[0].checked){
            console.log('rec true;');
            rec = true;
        }
        if($('#liveFilterReplay')[0].checked){
            console.log('live true;');
            live = true;
        }
        displayReplay({det:det,rec:rec,live:live});
    });

});


//Actions--------------------------------------

//set frequencyEnd select on Change
document.getElementById('frequency').addEventListener('change',function(){
    var frequency = document.getElementById('timer-form').frequency.value;
    if(frequency == '*'){
        document.getElementById('frequencyEnd').style.display = 'none';
    }else{
        document.getElementById('frequencyEnd').style.display = 'block';
    }
});


document.getElementById('sortBy').addEventListener('change',function(){
    console.log('sortBy function');
    var filesReplay = document.getElementById('files-replay');
    while(filesReplay.firstChild){
        filesReplay.removeChild(filesReplay.firstChild);
    }
    var player = document.getElementById('player-replay-div');
    while(player.firstChild){
        player.removeChild(player.firstChild);
    }
    var Obj = $('#sortBy').val();
    if(Obj == 'name'){
        myTbReplay.sort(compareName);
    }else{
        if(Obj == 'type'){
            myTbReplay.sort(compareType);
        }else{
            myTbReplay.sort(compareDate);
        }
    }

    var det,rec,live = false;
    if($('#detectionFilterReplay')[0].checked){
        console.log('det : true');
        det = true;
    }else{
        console.log('det : false');
    }
    if($('#recordFilterReplay')[0].checked){
        console.log('rec : true');
        rec = true;
    }
    if($('#liveFilterReplay')[0].checked){
        console.log('live : true');
        live = true;
    }

    displayReplay({det:det,rec:rec,live:live});
});



//EVENTS-----------------------------------------------------------------------------------------------------------------

socket.on('updateCameraEnable', function(data){
    console.log('cameraUP event');
    var camera = $('#camera'+data.cameraID);
    if(camera != 'undefined' && camera != null){
        console.log('camera update enable');
        var config = document.getElementById('camera'+data.cameraID+'-config');
        var timer = document.getElementById('camera'+data.cameraID+'-timer');
        var live = document.getElementsByClassName('camera3-liveBtn');
        var detection = document.getElementById('camera'+data.cameraID+'-detection');
        if(data.enable){
            console.log('live.id: '+live.id);
            config.disabled = false;
            timer.disabled = false;
            live.disabled = false;
            detection.disabled = false;
            camera.addClass('cameraUP');
            camera.removeClass('cameraDown');
        }else{
            console.log('live.id: '+live.id);
            config.disabled = true;
            timer.disabled = true;
            live.disabled = true;
            detection.disabled = true;
            camera.addClass('cameraDown');
            camera.removeClass('cameraUP');
        }
    }
});


socket.on('sendCamera', function(data){
    console.log('sendCamera event');
    if(data.cameras.length>0){
        document.getElementById('cameras').innerHTML = '<h2>Vos caméras</h2>';
    }else{
        document.getElementById('cameras').innerHTML = '<h2>Vous n\'avez aucune caméras</h2>';
    }

    if(data.sharedCameras.length>0){
        document.getElementById('sharedCameras').innerHTML = '<h2>Vos caméras partagés</h2>';
    }

    displayCamera({cameras:data.cameras, sharedCamera:false});
    displayCamera({cameras:data.sharedCameras, sharedCamera:true});

});


socket.on('sendPlanning', function(tbPlanning){
    console.log('sendPlanning event');
    displayPlanning(tbPlanning);
});


socket.on('message',function(data){
    console.log('display message event');
    displayMessage(data);
});


socket.on('redirect', function(url){
    console.log('redirect event');
    redirectURL(url);
});


socket.on('updatePlanningColor', function(data){
    console.log('setOldPlanning event');
    var planning = document.getElementById('planning-'+data.planningID);
    if(planning != 'undefined' && planning != null){
        switch(data.state){
            case 0:
                planning.setAttribute('style','background-color:#FFFFFF');
                break;
            case 1:
                planning.setAttribute('style','background-color:#B9E9C4');
                break;
            case 2:
                planning.setAttribute('style','background-color:#E1E099');
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
    myTbReplay = [];
    cameraIDReplay = data.cameraID;
    for(var i=0;i<data.tbReplay.length;i++){
        var myType,myDate;
        var myName = data.tbReplay[i].toString();
        var wd = myName.length;
        if(myName.includes('Detection')){
            myType = 'det';
        }else{
            if(myName.includes('record')){
                myType = 'rec';
            }else{
                myType = 'live';
            }
        }
        myDate = myName.substr(wd-23,19);
        var myReplay = {
            type: myType,
            name: myName,
            date: myDate
        };
        myTbReplay.push(myReplay);
    }
    displayReplay({det:true,rec:true,live:true});
});


socket.on('getReplaysRes', function(data){
    myTbReplay = [];
    cameraIDReplay = data.cameraID;
    myTbReplay = data.replays;
    myTbReplay.sort(compareDate);
    displayReplay({det:true, rec:true, live:true});
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
    //var replay = document.getElementById('table-replay-'+data.replayID).firstChild;
    document.getElementById('name-replay'+data.replayID).innerHTML = data.name;
    //replay.innerHTML = data.name;
});


socket.on('displayCameraState',function(data){
    displayCameraState({cameraID:data.cameraID, state:data.state});
});


socket.on('setConfig', function(data){
    console.log('setConfig');

    var title = document.getElementById('config-title');
    if(title.innerHTML == 'Configuration - '+data.cameraName){

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
    console.log('update preview event');
    var img = document.getElementById('previewImg'+cameraID);
    if(img != null && img != 'undefined'){
        img.src = '../cameras/camera'+cameraID+'/live/preview.jpg?v='+ new Date().getTime();
    }
});






//Functions-----------------------------------

function displayCamera(data){


    var tbCamera = data.cameras;
    var nbRow = 0;
    var size = tbCamera.length;
    var display;
    console.log('type: '+data.type);
    if(data.sharedCamera){
        display = document.getElementById('displaySharedCameras');
    }else{
        display = document.getElementById('display');
    }


    for(var i=0;i<tbCamera.length;i++){

        //NAME================================================================

        var nameDiv = document.createElement('div');
        nameDiv.id = 'camera'+tbCamera[i].cameraID+'-nameDiv';
        nameDiv.className = 'row';
        nameDiv.setAttribute('style','text-align:center; background-color:#6CB4CE; color:#fff;');
        var nameH3 = document.createElement('h3');
        nameH3.id = 'camera'+tbCamera[i].cameraID+'-nameH3';
        nameH3.setAttribute('onclick','setName('+tbCamera[i].cameraID+');');
        var name = document.createTextNode(tbCamera[i].name);
        name.id = 'camera'+tbCamera[i].cameraID+'-name';
        name.title = 'Cliquer pour modifier le nom de la caméra';
        var hrName = document.createElement('hr');
        hrName.setAttribute('style','margin-left:30px; margin-right: 30px;');

        nameH3.appendChild(name);
        nameDiv.appendChild(nameH3);
        nameDiv.appendChild(hrName);

        //IMG==================================================================

        var liveDiv = document.createElement('div');
        liveDiv.id = 'camera'+tbCamera[i].cameraID+'-liveDiv';
        liveDiv.className = 'col-lg-6';
        liveDiv.setAttribute('style','margin-bottom:2%; margin-top:2%;');
        var liveBtn = document.createElement('button');
        liveBtn.className = 'btn';
        liveBtn.id = 'camera'+tbCamera[i].cameraID+'-liveBtn';
        liveBtn.setAttribute('style','border:0px; background-color:#fff;');
        liveBtn.setAttribute('onclick','runLive('+tbCamera[i].cameraID+');');
        liveBtn.setAttribute('data-toggle','modal');
        liveBtn.setAttribute('data-target','#modal-live');
        var live = document.createElement('img');
        live.id = 'camera'+tbCamera[i].cameraID+'-live';
        live.src = '../cameras/camera'+tbCamera[i].cameraID+'/live/stream_camera_'+tbCamera[i].cameraID+'.jpg';
        live.setAttribute('onerror','javascript:this.src="../images/logo.png"');
        live.title = 'Cliquer pour démarrer le direct';
        live.setAttribute('style','border:5px solid #ddd;border-radius:8px;height:150px;width:220px;');
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
        replay.title = 'Cliquer pour voir vos enregistrements';
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
        timer.title = 'Cliquer pour gérer ou ajouter des planifications';
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
        detection.title = 'Cliquer pour démarrer une session de détection de mouvement';
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
        config.title = 'Cliquer pour afficher les paramètres de la caméra';
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

        camera.appendChild(nameDiv);
        //camera.appendChild(hr);
        camera.appendChild(imgBtnDiv);

        if(tbCamera[i].enable == 0) {
            timer.disabled = true;
            detection.disabled = true;
            liveBtn.disabled = true;
            config.disabled = true;
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
            if(tbCamera[i].enable == 0){
                camera.className = 'cameraDown col-lg-offset-1 col-lg-4';
            }else{
                camera.className = 'cameraUP col-lg-offset-1 col-lg-4';
            }
            row.appendChild(camera);
            display.appendChild(row);
        }else{
            row = document.getElementById('row'+nbRow);
            row.setAttribute('style','margin-bottom:3%;');
            if(tbCamera[i].enable == 0){
                camera.className = 'cameraDown col-lg-offset-2 col-lg-4';
            }else{
                camera.className = 'cameraUP col-lg-offset-2 col-lg-4';
            }
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
    -> remove old planning
    -> empty timer form
     */
    console.log('runTimer function');
    
    var title = document.getElementById('timer-title');
    var name = document.getElementById('camera'+cameraID+'-nameH3').innerHTML;
    title.innerHTML = 'Planifications - '+name;

    var timerBtn = document.getElementById('timer-confirm-btn');
    timerBtn.setAttribute('onclick','applyTimer('+cameraID+');');

    var tbPlanning = document.getElementById('timer-planning-tbody');
    while(tbPlanning.firstChild){
        tbPlanning.removeChild(tbPlanning.firstChild);
    }

    emptyTimerForm();

    socket.emit('getPlanning', cameraID);
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


function displayPlanning(tbPlanning){
    console.log('displayPlanning function');
    var tb = document.getElementById('timer-planning-tbody');
    while(tb.firstChild){
        tb.removeChild(tb.firstChild);
    }


    for(var i=0;i<tbPlanning.length;i++){
        //Create elements
        var planning = document.createElement('tr');
        var beginTD = document.createElement('td');
        var endTD = document.createElement('td');
        var frequencyTD = document.createElement('td');
        var frequencyEndTD = document.createElement('td');
        var typeTD = document.createElement('td');
        var apply = document.createElement('td');
        var remove = document.createElement('td');

        var frequency, frequencyEnd;
        switch(tbPlanning[i].frequency){
            case '1':
                frequency = document.createTextNode('Lundi');
                break;
            case '2':
                frequency = document.createTextNode('Mardi');
                break;
            case '3':
                frequency = document.createTextNode('Mercredi');
                break;
            case '4':
                frequency = document.createTextNode('Jeudi');
                break;
            case '5':
                frequency = document.createTextNode('Vendredi');
                break;
            case '6':
                frequency = document.createTextNode('Samedi');
                break;
            case '7':
                frequency = document.createTextNode('Dimanche');
                break;
            default:
                frequency = document.createTextNode('Tous les jours');
                break;
        }
        switch(tbPlanning[i].frequencyEnd){
            case '1':
                frequencyEnd = document.createTextNode('Lundi');
                break;
            case '2':
                frequencyEnd = document.createTextNode('Mardi');
                break;
            case '3':
                frequencyEnd = document.createTextNode('Mercredi');
                break;
            case '4':
                frequencyEnd = document.createTextNode('Jeudi');
                break;
            case '5':
                frequencyEnd = document.createTextNode('Vendredi');
                break;
            case '6':
                frequencyEnd = document.createTextNode('Samedi');
                break;
            case '7':
                frequencyEnd = document.createTextNode('Dimanche');
                break;
            default:
                frequencyEnd = document.createTextNode('Tous les jours');
                break;
        }

        var beginMinute = (tbPlanning[i].begin % 60);
        var beginHour = ((tbPlanning[i].begin - beginMinute) / 60);
        if(beginMinute < 10){
            beginMinute = '0'+beginMinute;
        }
        if(beginHour < 10){
            beginHour = '0'+beginHour;
        }
        var begin = document.createTextNode(beginHour+':'+beginMinute);
        var endMinute = (tbPlanning[i].end % 60);
        var endHour = ((tbPlanning[i].end - endMinute) / 60);
        if(endMinute < 10){
            endMinute = '0'+endMinute;
        }
        if(endHour < 10){
            endHour = '0'+endHour;
        }
        var end = document.createTextNode(endHour+':'+endMinute);
        var type = document.createTextNode(tbPlanning[i].type);
        var applyBtn = document.createElement('button');
        var applyBtnIcon = document.createElement('span');
        var removeBtn = document.createElement('button');
        var removeBtnIcon = document.createElement('span');

        //Add Attributes
        planning.id = 'planning-'+tbPlanning[i].planningID;
        applyBtn.id = 'planning-'+tbPlanning[i].planningID+'-apply';
        applyBtn.title = 'Cliquer pour activer la planification';
        applyBtn.setAttribute('onclick','applyPlanning('+ tbPlanning[i].planningID +');');
        removeBtn.id = 'planning-'+tbPlanning[i].planningID+'-remove';
        removeBtn.title = 'Cliquer pour supprimer la planification';
        removeBtn.setAttribute('onclick', 'deletePlanning('+ tbPlanning[i].planningID +');');
        applyBtn.className = 'btn btn-primary';
        removeBtn.className = 'close';
        applyBtnIcon.id = 'planning-'+tbPlanning[i].planningID+'-apply-icon';
        applyBtnIcon.className = 'glyphicon glyphicon-ok';
        removeBtnIcon.className = 'glyphicon glyphicon-remove';

        if(tbPlanning[i].state == 1){
            planning.setAttribute('style','background-color:#B9E9C4;');
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
        planning.appendChild(frequencyTD);
        planning.appendChild(beginTD);
        planning.appendChild(frequencyEndTD);
        planning.appendChild(endTD);
        planning.appendChild(typeTD);
        planning.appendChild(apply);
        planning.appendChild(remove);
        tb.appendChild(planning);
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
    title.innerHTML = 'Enregistrements - '+name;


    var table = document.getElementById('files-replay');
    while(table.firstChild){
        table.removeChild(table.firstChild);
    }

    var playerReplay = document.getElementById('player-replay-div');
    if(playerReplay.firstChild){
        playerReplay.removeChild(playerReplay.firstChild);
    }

    socket.emit('getReplays',cameraID);
}


function displayReplay(filter){
    var first = true;
    var nbReplay = 0;
    for(var i=0;i<myTbReplay.length;i++){

        if(myTbReplay[i].type == 'det'){
            if(!filter.det){
                continue;
            }
        }
        if(myTbReplay[i].type == 'rec'){
            if(!filter.rec){
                continue;
            }
        }
        if(myTbReplay[i].type == 'live'){
            if(!filter.live){
                continue;
            }
        }

        nbReplay = nbReplay + 1;
        console.log('new replay: '+nbReplay);

        //ROW
        var row = document.createElement('div');
        row.className = 'row';

        //REPLAY
        var replay = document.createElement('div');
        replay.id = 'replay'+i;
        if(first){
            first = false;
            replay.className = 'replaySelected';
        }else{
            replay.className = 'replay';
        }

        //BTN
        var btnDiv = document.createElement('div');
        btnDiv.setAttribute('style','margin-top:5px;');
        btnDiv.className = 'col-lg-4';

        //NAME
        var nameDiv = document.createElement('div');
        nameDiv.className = 'col-lg-8';
        nameDiv.title = 'Cliquer pour voir la vidéo';
        nameDiv.setAttribute('onclick','playReplay({cameraID:'+cameraIDReplay+',replayID:'+i+'});');
        var name = document.createElement('span');
        name.id = 'name-replay'+i;
        name.setAttribute('style','font-weight: bold; width:100%; height:100%;');
        var txt = document.createTextNode(myTbReplay[i].name);

        name.appendChild(txt);
        nameDiv.appendChild(name);
        replay.appendChild(nameDiv);

        //EDIT
        var editBtn = document.createElement('button');
        editBtn.className = 'btn';
        editBtn.setAttribute('style','border:0;background-color:#fff;');
        editBtn.title = 'Cliquer pour renommer le fichier';
        editBtn.setAttribute('onclick','editReplay({cameraID: '+cameraIDReplay+', replayID: '+i+'});');
        var editIcon = document.createElement('span');
        editIcon.className = 'glyphicon glyphicon-edit';

        editBtn.appendChild(editIcon);
        btnDiv.appendChild(editBtn);

        //REMOVE
        var removeBtn = document.createElement('button');
        removeBtn.className = 'btn';
        removeBtn.setAttribute('style','border:0;background-color:#fff;');
        removeBtn.title = 'Cliquer pour supprimer le fichier';
        removeBtn.setAttribute('onclick','removeReplay({cameraID: '+cameraIDReplay+', replayID: '+i+'});');
        var removeIcon = document.createElement('span');
        removeIcon.className = 'glyphicon glyphicon-remove-circle';

        removeBtn.appendChild(removeIcon);
        btnDiv.appendChild(removeBtn);

        replay.appendChild(btnDiv);
        row.appendChild(replay);

        document.getElementById('files-replay').appendChild(row);

    }

    var video = document.createElement('video');
    video.setAttribute('controls',true);
    video.setAttribute('width','500px');
    if(nbCamera>0){
        var source = document.createElement('source');
        source.setAttribute('src','../cameras/camera'+cameraIDReplay+'/videos/'+myTbReplay[0].name);
        source.setAttribute('type','video/mp4');
        video.appendChild(source);
    }
    document.getElementById('player-replay-div').appendChild(video);
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
    title.innerHTML = 'Configuration - '+name;

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
    console.log(getName.length);
    if(getName.length>12){
        displayMessage({title:'Alerte', message:'Le nom de la caméra ne peut excéder 12 caractères'});
    }else{
        if (getName != '' && getName != null){
            var nameH3 = document.getElementById('camera'+cameraID+'-nameH3');
            var name = document.createTextNode(getName);
            name.id = 'camera'+cameraID+'-name';
            nameH3.replaceChild(name, nameH3.firstChild);
            socket.emit('changeCameraName', {cameraID: cameraID, name: getName});
        }
    }
}


function setTimer(){
    console.log('setTimer function');
    var timer_form = document.getElementById("timer-form");
    socket.emit('setTimer', {begin_hour: timer_form.begin-hour.value, begin_minute: timer_form.begin-minute.value, end_hour: timer_form.end-hour.value, end_minute: timer_form.end-minute.value, frequency: timer_form.frequency.value});
}


function applyPlanning(planningID){
    console.log('applyPlanning function');
    socket.emit('applyPlanning',planningID);
}


function deletePlanning(planningID){
    console.log('deletePlanning function');
    socket.emit('deletePlanning',planningID);
    var planning = document.getElementById('planning-'+planningID);
    document.getElementById('timer-planning-tbody').removeChild(planning);
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


function stopRecording(cameraID, planningID){
    console.log('stopRecording function');
    document.getElementById('screen-'+data.cameraID+'-notif-check').disabled = false;
    document.getElementById('screen-'+data.cameraID+'-live-link').disabled = false;
    document.getElementById('planning-'+data.planningID+'-apply').className = 'btn btn-primary';
    document.getElementById('planning-'+data.planningID+'-apply').title = 'Click to apply this planning';
    document.getElementById('planning-'+data.planningID+'-apply').setAttribute('onclick','applyPlanning('+data.planningID+');');
    document.getElementById('planning-'+data.planningID+'-apply-icon').className = 'glyphicon glyphicon-ok';
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
    //var replay = document.getElementById('table-replay-'+data.replayID).firstChild;
    var name = document.getElementById('name-replay'+data.replayID).innerHTML;
    console.log('play replay : '+name);


    $('.replaySelected , #replay'+data.replayID).toggleClass('replay replaySelected');

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
    //var replay = document.getElementById('table-replay-'+data.replayID).firstChild;
    var name = document.getElementById('name-replay'+data.replayID).innerHTML;
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
    //var replay = document.getElementById('table-replay-'+data.replayID).firstChild;
    var name = document.getElementById('name-replay'+data.replayID).innerHTML;
    console.log('remove replay '+name);

    var replay = document.getElementById('replay'+data.replayID);
    replay.parentNode.removeChild(replay);
    //document.getElementById('files-replay').removeChild(replay);
    //Table.removeChild(document.getElementById('table-replay-tr'+data.replayID));

    socket.emit('removeReplay',{cameraID: data.cameraID, name: name});
}


function updateConfigValue(data){
    console.log('updateConfigValue');
    
    if(data.input == 'resolution'){
        switch(parseInt(data.value)){
            case 1:
                document.getElementById(data.input+'Value').innerHTML = 'Faible';
                break;
            case 2:
                document.getElementById(data.input+'Value').innerHTML = 'Moyenne';
                break;
            case 3:
                document.getElementById(data.input+'Value').innerHTML = 'Haute';
        }
    }else{
        document.getElementById(data.input+'Value').innerHTML = data.value;
    }
}


function displayCameraState(data){
    console.log('displayCameraState function');

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
}


function compareName(a,b){
    if(a.name < b.name)
        return -1;
    if(a.name > b.name)
        return 1;
    return 0;
}


function compareType(a,b){
    if(a.type < b.type)
        return -1;
    if(a.type > b.type)
        return 1;
    return 0;
}


function compareDate(a,b){
    if(a.date < b.date)
        return 1;
    if(a.date > b.date)
        return -1;
    return 0;
}




