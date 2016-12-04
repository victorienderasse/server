/**
 * Created by Victorien on 02-12-16.
 */
//Event--------------------------------

//Display error messages
socket.on('msgError', function(data){
    console.log(data);
});


socket.on('loginSuccess', function(userID){

});

//Button-------------------------------

//Sign In
document.getElementById('signin-confirm-btn').addEventListener('click',function(){
    console.log('signin btn');
    var signinForm = document.getElementById('signin-form');
    const password = signinForm.password.value;
    const confPassword = signinForm.confPassword.value;
    if (password != confPassword) {
        console.log('erreur passwd');
    }else{
        socket.emit('signin', {
            name: signinForm.name.value,
            email: signinForm.email.value,
            password: signinForm.password.value
        });
    }
});

//Login
document.getElementById('login-confirm-btn').addEventListener('click', function(){
    console.log('login btn');
    loginForm = document.getElementById('login-form');
    socket.emit('login', {
        email: loginForm.email.value,
        password: loginForm.password.value
    });
});