function Client(){
    // summary:
    //          Interface for the client objects to 'implement'.
}
Client.prototype = {
    destroy: function(){
        // summary:
        //          Cleans up the object so it's ready to be garbage-collected.
        throw new Error("Client.destroy() not Implemented.");
    },
    
    sendData: function(data){
        // summary:
        //          Sends data to the client.
        throw new Error("Client.sendEvent() not Implemented.");
    }
};