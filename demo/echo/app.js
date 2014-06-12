var express = require('express');
var app = express();
app.use(express.static(__dirname + '/public'));
var server = require('http').Server(app).listen(process.env.PORT || 3000);
var bus = require('bus.io')(server);
