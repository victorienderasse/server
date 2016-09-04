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
        const checkRecordExist = 'SELECT * FROM record WHERE cameraID = '+data.cameraID+' AND state = 1';
        connection.query(checkRecordExist, function(err, rows){
            if(err){
                console.log('error :'+err);
            }else{
                if(rows.length>0) {
                    //update record
                    console.log('update record');
                    const updateRecord = 'UPDATE record SET state = 0 WHERE recordID = ' + rows[0].recordID;
                    connection.query(updateRecord, function (err) {
                        if (err) {
                            console.log(err);
                        }else{
                            console.log('update done');
                            addRecord(data);
                        }
                    });
                }else{
                    console.log('no update needed');
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
                    const getSocketID = 'SELECT * FROM camera WHERE cameraID = '+rows[0].cameraID;
                    connection.query(getSocketID, function(err,rows){
                        if(err){
                            console.log('get socket id MYSQL error : '+err);
                        }else{
                            io.to(rows[0].socketID).emit('deleteRecord');
                        }
                    });
                }
            }
        });
    });


    socket.on('applyRecord', function(recordID){
        console.log('applyRecord event');
        //set old record to client
        console.log('set old record to client');
        const getOldRecord = 'SELECT * FROM record WHERE state = 1 AND cameraID = (SELECT cameraID FROM (SELECT cameraID FROM record WHERE recordID ='+recordID+') AS tpm)';
        connection.query(getOldRecord, function(err,rows){
            if(err){
                console.log('get old record MYSQL error : '+err);
            }else{
                if(rows[0].length>0){
                    socket.emit('setOldRecord',rows[0].recordID);
                    //set old main record state to 0
                    console.log('set old main record state to 0');
                    const oldRecord = 'UPDATE record SET state =0 WHERE state =1 AND cameraID = ( SELECT cameraID FROM (SELECT cameraID FROM record WHERE recordID ='+recordID+') AS tmp )';
                    connection.query(oldRecord, function (err) {
                        if(err){
                            console.log('update old record MYSQL error : '+err);
                        }else{
                            //set new main record state to 1
                            console.log('set new main record state to 1');
                            const newRecord = 'UPDATE record SET state = 1 WHERE recordID = '+recordID;
                            connection.query(newRecord, function(err){
                                if(err){
                                    console.log('apply new record MYSQL error : '+err);
                                }else{
                                    //set record to camera
                                    console.log('set record to camera');
                                    const getDataRecord = 'SELECT * FROM record INNER JOIN camera ON record.cameraID = camera.cameraID WHERE recordID = '+recordID;
                                    connection.query(getDataRecord, function(err, rows){
                                        if(err){
                                            console.log('set record to camera MYSQL error : '+err);
                                        }else{
                                            var begin_minute = rows[0].begin % 60;
                                            var begin_hour = (rows[0].begin - begin_minute) / 60;
                                            var end_minute = rows[0].end % 60;
                                            var end_hour = (rows[0].end - end_minute) / 60;
                                            io.to(rows[0].socketID).emit('timer', {begin_hour: begin_hour, begin_minute: begin_minute, end_hour: end_hour, end_minute: end_minute, frequency: rows[0].frequency, cameraName: rows[0].name});
                                        }
                                    });
                                }
                            });
                        }
                    });
                }
            }
        });
    });


//Functions-------------------------------------------------


    function addRecord(data){
        console.log('addRecord function');
        const begin = parseInt(data.begin_hour*60)+parseInt(data.begin_minute);
        const end = parseInt(data.end_hour*60)+parseInt(data.end_minute);
        //add new record
        console.log('add record mysql');
        const addRecord = 'INSERT INTO record SET cameraID = '+data.cameraID+', begin = '+begin+', end = '+end+', frequency = "'+data.frequency+'", state = 1';
        connection.query(addRecord, function(err){
            if(err){
                console.log('error : '+err);
            }else{
                //get socketID and name of the camera
                console.log('get socket ID');
                const getSocketID = 'SELECT * FROM camera WHERE cameraID = '+data.cameraID;
                connection.query(getSocketID, function(err,rows){
                    if(err){
                        console.log('get socket id MYSQL error : '+err);
                    }else{
                        console.log('send timer event to camera');
                        io.to(rows[0].socketID).emit('timer', {begin_hour: data.begin_hour, begin_minute: data.begin_minute, end_hour: data.end_hour, end_minute: data.end_minute, frequency: data.frequency, cameraName: rows[0].name});
                    }
                });
            }
        });
    }




};