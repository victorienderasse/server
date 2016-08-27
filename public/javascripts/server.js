/**
 * Created by Victorien on 06-06-16.
 */

module.exports = function(socket, io, connection) {

//Event-------------------------------------------

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
               var disable = 'UPDATE camera SET enable = 0, state = 0 WHERE socketID = "'+socket.id+'"';
               connection.query(disable, function (err) {
                  if(err){
                      console.log('disable error : '+err);
                  }
               });
           }
        });
    });


    socket.on('setTimer', function(data) {
        //update database
        console.log('Set timer record');
        const begin = (data.begin_hour*60)+data.begin_minute;
        const end = (data.end_hour*60)+data.end_minute;
        const addRecord = 'INSERT INTO record SET cameraID = '+data.cameraID+', begin = '+begin+', end = '+end+', frequency = "'+data.frequency+'", state = '+0;
        connection.query(addRecord, function(err){
            if(err){
                console.log('error : '+err);
            }else{
                //send to camera
                console.log('Send timer to camera');
                const getSocketID = 'SELECT * FROM camera WHERE cameraID = '+data.cameraID;
                connection.query(getSocketID, function (err, rows){
                    if(err){
                        console.log('error : '+err);
                    }else{
                        const socketID = rows[0].socketID;
                        io.to(socketID).emit('test', data.cameraID);
                    }
                });
                //io.emit('timer',data);
            }

        });
    });

    //change the camera's name
    socket.on('changeCameraName', function(data){
        const changeName = 'UPDATE camera SET name = "'+data.name+'" WHERE cameraID = "'+data.cameraID+'"';
        connection.query(changeName, function(err){
            if(err){
                console.log('error : '+err);
            }
            console.log('CameraName changed successfully');
        })
    });


//Functions-------------------------------------------------
    /*
    function addUser(data) {
        const user = {name: data.name, surname: data.surname, email: data.email, password: data.password};
        connection.connect(function (err) {
            if (!err) {
                //check Data
                connection.query("SELECT email FROM user WHERE email = ?", data.email, function(err, rows, fields){
                    if (rows.length > 0){
                        //connection.end();
                        socket.emit('msgError', 'Error - Email already in use');
                    }else{
                        if (data.password != data.passwordCheck) {
                            //connection.end();
                            socket.emit('msgError', 'Your passwords seems to be differents');
                        }else {
                            //Add Data
                            console.log('connect to database');
                            connection.query("INSERT INTO user SET ?", user, function (err) {
                                //connection.end();
                                if (!err) {
                                    console.log('responde : OK');
                                    socket.emit('redirect', 'http://localhost:8080/display');
                                }else {
                                    console.log('Error', err);
                                    socket.emit('msgError', 'Error - ')
                                }
                            });
                        }
                    }
                });
            } else {
                console.log('error connecting database..', err);
            }
        });
    };
    */

}