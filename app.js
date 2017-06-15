
//Global var---------------------------------------------------------------------------------
const express = require('express');
const path = require('path');
const favicon = require('serve-favicon');
const logger = require('morgan');
const cookieParser = require('cookie-parser');
const bodyParser = require('body-parser');
const fs = require('fs');
const passHash = require('password-hash');
const http = require('http');
const mysql = require('mysql');
const routes = require('./routes/index');
const exec = require('child_process').exec;
const twilio = require('twilio');
var session = require('express-session');

const port = 3000;
const serverURL = 'http://victorienderasse.be:3000';
const serverUser = 'victorien';
const app = express();

const server = http.createServer(app);
const io = require('socket.io').listen(server);

const connection = mysql.createConnection({
  host : 'localhost',
  user : 'root',
  password : '221193m',
  database : 'TFE'
});

//const client = new twilio.RestClient('AC175fe55d0a0d00d7094c00338f548ec5','956f723bfa80087e696300e1358f46cb');
const client = new twilio.RestClient('ACd630e172c70376dc380846e46304f004','c09336a02e9a514a9a65af19fe2f994b');



//YOLO ?---------------------------------------------------------------------------------------
// view engine setup
app.set('views', path.join(__dirname, 'views'));
app.set('view engine', 'ejs');
app.set('port', port);
//app.use(favicon(path.join(__dirname, 'public', 'favicon.ico')));
app.use(express.static(path.join(__dirname, 'public')));
app.use('/public/javascripts', express.static(path.join(__dirname, 'public/javascripts')));
app.use('/public/stylesheets', express.static(path.join(__dirname, 'public/stylesheets')));
app.use('/public/images', express.static(path.join(__dirname, 'public/images')));
app.use('/public/images', express.static(path.join(__dirname, 'public/cameras')));
app.use('/public/images', express.static(path.join(__dirname, 'public/videos')));
//app.use(logger('dev'));
app.use(bodyParser.json());
app.use(bodyParser.urlencoded({ extended: false }));
app.use(cookieParser());
app.use(session({
  secret: "tfe-secret",
  resave: true,
  saveUninitialized: true
}));

app.use('/', routes);

//Receive data from client------------------------------------------------------------------

