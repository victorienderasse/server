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


const port = 3000;
const routes = require('./routes/index');
const app = express();

// view engine setup
app.set('views', path.join(__dirname, 'views'));
app.set('view engine', 'ejs');
app.set('port', port);


const server = http.createServer(app);
server.listen(port, function(){
  console.log('Server running !');
});

const io = require('socket.io').listen(server);

// uncomment after placing your favicon in /public
app.use(favicon(path.join(__dirname, 'public', 'favicon.ico')));
app.use(express.static(path.join(__dirname, 'public')));
app.use('/public/javascripts', express.static(path.join(__dirname, 'public/javascripts')));
app.use('/public/stylesheets', express.static(path.join(__dirname, 'public/stylesheets')));
app.use('/public/images', express.static(path.join(__dirname, 'public/images')));
app.use(logger('dev'));
app.use(bodyParser.json());
app.use(bodyParser.urlencoded({ extended: false }));
app.use(cookieParser());
app.use(express.static(path.join(__dirname, 'public')));
app.use('/', routes);

// catch 404 and forward to error handler
app.use(function(req, res, next) {
  var err = new Error('Not Found');
  err.status = 404;
  next(err);
});

// error handlers

// development error handler
// will print stacktrace
if (app.get('env') === 'development') {
  app.use(function(err, req, res, next) {
    res.status(err.status || 500);
    res.render('error', {
      message: err.message,
      error: err
    });
  });
}

// production error handler
// no stacktraces leaked to user
app.use(function(err, req, res, next) {
  res.status(err.status || 500);
  res.render('error', {
    message: err.message,
    error: {}
  });
});


//module.exports = app;

//connection database

const connection = mysql.createConnection({
  host : 'localhost',
  user : 'root',
  password : 'tfepassword',
  database : 'TFE'
});


