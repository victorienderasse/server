/**
 * Created by Victorien on 11-04-17.
 */

var userID = document.getElementById('userID').innerHTML;

socket.on('QRCodeDone', function(ID){

    console.log('QRCodeDone');

    if(ID == userID){
        var img = document.getElementById('imgQRCode');
        if(img.firstChild){
            img.removeChild(img.firstChild);
        }
        img.src = '../images/qrcode'+ID+'.jpg';
        document.getElementById('data').setAttribute('style','display:none');
        document.getElementById('qrcode').setAttribute('style','display;block');

        $('#loading').hide('slow', function(){
            $('#qrcode').show('slow');
        });
    }

});


socket.on('newCameraConnectionRes', function(userID){
    console.log('newCameraConnectionRes event');
    $('#qrcode').hide('slow', function(){
        $('#connectionOK').show('slow');
    });
    setTimeout(function(){
        redirectURL(serverURL+'/display?userID='+userID);
    },5000);
});

$(function(){
    $('#data, #qrcode, #loading').hide();
    
    $('#back').click(function(){
        redirectURL(serverURL+'/display?userID='+userID);
    });
});

document.getElementById('infoBtn').addEventListener('click', function(){
    $('#info').hide('slow', function(){
        $('#data').show('slow');
    });
});

document.getElementById('dataBtn').addEventListener('click', function(){
    var form = document.getElementById('dataForm');
    var ssid = form.ssid.value;
    var password = form.password.value;
    
    if(ssid != '' && password != ''){
        socket.emit('setQRCode', {userID: userID, ssid: ssid, password: password});
        $('#data').hide('slow', function(){
            $('#loading').show('slow');
        });
    }else{
        displayMessage({title:'Alerte',message:'Veuillez remplir tous les champs',action:'resetMessage'});
    }
});