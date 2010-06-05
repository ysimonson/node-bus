;(function(){
    var protocolPattern = /^(http|ws|wss|https):\/\//;

    function Bus(busUrl){
        this.url = busUrl;
        
        var protocolMatch = protocolPattern.exec(this.url)[1];
        
        // do browser detection.
        if(window.WebSocket){
            this.websocket = true;
            if(protocolMatch === "https"){
                this.url = this.url.replace(protocolPattern, "wss://");
            } else if(protocolMatch === "http"){
                this.url = this.url.replace(protocolPattern, "ws://");
            }
        } else {
            if(protocolMatch === "wss"){
                this.url = this.url.replace(protocolPattern, "https://");
            } else if(protocolMatch === "ws"){
                this.url = this.url.replace(protocolPattern, "http://");
            }
            this.websocket = false;
        }
        
        this.initialize();
    };
    
    Bus.prototype = {
        
        // subscriptions: Object
        //          Map of event names to arrays of callback function/scope 
        //          pairs.
        subscriptions: {},
        
        initialize: function(){
            // summary:
            //          Sets up the client. 
            // description:
            //          Depending on whether or not we're using WebSockets or 
            //          long-polling, this will set up the long-polling or 
            //          socket accordingly.
            
            var me = this;
            
            if(this.websocket){
                this.socket = new WebSocket(this.url);
                this.socket.addEventListener("message", function(message){
                    var jsonEvent = message.data;
                    var event = JSON.parse(jsonEvent);
                    
                    me._fireEvent(event.name, event.payload);
                });
                this.socket.addEventListener("error", function(error){
                    // handle the error, then try to reconnect.
                    
                    if(me.errors == null){
                        me.errors = 0;
                    }
                    me.errors++;
                    
                    if(window.console){
                        console.error("An error occurred with the WebSocket, reconnecting in "+(me.errors*me.errors)+" seconds.");
                    }
                    setTimeout(me.initialize, 1000 * me.errors * me.errors);
                });
                this.socket.addEventListener("close", function(){
                    setTimeout(me.initialize, 1000);
                });
            } else {
                // set up the long-polling mechanisms.
            
                var xhr = null;
                function openConnection(){
                    // summary:
                    //          Opens a GET connection to the server. This will 
                    //          start the long-polling request.
                    
                    xhr = me._createXHR();
                    
                    xhr.onreadystatechange = listen;
                
                    // use the date/time suffix for anti-caching and use the 
                    //  lastEventId to 'catch up' with events we missed.
                    
                    var queryString = "";
                    
                    if(me._lastEventId != null){
                        queryString = "?lastEventId="+me._lastEventId+"&" + (new Date()).getTime();
                    } else {
                        queryString = "?" + (new Date()).getTime();
                    }
                    
                    // start the connection.
                    xhr.open("GET", me.url + queryString, true);
                    xhr.send();
                }
                
                function listen(){
                    // summary:
                    //          Handles the response for the long-polling 
                    //          request.
                    
                    if(xhr.readyState == 4){
                        var response = xhr.responseText;
                        
                        // Unlike for websockets, the longpolling responses come 
                        //  back as an array. Parse it here.
                        var eventArray = JSON.parse(response);
                        
                        // Iterate through the events and fire them all out.
                        for(var i = 0, len = eventArray.length; i < len; i++){
                            me._fireEvent(eventArray[i].name, eventArray[i].payload);
                        }
                        
                        // Grab the lastEventId.
                        me._lastEventId = eventArray[eventArray.length-1].id;
                        
                        // Reopen the connection immediately.
                        openConnection();
                    }
                }
                
                // Start long-polling.
                openConnection();
            }
        },
        
        _sendEvent: function(event){
            // summary:
            //          Sends an event to the server.
            // description:
            //          If we are using websockets, it will simply call .send on 
            //          this.socket, otherwise we'll do an XHR POST request to 
            //          the url with the data.
            // event: Object
            //          Javascript Object that represents an event.
            
            if(this.websocket){
                this.socket.send(JSON.stringify(event));
            } else {
                var xhr = this._createXHR();
                
                xhr.onReadyStateChange = function(){
                    if(xhr.readyState == 4){
                        // bla bla bla
                    }
                }
                
                xhr.open("POST", this.url, true);
                xhr.setRequestHeader("Content-type","application/json");
                xhr.send(JSON.stringify(event));
            }
        },
        
        _fireEvent: function(eventName, payload){
            // summary:
            //          Fire off the event to the listeners.
            // eventName:
            //          Name of the event.
            // args: Array
            //          The arguments to send to subscribers.
            var container = this.subscriptions[eventName];
            
            if(container) {
                for(var i = 0, len = container.length; i < len; i++){
                    var sub = container[i];
                    sub[1].apply(sub[0], [payload]);
                }
            }
        },
        
        _createXHR: function(){
            // summary:
            //          creates an XHR object for AJAX...
            // return:
            //          In all normal browsers: XMLHttpRequest, 
            //          IE6: ActiveXObject.
            var xhr = null;
            if(window.XMLHttpRequest){
                xhr = new XMLHttpRequest();
            } else {
                xhr = new ActiveXObject("Microsoft.XMLHTTP");
            }
            return xhr;
        },
                
        subscribe: function(eventName /*, scope (optional), callback*/){
            // summary:
            //          Public function, subscribes to an event when given a 
            //          callback and an optional scope for the callback.
            // eventName: String
            //          Name of the event.
            // scope: Object (Optional)
            //          Calling-scope of the listener callback.
            // callback: Function
            //          Function that is listening for the eventName event.
            // return: 
            //          Whether or not the subscription was made.
            var scope = window;
            var callback = null;
            
            if(arguments.length == 2){
                callback = arguments[1];
            } else if (arguments.length == 3){
                scope = arguments[1];
                callback = arguments[2];
            } else {
                throw new Error("Bus.subscribe(..) requires two or three arguments: event name, [callback scope,] callback");
            }
            
            var callee = [scope, callback];
            
            var container = this.subscriptions[eventName];
            if(!container) {
                this.subscriptions[eventName] = container = [];
            }
            
            container.push(callee);
            return {eventName: eventName, callee: callee};
        },
        
        unsubscribe: function(handle){
            // summary:
            //          Public function, unsubscribes from an event.
            // handle: Object
            //          The object to unsubscribe.
            // return:
            //          Whether or not the unsubscribe action was successful.  
            //          If the function and scope were not found as a listener 
            //          to the event, false will be returned.
            var container = this.subscriptions[handle.eventName];
            if(!container) return false;
            
            var callee = handle.callee;
            
            for(var i=0, len=container.length; i<len; i++) {
                var item = container[i];
                
                if(item === callee) {
                    container.splice(i, 1);
                    
                    if(container.length == 0) {
                        //There are no callbacks listening to this event; notify
                        //the server
                        this.socket.send(JSON.stringify({
                            'type': 'unlisten',
                            'event': handle.eventName
                        }));
                    
                        //Perform a hard-core delete to prevent memory leaks
                        delete this.subscriptions[handle.eventName];
                    }
                    
                    delete item;
                    return true;
                }
            }
                
            return false;
        },
        
        publish: function(eventName, payload){
            // summary:
            //          Publishes an event.
            // eventName:
            //          Name of the event.
            // payload:
            //          Information for the event. For example, this could be 
            //          the information that goes along with a click event: 
            //          target, x/y coordinates, etc.
            
            this._sendEvent({name: eventName, payload: payload});
        },
        
        // Shortcut function for subscribe.
        sub: function(){ return this.subscribe.apply(this, Array.prototype.slice.call(arguments)); },
        // Shortcut function for unsubscribe.
        unsub: function(){ return this.unsubscribe.apply(this, Array.prototype.slice.call(arguments)); },
        // Shortcut function for publish.
        pub: function pub(){ return this.publish.apply(this, Array.prototype.slice.call(arguments)); }
    };

    window.Bus = Bus;
})();


