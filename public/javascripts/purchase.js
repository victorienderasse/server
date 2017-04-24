/**
 * Created by Victorien on 22-04-17.
 */
$(function(){

    $('#back').click(function(){
        redirectURL(serverURL+'/');
    });

    $('#confirm, #ok').click(function(){
        $('#purchase-select').slideToggle('slow');
        $('#purchase-bill').slideToggle('slow');
    });

});


function updatePrice(value){
    $('#nbPrice').text(value+' x 50€');
    var price = value * 50;
    $('#sumPrice').text(price+'€');
}