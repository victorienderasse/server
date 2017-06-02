/**
 * Created by Victorien on 02-12-16.
 */

//Event--------------------------------

$(function(){



    $('body').scrollTop('0');

    var widthIntro = window.innerWidth-2;
    var heightIntro = window.innerHeight;
    var heightImg = heightIntro - 50;
    //var widthImg = widthIntro - 17;
    var widthImg = widthIntro - 17;
    $('#intro').attr('style','width:'+widthImg+'px; height:'+heightImg+'px;margin-top:50px; background-image: url("/public/images/Intro1.jpg"); background-repeat: no-repeat; background-size: '+widthImg+'px '+heightImg+'px;');

    var heightDiv = (heightIntro)*0.66;
    $('#live, #planification').attr('style','width:'+widthIntro+'px; height:'+heightDiv+'px;');
    $('#detection').attr('style','width:'+widthIntro+'px; height:'+heightDiv+'px; background-color:#BCE5F0;')

    var widthFooter = widthIntro;
    $('footer').attr('style','background-color:#333; color:#fff; width:'+widthFooter+'px;height:400px;');
    

    $('#menu').attr('style','background-color:#6CB4CE');
    

    $('#login-btn').click(function(){
        var email = $('#loginEmail').val();
        var password = $('#loginPassword').val();
        if(email != '' && password != ''){
            socket.emit('login',{email:email, password:password});
        }else{
            displayMessage({title:'Alerte',message:'Veuillez remplir tous les champs'});
        }

    });


    $('#signin-confirm-btn').click(function(){
        console.log('signin btn');
        var signinForm = document.getElementById('signin-form');
        const password = signinForm.signinPassword.value;
        const confPassword = signinForm.signinPasswordConf.value;
        if (password != confPassword) {
            displayMessage({title:'Alerte',message:'Password non identique'});
        }else{
            socket.emit('signin',{name: signinForm.signinName.value, email: signinForm.signinEmail.value, phone:signinForm.signinPhone.value, password: password});
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




//Functions ---------------------------------------------

function emptyLoginForm(){
    console.log('emptyLoginForm function');
    var myForm = document.getElementById('login-form');
    myForm.email.value = '';
    myForm.password.value = '';
}

