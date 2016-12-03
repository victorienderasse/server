/**
 * Created by Victorien on 02-12-16.
 */
/**
 * Created by Victorien on 17-06-16.
 */


//Connection to the server------------------
var socket = io.connect(serverURL);
var stream;

//Events------------------------------------


var userID = document.getElementById('userID').innerHTML;
socket.emit('client',userID);


//getCameras
socket.on('sendCamera', function(data){
    console.log('sendCamera event');
    tbScreen = data;

    if(tbScreen.length>0){
        displayScreens();
        console.log('nbCamera = '+tbScreen.length);
    }else{
        document.getElementById('table-screen-div').innerHTML = 'Vous n\'avez aucune camera';
        console.log('Aucune camera');
    }
});


//getRecords
socket.on('sendRecords', function(tbRecord){
    console.log('sendRecords event');
    displayRecords(tbRecord);
});

//Errors
socket.on('msgError', function(msg){
    console.log('msgError event');
    document.getElementById('signin-form').reset();
    document.getElementById('error-signin-div').innerHTML = msg;
});

//redirection
socket.on('redirect', function(url){
    console.log('redirect event');
    window.location = url;
});


socket.on('setOldRecord', function(recordID){
    console.log('setOldRecord event');
    //document.getElementById('record-'+recordID+'-apply').disabled = false;
    document.getElementById('record-'+recordID).setAttribute('style','background-color:#FFFFFF');
});


socket.on('setReplays', function(tbReplay){
    console.log('setReplay event');
    var select = document.getElementById('select-replay');

    for(i=0;i<tbReplay.length;i++){
        var replay = document.createElement('option');
        var name = document.createTextNode(tbReplay[i]);
        replay.id = 'replay-'+i;
        replay.title = 'Click to play the video';
        replay.setAttribute('value',tbReplay[i]);
        replay.appendChild(name);
        select.appendChild(replay);
    }

    playReplay();
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
    if(document.getElementById('timer-detection').checked){
        var type = 'detection';
    }else{
        var type = 'record';
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
        document.getElementById('msg').innerHTML = 'error adding timer';
    }
});




//Functions-----------------------------------

function displayScreens(){
    console.log('displayScreens function');

    //Create table & add id
    var tableScreen = document.createElement('table');
    tableScreen.id = 'table-screen';
    tableScreen.className = 'table table-striped table-hover table-responsive';
    tableScreen.setAttribute('style','background-color:#FFFFFF;');

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
        //var screen_replay = document.createElement('td');
        //var screen_replay_btn = document.createElement('button');
        //var screen_replay_btn_icon = document.createElement('span');
        var screen_img = document.createElement('img');

        //Create text
        var name = document.createTextNode(tbScreen[i].name);
        var bold = document.createElement('b');
        bold.appendChild(name);

        //Add text
        screen_name.appendChild(bold);

        //Add attributes
        //Screen
        screen.id = 'screen-' + tbScreen[i].cameraID;
        //Screen_live
        screen_live.id = 'screen-' + tbScreen[i].cameraID + '-live';
        screen_live.title = 'Watch your camera online';
        screen_live_btn.id = 'screen-' + tbScreen[i].cameraID + '-live-link';
        screen_live_btn.setAttribute('onclick','runLive(' + tbScreen[i].cameraID + ');');
        screen_live_btn.setAttribute('data-toggle','modal');
        screen_live_btn.setAttribute('data-target','#modal-live');
        //Screen_name
        screen_name.id = 'screen-' + tbScreen[i].cameraID + '-name';
        screen_name.title = 'Click to change the name';
        screen_name.setAttribute('onclick','runName(' + tbScreen[i].cameraID + ');');
        //Screen_notif
        screen_notif.id = 'screen-' + tbScreen[i].cameraID + '-notif';
        screen_notif.title = 'Activate start motion detection';
        screen_notif_check.id = 'screen-' + tbScreen[i].cameraID + '-notif-check';
        screen_notif_check.type = 'checkbox';
        screen_notif_check.setAttribute('onchange','runNotif(' + tbScreen[i].cameraID + ');');
        //Screen_timer
        screen_timer.id = 'screen-' + tbScreen[i].cameraID + '-timer';
        screen_timer.title = 'manage your timers';
        screen_timer_btn.id = 'screen-' + tbScreen[i].cameraID + '-timer-btn';
        screen_timer_btn.title ='Manage the timers of the camera';
        screen_timer_btn.setAttribute('data-toggle','modal');
        screen_timer_btn.setAttribute('data-target','#modal-timer');
        screen_timer_btn.setAttribute('onclick','runTimer('+tbScreen[i].cameraID+');');
        //Screen_replay
        //screen_replay.id = 'screen-' + tbScreen[i].cameraID + '-replay';
        //screen_replay.title = 'Watch the replay of this camera';
        //screen_replay_btn.id = 'screen-' + tbScreen[i].cameraID + '-replay-btn';
        //screen_replay_btn.setAttribute('onclick','runReplay(' + tbScreen[i].cameraID + ');');
        //screen_replay_btn.setAttribute('data-toggle','modal');
        //screen_replay_btn.setAttribute('data-target','#modal-replay');
        //Screen_img
        screen_img.id = 'screen-'+tbScreen[i].cameraID+'-image';
        screen_img.setAttribute('src','/public/images/stream_camera_'+tbScreen[i].cameraID+'.jpg');
        screen_img.setAttribute('height','150px');
        screen_img.setAttribute('width','200px');
        screen_img.setAttribute('alt','Click to display live session');

        //Add Class
        screen_timer_btn.className = 'btn btn-primary form-control';
        //screen_replay_btn.className = 'btn btn-success form-control';
        screen_timer_btn_icon.className = 'glyphicon glyphicon-edit';
        //screen_replay_btn_icon.className = 'glyphicon glyphicon-play';
        screen.className = 'form-group';
        screen_live.className = 'col-lg-2';
        screen_name.className = 'row col-lg-1';
        screen_notif.className = 'row col-lg-1';
        screen_timer.className = 'row col-lg-1';

        //get state -> diabled btn
        var state = tbScreen[i].state;
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

        //Insert Element
        screen_timer_btn.appendChild(screen_timer_btn_icon);
        //screen_replay_btn.appendChild(screen_replay_btn_icon);
        screen_live_btn.appendChild(screen_img);
        screen_live.appendChild(screen_live_btn);
        screen_notif.appendChild(screen_notif_check);
        screen_timer.appendChild(screen_timer_btn);
        //screen_replay.appendChild(screen_replay_btn);
        screen.appendChild(screen_live);
        screen.appendChild(screen_name);
        screen.appendChild(screen_notif);
        screen.appendChild(screen_timer);
        //screen.appendChild(screen_replay);
        tableScreen.appendChild(screen);
    }

    document.getElementById('table-screen-div').appendChild(tableScreen);

}



