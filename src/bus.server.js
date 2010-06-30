#!/usr/local/bin/node

var sys = require('sys'),
    Utilities = require('./bus.server/Utilities'),
    EventManager = require('./bus.server/EventManager'),
    ClientList = require('./bus.server/ClientList'),
    WebSocketClient = require('./bus.server/WebSocketClient').WebSocketClient;
    LongPollingClient = require('./bus.server/LongPollingClient').LongPollingClient;

setInterval(function(){
    EventManager.publishEvent({name: "node-bus/keepalive", payload: {}});
}, 10000);

function longPollingBus(request, response){
    ClientList.addClient(new LongPollingClient(request, response));
}

function webSocketBus(request, socket, head){
    ClientList.addClient(new WebSocketClient(request,socket,head));
}

function service(request, response){
    // summary:
    //          External bus function, used to add a client to the node-bus 
    //          system.
    // description:
    //          Examines the request headers and determines which type of client 
    //          we're dealing with, then calls the appropriate registration 
    //          function.
    // request: http.ServerRequest
    //          Client's request object.
    // response: http.ServerResponse
    //          Client's response object.
    // returns:
    //          Nothing.
    
    if(request.method === "GET"){
        longPollingBus(request, response);
    } else if (request.method === "POST"){
        var data = [];
        
        // listen for data events so we can collect the data.
        request.addListener('data', function(chunk){
            data.push(chunk);
        });
        
        request.addListener('end', function(chunk){
            var fullData = data.join('');
            
            try{
                var event = JSON.parse(fullData);
            
                EventManager.publishEvent(event);
                
                response.writeHead(200);
            } catch (e){
                sys.log("Invalid JSON Data: "+fullData);
                response.writeHead(400);
            }
            response.end();
        });
        
    }
    return false;
}

exports.initialize = function(server, pattern){
    // summary:
    //          Initialize the Bus system.
    // description:
    //          Sets up listeners for 'request' and 'upgrade' events on the 
    //          server object when they match the given pattern.  Will handle 
    //          WebSocket requests and Multipart/mixed and longpolling requests.
    // server: http.Server
    //          Http Server object.
    // pattern: RegExp
    //          URL pattern to match.
    // returns: 
    //          Nothing.
    
    // listen for 'upgrade' events, so we can handle websockets.
    server.addListener('upgrade', function(req, socket, head){
        if(req.headers['upgrade'] === "WebSocket" && req.url.match(pattern)){
            webSocketBus(req, socket, head);
        }
    });
    
    server.addListener('request', function(req, res){
        if(req.url.match(pattern)){
            service(req, res);
        }
        return false;
    });
}

exports.service = service;