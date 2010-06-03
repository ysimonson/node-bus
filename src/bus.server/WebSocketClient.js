var sys = require('sys'),
    Client = require('./Client'),
    EventManager = require('./EventManager'),
    ClientList = require('./ClientList'),
    Utilities = require('./Utilities');

// chunkPattern: RegExp
//          Regular expression to parse out the data from a chunk received over 
//          a WebSocket. Designed to the WebSocket spec for received events from 
//          clients. 
var chunkPattern = new RegExp("^\u0000(.*)\ufffd$");

function WebSocketClient(request, socket){
    // summary:
    //          A client for node-bus who is connected via an HTML 5 WebSocket.
    // description:
    //          Implements the "Client" interface (destroy, sendData) as well as 
    //          the functions necessary to support listening to the client via a 
    //          WebSocket.
    //
    //          Inspiration for the functionality of this class was taken from 
    //          the Socket.IO-Node project.
    // request: http.ServerRequest
    //          Request object for the new WebSocket connection.
    // socket:  net.Stream
    //          Socket/stream object, used for listening and writing.
    // returns: WebSocketClient
    //          New instance of a WebSocketClient. (This function is a 
    //          constructor)
    
    // save the argument variables.
    this.request = request;
    this.socket = socket;
    
    // initialize the socket
    this.init();
    
    // listen for socket events.
    this.socket.addListener("data", Utilities.hitch(this, this._handleData));
    this.socket.addListener("end", Utilities.hitch(this, this._handleDisconnect));
    this.socket.addListener("timeout", Utilities.hitch(this, this._handleTimeout));
    this.socket.addListener("error", Utilities.hitch(this, this._handleError));
}
WebSocketClient.prototype = {
    // connected: Boolean
    //          Whether or not the WebSocketClient's connection is open.
    connected: false,

    init: function(){
        // summary:
        //          Initializes the WebSocket connection.
        // description:
        //          Performs the 101 WebSocket protocol handshake and sets some 
        //          attributes on the socket stream.
        
        // Attempt to make the socket unable to time out.
        this.socket.setTimeout(0);
        this.socket.setKeepAlive(true);
        
        // We're going to be transmiting utf-8 strings.
        this.socket.setEncoding('utf8');
        
        // Immediately flush data when socket.write is called.
        this.socket.setNoDelay(true);
        
        // Set up the handshake.
        this.socket.write([
            'HTTP/1.1 101 Web Socket Protocol Handshake', 
            'Upgrade: WebSocket', 
            'Connection: Upgrade',
            'WebSocket-Origin: ' + this.request.headers.origin,
            'WebSocket-Location: ws://' + this.request.headers.host + this.request.url,
            '', ''
        ].join('\r\n'));
        
        // flag the client as connected!
        this.connected = true;
    },
    
    destroy: function(){
        // summary:
        //          Cleans up the WebSocketConnection object so that it is ready 
        //          to be garbage-collected.
        
        // close out the socket
        this.socket.end();
        
        // remove the client from the ClientList
        ClientList.removeClient(this);
        
        // manually delete all the attributes for this object
        delete this.socket;
        delete this.request;
        delete this.head;
        delete this.connected;
    },
    
    sendData: function(data){
        // summary:
        //          Sends an object (as JSON) to the client.
        // description:
        //          Serializes the 'data' parameter to JSON and sends it via the 
        //          WebSocket.
        // data: Object
        //          Data to send over the wire.
        // returns: Boolean
        //          True if the data was sent. False if the data could not be 
        //          sent (could happen if the client is disconnected).
        
        // Serialize the 'data' to JSON.
        var jsonData = "";
        try{
            jsonData = JSON.stringify(data);
        } catch (err){
            throw new Error("Could not stringify an object to send to WebSocket Client #"+this.clientId+".");
        }
    
        // If we're connected, write out the data (in the format specified by 
        //  WebSocket Protocol spec.
        if(this.connected){
            this.socket.write('\u0000', 'binary');
            this.socket.write(jsonData, 'utf8');
            this.socket.write('\uffff', 'binary');
            return true;
        }
        
        // Return false if it wasn't sent.
        return false;
    },

    _handleData: function(data){
        // summary:
        //          Callback for the 'data' event of the socket.
        // description:
        //          Handles the data coming from the client, and publishes an 
        //          event to the ClientList.
        // data: String
        //          Data from the client.
        // throws:
        //          Error if data string isn't a valid JSON string.
        
        // split the data by the separator character.
        var chunks = data.split('\ufffd');
        
        // initialze variables used by the array.
        var chunk = null;
        var chunk_count = chunks.length - 1;
        
        // iterate through the chunks
        for (var i = 0; i < chunk_count; i++) {
            chunk = chunks[i];
            
            // if it doesnt start with the start character, then throw an error.
            if (chunk[0] != '\u0000') {
                continue;
            }
            
            // remove the start character
            chunk = chunk.substr(1);
            
            // parse the json and publish the event.
            EventManager.publishEvent(JSON.parse(chunk));
            //sys.puts("WebSocket Client #"+this.clientId+": "+chunk);
        }
    },
    
    _handleDisconnect: function(){
        // summary: 
        //          Callback for the 'end' event of the socket.
        // description:
        //          Flags the client as disconnected, and calls destroy()
        
        sys.puts("WebSocket Client #"+this.clientId+" disconnected");
        this.connected = false;
        this.destroy();
    },
    
    _handleTimeout: function(){
        // summary:
        //          Callback for the 'timeout' event of the socket.
        // description:
        //          Flags the client as disconnected, and calls destroy()
        
        sys.puts("WebSocket Client #"+this.clientId+" timed out");
        this.connected = false;
        this.destroy();
    },
    
    _handleError: function(error){
        // summary:
        //          Callback for the 'error' event of the socket.
        // description:
        //          Logs the error, and handles it.  Flags the client as 
        //          disconnected, and calls destroy();
        
        sys.puts("WebSocket Client #"+this.clientId+" encountered error: "+error);
        
        // TODO: handle the error somehow.
        
        this.connected = false;
        this.destroy();
    }
};

exports.WebSocketClient = WebSocketClient;