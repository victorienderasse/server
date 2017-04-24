/**
 * Created by Victorien on 02-12-16.
 */

//Event--------------------------------


//Display error messages
socket.on('message',function(data){
    console.log('message event');
    displayMessage(data);
});


socket.on('redirect', function(url){
    redirectURL(url);
});


//Button-------------------------------

//Sign In
document.getElementById('signin-confirm-btn').addEventListener('click',function(){
    console.log('signin btn');
    var signinForm = document.getElementById('signin-form');
    const password = signinForm.password.value;
    const confPassword = signinForm.confPassword.value;
    if (password != confPassword) {
        displayMessage({title:'Alerte',message:'Password non identique'});
    }else{
        $.post(serverURL+'/signin',{name:'test',email:'test',password:password,passwordConf:confPassword});
        /*
        socket.emit('signin', {
            name: signinForm.name.value,
            email: signinForm.email.value,
            password: signinForm.password.value
        });
        */
    }
});


//Functions ---------------------------------------------

function emptyLoginForm(){
    console.log('emptyLoginForm function');
    var myForm = document.getElementById('login-form');
    myForm.email.value = '';
    myForm.password.value = '';
}

