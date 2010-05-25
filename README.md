node-bus
========

node-bus is a project where the goal is to provide a really simple facility for pubsub-style eventing between clients and between clients and the browser.

The bus framework includes a plugin for jQuery and dojo which make client-side developers' jobs as easy as possible.

Running the Test Server
=======================

Open a console window, and move to the ./tests directory.  Then type

node testServer.js

Then, to run the "maintest", navigate a browser to http://localhost:8080/tests/clientTests/maintest/  (this final slash is important, because of a fault with node-router, the node framework that the test server uses)