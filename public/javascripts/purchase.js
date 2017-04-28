/**
 * Created by Victorien on 22-04-17.
 */

var userID = 1;

$(function(){

    $('#back').click(function(){
        redirectURL(serverURL+'/');
    });

    $('#confirm-select').click(function(){
        $('#purchase-select').slideToggle('slow');
        $('#purchase-bill').slideToggle('slow');
        socket.emit('purchaseConfirm',{userID:userID, nbCamera: $('#nbCamera').val()});
    });

});


function updatePrice(value){
    $('#nbPrice').text(value+' x 50€');
    var price = value * 50;
    $('#sumPrice').text(price+'€');
}