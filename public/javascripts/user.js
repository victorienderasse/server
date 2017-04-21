/**
 * Created by Victorien on 19-04-17.
 */
var userID = document.getElementById('userID').innerHTML;

socket.emit('getInfoUser',userID);

$(function(){
    $('#form').hide();

    $('#affiche').click(function(){
        $('#option').first().show('slow');
    });

    $('#displayForm').click(function(){
        $('#user').hide('slow', function(){
            $('#form').show('slow');
        });
        $('#name').attr('value',$('#userName').text());
        $('#email').attr('value',$('#userEmail').text());
        $('#phone').attr('value',$('#userPhone').text());
    });

    $('#updateUser').click(function(){
        document.getElementById('updateUser').innerHTML = 'En cours ..';
        if($('#name').val() == '' || $('#email').val() == '' || $('#phone').val() == '' || $('#password').val() == '' || $('#passwordConf').val() == ''){
            document.getElementById('updateUser').innerHTML = 'Confirmer';
            displayMessage({title:'Alerte', message:'Erreur, merci de remplir tous les champs', action:'resetMessage'});
        }else{
            if($('#password').val() != $('#passwordConf').val()){
                document.getElementById('updateUser').innerHTML = 'Confirmer';
                displayMessage({title:'Alerte', message:'Erreur, Les mots de passes indiquer sont différents', action:'resetMessage'});
            }else{
                socket.emit('updateUser',{
                    userID: userID,
                    name: $('#name').val(),
                    email: $('#email').val(),
                    phone: $('#phone').val(),
                    password: $('#password').val()
                });
            }
        }
    });
});


socket.on('getInfoUserRes', function(data){
    console.log('getInfoUserRes event');

    $('#userName').html('<b>'+data[0].userName+'</b>');
    $('#userEmail').html('<b>'+data[0].email+'</b>');
    $('#userPhone').html('<b>'+data[0].phone+'</b>');
    $('#nbCamera').html('<h4>Vous possédez '+data.length+' caméras</h4>');


    var table = document.getElementById('infoCamera');
    for(var i=0;i<data.length;i++){

        //Camera

        var camera = document.createElement('div');
        camera.id = 'camera'+data[i].cameraID;
        var nameTitle = document.createElement('span');
        nameTitle.setAttribute('style','font-weight: bold; font-size: 20px;position:absolute; left:40px; margin-top:10px;');
        var name = document.createTextNode(data[i].cameraName);
        var btn = document.createElement('button');
        btn.id = 'btn-camera'+data[i].cameraID;
        btn.setAttribute('onclick','displayOption('+data[i].cameraID+');');
        btn.className = 'btn btn-lg';
        //btn.setAttribute('style','position:absolute; right:0; border-left: 2px solid #ECECEC; border: 0px;');
        var btnIcon = document.createElement('span');
        btnIcon.id = 'btnIcon-camera'+data[i].cameraID;
        btnIcon.className = 'glyphicon glyphicon-chevron-down';
        //btnIcon.setAttribute('style','margin-right:0px')
        var stateTitle = document.createElement('span');
        stateTitle.setAttribute('style','font-style:oblique; font-size: 15px; position:absolute; left:200px; margin-top:20px');
        var state;
        if(data[i].state != 2){
            state = document.createTextNode('Online');
            btn.setAttribute('style','border:0px; background-color:#fff; position:absolute; right:20px;; border-left:1px #ECECEC;');
            camera.setAttribute('style','width:100%; height:50px; border-style:outset');
        }else{
            state = document.createTextNode('Offline');
            btn.setAttribute('style','border:opx; background-color:#FAECEC');
            camera.setAttribute('style','width:100%; height:50px; background-color:#FAECEC');
        }
        state.className = 'help-block navbar-right';

        btn.appendChild(btnIcon);
        nameTitle.appendChild(name);
        stateTitle.appendChild(state);
        camera.appendChild(nameTitle);
        camera.appendChild(stateTitle);
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


socket.on('updateUserRes', function(isOK){
    if(isOK){
        displayMessage({title:'Bravo',message:'Vos informations ont correctemment été modifiés'});
        setTimeout(function(){
            redirect(serverURL+'/user?userID='+userID);
        },3000);
    }else{
        document.getElementById('updateUser').innerHTML = 'Confirmer';
        displayMessage({title:'Alerte',message'Erreur, l\'email est déjà utilisée'});
    }
});




function displayOption(cameraID){
    $('#btnIcon-camera'+cameraID).toggleClass('glyphicon-chevron-down glyphicon-chevron-right');
    $('#btn-camera'+cameraID).attr('onclick','hideOption('+cameraID+')');
    $('#optionCamera'+cameraID).show('slow');
}

function hideOption(cameraID){
    $('#btn-camera'+cameraID).attr('onclick','displayOption('+cameraID+')');
    $('#btnIcon-camera'+cameraID).toggleClass('glyphicon-chevron-down glyphicon-chevron-right');
    $('#optionCamera'+cameraID).hide('slow');
}