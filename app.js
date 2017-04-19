
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
const serverURL = 'http://192.168.1.51:3000';
const app = express();

const server = http.createServer(app);
const io = require('socket.io').listen(server);

const connection = mysql.createConnection({
  host : 'localhost',
  user : 'root',
  password : '221193m',
  database : 'TFE'
});

const session = require('express-session')({
  secret: "tfe-secret",
  resave: true,
  saveUnitialized: true
});

const client = new twilio.RestClient('AC175fe55d0a0d00d7094c00338f548ec5','956f723bfa80087e696300e1358f46cb');



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
    const getSerial = 'SELECT * FROM camera WHERE serial = "'+serial+'"';
    connection.query(getSerial , function(err, rows){
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
            socket.emit('cameraUP', rows[0].cameraID);
          });
        }else{
          //Camera already added -> update socketID
          connection.query(setSocketID, function(err){
            if (err){
              throw err;
            }
            socket.emit('cameraUP', rows[0].cameraID);
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
    /*
    -> delete record from DB
    -> if state = 1, delete record from Cron
     */
    console.log('deleteRecord event');

    getInfoRecord(recordID, function(record){
      if(record.state == 1){
        sendToCamera(record.cameraID,'deleteRecord',recordID);
      }

      const deleteRecord = 'DELETE FROM record WHERE recordID = '+recordID;
      connection.query(deleteRecord, function(err){
        if(err){
          throw err;
        }
      });

    });

  });

  
  socket.on('applyRecord', function(recordID){
    console.log('applyRecord event');
    //set old record to client

        getInfoRecord(recordID, function(record){

          const getRecordsEnable = 'SELECT * FROM record WHERE state = 1 AND cameraID = '+record.cameraID;
          connection.query(getRecordsEnable, function(err,rows){
            if(err){
              throw err;
            }
            if(rows.length>0){
              var same = false;
              for(var i=0;i<rows.length;i++){
                if(parseInt(rows[i].recordID) == recordID){
                  same = true;
                  break;
                }
              }

              if(same){
                console.log('disable record');
                disableRecord(recordID);
              }else{
                console.log('apply record');
                checkTimer({timer1:rows,timer2:record},function(check){
                  if(check == 'OK'){
                    changeRecord(recordID);
                  }else{
                    socket.emit('message',{title:'Alerte',message:'Erreur record chevauchage',action:null});
                  }
                });
              }
            }else{
              changeRecord(recordID);
            }
          });

        });

  });

  
  socket.on('getReplays',function(cameraID){
    /*
    -> get filename in directory
    -> send it to client
     */
    console.log('getReplays event');
    fs.readdir('./public/cameras/camera'+cameraID+'/videos/', function(err, files){
      if(err){
        throw err;
      }
      socket.emit('setReplays',{tbReplay: files, cameraID: cameraID});
    });
  });

  
  socket.on('startDetection', function(cameraID){
    /*
    -> Set enabled record on pause state
    -> set state of camera to 1 (motion detection)
    -> send request to camera to start process
     */
    console.log('startDetection event');

    setRecordPaused(cameraID);
    setState(cameraID, 1);
    getInfoCamera(cameraID, function(camera){
      sendToCamera(cameraID,'startDetection',{cameraName: camera.name, cameraID: cameraID, resolution: camera.resolution, fps: camera.fps, brightness: camera.brightness, contrast: camera.contrast});
    });
  });


  socket.on('stopDetection', function(cameraID){
    /*
    -> Set enable paused record
    -> set state of camera to 0 (unused)
    -> send request to camera to stop process
     */
    console.log('stopDetection');
    setRecordUnpaused(cameraID);
    setState(cameraID,0);
    sendToCamera(cameraID,'killProcess',null);
  });

  
  socket.on('startStream', function(cameraID){
    /*
    -> Set camera state to 2 (live)
    -> Set enable record on pause
    -> send request to camera
     */
    console.log('startStream event ');
    setState(cameraID, 2);

    setRecordPaused(cameraID);

    getInfoCamera(cameraID, function(camera){
      sendToCamera(cameraID,'startStream', {cameraID: cameraID, name: camera.name, resolution: camera.resolution, fps: camera.fps, brightness: camera.brightness, contrast: camera.contrast});
    });

  });


  socket.on('stopStream', function(cameraID){
    /*
    -> enable paused records
    -> Check state of camera
    -> if state = 4 : Close while recording, ask camera to send video
    -> if state = 2 : just stop the stream
    -> set state of camera to 0 (unused)
     */
    console.log('stopStream');

    setRecordUnpaused(cameraID);

    getInfoCamera(cameraID, function(camera){
      if(camera.state == 4){
        setState(cameraID,0);
        socket.emit('updateLiveRecordingBtn',cameraID);
        sendToCamera(cameraID,'getLiveRecording',{cameraID: cameraID, name: camera.name});
      }else{
        setState(cameraID,0);
        sendToCamera(cameraID,'killProcess',null);
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

  
  socket.on('addCamera', function(data){
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
  });

  
  socket.on('motionDetectionStop', function(data){
    setState(data.cameraID, 0);
    if(data.once){
      setRecordState(data.recordID,0);
      sendToCamera(data.cameraID,'deleteRecord',data.recordID);
    }
  });

  
  socket.on('motionDetected', function(data){
    console.log('MotionDetected event');
    const getInfoClient = 'SELECT user.userID, user.phone, user.email, camera.name AS cameraName FROM user INNER JOIN camera ON camera.userID=user.userID WHERE cameraID = '+data.cameraID;
    connection.query(getInfoClient, function(err,rows){
      if(err){
        throw err;
      }
      if(rows.length > 0){
        //Send SMS
        client.messages.create({
          to: "'"+rows[0].phone+"'",
          from: '+32460207648',
          body: 'Hi '+rows[0].name+' ! The camera "'+rows[0].cameraName+'" just detected motion at '+data.timestr+'. A record has been started. You will be able to see it in few minutes on the website. Bisous !'
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
  

  socket.on('recordStart', function(cameraID){
    setState(cameraID,3);
  });


  socket.on('recordStop', function(data){
    console.log('recordStop event');
    setState(data.cameraID,0);
    if(data.once){
      setRecordState(data.recordID, 0);
      sendToCamera(data.cameraID,'deleteRecord',data.recordID);
    }
  });


  socket.on('streamSend', function(cameraID){
    console.log('streamSend');
    io.emit('updateStream', cameraID);
  });


  socket.on('startLiveRecording', function(cameraID){
    console.log('startLiveRecording');
    setState(cameraID,4);

    getInfoCamera(cameraID, function(camera){
      sendToCamera(cameraID, 'startLiveRecording', {cameraID: cameraID, name: camera.name, resolution: camera.resolution, fps: camera.fps, brightness: camera.brightness, contrast: camera.contrast});
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


  socket.on('stopMultiLive', function(userID){
    console.log('stopMultiLive event');
    const getCamera = 'SELECT * FROM camera WHERE userID = '+userID;
    connection.query(getCamera, function(err,rows){
      if(err){
        throw err;
      }
      if(rows.length>0){
        for(var i =0;i<rows.length;i++){

          setRecordUnpaused(rows[i].cameraID);

          getInfoCamera(rows[i].cameraID, function(camera){

            if(rows[i].state == 4){
              sendToCamera(camera.cameraID,'getLiveRecording',{cameraID:camera.cameraID, name: camera.name});
            }else{
              sendToCamera(rcamera.cameraID,'killProcess',null);
            }
            setState(camera.cameraID,0);

          });

        }
      }else{
        console.log('User has no camera up');
      }

    });
  });


  socket.on('startConfig', function(cameraID){
    console.log('startConfig event');

    getInfoCamera(cameraID, function(camera){
      console.log('camera name = '+camera.name);
      sendToCamera(cameraID,'getConfig', {cameraID: cameraID, cameraName: camera.name});
    });
    /*
    getInfoCamera(cameraID, function(camera){
      socket.emit('getConfig',camera);
    });
    */
  });


  socket.on('getConfigRes', function(data){
    console.log('getConfigRes Event');
    console.log('cameraName = '+data.cameraName);
    console.log(data.cameraID);
    console.log(data.width);
    io.emit('setConfig',data);
  });
  
  
  socket.on('applyConfig', function(data){
    console.log('setConfig event');
    const addConfig = 'UPDATE camera SET resolution = '+data.resolution+', fps = '+data.fps+', brightness = '+data.brightness+', contrast = '+data.contrast+' WHERE cameraID = '+data.cameraID;
    connection.query(addConfig, function(err){
      if(err) throw err;
    });
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
    console.log('newCameraConnection event');
    const addCamera = 'INSERT INTO camera SET userID = '+data.userID+', serial = "'+data.serial+'", name = "camera_'+data.serial+'", enable = 0, state = 0';
    connection.query(addCamera, function(err){
      if(err) throw err;
    });
  });
  
  
  
//FUNCTIONS----------------------------------------------------------------------------------------------


  function addRecord(data){
    console.log('addRecord function');
    const begin = parseInt(data.begin_hour*60)+parseInt(data.begin_minute);
    const end = parseInt(data.end_hour*60)+parseInt(data.end_minute);
    var Once;
    if(data.once){
      Once = 1;
    }else{
      Once = 0;
    }
    //add new record
    const addRecord = 'INSERT INTO record SET cameraID = '+data.cameraID+', begin = '+begin+', end = '+end+', frequency = "'+data.frequency+'", frequencyEnd = "'+data.frequencyEnd+'", state = 1, type = "'+data.type+'", once = '+Once;
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
              recordID: rows[0].recordID,
              resolution: camera.resolution,
              fps: camera.fps,
              brightness: camera.brightness,
              contrast: camera.contrast
            };

            sendToCamera(data.cameraID,'timer',arg);

          }
        });
      });
    });
  }


  function changeRecord(recordID){
    /*
    -> Update record color in UI
    -> Set record state to 1 (enable)
    -> get info record & info camera
    -> send to camera to add record on cron table
     */
    console.log('changeRecord function');
    
    socket.emit('updateRecordColor',{recordID: recordID, state: 1});

    setRecordState(recordID,1);

    getInfoRecord(recordID, function(record){
      //because cameraName
      getInfoCamera(record.cameraID, function(camera){

        var begin_minute = record.begin % 60;
        var begin_hour = (record.begin - begin_minute) / 60;
        var end_minute = record.end % 60;
        var end_hour = (record.end - end_minute) / 60;

        var Once;
        if(record.once == 0){
          Once = false;
        }else{
          Once = true;
        }

        arg = {
          begin_hour: begin_hour,
          begin_minute: begin_minute,
          end_hour: end_hour,
          end_minute: end_minute,
          frequency: record.frequency,
          frequencyEnd: record.frequencyEnd,
          cameraName: camera.name,
          cameraID: record.cameraID,
          type: record.type,
          once: Once,
          recordID: recordID,
          resolution: camera.resolution,
          fps: camera.fps,
          brightness: camera.brightness,
          contrast: camera.contrast
        };

        sendToCamera(record.cameraID,'timer',arg);

      });

    });

  }


  function disableRecord(recordID){
    /*
    -> Change record color on UI
    -> Set record state to 0 (disable)
    -> get cameraID of record
    -> get socketID of the camera
    -> send deleteRecord to camera
     */
    console.log('disableRecord function');

    socket.emit('updateRecordColor',{recordID: recordID,state:0});
    
    setRecordState(recordID,0);

    getInfoRecord(recordID, function(record){
        sendToCamera(record.cameraID,'deleteRecord',recordID);
    });
    
  }


  function sendToCamera(cameraID, event, data){
    
    getInfoCamera(cameraID, function(camera){
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


  function setRecordState(recordID, state){
    console.log('setRecordState function - state = '+state);
    /*
    State 0 : Disable
    State 1 : Enable
    State 2 : Pause
     */
    const setRecordState = 'UPDATE record SET state = '+state+' WHERE recordID = '+recordID;
    connection.query(setRecordState, function(err){
      if(err){
        throw err;
      }
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


  function getInfoRecord(recordID, callback){

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
    /*
    -> Check the record get over another record
     */

    console.log('checkTimer');

    var t1b, t1e, t2b, t2e;
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
      console.log('end record '+i);
    }

    console.log('end loop');
    if(check){
      callback('OK');
    }else{
      callback('NOK');
    }

  }


  function setRecordPaused(cameraID){
    /*
    -> Get tb of all record enable
    -> set all enable record on pause
    -> update UI
    -> send to camera to delete enable record on cron table
     */
    console.log('setRecordPaused function');
    const getEnableRecord = 'SELECT * FROM record WHERE state = 1 AND cameraID = '+cameraID;
    connection.query(getEnableRecord, function(err,rows){
      if(err){
        throw err;
      }

      if(rows.length>0){
        const setRecordPaused = 'UPDATE record SET state = 2 WHERE state = 1 AND cameraID = '+cameraID;
        connection.query(setRecordPaused, function(err){
          if(err){
            throw err;
          }
        });

        for(var i = 0;i<rows.length;i++){
          socket.emit('updateRecordColor',{recordID: rows[i].recordID, state: 2});
          sendToCamera(cameraID,'deleteRecord',rows[i].recordID);
        }
      }

    });


  }


  function setRecordUnpaused(cameraID){
    /*
    -> get all record on pause
    -> set paused record on enable
    -> update UI
    -> add record on cron table
     */
    console.log('setRecordUnpaused function');
    const getPausedRecord = 'SELECT * FROM record WHERE state = 2 AND cameraID = '+cameraID;
    connection.query(getPausedRecord, function(err,rows){
      if(err){
        throw err;
      }

      if(rows.length>0){
        const setRecordEnable = 'UPDATE record SET state = 1 WHERE state = 2 AND cameraID = '+cameraID;
        connection.query(setRecordEnable, function(err){
          if(err){
            throw err;
          }
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
              recordID: rows[i].recordID,
              resolution: camera.resolution,
              fps: camera.fps,
              brightness: camera.brightness,
              contrast: camera.contrast
            };

            sendToCamera(cameraID,'timer',arg);

            socket.emit('updateRecordColor',{recordID:rows[i].recordID,state:1});

          }
        });
      }
    });
  }

  
});

server.listen(port, function(){
  console.log('Server running !');
});