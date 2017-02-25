/**
 * Created by Victorien on 24-02-17.
 */

function redirectURL(url){
    console.log('redirectURL function');
    window.location = url;
}


function displayMessage(data){
    console.log('displayMessage function');
    //Action
    if (data.action == "redirect-index"){
        redirectURL(serverURL);
    }
    if (data.action == 'resetMessage'){
        setTimeout(function(){
            resetMessage();
        },5000)
    }
    //type
    if (data.title == 'Alerte'){
        document.getElementById('message-div').className = 'alert alert-danger';
    }
    if (data.title == 'Bravo'){
        document.getElementById('message-div').className = 'alert alert-success';
    }
    if (data.title == 'Info'){
        document.getElementById('message-div').className = 'alert alert-info';
    }
    //add message and title
    document.getElementById('message-title').innerHTML = data.title;
    document.getElementById('message-body').innerHTML = data.message;
}


function resetMessage(){
    document.getElementById('message-div').className = '';
    document.getElementById('message-title').innerHTML = '';
    document.getElementById('message-body').innerHTML = '';
}