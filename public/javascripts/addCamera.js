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
        img.src = '../images/qrcode'+data.userID+'.jpg';
        document.getElementById('data').setAttribute('style','display:none');
        document.getElementById('qrcode').setAttribute('style','display;block');
    }else{
        console.log('userID NOK -> '+ID+' != '+userID);
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