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


    //Reception from sign in form
    /*
    socket.on('sendSignin', function (data) {
        console.log('data received');
        addUser(data);
    });
    */


    //Camera connected
    socket.on('camera', function (serial) {
        console.log('camera connecté : '+ serial);

        //check camera exist
        connection.query('SELECT * FROM camera WHERE serial = ?', serial , function(err, rows, fields){
            console.log('rows.length : '+rows.length);
            if(rows.length > 0){
                console.log('camera exist');
                var alter = 'UPDATE camera SET socketID="'+socket.id+'" , enable = 1 WHERE cameraID = '+rows[0].cameraID;
                console.log(alter);
                connection.query(alter, function(err){
                    if(err){
                        console.log(err);
                    }
                });

            }else{
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

    socket.on('disconnect', function(){
        console.log('disconnected');
        //check client or camera disconnected
        var disconnection = 'SELECT cameraID FROM camera WHERE socketID = "'+ socket.id+'"';
        connection.query(disconnection, function(err, rows){
           if(rows.length > 0){
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
        console.log(data.frequency)
        //send camera
        io.emit('timer',data);
    });


    socket.on('changeCameraName', function(data){
        const changeName = 'UPDATE camera SET name = "'+data.name+'" WHERE cameraID = "'+data.cameraID+'"';
        connection.query(changeName, function(err){
            if(err){
                console.log('error : '+err);
            }
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