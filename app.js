
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

const port = 3000;
const serverURL = 'http://192.168.1.50:3000';
const app = express();

const server = http.createServer(app);
const io = require('socket.io').listen(server);

const connection = mysql.createConnection({
  host : '192.168.1.50',
  user : 'root',
  password : '',
  database : 'TFE'
});

const session = require('express-session')({
  secret: "tfe-secret",
  resave: true,
  saveUnitialized: true
});

const client = new twilio.RestClient('AC175fe55d0a0d00d7094c00338f548ec5','956f723bfa80087e696300e1358f46c{{secondMin}}');



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
//app.use(logger('dev'));
app.use(bodyParser.json());
app.use(bodyParser.urlencoded({ extended: true }));
app.use(cookieParser());
app.use('/', routes);
app.use(session);

//Receive data from client------------------------------------------------------------------

io.sockets.on('connection', function(socket){
  
  //EVENTS---------------------------------------------------------------------------------------------
  
  socket.on('client', function (data) {
    console.log('client connected');
  });

  
  socket.on('camera', function (serial) {
    console.log('camera connecté');
    //check camera exist
    connection.query('SELECT * FROM camera WHERE serial = ?', serial , function(err, rows){
      if(err){
        throw err;
      }
      if(rows.length > 0) {
        console.log('camera exist');
        const setSocketID = 'UPDATE camera SET socketID = "'+socket.id+'", enable = 1 WHERE cameraID = '+rows[0].cameraID;
        if(rows[0].socketID == null){
          //First connection -> Create camera folder
          const createFolder = 'mkdir -p /home/victorien/TFE/source/server/public/cameras/camera'+rows[0].cameraID+'/videos /home/victorien/TFE/source/server/public/cameras/camera'+rows[0].cameraID+'/live';
          exec(createFolder, function(error,stdout, stderr){
            if (err){
              throw err;
            }
          });
          connection.query(setSocketID, function(err){
            if (err){
              throw err;
            }
          });
        }else{
          //Camera already added -> update socketID
          connection.query(setSocketID, function(err){
            if (err){
              throw err;
            }
          });
        }
      }else{
        console.log('Error ! No camera found. Please add it on admin interface first');
      }
    });
  });

  
  socket.on('getCamera', function(userID){
    console.log('getCamera event -> userID : '+userID);
    var sendCamera = 'SELECT * FROM camera WHERE userID = '+userID;
    connection.query(sendCamera, function (err,rows) {
      if (err){
        throw err;
      }
      if (rows.length>0){
        socket.emit('sendCamera', rows);
      }else{
        socket.emit('message', {title:'Alerte', message: 'Vous n\'avez aucune caméra', action:''});
      }
    });
  });

  
  socket.on('disconnect', function(){
    console.log('disconnected');
    //check client or camera disconnected
    var disconnection = 'SELECT cameraID FROM camera WHERE socketID = "'+ socket.id+'"';
    connection.query(disconnection, function(err, rows){
      if(rows.length > 0){
        //camera disconnected -> set enable to false and state to unused
        var disable = 'UPDATE camera SET enable = 0, state = 0 WHERE cameraID = '+rows[0].cameraID;
        connection.query(disable, function (err) {
          if(err){
            throw err;
          }
        });
      }
    });
  });


  socket.on('setTimer', function(data) {
    /*
    -> Check si d'autre record sont actif
    -> Si ce n'est pas le cas, on ajoute les données
    -> Si c'est le cas, on check qu'ils ne se chevauchent pas avant d'ajouter les données
     */
    console.log('SetTimer event');
    //update record
    const checkRecordEnable = 'SELECT * FROM record WHERE cameraID = '+data.cameraID+' AND state = 1';
    connection.query(checkRecordEnable, function(err,rows){
      if(err){
        throw err;
      }
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
            socket.emit('message',{title: 'Bravo', message: 'Record success',action:null});
            addRecord(data);
          }else{
            console.log('NOK');
            socket.emit('message',{title: 'Alerte', message: 'Erreur record',action:null});
          }
        });

      }else{
        addRecord(data);
      }
    });
  });

  
  socket.on('changeCameraName', function(data){
    console.log('changeCameraName event');
    const changeName = 'UPDATE camera SET name = "'+data.name+'" WHERE cameraID = '+data.cameraID;
    connection.query(changeName, function(err){
      if(err){
        throw err;
      }
      socket.emit('message', {title: 'Bravo', message: 'Le nom de votre caméra a été mis à jour !', action: 'resetMessage'});
    });
  });

  
  socket.on('getRecords', function(cameraID){
    console.log('getRecords event');
    const getRecords = 'SELECT * FROM record WHERE cameraID = '+cameraID;
    connection.query(getRecords, function(err, rows){
      if(err){
        throw err;
      }
      socket.emit('sendRecords', rows);
    });
  });

  
  socket.on('deleteRecord', function(recordID){
    console.log('deleteRecord event');
    const checkState = 'SELECT * FROM record WHERE recordID = '+recordID;
    connection.query(checkState, function(err,rows){
      if(err){
        throw err;
      }
      const deleteRecord = 'DELETE FROM record WHERE recordID = '+recordID;
      connection.query(deleteRecord, function(err){
        if(err){
          throw err;
        }
      });
      if(rows[0].state == 1) {
        if(rows[0].type == 'record'){
          sendToCamera(rows[0].cameraID, 'deleteRecord', null);
        }else{
          sendToCamera(rows[0].cameraID, 'deleteDetection', null);
        }
      }
    });
  });

  
  socket.on('applyRecord', function(recordID){
    console.log('applyRecord event');
    //set old record to client
    const getOldRecord = 'SELECT * FROM record WHERE state = 1 AND cameraID = (SELECT cameraID FROM (SELECT cameraID FROM record WHERE recordID ='+recordID+') AS tpm)';
    connection.query(getOldRecord, function(err,rows){
      if(err){
        throw err;
      }
      if(rows.length>0) {


        const getFocusRecord = 'SELECT * FROM record WHERE recordID = '+recordID;
        connection.query(getFocusRecord, function(err,rows2){
          if(err){
            throw err;
          }

          checkTimer({timers:rows,timer2:rows2},function(check){
            if(check == 'OK'){
              console.log('Check OK');

            }else{
              console.log('Check NOK');
              socket.emit('message',{title:'Alerte',message:'Erreur record chevauchage',action:null});
            }
          });

        });

        socket.emit('setOldRecord', rows[0].recordID);
        if(parseInt(rows[0].recordID) == parseInt(recordID)){
          console.log('le mm');
          disableRecord(recordID);
        }else{
          console.log('pas le mm');
          changeRecord(recordID);
        }
      }else{
        changeRecord(recordID);
      }
    });
    //Check if camera is on state 3 -> if it is : kilProcess
    const getCameraState = 'SELECT camera.state, camera.cameraID FROM record INNER JOIN camera ON record.cameraID=record.cameraID WHERE recordID = '+recordID;
    connection.query(getCameraState, function(err, rows){
      if(err){
        throw err;
      }
      if (rows.length > 0){
        if (rows[0].state == 3){
          sendToCamera(rows.cameraID,'killProcess', null);
        }
      }else{
        console.log('Erreur : Le record n\'est associé à aucune camera');
      }
    });

  });

  
  //Get all the replay
  /*
  socket.on('getReplays', function(cameraID){
    console.log('getReplays event');
    fs.readdir('./public/cameras/camera'+cameraID+'/videos/', function(err, files){
      if(err){
        throw err;
      }
      socket.emit('setReplays',{tbReplay: files, cameraID: cameraID});
      socket.emit('setReplays2',{tbReplay: files, cameraID: cameraID});
    })
  });
  */
  
  socket.on('getReplays',function(cameraID){
    console.log('getReplays event');
    fs.readdir('./public/cameras/camera'+cameraID+'/videos/', function(err, files){
      if(err){
        throw err;
      }
      socket.emit('setReplays',{tbReplay: files, cameraID: cameraID});
    });
  });

  
  socket.on('startDetection', function(cameraID){
    console.log('startDetection event');
    //évite qu'un record se lance pendant la détection de mouvement
    const setStateRecord = 'UPDATE record SET state = 0 WHERE cameraID = '+cameraID+" AND state = 1";
    connection.query(setStateRecord, function(err){
      if(err){
        throw err;
      }
    });
    //send to camera
    setState(cameraID, 1);
    const getSocketID = 'SELECT * FROM camera WHERE cameraID = '+cameraID;
    connection.query(getSocketID, function(err,rows){
      if(err){
        throw err;
      }
      io.to(rows[0].socketID).emit('startDetection', {cameraName: rows[0].name, cameraID: cameraID});
    });
  });


  socket.on('stopDetection', function(cameraID){
    console.log('stopDetection');
    setState(cameraID,0);
    sendToCamera(cameraID,'stopProcess',null);
  });

  
  socket.on('startStream', function(cameraID){
    console.log('startStream event ');
    setState(cameraID, 2);
    const getCameraName = 'SELECT name FROM camera WHERE cameraID = '+cameraID;
    connection.query(getCameraName, function(err,rows){
      if(err){
        throw err;
      }
      if(rows.length>0){
        sendToCamera(cameraID, 'startStream', {cameraID: cameraID, name: rows.name});
      }else{
        console.log('Error getCameraName in startStream event');
      }
    });
  });


  socket.on('stopStream', function(cameraID){
    console.log('stopStream');
    const getInfoCamera = 'SELECT * FROM camera WHERE cameraID = '+cameraID;
    connection.query(getInfoCamera, function(err,rows){
      if(err){
        throw err;
      }
      if(rows.length>0){
        console.log('cameraState : '+rows[0].state);
        if (rows[0].state == 4){
          //LiveRecording
          console.log('close while recording');
          setState(cameraID,0);
          socket.emit('updateLiveRecordingBtn', cameraID);
          sendToCamera(cameraID,'getLiveRecording',{cameraID: cameraID, name: rows[0].name});
        }else{
          //Live
          setState(cameraID,0);
          sendToCamera(cameraID,'killProcess',null);
        }
      }else{
        console.log('Error getInfoCamera in stopStream');
      }
    });
  });

  
  socket.on('killProcess', function(cameraID){
    console.log('killProcess event');
    setState(cameraID, 0);
    sendToCamera(cameraID, 'killProcess', null);
  });


  socket.on('signin', function(data){
    console.log('signin event');
    var password = passHash.generate(data.password);
    const checkEmail = 'SELECT email FROM user WHERE email = "'+data.email+'"';
    connection.query(checkEmail, function(err, rows){
      if (err){
        throw err;
      }
      console.log('no error chack email');
      if (rows.length>0){
        console.log('email exist');
        socket.emit('message', {title: 'Alerte', message: 'Error Email already exist', action: ''});
      }else{
        console.log('email don\'t exist');
        const signin = 'INSERT INTO user SET name = "'+data.name+'", email = "'+data.email+'", password = "'+password+'"';
        connection.query(signin, function(err){
          if (err){
            throw err;
          }
          console.log('login success');
          const getUserID = 'SELECT userID FROM user WHERE email = "'+data.email+'"';
          connection.query(getUserID, function(err,rows){
            if (err){
              throw err;
            }
            socket.emit('redirect',serverURL+'/display?userID='+rows[0].userID);
          });
        });
      }
    });
  });

  
  socket.on('login', function(data){
    console.log('login event');
    const getPassword = 'SELECT * FROM user WHERE email = "'+data.email+'"';
    connection.query(getPassword,function(err,rows){
      if (err){
        throw err;
      }
      if (rows.length>0){
        if (passHash.verify(data.password, rows[0].password)){
          socket.emit('redirect',serverURL+'/display?userID='+rows[0].userID);
        }else{
          socket.emit('message',{title: 'Alerte', message: 'Erreur: Le password entré est incorrect', action: 'empty-login'});
        }
      }else{
          socket.emit('message',{title: 'Alerte', message: 'Erreur: Cette adresse email est introuvable', action: 'empty-login'});
      }
    })
  });

  
  socket.on('addScreen', function(data){
    console.log('add screen event');
    const checkCode = 'SELECT * FROM camera WHERE code = "'+data.code+'"';
    connection.query(checkCode, function(err,rows){
      if (err){
        throw err;
      }
      if (rows.length > 0){
        const addScreenToClient = 'UPDATE camera SET userID = '+data.userID+', code = 0 WHERE code = "'+data.code+'"';
        connection.query(addScreenToClient, function(err){
          if (err){
            throw err;
          }
          socket.emit('message', {title: 'Bravo', message: 'La caméra a correctement été ajouté ! La page devrait se rafraichir d\'ici quelques seconde..', action: ''});
          setTimeout(function(){
            socket.emit('redirect', serverURL+'/display?userID='+data.userID);
          }, 5000);
        });
      }else{
        console.log('No camera found');
        socket.emit('message',{title: 'Alerte', message: 'Le code indiqué est érroné', action: ''});
      }
    });
  });

  
  socket.on('checkAdminPassword', function(data){
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
    setState(cameraID,1);
    io.emit('motionDetectionStart', cameraID);
  });

  
  socket.on('motionDetectionStop', function(cameraID){
    setState(cameraID, 0);
    io.emit('motionDetectionStop', cameraID);
    sendToCamera(cameraID,'killProcess',null);
  });

  
  socket.on('motionDetected', function(data){
    const getInfoClient = 'SELECT user.userID, user.phone, user.email, camera.name AS cameraName FROM user INNER JOIN camera ON camera.userID=user.userID WHERE cameraID = '+data.cameraID;
    connection.query(getInfoClient, function(err,rows){
      if(err){
        throw err;
      }
      if(rows.length > 0){
        //Send SMS
        client.sms.message.create({
          to: "'"+rows[0].phone+"'",
          from: '+32460207648',
          body: 'Hi '+rows[0].name+' ! The camera "'+rows[0].cameraName+'" just detected motion at '+data.timestr+'. A record has been started. You will be able to see it in few minutes on the website. Bisous !'
        }, function(error, message){
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
  

  socket.on('recordStart', function(cameraID){
    setState(cameraID,3);
  });


  socket.on('recordStop', function(cameraID){
    setState(cameraID,0);
  });


  socket.on('streamSend', function(cameraID){
    console.log('streamSend');
    io.emit('updateStream', cameraID);
  });


  socket.on('startLiveRecording', function(cameraID){
    console.log('startLiveRecording');
    setState(cameraID,4);

    getInfoCamera(cameraID, function(camera){
      sendToCamera(cameraID, 'startLiveRecording', {cameraID: cameraID, name: camera.name});
    });

  });


  socket.on('stopLiveRecording', function(cameraID){
    console.log('stopLiveRecording');
    setState(cameraID,2);

    getInfoCamera(cameraID, function(camera){
      sendToCamera(cameraID, 'getLiveRecording', {cameraID: cameraID, name: camera.name});
    });

  });


  socket.on('getLiveRecordingDone', function(cameraID){
    console.log('getLiveRecordingDone');

    getInfoCamera(cameraID, function(camera){
      if(camera.state == 2){
        sendToCamera(cameraID, 'startStream', {cameraID: cameraID, name: camera.name});
      }
    });

    io.emit('getLiveRecordingDone',cameraID);
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
          console.log(files[i]+' = '+data.newName);
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
          if(err){
            throw err;
          }
        });
      }
    });
  });
  
  
  socket.on('removeReplay',function(data){
    console.log('removeReplay event');
    const cmd = 'rm ./public/cameras/camera'+data.cameraID+'/videos/'+data.name;
    console.log(cmd);
    exec(cmd,function(err){
      if(err){
        throw err;
      }
    });
  });
  
  
  
//FUNCTIONS----------------------------------------------------------------------------------------------

  //function findGetParameter(parameterName) {
   // var result = null,
  //      tmp = [];
  //  var items = location.search.substr(1).split("&");
  //  for (var index = 0; index < items.length; index++) {
  //    tmp = items[index].split("=");
  //    if (tmp[0] === parameterName) result = decodeURIComponent(tmp[1]);
  //  }
  //  return result;
 // }


  function addRecord(data){
    console.log('addRecord function');
    const begin = parseInt(data.begin_hour*60)+parseInt(data.begin_minute);
    const end = parseInt(data.end_hour*60)+parseInt(data.end_minute);
    //add new record
    const addRecord = 'INSERT INTO record SET cameraID = '+data.cameraID+', begin = '+begin+', end = '+end+', frequency = "'+data.frequency+'", frequencyEnd = "'+data.frequencyEnd+'", state = 1, type = "'+data.type+'"';
    connection.query(addRecord, function(err){
      if(err){
        throw err;
      }
      const getRecordID = 'SELECT recordID FROM record ORDER BY recordID DESC LIMIT 1';
      connection.query(getRecordID, function(err,rows){
        if(err){
          throw err;
        }
        getInfoCamera(data.cameraID, function(camera){
          if(camera != null){

            io.to(camera.socketID).emit('timer', {
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
              recordID: rows[0].recordID
            });
          }
        });
      });
    });
  }


  function changeRecord(recordID){
    console.log('changeRecord function');
    const oldRecord = 'UPDATE record SET state =0 WHERE state =1 AND cameraID = ( SELECT cameraID FROM (SELECT cameraID FROM record WHERE recordID ='+recordID+') AS tmp )';
    connection.query(oldRecord, function (err) {
      if(err){
        throw err;
      }
      //set new main record state to 1
      const newRecord = 'UPDATE record SET state = 1 WHERE recordID = '+recordID;
      connection.query(newRecord, function(err){
        if(err){
          throw err;
        }
        //set record to camera
        const getDataRecord = 'SELECT * FROM record INNER JOIN camera ON record.cameraID = camera.cameraID WHERE recordID = '+recordID;
        connection.query(getDataRecord, function(err, rows){
          if(err){
            throw err;
          }
          var begin_minute = rows[0].begin % 60;
          var begin_hour = (rows[0].begin - begin_minute) / 60;
          var end_minute = rows[0].end % 60;
          var end_hour = (rows[0].end - end_minute) / 60;
          io.to(rows[0].socketID).emit('timer', {begin_hour: begin_hour, begin_minute: begin_minute, end_hour: end_hour, end_minute: end_minute, frequency: rows[0].frequency, cameraName: rows[0].name, type: rows[0].type});
        });
      });
    });
  }


  function disableRecord(recordID){
    console.log('disableRecord function');
    const setStateTo0 = 'UPDATE record SET state = 0 WHERE recordID = '+recordID;
    connection.query(setStateTo0, function(err){
      if(err){
        throw err;
      }
    });
    const getRecordType = 'SELECT * FROM record WHERE recordID = '+recordID;
    connection.query(getRecordType, function(err, rows){
      if(err){
        throw err;
      }
      if(rows[0].type == 'record'){
        sendToCamera(rows[0].cameraID, 'deleteRecord', null);
      }else{
        sendToCamera(rows[0].cameraID, 'deleteDetection', null);
      }
    });
  }


  function sendToCamera(cameraID, event, data){
    //console.log('sendToCamera function');
    const getSocketID = 'SELECT * FROM camera WHERE cameraID = '+cameraID;
    connection.query(getSocketID, function(err,rows){
      io.to(rows[0].socketID).emit(event, data);
    });
  }


  function setState(cameraID, state){
    //State 0 = Nothing is running
    //State 1 = MotionDetection running
    //State 2 = Live running
    //State 3 = Record running
    //State 4 = Live Recording running
    //console.log('setState function');
    const setState = 'UPDATE camera SET state = '+state+' WHERE cameraID = '+cameraID;
    connection.query(setState, function(err){
      if(err){
        throw err;
      }
    });
  }
  
  
  function getInfoCamera(cameraID, callback){
    console.log('getInfoCamera function');
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


  function getInfoRecord(recordID, callback){
    console.log('getInfoRecord function');
    const getInfoRecord = 'SELECT * FROM record WHERE recordID = '+recordID;
    connection.query(getInfoRecord, function(err,rows){
      if(err){
        throw err;
      }
      if(rows.length>0){
        callback(rows[0]);
      }else{
        console.log('error getInfoRecord function');
      }
    });
  }


  function checkTimer(data, callback){

    console.log('checkTimer');

    var t1b, t1e, t1b1,t1b2,t1e1,t1e2, t2b, t2e, t2b1, t2e1, t2b2, t2e2;
    var check = true;
    var timer1 = data.timer1;
    var timer2 = data.timer2;

    //Check chevauche ?

    for(var i=0;i<timer1.length;i++){
      console.log('check record '+i);

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

          if(((t1e - t1b) >= 1440) || ((t1e - t1b) < 0)){
            console.log('size > 1440');
            check = false;
            break;
          }else{

            t2b1 = ((parseInt(timer1[i].frequency)*24*60)+timer2.begin);
            t2e1 = ((parseInt(timer1[i].frequency)*24*60)+timer2.end);
            t2b2 = ((parseInt(timer1[i].frequencyEnd)*24*60)+timer2.begin);
            t2e2 = ((parseInt(timer1[i].frequencyEnd)*24*60)+timer2.end);
            console.log('t1b = '+t1b+' | t1e = '+t1e+' | t2b1 = '+t2b1+' | t2b2 = '+t2b2+' | t2e1 = '+t2e1+' | t2e2 = '+t2e2);

            if((t1b >= t2b1 && t1b <= t2e1) || (t1e >= t2b2 && t1e <= t2e2) || (t1b < t2b1 && t1e > t2e1) || (t1b > t2e1 && t1e < t2b1)){
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

            if(((t2e - t2b) >= 1440) || ((t2e - t2b) < 0)){
              console.log('size > 1440');
              check = false;
              break;
            }else{

              t1b1 = ((parseInt(timer2.frequency)*24*60)+timer1[i].begin);
              t1e1 = ((parseInt(timer2.frequency)*24*60)+timer1[i].end);
              t1b2 = ((parseInt(timer2.frequencyEnd)*24*60)+timer1[i].begin);
              t1e2 = ((parseInt(timer2.frequencyEnd)*24*60)+timer1[i].end);
              console.log('t2b = '+t2b+' | t2e = '+t2e+' | t1b1 = '+t1b1+' | t1b2 = '+t1b2+' | t1e1 = '+t1e1+' | t1e2 = '+t1e2);

              if((t2b >= t1b1 && t2b <= t1e1) || (t2e >= t1b2 && t2e <= t1e2) || (t2b < t1b1 && t2e > t1e1) || (t2b > t1e1 && t2e < t1b1)){
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
      console.log('end record '+i);
    }

    console.log('end loop');
    if(check){
      callback('OK');
    }else{
      callback('NOK');
    }

  }

  
});

server.listen(port, function(){
  console.log('Server running !');
});