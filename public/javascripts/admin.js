/**
 * Created by Victorien on 23-02-17.
 */

//Connection to the server------------------
var socket = io.connect(serverURL);

//Events------------------------------------
socket.emit('client','display');

//Actions-----------------------------------
var password = prompt('Entrez mot de passe admin');
if (password == 'adminadmin'){
    document.getElementById('admin').style.display = 'block';
} 
