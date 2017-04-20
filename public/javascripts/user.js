/**
 * Created by Victorien on 19-04-17.
 */
var userID = document.getElementById('userID').innerHTML;

socket.emit('getInfoUser',userID);

$(function(){
    $('#option, #form').hide();

    $('#affiche').click(function(){
        $('#option').first().show('slow');
    });

    $('#displayForm').click(function(){
        $('#user').hide('slow', function(){
            $('#form').show('slow');
        });
    })
});

socket.on('getInfoUserRes', function(data){
    console.log('getInfoUserRes event');

    $('#userName').html('<b>'+data[0].userName+'</b>');
    $('#userEmail').html('<b>'+data[0].email+'</b>');
    $('#userPhone').html('<b>'+data[0].phone+'</b>');


    var table = document.getElementById('infoCamera');
    for(var i=0;i<data.length;i++){

        //Camera

        var camera = document.createElement('div');
        camera.id = 'camera'+data[i].cameraID;
        var name = document.createTextNode(data[i].cameraName);
        var state;
        if(data[i].state == 1){
            state = document.createTextNode('Online');
            camera.setAttribute('style','width:100%; height:50px');
        }else{
            state = document.createTextNode('Offline');
            camera.setAttribute('style','width:100%; height:50px; background-color:#FAECEC');
        }
        state.className = 'help-block navbar-right';
        var btn = document.createElement('button');
        //btn.setAttribute('onclick','displayOption('+data[i].cameraID+');');
        var btnIcon = document.createElement('span');
        btnIcon.id = 'btnIcon-camera'+data[i].cameraID;
        btnIcon.className = 'glyphicon glyphicon-chevron-down';
        var hr = document.createElement('hr');

        btn.appendChild(btnIcon);
        camera.appendChild(name);
        camera.appendChild(state);
        camera.appendChild(hr);
        camera.appendChild(btn);

        //WIFI

        var WifiDiv = document.createElement('div');
        var wifi = document.createTextNode('Add Wifi Network');
        var wifiIcon = document.createElement('span');
        wifiIcon.className = 'glyphicon glyphicon-plus';

        WifiDiv.appendChild(wifi);

        //SERIAL

        var serialDiv = document.createElement('div');
        var serial = document.createTextNode(data[i].serial);
        serialDiv.appendChild(serial);

        //OPTION

        var option = document.createElement('div');
        option.id = 'optionCamera'+data[i].cameraID;
        option.className = 'optionCamera';
        option.appendChild(WifiDiv);
        option.appendChild(serialDiv);

        //TABLE

        table.appendChild(camera);
        table.appendChild(option);
    }

    $('.optionCamera').hide();

});




function displayOption(cameraID){
    $('#optionCamera'+cameraID).show('slow', function(){
        $(this).attr('onclick','hideOption('+cameraID+')');
        $('#btnIcon-camera'+cameraID).toggleClass('glyphicon-chevron-down glyphicon-chevron-right');
    });
}

function hideOption(cameraID){
    $('#optionCamera'+cameraID).hide('slow', function(){
        $(this).attr('onclick','displayOption('+cameraID+')');
        $('#btnIcon-camera'+cameraID).toggleClass('glyphicon-chevron-down glyphicon-chevron-right');
    });
}