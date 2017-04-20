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
        var camera = document.createElement('div');
        var WifiDiv = document.createElement('div');
        var serialDiv = document.createElement('div');
        var name = document.createTextNode('camera'+data[i].cameraName);
        camera.appendChild(name);
        var btn = document.createElement('button');
        btn.setAttribute('onclick','displayOption('+data[i].cameraID+');')
        var btnIcon = document.createElement('span');
        btnIcon.className = 'glyphicon glyphicon-chevron-down';
        btn.appendChild(btnIcon);
        camera.appendChild(btn);
        var wifi = document.createTextNode('Add Wifi Network');
        var wifiIcon = document.createElement('span');
        wifiIcon.className = 'glyphicon glyphicon-plus';
        WifiDiv.appendChild(wifi);
        var serial = document.createTextNode(data[i].serial);
        serialDiv.appendChild(serial);
        var option = document.createElement('div');
        option.id = 'optionCamera'+data[i].cameraID;
        option.className = 'optionCamera';
        option.appendChild(WifiDiv);
        option.appendChild(serialDiv);

        table.appendChild(camera);
        table.appendChild(option);
    }

    $('.optionCamera').hide();

});


function updateUser(){
    $(function(){
        $('#test').slideToggle();
    });
}


function displayOption(cameraID){
    $('#optionCamera'+cameraID).show('slow');
}