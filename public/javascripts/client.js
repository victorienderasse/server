/**
 * Created by Victorien on 02-12-16.
 */
var socket = io.connect(serverURL);

socket.emit('client','client');

socket.on('redirect', function(url){
    window.location = url;
});