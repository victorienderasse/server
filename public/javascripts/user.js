/**
 * Created by Victorien on 19-04-17.
 */
var userID = document.getElementById('userID').innerHTML;

//socket.emit('getInfoUser',userID);

$(function(){
    $('#test').fadeOut('slow', function(){
        $(this).fadeIn('slow');
    })
});

socket.on('getInfoUserRes', function(data){
    console.log('getInfoUserRes event');

    document.getElementById('userName').innerHTML = data[0].userName;
    document.getElementById('userEmail').innerHTML = data[0].email;
    if(data[0].phone == '' || data[0].phone == 'undefined' || data[0].phone == null){
        document.getElementById('userPhone').innerHTML = 'No phone number';
    }else{
        document.getElementById('userPhone').innerHTML = data[0].phone;
    }

    var table = document.getElementById('cameraList');
    for(var i=0;i<data.length;i++){
        var camera = document.createElement('tr');
        var nameTD = document.createElement('td');
        var enableTD = document.getElementById('td');
    }

});


function displayForm(){
    document.getElementById('displayUser').setAttribute('style','display:none;');
    document.getElementById('displayForm').setAttribute('style','display:block;');
}


function updateUser(){

}