var express = require('express'),
    routes = require('./routes'),
    app = express(),
    server = require('http').createServer(app),
    stylus = require('stylus'),
    io = require('socket.io').listen(server),
    nib = require('nib'),
    ttt = require('./lib/ttt.js'),
    path = require('path');

function compile(str, path) {
    return stylus(str)
        .set('filename', path)
        .use(nib())
}


// all environments
app.set('views', __dirname + '/views');
app.set('view engine', 'jade');
app.use(express.bodyParser());
app.use(express.methodOverride());
app.use(app.router);
app.use(stylus.middleware({
        src: __dirname + '/public',
        compile: compile
}));

app.use(express.static(path.join(__dirname, 'public')));

server.listen(8080, '0.0.0.0');

app.get('/', routes.index);

var games = new Object();

io.sockets.on('connection', function (socket) {

    socket.on('createGame', function (data) {
        ttt.createGame(games, socket, data);
    });

    socket.on('joinGame', function (data) {
        ttt.joinGame(games, socket, data);
    });

    socket.on('move', function(data) {
        ttt.move(games[data.game_id], socket, data);
    });

    socket.on('disconnect', function () {
        ttt.disconnect(games, socket);
    });
});
