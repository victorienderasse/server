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


    //save record to db and send record to camera to process
    socket.on('setTimer', function(data) {
        console.log('begin hour = '+data.begin_hour);
        console.log('Set timer record');
        const begin = parseInt(data.begin_hour*60)+parseInt(data.begin_minute);
        const end = parseInt(data.end_hour*60)+parseInt(data.end_minute);
        //check if this camera has already a record
        console.log('check record exist');
        const checkRecordExist = 'SELECT * FROM record WHERE cameraID = '+data.cameraID+' AND state = 1';
        connection.query(checkRecordExist, function(err, rows){
            if(err){
                console.log('error :'+err);
            }else{
                if(rows.length>0) {
                    //update record
                    console.log('update record');
                    const updateRecord = 'UPDATE record SET state = 0 WHERE cameraID = ' + data.cameraID + ' AND state = 1';
                    connection.query(updateRecord, function (err) {
                        if (err) {
                            console.log(err);
                        }else{
                            addRecord({begin: begin, end: end, frequency: data.frequency, cameraID: data.cameraID});
                        }
                    });
                }else{
                    addRecord({begin: begin, end: end, frequency: data.frequency, cameraID: data.cameraID});
                }
                const getSocketID = 'SELECT * FROM camera WHERE cameraID = '+data.cameraID;
                connection.query(getSocketID, function(err,rows){
                    if(err){
                        console.log('get socket id MYSQL error : '+err);
                    }else{
                        const socketID = rows[0].socketID;
                        io.to(socketID).emit('timer',{begin_Hour: data.begin_hour, begin_minute: data.begin_minute, end_hour: data.end_hour, end_minute: data.end_minute, frequency: data.frequency});
                    }
                });
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


    //Send Record to client
    socket.on('getRecords', function(cameraID){
        console.log('get record');
        const getRecords = 'SELECT * FROM record WHERE cameraID = '+cameraID;
        connection.query(getRecords, function(err, rows){
            if(err){
                console.log(err);
            }
            console.log('send records');
            socket.emit('sendRecords', rows);
        });
    });


//Functions-------------------------------------------------

    function addRecord(data){
        //add new record
        const addRecord = 'INSERT INTO record SET cameraID = '+data.cameraID+', begin = '+data.begin+', end = '+data.end+', frequency = "'+data.frequency+'", state = 1';
        connection.query(addRecord, function(err){
            if(err){
                console.log('error : '+err);
            }else{
                //get socketID of the camera
                const getSocketID = 'SELECT * FROM camera WHERE cameraID = '+data.cameraID;
                connection.query(getSocketID, function(err, rows){
                    if(err){
                        console.log('error : '+err);
                    }else{
                        const socketID = rows[0].socketID;
                        io.to(socketID).emit('timer', data);
                        io.to(socketID).emit('timer', data);
                    }
                });
            }
        });
    }

};