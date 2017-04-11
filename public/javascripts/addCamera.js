/**
 * Created by Victorien on 11-04-17.
 */

var userID = document.getElementById('userID').innerHTML;

socket.on('QRCodeDone', function(userID){

    console.log('QRCodeDone');

    if(data.userID == userID){
        var img = document.getElementById('imgQRCode');
        if(img.firstChild){
            img.removeChild(img.firstChild);
        }
        img.src = '../images/qrcode'+data.userID+'.jpg';
    }else{
        console.log('userID NOK -> '+data.userID+' != '+userID);
    }

});


document.getElementById('infoBtn').addEventListener('click', function(){
    document.getElementById('info').setAttribute('style','display:none;');
    document.getElementById('data').setAttribute('style','display:block');
});

document.getElementById('dataBtn').addEventListener('click', function(){
    var form = document.getElementById('dataForm');
    var ssid = form.ssid.value;
    var password = form.password.value;
    
    if(ssid != '' && password != ''){
        socket.emit('setQRCode', {userID: userID, ssid: ssid, password: password});
    }else{
        console.log('erreur');
    }
});