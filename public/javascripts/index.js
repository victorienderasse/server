/**
 * Created by Victorien on 02-12-16.
 */

//Event--------------------------------

$(function(){

    $('#login-btn').click(function(){
        var email = $('#loginEmail').val();
        var password = $('#loginPassword').val();
        if(email != '' && password != ''){
            socket.emit('login',{email:email, password:password});
        }else{
            displayMessage({title:'Alerte',message:'Veuillez remplir tous les champs'});
        }

    });

});


//Display error messages
socket.on('message',function(data){
    console.log('message event');
    displayMessage(data);
});


socket.on('redirect', function(url){
    redirectURL(url);
});


socket.on('loginRes', function(data){
    console.log('loginRes event');
    if(data.emailExist){
        if(data.passwordWrong){
            displayMessage({title:'Alerte',message:'Le mot de passe est incorrect'});
        }else{
            $.post(serverURL+'/login',{userID:data.userID},function(data){
                window.location.href = '/display';
            });
        }
    }else{
        displayMessage({title:'Alerte',message:'Email inexistante'});
    }
});


socket.on('signinRes', function(data){
    if(data.emailExist){
        displayMessage({title:'Alerte',message:'Email déjà utilisé'});
    }else{
        $.post(serverURL+'/login',{userID:data.userID}, function(data){
            window.location.href = '/display';
        });
    }
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
        socket.emit('signin2',{name: signinForm.name.value, email: signinForm.email.value, phone:signinForm.phone.value, password: signinForm.password.value});
    }
});




//Functions ---------------------------------------------

function emptyLoginForm(){
    console.log('emptyLoginForm function');
    var myForm = document.getElementById('login-form');
    myForm.email.value = '';
    myForm.password.value = '';
}

