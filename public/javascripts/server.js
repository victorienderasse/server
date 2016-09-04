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
        console.log('SetTimer function');
        //check if this camera has already a record
        console.log('check record exist');
        console.log('cameraID : '+data.cameraID);
        const checkRecordExist = 'SELECT * FROM record WHERE cameraID = '+data.cameraID+' AND state = 1';
        connection.query(checkRecordExist, function(err, rows){
            console.log('cameraID2 : '+data.cameraID);
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
                            addRecord(data);
                        }
                    });
                }else{
                    addRecord(data);
                }
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


    socket.on('deleteRecord', function(recordID){
        const checkState = 'SELECT * FROM record WHERE recordID = '+recordID;
        connection.query(checkState, function(err,rows){
            console.log('record ID :'+rows[0].recordID);
            if(err){
                console.log('check state MYSQL error :'+err);
            }else{
                const deleteRecord = 'DELETE FROM record WHERE recordID = '+recordID;
                connection.query(deleteRecord, function(err){
                    if(err){
                        console.log('delete record MYSQL error : '+err);
                    }
                });
                if(rows[0].state == 1) {
                    const getSocketID = 'SELECT * FROM camera WHERE cameraID = '+cameraID;
                    connection.query(getSocketID, function(err,rows){
                        if(err){
                            console.log('get socket id MYSQL error : '+err);
                        }else{
                            console.log('socketID :'+socketID);
                            io.to(rows[0].socketID).emit('deleteRecord');
                        }
                    });
                }
            }
        });
    });


//Functions-------------------------------------------------


    function addRecord(data){
        const begin = parseInt(data.begin_hour*60)+parseInt(data.begin_minute);
        const end = parseInt(data.end_hour*60)+parseInt(data.end_minute);
        //add new record
        const addRecord = 'INSERT INTO record SET cameraID = '+data.cameraID+', begin = '+begin+', end = '+end+', frequency = "'+data.frequency+'", state = 1';
        connection.query(addRecord, function(err){
            if(err){
                console.log('error : '+err);
            }else{
                //get socketID of the camera
                const getSocketID = 'SELECT * FROM camera WHERE cameraID = '+cameraID;
                connection.query(getSocketID, function(err,rows){
                    if(err){
                        console.log('get socket id MYSQL error : '+err);
                    }else{
                        io.to(rows[0].socketID).emit('timer', data);
                    }
                });
            }
        });
    }




};