io.sockets.on('connection', function(socket){
  
  //EVENTS---------------------------------------------------------------------------------------------
  
  socket.on('client', function (data) {
    /*
    "Un client vient de se connecter"
     */
    console.log('client connected');
  });

  socket.on('rpiip', function(ip){
      console.log('RPI IP: '+ip);
    exec('echo "'+ip+'" >> /home/victorien/rpiip', function(err){
      if(err) throw err;
    });
  });

  socket.on('camera', function (serial) {
    /*
    "Une caméra vient de se connecter"

    Paramètre:
    - serial: Le numéra de série de la caméra venant juste de se connecter au serveur

    Evènement renvoyé:
    - 'updateCameraEnable': Permet la MàJ de l'UI
      - cameraID: L'ID de la caméra en question
      - enable: L'état de la caméra en question

    Description:
    - Recherche de la caméra en question sur base du serial.
    - Si socketID est NULL (1e connexion de la caméra au serveur)
      - Création des dossiers et sous-dossiers
      - MàJ du champ 'socketID' de la caméra en DB
      - MàJ de l'UI
    - Si socketID non NULL (la caméra s'est déjà connecté au serveur auparavant)
      - MàJ du champ 'socketID' en DB
      - MàJ de l'UI
     */
    console.log('camera connecté');
    //check camera exist
    const getSerial = 'SELECT * FROM camera WHERE serial = "'+serial+'"';
    connection.query(getSerial , function(err, rows){
      if(err)throw err;
      if(rows.length > 0) {
        console.log('camera exist');
        const setSocketID = 'UPDATE camera SET socketID = "'+socket.id+'", enable = 1 WHERE cameraID = '+rows[0].cameraID;
        if(rows[0].socketID == null || rows[0].socketID == '' || rows[0].socketID == 'undefined'){
          console.log('first connection');
          const createFolder = 'mkdir -p /home/'+serverUser+'/TFE/source/server/public/cameras/camera'+rows[0].cameraID+'/videos /home/'+serverUser+'/TFE/source/server/public/cameras/camera'+rows[0].cameraID+'/live';
          exec(createFolder, function(error,stdout, stderr){
            if (err)throw err;
          });
          connection.query(setSocketID, function(err){
            if (err)throw err;
            io.emit('updateCameraEnable', {cameraID:rows[0].cameraID, enable:true});
          });
        }else{
          console.log('not first connection');
          //Camera already added -> update socketID
          connection.query(setSocketID, function(err){
            if (err)throw err;
            io.emit('updateCameraEnable', {cameraID:rows[0].cameraID, enable:true});
          });
        }
      }else{
        console.log('ERROR: camera not in DB');
      }
    });
  });

  
  socket.on('getCamera', function(userID){
    /*
    "On veut récupérer les caméras de l'utilisateur pour l'interface Display"

    Paramètre:
    - userID: ID de l'utilisateur

    Evènement renvoyé:
    - 'sendCamera': Permet l'affichage des caméras dans l'interface 'display'
      - cameras: tableau de caméra appartenant à l'utilisateur
      - sharedCameras: tableau de caméras partagés avec cet utilisateur

    Description:
    - Concerne l'interface display
    - Récupération des caméras de l'utilisateur en DB
    - Récupération des caméras partagé avec cet utilisateur en DB
    - Envoie des caméras et caméras partagés à l'utilisateur
     */
    console.log('getCamera event -> userID : '+userID);
    const sendCamera = 'SELECT * FROM camera WHERE userID = '+userID;
    connection.query(sendCamera, function (err,cameras) {
      if (err) throw err;
      const getSharedCamera = 'SELECT camera.cameraID, camera.state, camera.enable, camera.name  FROM sharedCamera INNER JOIN camera ON sharedCamera.cameraID = camera.cameraID WHERE sharedCamera.userID = '+userID;
      connection.query(getSharedCamera, function(err,sharedCameras){
        if(err)throw err;
        socket.emit('sendCamera', {cameras: cameras, sharedCameras:sharedCameras});
      });
    });
  });


  socket.on('getCameraUP', function(userID){
    /*
    "On veut récupérer les caméras de l'utilisateur pour l'interface MultiLive"

    Paramètre:
    - UserID: ID de l'utilisateur

    Evènement renvoyé:
    - 'getCameraUPRes': Permet l'affichage des caméras dans l'interface 'multiLive'
      - cameras: Tableau de caméras appartenant à l'utilisateur et partagé avec cet utilisateur

    Description:
    - Concerne l'interface multiLive
    - Récupération des caméras allumée et inactive (enable=1 et state=0) de l'utilisateur
    - Récupération des caméras partagés allumés et inactive partagé avec cet utilisateur
    - Fusion des 2 tableaux
    - Envoie des caméras à l'utilisateur
     */
    console.log('getCameraUP event');
    var getCameraUP = 'SELECT * FROM camera WHERE userID = '+userID+' AND enable = 1 AND state = 0';
    connection.query(getCameraUP, function(err, cameras){
      if(err)throw err;
      const getSharedCamera = 'SELECT camera.name, camera.cameraID, camera.enable, camera.state FROM sharedCamera INNER JOIN camera on sharedCamera.cameraID = camera.cameraID WHERE camera.enable = 1 AND camera.state = 0 AND sharedCamera.userID = '+userID;
      connection.query(getSharedCamera, function(err,sharedCameras){
        if(err)throw err;
        for(var i=0;i<sharedCameras.length;i++){
          cameras.push(sharedCameras[i]);
        }
        socket.emit('getCameraUPRes',cameras);
      });
    });
  });

  
  socket.on('disconnect', function(){
    /*
    "Un client vient de se déconnecter"

    évènement renvoyé:
    - 'updateCameraEnable': Permet la MàJ de l'UI
      - cameraID: ID de la caméra concernée
      - enable: état de la caméra concernée

    Description:
    - Quand un client se déconecte du serveur
    - Si c'est une caméra
      - MàJ de l'état de la caméra (enable = 0, state = 0)
      - MàJ de l'UI
     */
    console.log('disconnected');
    var disconnect = 'SELECT cameraID FROM camera WHERE socketID = "'+ socket.id+'"';
    connection.query(disconnect, function(err, rows){
      if(rows.length > 0){
        var disable = 'UPDATE camera SET enable = 0, state = 0 WHERE cameraID = '+rows[0].cameraID;
        connection.query(disable, function (err) {
          if(err)throw err;
          io.emit('updateCameraEnable', {cameraID:rows[0].cameraID,enable:false});
        });
      }
    });
  });


  socket.on('setTimer', function(data) {
    /*
    "Un client veut créer une nouvelle planification"

    Paramètres:
    - Data: Les informations concernant la planifications
      - begin_hour: Heure de début
      - begin_minute: Minute de début
      - end_hour: Heure de fin
      - end_minute: Minute de fin
      - frequency: Jour de début
      - frequencyEnd: Jour de fin
      - cameraID: ID de la caméra concernée
      - type: le type de planification (detetion de mouvements ou enregistrement continu)
      - once: La planification s'exécute une seule fois ou de manière cyclique

    Evènement renvoyé:
    - 'displayMessage': Permet d'afficher un message à l'utilisateur
      - title: titre du message
      - message: Le message en question

    Description:
    - On récupère les possible planifications actives pour cette caméra
    - Si planifications actives il y a
      - On vérifie que la nouvelle planification ne chevauche aucune autre planifications (avec checkTimer())
      - Si chevauchage il y a
        - Message d'erreur à l'utilisateur
      - Si pas
        - Message de succès à l'utilisateur
        - Appel de la fonction addPlanning() pour l'ajout des données en DB et la suite
    - S'il n'y a aucune planifications active pour cette caméra
        - Appel de la fonction addPlanning() pour l'ajout des données en DB et la suite
     */
    console.log('SetTimer event');
    const checkPlanningEnable = 'SELECT * FROM planning WHERE cameraID = '+data.cameraID+' AND state = 1';
    connection.query(checkPlanningEnable, function(err,rows){
      if(err)throw err;
      if (rows.length > 0){
        var timer = {
          begin: (parseInt(data.begin_hour)*60)+parseInt(data.begin_minute),
          end: (parseInt(data.end_hour)*60)+parseInt(data.end_minute),
          frequency: data.frequency,
          frequencyEnd: data.frequencyEnd
        };
        checkTimer({timer1:rows,timer2:timer}, function(check){
          if(check == 'OK'){
            console.log('Check Timer OK');
            socket.emit('displayMessage',{title: 'Bravo', message: 'Planning success'});
            addPlanning(data);
          }else{
            console.log('NOK');
            socket.emit('displayMessage',{title: 'Alerte', message: 'Erreur Planning'});
          }
        });
      }else{
        addPlanning(data);
      }
    });
  });

  
  socket.on('changeCameraName', function(data){
    /*
    "Le client veut renommer une de ses caméras"

    Paramètres:
    - data: Informations concernant le nouveau nom de la caméra
      - cameraID: ID de la caméra concernée
      - name: Le nouveau nom de la caméra

    Evènement renvoyé:
    - 'displayMessage': Permet d'afficher un message à l'utilisateur
      - title: titre du message
      - message: Le message en question

    Description:
    -MàJ du champ 'name' de la caméra concernée en DB
     */
    console.log('changeCameraName event');
    const changeName = 'UPDATE camera SET name = "'+data.name+'" WHERE cameraID = '+data.cameraID;
    connection.query(changeName, function(err){
      if(err)throw err;
      socket.emit('displayMessage', {title: 'Bravo', message: 'Le nom de votre caméra a été mis à jour !'});
    });
  });

  
  socket.on('getPlanning', function(cameraID){
    /*
    "Le client veut récupérer les planifications d'une de ses caméras"

    Paramètre:
    - cameraID: ID de la caméra concernée

    Evènement renvoyé:
    - 'sendPlannings': Permet l'affichage des planifications de la caméra concernée
      - Plannings: Tableau de planifications de la caméra concernée

    Description:
    - Récupération de toutes les planifications de la caméra en DB
    - Envoie de ces planifications à l'utilisateur
     */
    console.log('getPlanning event');
    const getPlanning = 'SELECT * FROM planning WHERE cameraID = '+cameraID;
    connection.query(getPlanning, function(err, planning){
      if(err)throw err;
      socket.emit('sendPlanning', planning);
    });
  });

  
  socket.on('deletePlanning', function(planningID){
    /*
    "Le client supprime une planification d'une de ses caméras"

    Paramètre:
    - PlanningID: ID de la planification

    Evènement renvoyé:
    - 'deletePlanning': Permet la suppression d'une planification dans la table cron de la caméra
      - PlanningID: ID de la planification

    Description:
    - Récupération de toutes les information de la planification en DB
    - Si la planification est active
      - On demande à la caméra de la supprimer de sa table cron
    - Suppression de la planification en DB
     */
    console.log('deletePlanning event');
    getInfoPlanning(planningID, function(planning){
      if(planning.state == 1){
        sendToCamera(planning.cameraID,'deletePlanning',planningID);
      }
      const deletePlanning = 'DELETE FROM planning WHERE planningID = '+planningID;
      connection.query(deletePlanning, function(err){
        if(err)throw err;
      });
    });
  });

  
  socket.on('applyPlanning', function(planningID){
    /*
    "Le client active une planification d'une de ses caméra"

    Paramètre:
    - PlanningID: ID de la planification

    Evènement renvoyé:
    - 'displayMessage': Affiche un message à l'utilisateur
      - title: titre du message
      - message: Le message en question

    Description:
    - On récupère les informations de la planification
    - On récupère les autres planifications active de la caméra
    - Si plusieurs planifications actives
      - On regarde Si l'une des planification actives n'est pas celle en paramètre
      - Si c'est le cas il s'agit d'une désactivation de planification
        - Appel de la fonction disablePlanning()
      - Si pas, il s'agit d'une activation de planification
        - On vérifie qu'il n'y a pas de chevauchage
        - On appel la fonction changePlanning()
    - Si aucune planification active, c'est une activation de planification
      - Appel de la fonction changePlanning()
     */
    console.log('applyPlanning event');
    getInfoPlanning(planningID, function(planning){
      const getPlanningEnable = 'SELECT * FROM planning WHERE state = 1 AND cameraID = '+planning.cameraID;
      connection.query(getPlanningEnable, function(err,rows){
        if(err)throw err;
        if(rows.length>0){
          var same = false;
          for(var i=0;i<rows.length;i++){
            if(parseInt(rows[i].planningID) == planningID){
              same = true;
              break;
            }
          }
          if(same){
            console.log('disable planning');
            disablePlanning(planningID);
          }else{
            console.log('apply planning');
            checkTimer({timer1:rows,timer2:planning},function(check){
              if(check == 'OK'){
                changePlanning(planningID);
              }else{
                socket.emit('displayMessage',{title:'Alerte',message:'Erreur planning chevauchage',action:null});
              }
            });
          }
        }else{
          changePlanning(planningID);
        }
      });
    });
  });

  
  socket.on('getReplays',function(cameraID){
    /*
    "Le client veut récupérer les enregistrements d'une de ses caméras"

    Paramètre:
    - cameraID: ID de la caméra

    Evènement renvoyé:
    - 'setReplay': Envoie les replays à l'utilisateur
      - tbReplay: Tableau contenant le nom des replay trier par ordre décroissant des dates
      - cameraID: ID de la caméra

    Description
    - Récupération du nom des fichiers dans le dossier correspondant à la caméra
    - On trie le tableau par ordre décroissant des dates
    - Envoie du tableau trié des replays à l'utilisateur
     */
    
    const getReplay = 'SELECT * FROM record WHERE cameraID = '+cameraID;
    connection.query(getReplay, function(err,replays){
      if(err)throw err;
      socket.emit('getReplaysRes', {replays: replays, cameraID: cameraID});
    });
  });

  
  socket.on('startDetection', function(cameraID){
    /*
    "Le client veut démarrer une session de détection de mouvement d'une de ses caméra"

    Paramètre:
    - cameraID: ID de la caméra

    Evènement renvoyé
    - 'startDetection': Demande à la caméra de démarrer une sessionde détection de mouvement
      - cameraName: le nom de la caméra (afin de créer le nom du fichier)
      - cameraID: ID de la caméra

    Description
    - On met les planifications de la caméra actives à l'état 2 (en pause)
    - On place la caméra à l'état 1 (mode détection de mouvement)
    - On récupère le nom de la caméra
    - On envoie la requête à la caméra afin qu'elle démarre la session de détection de mouvement
     */
    console.log('startDetection event');
    setPlanningPaused(cameraID);
    setState(cameraID, 1);
    getInfoCamera(cameraID, function(camera){
      sendToCamera(cameraID,'startDetection',{cameraName: camera.name, cameraID: cameraID});
    });
  });


  socket.on('stopDetection', function(cameraID){
    /*
    "Le client veut stopper une session de détection de mouvement d'une de ses caméra"

    Paramètre:
    - cameraID: ID de la caméra

    Evènement renvoyé:
    - 'killProcess': Demande à la caméra d'arrêter le processus python en cours d'exécution

    Description:
    - On remet les planifications de la caméra qui étaient en pause à l'état 1 (actif)
    - On replace la caméra à l'état 0 (libre)
    - On demande à la caméra de stopper le processus python en cours
     */
    console.log('stopDetection');
    setPlanningUnpaused(cameraID);
    setState(cameraID,0);
    sendToCamera(cameraID,'killProcess',null);
  });

  
  socket.on('startStream', function(cameraID){
    /*
    "Le client veut démarrer une session live d'une de ses caméras"

    Paramètre:
    - cameraID: ID de la caméra

    Evènement renvoyé:
    - 'startStream': demande à la caméra de démarrer une session live
      - cameraID: ID de la caméra
      - name: nom de la caméra

    Description:
    - On met les planifications de la caméra active à l'état 2 (en pause)
    - On place la caméra à l'état 2 (mode live)
    - On demande à la caméra de démarrer une session live
     */
    console.log('startStream event ');
    setState(cameraID, 2);
    setPlanningPaused(cameraID);
    getInfoCamera(cameraID, function(camera){
      sendToCamera(cameraID,'startStream', {cameraID: cameraID, name: camera.name});
    });
  });


  socket.on('stopStream', function(cameraID){
    /*
    "Le client veut stopper une session live d'une de ses caméras"

    Paramètre:
    - cameraID: ID de la caméra

    Evènement renvoyé:
    - 'getLiveRecording': Demande à la caméra d'envoyer l'enregistrement live
      - cameraID: ID de la caméra
      - name: nom de la caméra
    - 'killProcess': Demande à la caméra d'arrêter le processus python en cours d'exécution

    Description:
    - On met les planifications de la caméra qui était en pause à l'état 1 (actif
    - On vérifie l'état de la caméra
    - Si la caméra est à l'état 4 (mode live recording):
      - On MàJ le bouton record de la caméra afin que le client ne lance pas un enregistrement trop vite
      - On demande à la caméra d'envoyer l'enregistrement fait pendant le live
    - Si la caméra est à l'état 2 (mode live);
      - On de mande à la caméra de stopper le processus python en cours d'exécution
    - On met la caméra à l'état 0 (libre)
     */
    console.log('stopStream');
    setPlanningUnpaused(cameraID);
    getInfoCamera(cameraID, function(camera){
      if(camera.state == 4){
        socket.emit('updateLiveRecordingBtn',cameraID);
        sendToCamera(cameraID,'getLiveRecording',{cameraID: cameraID, name: camera.name});
      }else{
        sendToCamera(cameraID,'killProcess',null);
      }
      setState(cameraID,0);
    });
  });

  
  socket.on('killProcess', function(cameraID){
    /*
    "Le client veut mettre fin au processus python en cours d'exécution sur une de ses caméra"

    Paramètre:
    - cameraID: ID de la caméra

    Evènement renvoyé:
    - 'killProcess': Demande à la caméra d'arrêter le processus python en cours d'exécution

    Description:
    - On met l'état de la caméra à 0 (libre)
    - On envoie la requête à la caméra afin qu'il stop le processus python en cours d'exécution
     */
    console.log('killProcess event');
    setState(cameraID, 0);
    sendToCamera(cameraID, 'killProcess', null);
  });


  socket.on('signin', function(data){
    /*
    "Le client veut s'inscrire"

    Paramètres:
    data: Information d'inscription
      - name: le nom de l'utilisateur
      - email: l'email de l'utilisateur
      - phone: le numéro de téléphone de l'utilisateur
      - password: Le mot de passe de l'utilisateur

    Evènement renvoyé:
    - 'signinRes': Renvoie à l'utilisateur la conclusion du serveur après analyse des données d'inscription
      - userID: ID de l'utilisateur
      - emailExist: Boolean précisant si l'email donnée existe ou non

    Description:
    - On vérifie que l'email donnée n'existe pas en DB
    - Si il existe:
      - Envoie d'une réponse négative à l'utilisateur
    - S'il n'existe pas:
      - On hash le mot de passe avec un sel
      - On crée un nouvel utilisateur en DB sur base des informations d'inscription
      - On récupère l'ID de l'utilisateur nouvellement créé
      - On renvoie une réponse positive à l'utilisateur
     */
    const emailExist = 'SELECT email, userID FROM user WHERE email = "'+data.email+'"';
    connection.query(emailExist, function(err,rows){
      if(err)throw err;
      if(rows.length>0){
        socket.emit('signinRes',{emailExist:true});
      }else{
        var password = passHash.generate(data.password);
        const addUser = 'INSERT INTO user SET name = "'+data.name+'", email = "'+data.email+'", phone = "'+data.phone+'", password = "'+password+'"';
        connection.query(addUser, function(err){
          if(err)throw err;
          const getUserID = 'SELECT userID FROM user WHERE email = "'+data.email+'"';
          connection.query(getUserID, function(err,rows2){
            if(err)throw err;
            socket.emit('signinRes',{userID: rows2[0].userID, emailExist:false});
          });
        });
      }
    });
  });

  
  socket.on('login', function(data){
    /*
    "Le client veut se connecter"

    Paramètre:
    - data: Information de connexion de l'utilisateur
      - email: L'email de l'utilisateur
      - password: le mot de passe de l'utilisateur

    Evènement renvoyé:
    - 'loginRes': Renvoie une réponse positive ou négative à l'utilisateur en fonction des résultat obtenue par le serveur après analyse des données de connexions
      - userID: ID de l'utilisateur
      - email: L'email de l'utilisateur
      - password: le mot de passe de l'utilisateur
      - emailExist: Indique si l'email existe bien en DB ou non
      - passwordWrong: Indique si le mot de passe est correct ou non

    Description:
    - On vérifie si l'email existe dans le DB
    - Si ce n'est pas le cas:
      - On envoie une réponse négative à l'utilisateur
    - Si c'est le cas:
      - On vérifie que le mot de passe données correspont bien avec le mot de passe en DB
      - Si c'est correct:
        - On envoie une réponse positive à l'utilisateur
      - Si c'est incorrect:
        - On envoie une réponse négative à l'utilisateur
     */
    console.log('login event');
    const emailExist = 'SELECT * FROM user WHERE email = "'+data.email+'"';
    connection.query(emailExist, function(err,rows){
      if(err)throw err;
      if(rows.length>0){
        if (passHash.verify(data.password, rows[0].password)){
          socket.emit('loginRes',{userID:rows[0].userID,email:data.email, password:data.password,emailExist:true,passwordWrong:false});
        }else{
          socket.emit('loginRes',{email:data.email, password:data.password,emailExist:true,passwordWrong:true});
        }
      }else{
        socket.emit('loginRes',{email:data.email, password:data.password,emailExist:false,passwordWrong:null});
      }
    });
  });

  
  socket.on('checkAdminPassword', function(data){
    /*
    à voir si je laisse ...
     */
    console.log('checkAdminPassword event');
    const checkAdminPassword = "SELECT * FROM user WHERE userID = 1";
    connection.query(checkAdminPassword, function(err,rows){
      if(err){
        throw err;
      }
      if (rows.length > 0){
        if (passHash.verify(data, rows[0].password)){
          socket.emit('displayAdmin');
        }else{
          socket.emit('message',{title: 'Alerte', message: 'Erreur: Le password est incorrect', action: ''});
        }
      }else{
        socket.emit('message',{title: 'Alerte', message: 'Erreur: Aucun profil administrateur n\'a été trouvé. Veuillez vous référer à un administrateur (lol).', action: ''});
      }
    });
  });

  
  socket.on('addCameraAdmin', function(data){
    /*
    Pareil
     */
    console.log('AddCameraAdmin event');
    const checkSerial = 'SELECT * FROM camera WHERE serial = "'+data.serial+'" AND code = "'+data.cameraCode+'"';
    connection.query(checkSerial, function(err,rows){
      if (err){
        throw err;
      }
      if (rows.length > 0){
        socket.emit('message', {title: 'Alerte', message: 'Erreur : Le numéro de série ou le code est déjà utilisé', action: ''});
      }else{
        const addCameraAdmin = 'INSERT INTO camera SET serial = "'+data.serial+'", enable = 0, state = 0, code = "'+data.cameraCode+'"';
        connection.query(addCameraAdmin, function(err,rows){
          if (err){
            throw err;
          }
          socket.emit('message',{title: 'Bravo', message: 'La camera a bien été ajouté !', action: 'resetMessage'});
        });
      }
    });
  });

  
  socket.on('motionDetectionStart', function(cameraID){
    /*
    "Une planification à démarrer une session de détection de mouvement"

    Paramètre:
    - cameraID: ID de la caméra

    Description:
    - Cette fonction est appelé lorsqu'une planification de session de détection de mouvement démarre
    - On met l'état de la caméra à 1 (mode détection de mouvement)
    */
    setState(cameraID,1);
  });

  
  socket.on('motionDetectionStop', function(data){
    /*
    "Une planification a stoppé une session de détection de mouvement"

    Paramètre:
    - data:
      - cameraID: ID de la caméra
      - once: Permet de savoir si la planification doit être retiré ou non
      - PlanningID: ID de la planification

    Evènement renvoyé:
    - 'deletePlanning': Permet de supprimer une planification dans la table cron de la caméra
      - PlanningID: ID de la planification

    Description:
    - On met l'état de la caméra à 0 (libre)
    - Si 'once' est vrai, ça veut dire que la planification ne doit pas réiterer l'opération
      - On met l'état de la planification à 0 (inactive)
      - On demande à la caméra de supprimer la planification dans sa table cron
     */
    setState(data.cameraID, 0);
    if(data.once){
      setPlanningState(data.planningID,0);
      sendToCamera(data.cameraID,'deletePlanning',data.planningID);
    }
  });

  
  socket.on('motionDetected', function(data){
    /*
    "Un mouvement a été détecter lors d'une session de détection de mouvement"

    Paramètre:
    - data:
      - cameraID: ID de la caméra
      - stimestr: Date et Heure à laquelle le mouvement a été détecté
      - file: nom du fichier

    Description
    - On récupère les informations de l'utilisateur et de la caméra
    - On envoie un SMS au client


     */
    console.log('MotionDetected event');

    const getInfoClient = 'SELECT user.userID, user.name, user.phone, user.email, camera.name AS cameraName FROM user INNER JOIN camera ON camera.userID=user.userID WHERE cameraID = '+data.cameraID;
    connection.query(getInfoClient, function(err,rows){
      if(err)throw err;
      if(rows.length > 0){
        //Send SMS
        client.messages.create({
          to: "'"+rows[0].phone+"'",
          from: '+32460205305',
          body: 'Bonjour '+rows[0].name+' ! Votre caméra "'+rows[0].cameraName+'" vient tout juste de détecter un mouvement à la date : '+data.timestr+'. Un enregistrement à été démarré. Vous serez en mesure de le visionner d\'ici quelques secondes sur le site web. Merci pour votre confiance !'
        }, function(error){
          if(error){
            console.log('Error send SMS');
          }else{
            console.log('Successfully send SMS');
          }
        });
      }else{
        console.log('Error: No user found to send SMS');
      }
    });
  });


  socket.on('motionDetectedSend', function(data){
    /*
    "L'enregistrement démarrer via un mouvement détecté vient d'être envoyé au serveur"

    Paramètre
    - data

    Description
    - On fait appel à la fonction addRecord() permettant d'ajouter les informations de l'enregistrement en DB
     */
    console.log('motionDetectedSend event');
    addRecord(data);
  });
  

  socket.on('recordStart', function(cameraID){
    /*
    "Une planification d'enregistrement continu vient de démarrer"

    Paramètre
    - CameraID: L'ID de la caméra

    Description
    - On modifie l'état de la caméra à 3 (mode enregistrement continu
     */
    setState(cameraID,3);
  });


  socket.on('recordStop', function(data){
    /*
    "Une planification d'enregistrement continue vient de se terminer"

    Paramètre
    - Data

    Description
    - On appel la fonction addRecord() afin d'enregistrer les informations de l'enregistrement en DB
    - on modifie l'état de la caméra à 0 (mode libre)
    - Si la planification ne doit s'exécuter qu'une seule fois
      - On change l'état de la planification à 0 (mode inactif)
      - On envoie une requête à la caméra afin que celle-ci supprime la planification dans sa table Cron.
     */
    console.log('recordStop event');
    addRecord(data);
    setState(data.cameraID,0);
    if(data.once){
      setPlanningState(data.planningID, 0);
      sendToCamera(data.cameraID,'deletePlanning',data.planningID);
    }
  });


  socket.on('streamSend', function(cameraID){
    /*
    "Une nouvelle image du Strem vient d'être envoyeé au serveur"

    Paramètre
    - cameraID: L'id de la caméra

    Description
    - On envoie une requête en Broadcast (car on ne sait pas quel utilisateur à démarrer le Live) afin de mettre à jour le lecteur
     */
    console.log('streamSend');
    io.emit('updateStream', cameraID);
  });


  socket.on('startLiveRecording', function(cameraID){
    /*
    "On démarre le live recording"

    Paramètre
    - cameraID: L'ID de la caméra

    Description
    - On modifie l'état de la caméra à 4 (mode live recording)
    - On récupère les informations de la caméra en DB
    - On envoie la requête à la caméra
     */
    console.log('startLiveRecording');
    setState(cameraID,4);

    getInfoCamera(cameraID, function(camera){
      sendToCamera(cameraID, 'startLiveRecording', {cameraID: cameraID, name: camera.name});
    });

  });


  socket.on('stopLiveRecording', function(cameraID){
    /*
    "On stop le live recording"

    Paramètre
    - cameraID: l'ID de la caméra

    Description
    - On modifie l'état de la caméra à 2 (mode live) car le live n'est pas coupé pour autant
    - On récupère les informations de la caméra
    - On envoie la requête à la caméra afin qu'elle envoie l'enregistrement
     */
    console.log('stopLiveRecording');
    setState(cameraID,2);

    getInfoCamera(cameraID, function(camera){
      sendToCamera(cameraID, 'getLiveRecording', {cameraID: cameraID, name: camera.name});
    });

  });


  socket.on('getLiveRecordingDone', function(data){
    /*
    "On vient de recevoir l'enregistrement du live recording"

    Paramètre
    - Les informations de l'enregistrement

    Description
    - On ajoute les informations de l'enregistrement en DB
    - On récupère les informations de la caméra
    - Si l'état de la caméra est à 2 (elle est en mode live)
      - On envoie une requête à la caméra afin qu'elle redémarre le live
     */
    console.log('getLiveRecordingDone camera'+data.cameraID);
    addRecord(data);
    getInfoCamera(data.cameraID, function(camera){
      if(camera.state == 2){
        sendToCamera(data.cameraID, 'startStream', {cameraID: data.cameraID, name: camera.name});
      }
    });
    io.emit('getLiveRecordingDone',data.cameraID);
  });

  
  socket.on('editReplay',function(data){
    console.log('editReplay event');

    var nameTaken = false;
    fs.readdir('./public/cameras/camera'+data.cameraID+'/videos/', function(err, files){
      if(err){
        throw err;
      }
      for(var i=0;i<files.length;i++){
        if(files[i] == data.newName){
          nameTaken = true;
          break;
        }
      }
      if(nameTaken == true){
        console.log('name Taken');
        socket.emit('message',{title: 'Alerte',message:'Erreur: Le nom est déjà pris',action:null});
      }else{
        console.log('name not taken');
        socket.emit('editReplayOK',{name: data.newName, replayID: data.replayID});
        const cmd = 'mv ./public/cameras/camera'+data.cameraID+'/videos/'+data.oldName+' ./public/cameras/camera'+data.cameraID+'/videos/'+data.newName;
        console.log(cmd);
        exec(cmd,function(err){
          if(err) throw err;
        });
        const editRecord = 'UPDATE record SET name = "'+data.newName+'" WHERE recordID = '+data.replayID;
        console.log(editRecord);
        connection.query(editRecord, function(err){
          if(err) throw err;
        })
      }
    });
  });
  
  
  socket.on('removeReplay',function(data){
    console.log('removeReplay event');
    const cmd = 'rm ./public/cameras/camera'+data.cameraID+'/videos/'+data.name;
    console.log(cmd);
    exec(cmd,function(err){
      if(err) throw err;
    });
    const rmReplay = 'DELETE FROM record WHERE recordID = '+data.replayID;
    connection.query(rmReplay, function(err){
      if(err) throw err;
    })
  });


  socket.on('stopMultiLive', function(userID){
    console.log('stopMultiLive event');
    var ind;
    const getCamera = 'SELECT * FROM camera WHERE userID = '+userID+' AND enable = 1 AND state != 0';
    connection.query(getCamera, function(err,rows){
      if(err)throw err;
      console.log(rows.length+' cameras');
      const getSharedCameras = 'SELECT camera.state, camera.enable, camera.cameraID, camera.name FROM sharedCamera INNER JOIN camera ON sharedCamera.cameraID = camera.cameraID WHERE camera.enable = 1 AND camera.state != 0 AND sharedCamera.userID = '+userID;
      connection.query(getSharedCameras, function(err, sharedCameras){
        if(err)throw err;
        console.log(sharedCameras.length+' sharedCameras');
        for(var j=0;j<sharedCameras.length;j++){
          rows.push(sharedCameras[j]);
        }
        console.log('total cameras: '+rows.length);
        if(rows.length>0){
          for(var i =0;i<rows.length;i++){
            ind = i;
            getInfoCamera(rows[i].cameraID, function(camera){
              if(rows[ind].state == 4){
                sendToCamera(camera.cameraID,'getLiveRecording',{cameraID:camera.cameraID, name: camera.name});
              }else{
                sendToCamera(camera.cameraID,'killProcess',null);
              }
              setState(camera.cameraID,0);
            });
            setPlanningUnpaused(rows[i].cameraID);
          }
        }else{
          console.log('User has no camera up');
        }
        socket.emit('redirectURL',serverURL+'/display');
      });
    });
  });


  socket.on('startConfig', function(cameraID){
    console.log('startConfig event');

    getInfoCamera(cameraID, function(camera){
      sendToCamera(cameraID,'getConfig', {cameraID: cameraID, cameraName: camera.name});
    });
    
  });


  socket.on('getConfigRes', function(data){
    console.log('getConfigRes Event');
    io.emit('setConfig',data);
  });
  
  
  socket.on('applyConfig', function(data){
    console.log('setConfig event');
    sendToCamera(data.cameraID,'updateConfigFile',data);
  });


  socket.on('previewConfig', function(data){
    console.log('previewConfig event');
    sendToCamera(data.cameraID,'getPreview',data);
  });
  
  
  socket.on('previewSend', function(cameraID){
    console.log('previewSend event');
    io.emit('updatePreview',cameraID);
  });


  socket.on('setQRCode', function(data){
    console.log('setQRCode');
    const cmd = 'qr "'+data.userID+' '+data.ssid+' '+data.password+'" > ./public/images/qrcode'+data.userID+'.jpg';
    exec(cmd, function(err){
      if(err) throw err;
    });
    setTimeout(function(){
      console.log('send qrcode user : '+data.userID);
      socket.emit('QRCodeDone', data.userID);
    },5000);
  });


  socket.on('newCameraConnection', function(data){
    console.log('serial: '+data.serial);
    console.log('userID: '+data.userID);
    console.log('newCameraConnection event');
    const addCamera = 'INSERT INTO camera SET userID = '+data.userID+', serial = "'+data.serial+'", name = "Caméra", enable = 0, state = 0';
    connection.query(addCamera, function(err){
      if(err) throw err;
      io.emit('newCameraConnectionRes',data.userID);
    });
  });


  socket.on('getInfoUser', function(userID){
    console.log('getInfoUser event');
    
    getInfoUser(userID, function(user){
      const getCameraInfo = 'SELECT * FROM camera WHERE userID = '+userID;
      connection.query(getCameraInfo, function(err,cameras){
        if(err)throw err;
        socket.emit('getInfoUserRes',{user:user,cameras:cameras});
      });
    });
    /*
    const getInfo = 'SELECT user.name as userName, user.email, user.phone, camera.name as cameraName, camera.cameraID, camera.serial, camera.enable, camera.state FROM user INNER JOIN camera ON camera.userID = user.userID WHERE user.userID = '+userID;
    connection.query(getInfo, function(err,rows){
      if(err) throw err;
      if(rows.length>0){
        socket.emit('getInfoUserRes',rows);
      }else{
        console.log('Error getInfoUser, no user found');
      }
    });
    */
  });
  
  
  socket.on('updateUser', function(data){
    console.log('updateUser event');
    const checkEmail = 'SELECT email, userID FROM user WHERE email = "'+data.email+'"';
    connection.query(checkEmail, function(err, rows){
      if(err) throw err;
      if(rows.length > 0){
        if(rows[0].userID != data.userID){
          socket.emit('updateUserRes',false);
        }else{
          socket.emit('updateUserRes',true);
          updateInfoUser(data);
        }
      }else{
        socket.emit('updateUserRes',true);
        updateInfoUser(data);
      }
    });
  });


  socket.on('addWifi', function(cameraID){
    console.log('addWifi event');
    sendToCamera(cameraID,'addWifi',cameraID);
  });


  socket.on('addWifiDone',function(data){
    console.log('addWifi event');
    io.emit('addWifiRes',data);
  });


  socket.on('reboot', function(cameraID){
    console.log('rebootBySerial event');
    sendToCamera(cameraID,'reboot',null);
  });
  
  
  socket.on('getUserName', function(userID){
    getInfoUser(userID, function(user){
      socket.emit('getUserNameRes',user.name);
    });
  });
  
  
  socket.on('getProduct', function(){
    const getProduct = 'SELECT * FROM product';
    connection.query(getProduct, function(err,rows){
      if(err)throw err;
      socket.emit('getProductRes',rows);
    });
  });


  socket.on('addOrder', function(data){
    console.log('addOrder event');
    const addOrder = 'INSERT INTO TFE.order SET userID = '+data.userID+', state = 0, date = NOW()';
    connection.query(addOrder, function(err){
      if(err)throw err;
      const getOrderID = 'SELECT orderID FROM TFE.order WHERE userID = '+data.userID+' ORDER BY orderID DESC LIMIT 1';
      connection.query(getOrderID, function(err,rows){
        if(err)throw err;
        var addPurchase;
        for(var i=0;i<data.order.length;i++){
          console.log('purchase loop');
          if(data.order[i].amount > 0){
            console.log('addPurchase');
            addPurchase = 'INSERT INTO purchase SET productID = '+data.order[i].productID+', orderID = '+rows[0].orderID+', nbProduct = '+data.order[i].amount;
            connection.query(addPurchase, function(err){
              if(err)throw err;
            });
          }
        }
        socket.emit('addOrderRes',rows[0].orderID);
      });
    });
  });


  socket.on('orderPaid', function(orderID){
    console.log('orderPaid event');
    const setOrderstate = 'UPDATE TFE.order SET state = 1 WHERE orderID = '+orderID;
    connection.query(setOrderstate, function(err){
      if(err)throw err;
      socket.emit('displayMessage',{title:'Bravo', message:'Merci pour votre achat !'});
      setTimeout(function() {
        socket.emit('redirect', serverURL + '/display');
      },5000);
    });
  });


  socket.on('getOrder', function(userID){
    console.log('getOrder event');
    const getOrder = 'SELECT * FROM TFE.order INNER JOIN TFE.purchase ON TFE.order.orderID = TFE.purchase.orderID WHERE userID = '+userID;
    connection.query(getOrder, function(err, rows){
      if(err)throw err;
      socket.emit('getOrderRes', rows);
    });
  });


  socket.on('shareCamera', function(data){
    console.log('shareCamera event');
    getInfoUser(data.userID, function(user){
      if(passHash.verify(data.password, user.password)){
        console.log('password ok');
        if(data.email == user.email){
          console.log('error same user');
          socket.emit('displayMessage',{title:'Alerte',message:'Vous ne pouvez pas partager cette caméra avec vous-même !'});
        }else{
          const getUserFromEmail = 'SELECT * FROM user WHERE email = "'+data.email+'"';
          connection.query(getUserFromEmail, function(err,rows){
            if(err)throw err;
            if(rows.length>0){
              console.log('associer camera à user');
              const shareCameraToUser = 'INSERT INTO sharedCamera SET userID = '+rows[0].userID+', cameraID = '+data.cameraID;
              console.log(shareCameraToUser);
              connection.query(shareCameraToUser, function(err){
                if(err)throw err;
                socket.emit('displayMessage',{title:'Bravo',message:'Votre caméra a été partagée avec '+rows[0].name+' !'});
              });
            }else{
              console.log('send mail');
              socket.emit('displayMessage',{title:'Info',message:'Un email a été envoyé à la personne car celle-ci n\'a pas encore de compte'});
            }
          });
        }
      }else{
        console.log('erreur password');
        socket.emit('displayMessage',{title:'Alerte', message:'Mot de passe erroné'});
      }
    });
  });
  
  
//FUNCTIONS----------------------------------------------------------------------------------------------


  function addPlanning(data){
    console.log('addPlanning function');
    const begin = parseInt(data.begin_hour*60)+parseInt(data.begin_minute);
    const end = parseInt(data.end_hour*60)+parseInt(data.end_minute);
    var Once;
    if(data.once){
      Once = 1;
    }else{
      Once = 0;
    }
    //add new Planing
    const addPlanning = 'INSERT INTO planning SET cameraID = '+data.cameraID+', begin = '+begin+', end = '+end+', frequency = "'+data.frequency+'", frequencyEnd = "'+data.frequencyEnd+'", state = 1, type = "'+data.type+'", once = '+Once;
    connection.query(addPlanning, function(err){
      if(err)throw err;
      const getPlanningID = 'SELECT planningID FROM planning ORDER BY planningID DESC LIMIT 1';
      connection.query(getPlanningID, function(err,rows){
        if(err)throw err;
        getInfoCamera(data.cameraID, function(camera){
          if(camera != null){
            arg = {
              begin_hour: data.begin_hour,
              begin_minute: data.begin_minute,
              end_hour: data.end_hour,
              end_minute: data.end_minute,
              frequency: data.frequency,
              frequencyEnd: data.frequencyEnd,
              cameraName: camera.name,
              cameraID: camera.cameraID,
              type: data.type,
              once: data.once,
              planningID: rows[0].planningID
            };
            sendToCamera(data.cameraID,'timer',arg);
          }
        });
      });
    });
  }


  function changePlanning(planningID){
    /*
    -> Update Planning color in UI
    -> Set planning state to 1 (enable)
    -> get info planning & info camera
    -> send to camera to add planning on cron table
     */
    console.log('changePlanning function');
    socket.emit('updatePlanningColor',{planningID: planningID, state: 1});
    setPlanningState(planningID,1);
    getInfoPlanning(planningID, function(planning){
      //because cameraName
      getInfoCamera(planning.cameraID, function(camera){
        var begin_minute = planning.begin % 60;
        var begin_hour = (planning.begin - begin_minute) / 60;
        var end_minute = planning.end % 60;
        var end_hour = (planning.end - end_minute) / 60;
        var Once;
        if(planning.once == 0){
          Once = false;
        }else{
          Once = true;
        }
        arg = {
          begin_hour: begin_hour,
          begin_minute: begin_minute,
          end_hour: end_hour,
          end_minute: end_minute,
          frequency: planning.frequency,
          frequencyEnd: planning.frequencyEnd,
          cameraName: camera.name,
          cameraID: planning.cameraID,
          type: planning.type,
          once: Once,
          planningID: planningID,
          resolution: camera.resolution,
          fps: camera.fps,
          brightness: camera.brightness,
          contrast: camera.contrast
        };
        sendToCamera(planning.cameraID,'timer',arg);
      });
    });
  }


  function disablePlanning(planningID){
    /*
    -> Change planning color on UI
    -> Set planning state to 0 (disable)
    -> get cameraID of planning
    -> get socketID of the camera
    -> send deleteplanning to camera
     */
    console.log('disablePlanning function');

    socket.emit('updatePlanningColor',{planningID: planningID,state:0});
    
    setPlanningState(planningID,0);

    getInfoPlanning(planningID, function(planning){
        sendToCamera(planning.cameraID,'deletePlanning',planningID);
    });
    
  }


  function sendToCamera(cameraID, event, data){
    console.log('sendToCamera function');
    console.log('cameraID: '+cameraID+', event: '+event+', data: '+data);
    getInfoCamera(cameraID, function(camera){
      console.log('data: '+data);
      io.to(camera.socketID).emit(event,data);
    });
    
  }
  
  
  function setState(cameraID, state){
    //State 0 = Nothing is running
    //State 1 = MotionDetection running
    //State 2 = Live running
    //State 3 = Record running
    //State 4 = Live Recording running
    console.log('setState function - camera state = '+state);
    const setState = 'UPDATE camera SET state = '+state+' WHERE cameraID = '+cameraID;
    connection.query(setState, function(err){
      if(err){
        throw err;
      }
      io.emit('displayCameraState',{cameraID:cameraID, state: state});
    });
  }


  function setPlanningState(planningID, state){
    console.log('setPlanningState function - state = '+state);
    /*
    State 0 : Disable
    State 1 : Enable
    State 2 : Pause
     */
    const setPlanningState = 'UPDATE planning SET state = '+state+' WHERE planningID = '+planningID;
    connection.query(setPlanningState, function(err){
      if(err)throw err;
    });
  }
  
  
  function getInfoCamera(cameraID, callback){

    const getInfoCamera = 'SELECT * FROM camera WHERE cameraID = '+cameraID;
    connection.query(getInfoCamera, function(err,rows){
      if(err){
        throw err;
      }
      if(rows.length>0){
        callback(rows[0]);
      }else{
        console.log('error getInfoCamera - no camera');
      }
    });
  }


  function getInfoUser(userID, callback){
    console.log('getInfoUser function');
    const getInfoUser = 'SELECT * FROM user WHERE userID = '+userID;
    connection.query(getInfoUser, function(err,rows){
      if(err){
        throw err;
      }
      if(rows.length>0){
        callback(rows[0]);
      }else{
        console.log('error getInfoUser function');
      }
    });
  }


  function getInfoPlanning(planningID, callback){

    const getInfoPlanning = 'SELECT * FROM planning WHERE planningID = '+planningID;
    connection.query(getInfoPlanning, function(err,rows){
      if(err)throw err;
      if(rows.length>0){
        callback(rows[0]);
      }else{
        console.log('error getInfoPlanning function');
      }
    });
  }


  function checkTimer(data, callback){
    /*
    -> Check the planning get over another planning
     */

    console.log('checkTimer');

    var t1b, t1e, t2b, t2e;
    var check = true;
    var timer1 = data.timer1;
    var timer2 = data.timer2;

    //Check chevauche ?

    for(var i=0;i<timer1.length;i++){
      console.log('check planning '+i);

      if(timer2.frequency != '*' && timer1[i].frequency != '*'){

        t2b = ((parseInt(timer2.frequency)*24*60)+timer2.begin);
        t2e = ((parseInt(timer2.frequencyEnd)*24*60)+timer2.end);
        t1b = ((parseInt(timer1[i].frequency)*24*60)+timer1[i].begin);
        t1e = ((parseInt(timer1[i].frequencyEnd)*24*60)+timer1[i].end);
        console.log('t2b = '+t2b+' | t2e = '+t2e+' | t1b = '+t1b+' | t1e = '+t1e);

        if(t2b > t2e){
          console.log('t2b > t2e');
          t2e=t2e+10080;
          t1b=t1b+10080;
          t1e=t1e+10080;
          console.log('t2b = '+t2b+' | t2e = '+t2e+' | t1b = '+t1b+' | t1e = '+t1e);
        }
        if(t1b > t1e){
          console.log('t1b > t1e');
          t1e=t1e+10080;
          t2b=t2b+10080;
          t2e=t2e+10080;
          console.log('t2b = '+t2b+' | t2e = '+t2e+' | t1b = '+t1b+' | t1e = '+t1e);
        }

        if((t2b >= t1b && t2b <= t1e) || (t2e >= t1b && t2e <= t1e) || (t2b < t1b && t2e > t1e)){
          console.log('not OK');
          check = false;
          break;
        }else{
          console.log('OK');
        }

      }else{
        console.log('one * at least');

        if(timer2.frequency == '*' && timer1[i].frequency != '*'){
          console.log('new is *');

          t1b = ((parseInt(timer1[i].frequency)*24*60)+timer1[i].begin);
          t1e = ((parseInt(timer1[i].frequencyEnd)*24*60)+timer1[i].end);

          if(t1b > t1e){
            t1e = t1e + 10080;
          }

          if((t1e - t1b) >= 1440){
            console.log('size old > 1440');
            check = false;
            break;
          }else{

            t1b = timer1[i].begin;
            t1e = timer1[i].end;
            t2b = timer2.begin;
            t2e = timer2.end;

            if(t1b > t1e){
              t1e = t1e + 1440;
            }
            if(t2b > t2e){
              t2e = t2e + 1440;
            }

            console.log('t1b = '+t1b+' | t1e = '+t1e+' | t2b = '+t2b+' | t2e = '+t2e);
            if((t2b >= t1b && t2b <= t1e) || (t2e >= t1b && t2e <= t1e) || (t2b < t1b && t2e > t1e)){
              console.log('not OK');
              check = false;
              break;
            }else{
              console.log('OK');
            }
          }

        }else{
          if(timer2.frequency != '*' && timer1[i].frequency == '*'){
            console.log('old is *');

            t2b = ((parseInt(timer2.frequency)*24*60)+timer2.begin);
            t2e = ((parseInt(timer2.frequencyEnd)*24*60)+timer2.end);

            if(t2b > t2e){
              t2e = t2e + 10080;
            }

            if((t2e - t2b) >= 1440){
              console.log('size new > 1440');
              check = false;
              break;
            }else{

              t1b = timer1[i].begin;
              t1e = timer1[i].end;
              t2b = timer2.begin;
              t2e = timer2.end;

              if(t1b > t1e){
                t1e = t1e + 1440;
              }
              if(t2b > t2e){
                t2e = t2e + 1440;
              }

              console.log('t1b = '+t1b+' | t1e = '+t1e+' | t2b = '+t2b+' | t2e = '+t2e);

              if((t1b >= t2b && t1b <= t2e) || (t1e >= t2b && t1e <= t2e) || (t1b < t2b && t1e > t2e)){
                console.log('not OK');
                check = false;
                break;
              }else{
                console.log('OK');
              }
            }
          }else{
            console.log('both are *');

            t1b = timer1[i].begin;
            t1e = timer1[i].end;
            t2b = timer2.begin;
            t2e = timer2.begin;
            console.log('t1b = '+t1b+' | t1e = '+t1e+' | t2b = '+t2b+' | t2e = '+t2e);

            if(t2e == t2b ){
              console.log('t2e = t2b');
              t2e = t2e - 1;
            }
            if(t1b > t1e){
              console.log('t1b > t1e');
              t1e = t1e + 1440;
            }
            if(t2b > t2e){
              console.log('t2b > t2e');
              t2e = t2e + 1440;
            }

            console.log('t1b = '+t1b+' | t1e = '+t1e+' | t2b = '+t2b+' | t2e = '+t2e);

            if((t2b >= t1b && t2b <= t2e) || (t2e >= t1b && t2e <= t1e) || (t2b < t1b && t2e > t1e)){
              console.log('not OK');
              check = false;
              break;
            }else{
              console.log('OK');
            }
          }

        }
      }
      console.log('end planning '+i);
    }

    console.log('end loop');
    if(check){
      callback('OK');
    }else{
      callback('NOK');
    }

  }


  function setPlanningPaused(cameraID){
    /*
    -> Get tb of all planning enable
    -> set all enable planning on pause
    -> update UI
    -> send to camera to delete enable planning on cron table
     */
    console.log('setPlanningPaused function');
    const getEnablePlanning = 'SELECT * FROM planning WHERE state = 1 AND cameraID = '+cameraID;
    connection.query(getEnablePlanning, function(err,rows){
      if(err)throw err;
      if(rows.length>0){
        const setPlanningPaused = 'UPDATE planning SET state = 2 WHERE state = 1 AND cameraID = '+cameraID;
        connection.query(setPlanningPaused, function(err){
          if(err)throw err;
        });
        for(var i = 0;i<rows.length;i++){
          socket.emit('updatePlanningColor',{planningID: rows[i].planningID, state: 2});
          sendToCamera(cameraID,'deletePlanning',rows[i].planningID);
        }
      }
    });
  }


  function setPlanningUnpaused(cameraID){
    /*
    -> get all planning on pause
    -> set paused planning on enable
    -> update UI
    -> add planning on cron table
     */
    console.log('setPlanningUnpaused function');
    const getPausedPlanning = 'SELECT * FROM planning WHERE state = 2 AND cameraID = '+cameraID;
    connection.query(getPausedPlanning, function(err,rows){
      if(err)throw err;
      if(rows.length>0){
        const setPlanningEnable = 'UPDATE planning SET state = 1 WHERE state = 2 AND cameraID = '+cameraID;
        connection.query(setPlanningEnable, function(err){
          if(err)throw err;
        });
        getInfoCamera(cameraID, function(camera){
          for(var i=0;i<rows.length;i++){
            var begin_minute = rows[i].begin % 60;
            var begin_hour = (rows[i].begin - begin_minute) / 60;
            var end_minute = rows[i].end % 60;
            var end_hour = (rows[i].end - end_minute) / 60;
            var Once;
            if(rows[i].once == 1){
              Once = true;
            }else{
              Once = false;
            }
            arg = {
              begin_hour: begin_hour,
              begin_minute: begin_minute,
              end_hour: end_hour,
              end_minute: end_minute,
              frequency: rows[i].frequency,
              frequencyEnd: rows[i].frequencyEnd,
              cameraName: camera.name,
              cameraID: rows[i].cameraID,
              type: rows[i].type,
              once: Once,
              planningID: rows[i].planningID
            };
            sendToCamera(cameraID,'timer',arg);
            socket.emit('updatePlanningColor',{planningID:rows[i].planningID,state:1});
          }
        });
      }
    });
  }


  function updateInfoUser(data){
    console.log('updateInfoUser function');
    var password = passHash.generate(data.password);
    const updateUser = 'UPDATE user SET name = "'+data.name+'", email = "'+data.email+'", password = "'+password+'", phone = "'+data.phone+'" WHERE userID = '+data.userID;
    connection.query(updateUser, function (err){
      if(err)throw err;
    });
  }


  function addRecord(data){
    console.log('add record function');
    const addRecord = 'INSERT INTO record SET cameraID = '+data.cameraID+', name = "'+data.fileName+'", type = "'+data.type+'", date = NOW()';
    connection.query(addRecord, function(err){
      if(err)throw err;
    });
  }

  
});

server.listen(port, function(){
  console.log('Server running !');
});