//Receive data from client
io.sockets.on('connection', function(socket){
  
  //require('./public/javascripts/server.js')(socket, io, connection, fs, passHash);
  //Client connected
  socket.on('client', function (data) {
    console.log('client connecté');
    var sendCamera = 'SELECT * FROM camera WHERE enable = 1';
    connection.query(sendCamera, function (err,rows) {
      socket.emit('sendCamera', rows);
    });
  });


  //Camera connected
  socket.on('camera', function (serial) {
    console.log('camera connecté');

    //check camera exist
    connection.query('SELECT * FROM camera WHERE serial = ?', serial , function(err, rows, fields){
      if(err){
        console.log('camera exist MYSQL error : '+err);
        throw err;
      }
      if(rows.length > 0){
        console.log('camera exist');
        var alter = 'UPDATE camera SET socketID="'+socket.id+'" , enable = 1 WHERE cameraID = '+rows[0].cameraID;
        connection.query(alter, function(err){
          if(err){
            console.log(err);
          }
        });

      }else{
        console.log('New camera');
        var cameraName = "camera_"+serial;
        var camera = {serial: serial, name: cameraName, socketID: socket.id};
        connection.query('INSERT INTO camera SET ?', camera, function(err){
          if(err){
            console.log(err);
          }
        });
      }
    });
  });


  //camera or client disconnected
  socket.on('disconnect', function(){
    console.log('disconnected');
    //check client or camera disconnected
    var disconnection = 'SELECT cameraID FROM camera WHERE socketID = "'+ socket.id+'"';
    connection.query(disconnection, function(err, rows){
      if(rows.length > 0){
        //camera disconnected -> set enable to false and state to unused
        var disable = 'UPDATE camera SET enable = 0 WHERE socketID = "'+socket.id+'"';
        connection.query(disable, function (err) {
          if(err){
            console.log('disable error : '+err);
          }
        });
      }
    });
  });


  //save record to db and send record to camera to process
  socket.on('setTimer', function(data) {
    console.log('SetTimer event');
    //update record
    const updateRecord = 'UPDATE record SET state = 0 WHERE cameraID = ' + data.cameraID+' AND state = 1';
    connection.query(updateRecord, function (err) {
      if (err) {
        throw err;
      }
      addRecord(data);
    });
  });


  //change the camera's name
  socket.on('changeCameraName', function(data){
    console.log('changeCameraName event');
    const changeName = 'UPDATE camera SET name = "'+data.name+'" WHERE cameraID = "'+data.cameraID+'"';
    connection.query(changeName, function(err){
      if(err){
        console.log('error : '+err);
      }
    })
  });


  //Send Record to client
  socket.on('getRecords', function(cameraID){
    console.log('getRecords event');
    const getRecords = 'SELECT * FROM record WHERE cameraID = '+cameraID;
    connection.query(getRecords, function(err, rows){
      if(err){
        console.log(err);
      }
      socket.emit('sendRecords', rows);
    });
  });

  //Delete recorded record
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

  //enable recorded record
  socket.on('applyRecord', function(recordID){
    console.log('applyRecord event');
    //set old record to client
    const getOldRecord = 'SELECT * FROM record WHERE state = 1 AND cameraID = (SELECT cameraID FROM (SELECT cameraID FROM record WHERE recordID ='+recordID+') AS tpm)';
    connection.query(getOldRecord, function(err,rows){
      if(err){
        throw err;
      }
      if(rows.length>0) {
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
  });

  //Get all the replay
  socket.on('getReplays', function(){
    console.log('getReplays event');
    fs.readdir('../client/public/videos', function(err, files){
      if(err){
        console.log('getReplays error : '+err);
        throw err;
      }
      socket.emit('setReplays',files);
    })
  });

  //Start the motion detection
  socket.on('startDetection', function(cameraID){
    console.log('startDetection event');
    //update db
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
        console.log('get socket id MYSQL error : '+err);
        throw err;
      }
      io.to(rows[0].socketID).emit('startDetection', {cameraName: rows[0].name, cameraID: cameraID});
    });
  });

  //Start live stream
  socket.on('startStream', function(cameraID){
    console.log('startStream event');
    setState(cameraID, 2);
    sendToCamera(cameraID, 'startStream', cameraID);
  });

  //Kill all python process
  socket.on('killProcess', function(cameraID){
    console.log('killProcess event');
    setState(cameraID, 0);
    sendToCamera(cameraID, 'killProcess', null);
  });

  //Signin user
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
        socket.emit('msgError', 'Error Email already exist');
      }else{
        console.log('email don\'t exist');
        const signin = 'INSERT INTO user SET name = "'+data.name+'", email = "'+data.email+'", password = "'+password+'"';
        connection.query(signin, function(err){
          if (err){
            throw err;
          }
        });
      }
    });
  });

  //Login user
  socket.on('login', function(data){
    console.log('login event');
    const getPassword = 'SELECT password FROM user WHERE email = "'+data.email+'"';
    connection.query(getPassword,function(err,rows){
      if (err){
        throw err;
      }
      if (rows.length>0){
        if (passHash.verify(data.password, rows[0].password)){
          socket.emit('msgError','Login successfull');
        }else{
          socket.emit('msgError', 'Error wronf password');
        }
      }else{
        socket.emit('msgError','Error email doesn\'t exist');
      }
    })
  });


//Functions-------------------------------------------------


  function addRecord(data){
    console.log('addRecord function');
    const begin = parseInt(data.begin_hour*60)+parseInt(data.begin_minute);
    const end = parseInt(data.end_hour*60)+parseInt(data.end_minute);
    //add new record
    const addRecord = 'INSERT INTO record SET cameraID = '+data.cameraID+', begin = '+begin+', end = '+end+', frequency = "'+data.frequency+'", state = 1, type = "'+data.type+'"';
    connection.query(addRecord, function(err){
      if(err){
        throw err;
      }
      //get socketID and name of the camera
      const getSocketID = 'SELECT * FROM camera WHERE cameraID = '+data.cameraID;
      connection.query(getSocketID, function(err,rows){
        if(err){
          throw err;
        }
        io.to(rows[0].socketID).emit('timer', {
          begin_hour: data.begin_hour,
          begin_minute: data.begin_minute,
          end_hour: data.end_hour,
          end_minute: data.end_minute,
          frequency: data.frequency,
          cameraName: rows[0].name,
          type: data.type
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
    console.log('sendToCamera function');
    const getSocketID = 'SELECT * FROM camera WHERE cameraID = '+cameraID;
    connection.query(getSocketID, function(err,rows){
      io.to(rows[0].socketID).emit(event, data);
    });
  }


  function setState(cameraID, state){
    console.log('setState function');
    const setState = 'UPDATE camera SET state = '+state+' WHERE cameraID = '+cameraID;
    connection.query(setState, function(err){
      if(err){
        throw err;
      }
    });
  }

});
