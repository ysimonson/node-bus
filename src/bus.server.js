#!/usr/local/bin/node

var sys = require('sys');

exports.service = function(request, response){
    if(request.method === "GET"){
        // new listener...
        return listen(request, response);
    } else if(request.method === "POST"){
        // new event publish...
        sys.puts("POST received");
        return publish(request, response);
    }
}

var requests = [];
function listen(request, response){
    requests.push(response);
    
    sys.puts("Listener Registered");
}

function publish(request, response){
    var contentType = request.headers['Content-Type'];
    
    var data = [];
    request.addListener('data', function(chunk){
        // collect the data from the requestor...
        data.push(chunk);
    });
    
    // When data is finished, push it all to the listeners.
    request.addListener('end', function(chunk){
        var fullData = data.join('');
        
        sys.puts("Publishing an event to "+requests.length+" listeners.");
    
        for(var i = 0, len = requests.length; i < len; i++){
            var req = requests[i];
            req.writeHead(200, {
                'Content-Type': "application/javascript",
                'Content-Length': fullData.length,
            });
            req.end(fullData);
            delete requests[i];
        }
        
        requests = [];
    });
    
    // close out our request.
    response.writeHead(200);
    response.end();
}