function runTimer(screen_id){
    console.log('runTimer function');
    //get cameraID
    var hidden = document.getElementById('timer-camera-id-input');
    hidden.setAttribute('value',screen_id);
    //getRecord of the camera
    if(document.getElementById('timer-table-record-list')){
        console.log('tb exist -> remove');
        var tb = document.getElementById('timer-table-record-list');
        document.getElementById('timer-records-div').removeChild(tb);
    }
    console.log('get records from server');
    socket.emit('getRecords', screen_id);
}


function runReplay(){
    console.log('runReplay function');
    var select = document.getElementById('select-replay');
    while(select.firstChild){
        select.removeChild(select.firstChild);
    }
    socket.emit('getReplays');
}


function addReplay(replay_id){
    console.log('addReplay function');
    var opt = document.createElement('option');
    var name = document.createTextNode('replay '+replay_id);

    opt.value = 'replay-'+replay_id;
    opt.appendChild(name);

    document.getElementById('select-replay').appendChild(opt);

}


function runLive(screen_id){
    console.log('runLive function');

    document.getElementById('modal-live-close').setAttribute('onclick','stopStream('+screen_id+');');
    document.getElementById('modal-live-x').setAttribute('onclick','stopStream('+screen_id+');');
    document.getElementById('screen-'+screen_id+'-timer-btn').disabled = true;
    document.getElementById('screen-'+screen_id+'-notif-check').disabled = true;

    socket.emit('startStream',screen_id);

    var img = document.getElementById('live-stream-img');
    stream = setInterval(function(){
        console.log('new source');
        img.src = '/public/images/stream_camera_'+screen_id+'.jpg?v='+ new Date().getTime();
    },1000);
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


function runName(screen_id){
    console.log('runName function');
    var newName = document.createElement('input');
    newName.id = 'screen-'+screen_id+'-newName';
    newName.type = 'text';
    newName.autofocus = true;
    newName.setAttribute('onblur','changeName('+screen_id+');');
    var screen_name = document.getElementById('screen-'+screen_id+'-name');
    screen_name.replaceChild(newName, screen_name.firstChild);
}

function changeName(screen_id){
    console.log('changeName function');
    var name = document.getElementById('screen-'+screen_id+'-newName').value;
    var newName = document.createTextNode(name);
    var bold = document.createElement('b');
    bold.appendChild(newName);
    var screen_name = document.getElementById('screen-'+screen_id+'-name');
    screen_name.replaceChild(bold, screen_name.firstChild);
    socket.emit('changeCameraName', {cameraID: screen_id, name: name});
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


function playReplay(){
    console.log('playReplay function');
    //create video
    var video = document.createElement('video');
    video.id = 'video-replay';
    video.setAttribute('controls',true);
    video.setAttribute('width','600px');
    //create source
    var source = document.createElement('source');
    var opt = document.getElementById('select-replay').value;
    var path = '/public/videos/'+opt;
    source.setAttribute('src',path);
    source.setAttribute('type','video/mp4');
    video.appendChild(source);

    var display_div = document.getElementById('display-replay-div');
    if(display_div.firstChild){
        display_div.removeChild(display_div.firstChild);
    }
    display_div.appendChild(video);
}
