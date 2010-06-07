(function(){
    function Draw(host, $canvas, $userList){
        // summary:
        //          Creates a new instance of a Draw client. Assumes that 
        //          bus.client.js is already in the dom.
        
        this.bus = new Bus(host);
        this.$canvas = $canvas;
        this.$userList = $userList;
        
        this.bus.sub("draw/login", this, this.handleLogin);
        this.bus.sub("draw/draw", this, this.handleDraw);
        
        $canvas.mousedown($.proxy(this.handleMouseDown, this));
        $canvas.mouseup($.proxy(this.handleMouseUp, this));
        $canvas.mousemove($.proxy(this.handleMouseMove, this));
        
        $canvas.attr('width', $(document).width());
        $canvas.attr('height', $(document).height());
    }
    Draw.prototype = {
        // bus: Object
        //          node-bus client object. See bus.client.js for more details.
        bus: null,
        
        // username: String
        //          Username of the client.
        username: "",
        
        // $canvas: jQuery NodeList
        //          jQuery selector to the canvas to draw on.
        $canvas: null,
        
        // context: Object
        //          Used for drawing.
        context: null,
        
        // $userList: jQuery NodeList
        //          Used to show current users.
        $userList: null,
        
        // colorMap: Map
        //          Maps usernames to their associated colors
        colorMap: {},
        
        // drawing: Boolean
        //          Whether the mouse is currently down
        drawing: false,
    
        login: function(username){
            // summary:
            //          "logs in" to the service.  It sends a chat/login event.
            // username: String
            //          Username for the client.
            
            this.username = username;
            this.context = this.$canvas[0].getContext('2d');
            
            this.bus.pub("draw/login", {
                username: this.username,
                color: Math.round(0xffffff * Math.random())
            });
        }, 
        
        handleLogin: function(event){
            // summary:
            //          Handles when users log into the chat system.
            // event: Object
            //          Event object for chat/login events.
            var color = '#' + event.color.toString(16);
            this.colorMap[event.username] = color;
            this.$userList.append('<li><span class="user_color" style="background-color: ' + color + ';"> </span>&nbsp;&nbsp;' + event.username + '</li>');
        },
        
        sendDraw: function(){
            // summary:
            //          Sends a message to the chat service.
            // message: String
            //          Message to send.
            
            this.bus.pub("draw/draw", {username: this.username, draw: draw});
        },
        
        handleDraw: function(event){
            // summary:
            //          Handles a reciept of a message from the chat service.
            // event:
            //          Event object for the chat/message events.
            
        },
        
        handleMouseDown: function(event){
            // summary:
            //          Handles mouse down events on the canvas.
            // event:
            //          The jquery event object.
            
            this.context.beginPath();
            this.context.strokeStyle = this.colorMap[this.username];
            this.context.moveTo(event.pageX, event.pageY);
            this.drawing = true;
        },
        
        
        handleMouseUp: function(event){
            // summary:
            //          Handles mouse up events on the canvas.
            // event:
            //          The jquery event object.
            
            this.context.closePath();
            this.drawing = false;
        },
        
        
        handleMouseMove: function(event){
            // summary:
            //          Handles mouse movement events on the canvas.
            // event:
            //          The jquery event object.
            
            if(this.drawing) {
                this.context.lineTo(event.offsetX, event.offsetY);
                this.context.stroke();
            }
        }
    };

    window.Draw = Draw;
})();