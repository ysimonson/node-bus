var sys = require('sys'),
    ClientList = require('./ClientList');

var eventHistory = [];
var currentEventId = 0;

function publishEvent(event){
    // summary:
    //          Verifies and publishes an event to the ClientList. Also assigns 
    //          an id to the event.
    // event: Object
    //          Event object to publish.
    
    event.id = currentEventId;
    eventHistory.push(event);
    currentEventId++;
    
    ClientList.publishEvent(event);
}

function getEventHistory(startId, endId){
    // summary:
    //          Gets events from the history collection between the startId and 
    //          endId parameters.
    // description:
    //          Searches the event history collection for events between startId 
    //          and endId.  If startId is greater than the greatest ID in the 
    //          history, this function will return an empty array.  If endId is 
    //          lower than the lowest ID in the history, this function will 
    //          return an empty array.
    // startId: Integer
    //          Starting ID for the section to retrieve. (We'll actually get the 
    //          event just after this ID)
    // endId: Integer
    //          Ending ID for the section to retrieve. (We'll actually get the 
    //          event just before this ID)
    // returns: Array
    //          Returns an array of events between the startId and endId.
    
    // sanitize the input parameters.
    endId = endId || currentEventId;
    
    // initialize some variables (result is what we'll return.
    var result = [];
    var event = null;
    for(var i = 0, len = eventHistory.length; i < len; i++){
        event = eventHistory[i];
        if(event.id <= startId || event.id >= endId){
            continue;
        }
        
        result.push(event);
    }
    return result;
}

exports.publishEvent = publishEvent;
exports.getEventHistory = getEventHistory;