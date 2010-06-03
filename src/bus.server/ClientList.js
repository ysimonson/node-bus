// clients:
//          Array of clients connected to the bus.
var clients = [];

// currentClientId:
//          The current client ID, this is the ID that will be assigned to the 
//          next client which connects to the server.
var currentClientId = 0;


function addClient(client){
    // summary:
    //          Adds a client to the client collection.  When events are sent, 
    //          they will be pushed to all of the clients in the client 
    //          collection.
    // client: Object
    //          Client to add.
    // returns: Boolean
    //          True if the client was added, False if the client already 
    //          exists.
    
    if(clientExists(client)){
        return false;
    }

    // set the clientId for the client
    client.clientId = currentClientId;
    
    // increment the 'global' client id counter
    currentClientId++;
    
    // add the client to the array
    clients.push(client);
    
    return true;
}

function clientExists(client){
    // summary:
    //          Determines whether or not a client exists within the current 
    //          client collection.
    // client: Object
    //          Client object to evaluate.
    // returns: Boolean
    //          Whether or not the client exists within the client collection.
    
    if(client.clientId == null){
        // if the client doesn't have a client id, then it can't be in the array 
        //  (theoretically.... this isn't the most accurate way to do this, but 
        //  it will work for now)
        return false;
    }
    
    // look through the client array, if ours exists then return true.
    for(var i = 0, len = clients.length; i < len; i++){
        if(clients[i].clientId === client.clientId){
            return true;
        }
    }
    
    // if we didn't find it, return false
    return false;
}

function removeClient(client){
    // summary:
    //          Removes a client from the client collection.
    // client:
    //          Client object to remove.
    // returns: Boolean
    //          True if the client was successfully removed, False otherwise 
    //          (maybe the client was never added to the collection in the first 
    //          place).
    
    if(!clientExists(client)){
        return false;
    }
    
    
    // look through the client array, if ours exists then remove it.
    for(var i = 0, len = clients.length; i < len; i++){
        if(clients[i].clientId === client.clientId){
            clients.splice(i,1);
            return true;
        }
    }
    
    // return false if we couldn't find it.
    return false;
}

function publishEvent(event){
    // summary:
    //          Publishes an event to the clients in the collection.
    // event: Object
    //          Event to publish.
    
    // clean up expired longpolling clients and disconnected websocket clients
    cleanup();
    
    // iterate through the clients and send the event
    for(var i = 0, len = clients.length; i < len; i++){
        clients[i].sendData(event);
    }
}

function cleanup(){
    // summary:
    //          Looks for disconnected or expired clients and removes them from 
    //          the client collection.
    
    var newClientArry = [];
    
    for(var i = 0, len = clients.length; i < len; i++){
        if(clients[i].connected === false || clients[i].expired === true){
            continue;
        }
        
        newClientArry.push(clients[i]);
    }
    
    clients = newClientArry;
}

exports.addClient = addClient;
exports.clientExists = clientExists;
exports.removeClient = removeClient;
exports.publishEvent = publishEvent;