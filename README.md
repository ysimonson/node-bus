node-bus
========

node-bus is a project where the goal is to provide a really simple facility for pubsub-style eventing between clients and between clients and the browser.

The bus framework includes a client-side javascript tool which handles all of the long-polling COMET requests to make the developer's job as easy as possible.

Running the Test Server
=======================

Open a console window, and move to the ./examples directory.  Then type

sudo node server.js

Then, navigate a browser to http://localhost:8080/examples/

* Be sure to include the trailing slash in the URL
* Right now the engine has only been tested on firefox

Versions (tags)
===============

* v0.1a - Long-polling support for the client, and functioning server.  Chat example and the maintest test app.
* v0.2a - Adding support for WebSocket graceful degradation to longpolling.