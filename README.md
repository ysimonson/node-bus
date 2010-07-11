node-bus
========

node-bus is a project where the goal is to provide a really simple facility
for pubsub-style eventing between clients and a central server.

The bus framework includes a client-side javascript tool which handles all of
the comet requests to make the developer's job as easy as possible.
(automatically degrades from WebSockets to long polling)

Setting Things Up
=================

First download the node-bus repository:

    git clone git@github.com:node-bus/node-bus.git --recursive
    cd node-bus
    git submodule update --init --recursive

Then run the build:

    ant

Running the Test Server
=======================

Run the examples server:

    cd examples
    sudo node server.js

Then, navigate a browser to http://localhost:8080/examples/

* Be sure to include the trailing slash in the URL

Versions (tags)
===============

* v0.1a - Long-polling support for the client, and functioning server.  Chat example and the maintest test app.
* v0.2a - Adding support for WebSocket graceful degradation to longpolling.
* v0.3a - Moved communication logic into a separate project.