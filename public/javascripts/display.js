/**
 * Created by Victorien on 02-12-16.
 */
/**
 * Created by Victorien on 17-06-16.
 */


//Connection to the server------------------
var socket = io.connect(serverURL);
socket.emit('client','display');

var userID = document.getElementById('userID').innerHTML;

//Ask camera to server
socket.emit('getCamera',userID);


//EVENTS-----------------------------------------------------------------------------------------------------------------

//getCameras
socket.on('sendCamera', function(data){
    console.log('sendCamera event');
    displayScreens(data);
});

//getRecords
socket.on('sendRecords', function(tbRecord){
    console.log('sendRecords event');
    displayRecords(tbRecord);
});

//message
socket.on('message',function(data){
    console.log('display message event');
    displayMessage(data);
});

//redirection
socket.on('redirect', function(url){
    console.log('redirect event');
    redirectURL(url);
});


socket.on('setOldRecord', function(recordID){
    console.log('setOldRecord event');
    document.getElementById('record-'+recordID).setAttribute('style','background-color:#FFFFFF');
});


socket.on('setReplays', function(data){
    console.log('setReplay event');
    var select = document.getElementById('select-replay');

    for(i=0;i<data.tbReplay.length;i++){
        var replay = document.createElement('option');
        var name = document.createTextNode(data.tbReplay[i]);
        replay.id = 'replay-'+i;
        replay.title = 'Click to play the video';
        replay.setAttribute('value',data.tbReplay[i]);
        replay.appendChild(name);
        select.appendChild(replay);
    }

    playReplay(data.cameraID);
});


socket.on('motionDetectionStart', function(cameraID){
    console.log('motionDetectionStart event');
    var camera = document.getElementById('screen-'+cameraID);
    if(camera != 'undefined'){
        document.getElementById('screen-'+cameraID+'-notif-check').checked = true;
        document.getElementById('screen-'+cameraID+'-live-link').disabled = true;
        document.getElementById('screen-'+cameraID+'-timer-btn').disabled = true;
    }
});


socket.on('motionDetectionStop', function(cameraID){
    console.log('motionDetectionStop event');
    var camera = document.getElementById('screen-'+data.cameraID);
    if(camera != 'undefined'){
        document.getElementById('screen-'+cameraID+'-notif-check').checked = false;
        document.getElementById('screen-'+cameraID+'-live-link').disabled = false;
        document.getElementById('screen-'+cameraID+'-timer-btn').disabled = false;
    }
});


socket.on('updateStream', function(cameraID){
    var img = document.getElementById('live-stream-camera'+cameraID);
    if (img != 'undefined'){
        img.src = '/public/cameras/camera'+cameraID+'/live/stream_camera_'+cameraID+'.jpg?v='+ new Date().getTime();
    }
});

//Actions--------------------------------------


//Set Timer button
document.getElementById('timer-confirm-btn').addEventListener('click', function(){
    console.log('timer-confirm-btn pressed');
    var timer_form = document.getElementById("timer-form");
    var beginHour = timer_form.beginHour.value;
    var beginMinute = timer_form.beginMinute.value;
    var endHour = timer_form.endHour.value;
    var endMinute = timer_form.endMinute.value;
    var type;
    if(document.getElementById('timer-detection').checked){
        type = 'detection';
    }else{
        type = 'record';
    }
    if(beginHour >= 0 && beginHour < 24 && endHour >= 0 && endHour < 24 && beginMinute >= 0 && beginMinute < 60 && endMinute >= 0 && endMinute < 60) {
        socket.emit('setTimer', {
            begin_hour: beginHour,
            begin_minute: beginMinute,
            end_hour: endHour,
            end_minute: endMinute,
            frequency: timer_form.frequency.value,
            cameraID: timer_form.cameraID.value,
            type: type
        });
    }else{
        displayMessage({title: 'Alerte', message: 'Erreur ! Veuillez indiquer des valeurs correctes', action: ''});
    }
});

//Add Camera
document.getElementById('add-camera-btn').addEventListener('click', function(){
    console.log('AddScreen btn pressed');
    var form = document.getElementById('addScreen-form');
    var code = form.code.value;
    var userID = document.getElementById('userID').innerHTML;
    socket.emit('addScreen',{code:code,userID:userID});
});

//Disconnect
document.getElementById('disconnect-btn').addEventListener('click', function(){
    window.location = serverURL;
});



//Functions-----------------------------------

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
        screen_notif_check.setAttribute('onchange','runNotif(' + tbScreen[i].cameraID + ');');
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
        screen_replay_btn.setAttribute('data-target','#modal-replay');
        //Screen_img
        screen_img.id = 'screen-'+tbScreen[i].cameraID+'-image';
        screen_img.setAttribute('src','/public/images/stream_camera_'+tbScreen[i].cameraID+'.jpg');
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
            screen.className = 'camera-disable';
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
    console.log('runTimer function');
    //get cameraID
    var hidden = document.getElementById('timer-camera-id-input');
    hidden.setAttribute('value',cameraID);
    //getRecord of the camera
    if(document.getElementById('timer-table-record-list')){
        console.log('tb exist -> remove');
        var tb = document.getElementById('timer-table-record-list');
        document.getElementById('timer-records-div').removeChild(tb);
    }
    console.log('get records from server');
    socket.emit('getRecords', cameraID);
}


