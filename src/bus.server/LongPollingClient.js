var sys = require('sys'),
    URL = require('url'),
    QueryString = require('querystring'),
    EventManager = require('./EventManager'),
    ClientList = require('./ClientList'),
    Client = require('./Client'),
    Utilities = require('./Utilities');

function LongPollingClient(request, response){
    // summary:
    //          Creates a client for node-bus where the client is 'connected' 
    //          via a long-polling Ajax mechanism.
    // description:
    //          LongPollingClient client objects do not directly represent a 
    //          Client as the WebSocketClient class tends to. Instead, it 
    //          represents an individual, long-polling, request from a client.  
    //          The important thing to note with this is that clients could miss 
    //          events that are published while they are re-establishing their 
    //          HTTP long-poll request.  What we'll do to mitigate this is allow 
    //          clients to specify a parameter in the query string for the 
    //          request called 'lastEventId' which they'll set equal to the 'id' 
    //          attribute of the latest event they've received.  This way, when 
    //          the next event is published we can look up and send all the 
    //          previous events between the 'lastEventId' and the newest event - 
    //          to catch the client up.
    // request: http.ServerRequest
    //          Request object for the client.  If the request's url 
    //          has the format:
    //
    //          http://[server]:[port]/[route]?lastEventId=[event id]
    //
    //          Then we'll make sure to publish an array of event-history 
    //          between lastEventId and the newest event.
    // response: http.ServerResponse
    //          Response object for the client.  We will be writing to this 
    //          object in the form of a JSON array of events. Even if we are 
    //          only sending a single event.
    // returns:
    //          A new instance of LongPollingClient.
    
    this.request = request;
    this.response = response;
    
    this.init();
}
LongPollingClient.prototype = {
    // expired: Boolean
    //          Whether or not the connection has expired (after the response 
    //          has been given)
    expired: false,
    
    // lastEventId: Integer
    //          The ID of the last event seen by the client.  If null, we will 
    //          only push the newest event to the client.
    lastEventId: null,

    init: function(){
        // summary:
        //          Initializes the LongPollingClient.
        
        // parse the URL and determine if there is a lastEventId.
        var parsedRequestUrl = URL.parse(this.request.url);
        var query = QueryString.parse(parsedRequestUrl.query);
        if(query['lastEventId'] != null){
            this.lastEventId = parseInt(query['lastEventId']);
        }
    },
    
    destroy: function(){
        // summary:
        //          Prepares the LongPollingClient to be ready for the Garbage 
        //          collector.
        
        this.response.end();
    
        ClientList.removeClient(this);
        
        delete this.request;
        delete this.response;
        delete this.lastEventId;
    },
    
    sendData: function(data){
        // summary:
        //          Sends an event, and the historical events, to the client by 
        //          writing to the response stream.
        // data: Object
        //          Event object to write to the client's response stream.
    
        // we will always return an array.
        var events = [];
        
        if(this.lastEventId != null){
            events = EventManager.getEventHistory(this.lastEventId, data.id);
        }
        events.push(data);
        
        // stringify the events array..
        var jsonEvents = JSON.stringify(events);
        
        // set the response headers correctly
        this.response.writeHead(200, {
            'Content-Length': jsonEvents.length,
            'Content-Type': 'text/plain'
        });
        
        // write it out
        this.response.write(jsonEvents);
        this.response.end();
        this.expired = true;
    }
};

exports.LongPollingClient = LongPollingClient;