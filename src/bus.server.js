#!/usr/local/bin/node

var sys = require('sys');
var http = require('http');

var server = http.createServer(function (req, res){
    res.writeHead(200, {'Content-Type': 'text/plain'});
    var count = 0;
    var interval = setInterval(function(){
        count++;
        if(count <= 10){
            res.write("omg");
            res.flush();
        } else {
            res.end();
            clearInterval(interval);
        }
    }, 2000);
});
server.listen(8000);