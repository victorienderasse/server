/**
 * Created by Victorien on 19-04-17.
 */

socket.emit('getInfoUser',userID);

$(function(){
    $('#form').hide();

    $('#affiche').click(function(){
        $('#option').slideToggle('slow');
    });
    
    $('#back').click(function(){
        redirectURL(serverURL+'/display');
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
        document.getElementById('updateUser').disabled = true;
        if($('#name').val() == '' || $('#email').val() == '' || $('#phone').val() == '' || $('#password').val() == '' || $('#passwordConf').val() == ''){
            document.getElementById('updateUser').innerHTML = 'Confirmer';
            document.getElementById('updateUser').disabled = false;
            displayMessage({title:'Alerte', message:'Erreur, merci de remplir tous les champs', action:'resetMessage'});
        }else{
            if($('#password').val() != $('#passwordConf').val()){
                document.getElementById('updateUser').innerHTML = 'Confirmer';
                document.getElementById('updateUser').disabled = false;
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


    $('#updateUserCancel').click(function(){
        $('#form').hide('slow', function(){
            $('#user').show('slow');
        });
    });

});


socket.on('getInfoUserRes', function(data){
    console.log('getInfoUserRes event');

    var user = data.user;
    var tbCamera = data.cameras;

    $('#userName').html('<b>'+user.name+'</b>');
    $('#userEmail').html('<b>'+user.email+'</b>');
    $('#userPhone').html('<b>'+user.phone+'</b>');
    if(tbCamera.length>0){
        $('#nbCamera').html('<h4>Vous possédez '+tbCamera.length+' caméras</h4>');
    }else{
        $('#nbCamera').html('<h4>Vous ne possédez aucune caméras</h4>');
    }


    var table = document.getElementById('infoCamera');
    for(var i=0;i<tbCamera.length;i++){

        //Camera

        var camera = document.createElement('div');
        camera.id = 'camera'+tbCamera[i].cameraID;
        camera.setAttribute('style','width:100%; height:50px; border-style:outset');
        var nameTitle = document.createElement('span');
        nameTitle.id = 'name-camera'+tbCamera[i].cameraID;
        nameTitle.title = 'Cliquer pour changer le nom de la caméra';
        nameTitle.setAttribute('style','font-weight: bold; font-size: 20px;position:absolute; left:40px; margin-top:10px;');
        nameTitle.setAttribute('onclick','changeName('+tbCamera[i].cameraID+');');
        var name = document.createTextNode(tbCamera[i].name);
        var btn = document.createElement('button');
        btn.id = 'btn-camera'+tbCamera[i].cameraID;
        btn.setAttribute('style','border:0px; background-color:#fff; position:absolute; right:20px;;');
        btn.setAttribute('onclick','displayOption('+tbCamera[i].cameraID+');');
        btn.className = 'btn btn-lg';
        var btnIcon = document.createElement('span');
        btnIcon.id = 'btnIcon-camera'+tbCamera[i].cameraID;
        btnIcon.className = 'glyphicon glyphicon-chevron-down';
        var stateTitle = document.createElement('span');
        stateTitle.setAttribute('style','font-style:oblique; font-size: 15px; position:absolute; left:200px; margin-top:20px');
        var state;
        if(tbCamera[i].enable == 1){
            state = document.createTextNode('Online');
        }else{
            state = document.createTextNode('Offline');
        }
        state.className = 'help-block navbar-right';

        btn.appendChild(btnIcon);
        nameTitle.appendChild(name);
        stateTitle.appendChild(state);
        camera.appendChild(nameTitle);
        camera.appendChild(stateTitle);
        camera.appendChild(btn);

        //WIFI

        var wifiDiv = document.createElement('div');
        wifiDiv.setAttribute('style','height:40px');
        var wifiSpan = document.createElement('span');
        wifiSpan.setAttribute('style','font-size: 20px;position:absolute; left:60px; margin-top:10px;');
        var wifi = document.createTextNode('Ajouter un réseau WiFi');
        var wifiBtn = document.createElement('button');
        wifiBtn.className = 'btn btn-lg';
        wifiBtn.setAttribute('style','border:0px; background-color:#fff; position:absolute; right:20px;');
        wifiBtn.setAttribute('onclick','addWifi('+tbCamera[i].cameraID+');');
        if(tbCamera[i].enable == 0 || tbCamera[i].state != 0){
            wifiBtn.disabled = true;
            wifiBtn.title = 'Veuillez allumer la caméra ou arrêter le processus en cours pour ajouter un nouveau réseau WiFi';
        }else{
            wifiBtn.title = 'Cliquer pour ajouter un nouveau réseaux Wifi';
        }
        var wifiIcon = document.createElement('span');
        wifiIcon.className = 'glyphicon glyphicon-plus';

        wifiSpan.appendChild(wifi);
        wifiBtn.appendChild(wifiIcon);
        wifiDiv.appendChild(wifiSpan);
        wifiDiv.appendChild(wifiBtn);

        //SERIAL

        var serialDiv = document.createElement('div');
        serialDiv.setAttribute('style','height:40px');
        var serialSpan = document.createElement('span');
        serialSpan.setAttribute('style','font-weight:bold; font-size:20px; position:absolute; left:280px; margin-top:10px');
        var serial = document.createTextNode(tbCamera[i].serial);
        serialDiv.appendChild(serial);
        var serialTitleSpan = document.createElement('span');
        serialTitleSpan.setAttribute('style','font-size:20px; position:absolute; left:60px; margin-top:10px')
        var serialTitle = document.createTextNode('Numéro de série : ');

        serialSpan.appendChild(serial);
        serialTitleSpan.appendChild(serialTitle);
        serialDiv.appendChild(serialTitleSpan);
        serialDiv.appendChild(serialSpan);

        //SHARED CAMERA

        var sharedDiv = document.createElement('div');
        sharedDiv.setAttribute('style','height:40px');
        var sharedSpan = document.createElement('span');
        sharedSpan.setAttribute('style','font-size: 20px;position:absolute; left:60px; margin-top:10px;');
        var shared = document.createTextNode('Partager cette caméra');
        var sharedBtn = document.createElement('button');
        sharedBtn.title = 'Cliquer pour partager cette caméra avec quelqu\'un d\'autre';
        sharedBtn. className = 'btn btn-lg';
        sharedBtn.setAttribute('style','border:0px; background-color:#fff; position:absolute; right:20px;');
        sharedBtn.setAttribute('onclick','shareCamera('+tbCamera[i].cameraID+');');
        var sharedIcon = document.createElement('span');
        sharedIcon.className = 'glyphicon glyphicon-share';

        sharedSpan.appendChild(shared);
        sharedBtn.appendChild(sharedIcon);
        sharedDiv.appendChild(sharedSpan);
        sharedDiv.appendChild(sharedBtn);

        //OPTION

        var option = document.createElement('div');
        option.id = 'optionCamera'+tbCamera[i].cameraID;
        option.className = 'optionCamera';
        option.setAttribute('style','display: none;');
        option.appendChild(wifiDiv);
        option.appendChild(sharedDiv);
        option.appendChild(serialDiv);

        //TABLE

        table.appendChild(camera);
        table.appendChild(option);
    }

    $('.optionCamera').hide();

});


socket.on('updateUserRes', function(isOK){
    console.log('updateUserRes ebent');
    if(isOK){
        displayMessage({title:'Bravo',message:'Vos informations ont correctemment été modifiés'});
        setTimeout(function(){
            redirectURL(serverURL+'/user?userID='+userID);
        },3000);
    }else{
        document.getElementById('updateUser').innerHTML = 'Confirmer';
        document.getElementById('updateUser').disabled = true;
        displayMessage({title:'Alerte',message:'Erreur, l\'email est déjà utilisée',action:'resetMessage'});
    }
});




function displayOption(cameraID){
    $('#btnIcon-camera'+cameraID).toggleClass('glyphicon-chevron-down glyphicon-chevron-right');
    $('#optionCamera'+cameraID).toggle('slow');
}


function changeName(cameraID){
    var newName = prompt('Nouveu Nom : ');
    if(newName != '' && newName != null){
        var name = document.createTextNode(newName);
        document.getElementById('name-camera'+cameraID).replaceChild(name,document.getElementById('name-camera'+cameraID).firstChild);
        socket.emit('changeCameraName',{cameraID: cameraID, name:newName});
    }
}


function addWifi(cameraID){
    console.log('addWifi btn');
    socket.emit('addWifi',cameraID);
    redirectURL(serverURL+'/addCamera?userID='+userID);
}


function shareCamera(cameraID){
    console.log('shareCamera');
    var email = prompt('Entrez l\'adresse email de la personne avec qui vous souhiatez partager la caméra : ');
    var password = prompt('Merci de confirmer votre mot de passe');
    socket.emit('shareCamera',{email:email, password: password, userID:userID, cameraID:cameraID});
}