function runReplay(cameraID){
    console.log('runReplay function');
    var selectDiv = document.getElementById('select-replay-div');
    if (selectDiv.firstChild){
        selectDiv.removeChild(selectDiv.firstChild);
    }
    var select = document.createElement('select');
    select.id = 'select-replay';
    select.name = 'select-replay';
    select.className = 'form-control';
    select.setAttribute('onchange', 'playReplay('+cameraID+');');
    selectDiv.appendChild(select);

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
     2. Disabled 'timer' and 'motion detection' buttons
     3. empty the old <img> and create a new one
     4. Send command to server
     */
    console.log('runLive function');

    document.getElementById('modal-live-close').setAttribute('onclick','stopStream('+cameraID+');');
    document.getElementById('modal-live-x').setAttribute('onclick','stopStream('+cameraID+');');
    document.getElementById('screen-'+cameraID+'-timer-btn').disabled = true;
    document.getElementById('screen-'+cameraID+'-notif-check').disabled = true;

    var liveDiv = document.getElementById('live-stream');
    if (liveDiv.firstChild){
        liveDiv.removeChild(liveDiv.firstChild);
    }
    var img = document.createElement('img');
    img.id = 'live-stream-camera'+cameraID;
    liveDiv.appendChild(img);

    socket.emit('startStream',cameraID);

    /*
    var img = document.getElementById('live-stream-img');
    stream = setInterval(function(){
        console.log('new source');
        img.src = '/public/images/stream_camera_'+screen_id+'.jpg?v='+ new Date().getTime();
    },1000);
    */
}



function stopStream(screen_id){
    console.log('stopStream function');
    socket.emit('killProcess', screen_id);
    document.getElementById('screen-'+screen_id+'-timer-btn').disabled = false;
    document.getElementById('screen-'+screen_id+'-notif-check').disabled = false;
    clearInterval(stream);
}


function runNotif(screen_id){
    console.log('runNotif  function');
    var check = document.getElementById('screen-'+screen_id+'-notif-check');
    if(check.checked){
        document.getElementById('screen-'+screen_id+'-timer-btn').disabled = true;
        document.getElementById('screen-'+screen_id+'-live-link').disabled = true;
        socket.emit('startDetection', screen_id);
    }else{
        document.getElementById('screen-'+screen_id+'-timer-btn').disabled = false;
        document.getElementById('screen-'+screen_id+'-live-link').disabled = false;
        socket.emit('killProcess', screen_id);
    }

}


function setName(cameraID){
    var getName = prompt('Nouveau nom : ');
    if (getName != ''){
        var bold = document.createElement('b');
        var name = document.createTextNode(getName);
        bold.appendChild(name);
        var screenName = document.getElementById('screen-'+cameraID+'-name');
        screenName.replaceChild(bold, screenName.firstChild);
        socket.emit('changeCameraName', {cameraID: cameraID, name: name});
    }
}


function setTimer(){
    console.log('setTimer function');
    var timer_form = document.getElementById("timer-form");
    socket.emit('setTimer', {begin_hour: timer_form.begin-hour.value, begin_minute: timer_form.begin-minute.value, end_hour: timer_form.end-hour.value, end_minute: timer_form.end-minute.value, frequency: timer_form.frequency.value});
}


function displayRecords(tbRecord){
    console.log('displayRecord function');
    var tb = document.getElementById('timer-records-tbody');
    while(tb.firstChild){
        tb.removeChild(tb.firstChild);
    }


    for(i=0;i<tbRecord.length;i++){
        //Create elements
        var record = document.createElement('tr');
        var beginTD = document.createElement('td');
        var endTD = document.createElement('td');
        var frequencyTD = document.createElement('td');
        var typeTD = document.createElement('td');
        var apply = document.createElement('td');
        var remove = document.createElement('td');

        var beginMinute = (tbRecord[i].begin % 60);
        var beginHour = ((tbRecord[i].begin - beginMinute) / 60);
        var begin = document.createTextNode(beginHour+':'+beginMinute);
        var endMinute = (tbRecord[i].end % 60);
        var endHour = ((tbRecord[i].end - endMinute) / 60);
        var end = document.createTextNode(endHour+':'+endMinute);
        var frequency = document.createTextNode(tbRecord[i].frequency);
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
        typeTD.appendChild(type);
        apply.appendChild(applyBtn);
        remove.appendChild(removeBtn);
        record.appendChild(beginTD);
        record.appendChild(endTD);
        record.appendChild(frequencyTD);
        record.appendChild(typeTD);
        record.appendChild(apply);
        record.appendChild(remove);
        tb.appendChild(record);
    }
}


function applyRecord(recordID){
    console.log('applyRecord function');
    document.getElementById('record-'+recordID).setAttribute('style','background-color:#B9E9C4');
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
    myForm.beginHour.value = '';
    myForm.beginMinute.value = '';
    myForm.endHour.value = '';
    myForm.endMinute.value = '';
    myForm.frequency.value = 'Mon';
}


function playReplay(cameraID){
    console.log('playReplay function');
    //create video
    var video = document.createElement('video');
    video.id = 'video-replay';
    video.setAttribute('controls',true);
    video.setAttribute('width','600px');
    //create source
    var source = document.createElement('source');
    var opt = document.getElementById('select-replay').value;
    var path = '../cameras/camera'+cameraID+'/videos/'+opt;
    source.setAttribute('src',path);
    source.setAttribute('type','video/mp4');
    video.appendChild(source);

    var display_div = document.getElementById('display-replay-div');
    if(display_div.firstChild){
        display_div.removeChild(display_div.firstChild);
    }
    display_div.appendChild(video);
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