/* json2.js from http://json.org/json2.js */
if(!this.JSON){this.JSON={};}
(function(){function f(n){return n<10?'0'+n:n;}
if(typeof Date.prototype.toJSON!=='function'){Date.prototype.toJSON=function(key){return isFinite(this.valueOf())?this.getUTCFullYear()+'-'+
f(this.getUTCMonth()+1)+'-'+
f(this.getUTCDate())+'T'+
f(this.getUTCHours())+':'+
f(this.getUTCMinutes())+':'+
f(this.getUTCSeconds())+'Z':null;};String.prototype.toJSON=Number.prototype.toJSON=Boolean.prototype.toJSON=function(key){return this.valueOf();};}
var cx=/[\u0000\u00ad\u0600-\u0604\u070f\u17b4\u17b5\u200c-\u200f\u2028-\u202f\u2060-\u206f\ufeff\ufff0-\uffff]/g,escapable=/[\\\"\x00-\x1f\x7f-\x9f\u00ad\u0600-\u0604\u070f\u17b4\u17b5\u200c-\u200f\u2028-\u202f\u2060-\u206f\ufeff\ufff0-\uffff]/g,gap,indent,meta={'\b':'\\b','\t':'\\t','\n':'\\n','\f':'\\f','\r':'\\r','"':'\\"','\\':'\\\\'},rep;function quote(string){escapable.lastIndex=0;return escapable.test(string)?'"'+string.replace(escapable,function(a){var c=meta[a];return typeof c==='string'?c:'\\u'+('0000'+a.charCodeAt(0).toString(16)).slice(-4);})+'"':'"'+string+'"';}
function str(key,holder){var i,k,v,length,mind=gap,partial,value=holder[key];if(value&&typeof value==='object'&&typeof value.toJSON==='function'){value=value.toJSON(key);}
if(typeof rep==='function'){value=rep.call(holder,key,value);}
switch(typeof value){case'string':return quote(value);case'number':return isFinite(value)?String(value):'null';case'boolean':case'null':return String(value);case'object':if(!value){return'null';}
gap+=indent;partial=[];if(Object.prototype.toString.apply(value)==='[object Array]'){length=value.length;for(i=0;i<length;i+=1){partial[i]=str(i,value)||'null';}
v=partial.length===0?'[]':gap?'[\n'+gap+
partial.join(',\n'+gap)+'\n'+
mind+']':'['+partial.join(',')+']';gap=mind;return v;}
if(rep&&typeof rep==='object'){length=rep.length;for(i=0;i<length;i+=1){k=rep[i];if(typeof k==='string'){v=str(k,value);if(v){partial.push(quote(k)+(gap?': ':':')+v);}}}}else{for(k in value){if(Object.hasOwnProperty.call(value,k)){v=str(k,value);if(v){partial.push(quote(k)+(gap?': ':':')+v);}}}}
v=partial.length===0?'{}':gap?'{\n'+gap+partial.join(',\n'+gap)+'\n'+
mind+'}':'{'+partial.join(',')+'}';gap=mind;return v;}}
if(typeof JSON.stringify!=='function'){JSON.stringify=function(value,replacer,space){var i;gap='';indent='';if(typeof space==='number'){for(i=0;i<space;i+=1){indent+=' ';}}else if(typeof space==='string'){indent=space;}
rep=replacer;if(replacer&&typeof replacer!=='function'&&(typeof replacer!=='object'||typeof replacer.length!=='number')){throw new Error('JSON.stringify');}
return str('',{'':value});};}
if(typeof JSON.parse!=='function'){JSON.parse=function(text,reviver){var j;function walk(holder,key){var k,v,value=holder[key];if(value&&typeof value==='object'){for(k in value){if(Object.hasOwnProperty.call(value,k)){v=walk(value,k);if(v!==undefined){value[k]=v;}else{delete value[k];}}}}
return reviver.call(holder,key,value);}
text=String(text);cx.lastIndex=0;if(cx.test(text)){text=text.replace(cx,function(a){return'\\u'+
('0000'+a.charCodeAt(0).toString(16)).slice(-4);});}
if(/^[\],:{}\s]*$/.test(text.replace(/\\(?:["\\\/bfnrt]|u[0-9a-fA-F]{4})/g,'@').replace(/"[^"\\\n\r]*"|true|false|null|-?\d+(?:\.\d*)?(?:[eE][+\-]?\d+)?/g,']').replace(/(?:^|:|,)(?:\s*\[)+/g,''))){j=eval('('+text+')');return typeof reviver==='function'?walk({'':j},''):j;}
throw new SyntaxError('JSON.parse syntax error.');};}}());