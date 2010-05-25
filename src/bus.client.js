

;

(function(){
    function Bus(url){
        // summary:
        //          Main client class for node-bus. Handles both client-side and 
        //          client-server publish/subscribe functionality in the browser.
        this.url = url;
        
        // if it ends with a slash, cut it off..
        if(this.url.charAt(url.length - 1) == "/"){
            this.url = this.url.substr(0, url.length - 1);
        }
    }
    Bus.prototype = {
        // url: String
        //          URL of the endpoint where node-bus is running.  This is the 
        //          endpoint that will be connected-to for long-polling and will 
        //          be POSTed to for publishing.
        url: "",
        
        // subscriptions: Object
        //          Map of event names to arrays of callback function/scope 
        //          pairs.
        subscriptions: {},
        
        startup: function(){
            // summary:
            //          Initializes the long-polling mechanism.
            // returns:
            //          Reference to 'this'.
            
            
            var me = this;
            var xhr = null;
            function openConnection(){
                xhr = me._createXHR();
                
                xhr.onreadystatechange = listen;
            
                // use the date/time suffix for anti-caching.
                xhr.open("GET", me.url + "?" + (new Date()).getTime(), true);
                xhr.send();
            }
            
            function listen(){
                if(xhr.readyState == 4){
                    var response = xhr.responseText;
                    openConnection();
                    
                    var event = JSON.parse(response);
                    me._fireEvent(event);
                }
            }
            
            openConnection();
            return this;
        },
        
        _fireEvent: function(event){
            // summary:
            //          Fire off the event to the listeners.
            // event: Object
            //          Event to fire off.
            var subs = this.subscriptions[event.name];
            
            if(subs && subs.length > 0){
                for(var i = 0, len = subs.length; i < len; i++){
                    subs[i].callback.call(subs[i].scope, event);
                }
            }
        },
        
        _hasSubscription: function(eventName, scope, callback, removeFlag){
            // summary: 
            //          Determines whether or not an event has a subscription 
            //          with the given function in the specified scope.  Also 
            //          gives the caller the option to unsubscribe if the 
            //          subscription does exist.
            // eventName: String
            //          Name of the event to connect to.
            // scope: Object
            //          Calling-scope of the listener callback.
            // callback: Function
            //          Function that is listening for the eventName event.
            // removeFlag: Boolean (Optional)
            //          If true, this function will delete and unsubscribe the 
            //          subscription to the eventName event if it is found.
            // return:
            //          True - if the subscription exists. False - otherwise.
            if(!this.subscriptions[eventName]){
                this.subscriptions[eventName] = [];
            }
            
            for(var i = 0, len = this.subscriptions[eventName].length; i < len; i++){
                var sub = this.subscriptions[eventName][i];
                
                if(sub.scope === scope && sub.callback === callback){
                    if(removeFlag === true){
                        this.subscriptions[eventName].splice(i, 1);
                        delete sub;
                    }
                    return true;
                }
            }
            return false;
        },
        
        _addSubscription: function(eventName, scope, callback){
            // summary:
            //          Subscribes a listener to an event.
            // eventName: String
            //          Name of the event.
            // scope: Object
            //          Calling-scope of the listener callback.
            // callback: Function
            //          Function that is listening for the eventName event.
            
            if(this._hasSubscription(eventName, scope, callback)){
                return false;
            }
            
            this.subscriptions[eventName].push({scope: scope, callback: callback});
            return true;
        },
        
        _removeSubscription: function(eventName, scope, callback){
            // summary:
            //          Unsubscribes a listener from an event.
            // eventName: String
            //          Name of the event.
            // scope: Object
            //          Calling-scope of the listener callback.
            // callback: Function
            //          Function that is listening for the eventName event.
            return this._hasSubscription(eventName, scope, callback, true);
        },
        
        _publishEvent: function(eventName, payload){
            // summary:
            //          Publishes an event to the node-bus endpoint.
            // eventName:
            //          Name of the event.
            // payload:
            //          Information to pass along with the event.
            
            var xhr = this._createXHR();
            
            xhr.onReadyStateChange = function(){
                if(xhr.readyState == 4){
                    // bla bla bla
                }
            }
            
            xhr.open("POST", this.url, true);
            xhr.setRequestHeader("Content-type","application/json");
            xhr.send(JSON.stringify({name: eventName, payload: payload}));
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
        
        subscribe: function(/* eventName, scope (optional), callback */){
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
            var eventName = arguments[0];
            
            if(arguments.length == 2){
                callback = arguments[1];
            } else if (arguments.length == 3){
                scope = arguments[1];
                callback = arguments[2];
            } else {
                throw new Error("Bus.subscribe(..) requires two or three arguments: event name, [callback scope,] callback");
            }
            
            return this._addSubscription(eventName, scope, callback);
        },
        // Shortcut function for subscribe.
        sub: function(){ return this.subscribe.apply(this, Array.prototype.slice.call(arguments)); },
        
        unsubscribe: function(/* eventName, scope (optional), callback */){
            // summary:
            //          Public function, unsubscribes from an event for a given 
            //          listener and [optional] scope.
            // eventName: String
            //          Name of the event.
            // scope: Object (Optional)
            //          Calling-scope of the listener callback.
            // callback: Function
            //          Function that is listening for the eventName event.
            // return:
            //          Whether or not the unsubscribe action was successful.  
            //          If the function and scope were not found as a listener 
            //          to the event, false will be returned.
            var scope = window;
            var callback = null;
            var eventName = arguments[0];
            
            if(arguments.length == 2){
                callback = arguments[1];
            } else if (arguments.length == 3){
                scope = arguments[1];
                callback = arguments[2];
            } else {
                throw new Error("Bus.subscribe(..) requires two or three arguments: event name, [callback scope,] callback");
            }
            
            return this._removeSubscription(eventName, scope, callback);
        },
        // Shortcut function for unsubscribe.
        unsub: function(){ return this.unsubscribe.apply(this, Array.prototype.slice.call(arguments)); },
        
        publish: function(eventName, payload){
            // summary:
            //          Publishes an event.
            // eventName:
            //          Name of the event.
            // payload:
            //          Information for the event. For example, this could be 
            //          the information that goes along with a click event: 
            //          target, x/y coordinates, etc.
            
            if(eventName == null){
                eventName = "";
            }
            
            if(payload == null){
                payload = {};
            }
            
            this._publishEvent(eventName, payload);
        },
        pub: function pub(){ return this.publish.apply(this, Array.prototype.slice.call(arguments)); },
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