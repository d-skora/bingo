var crypto = require('crypto');

exports.Game = function (game_id, socket, data) {

    this.game_id = game_id;

    this.board = [];
    for (var i = 0; i < 49; i++) this.board[i] = 0;

    var nickname = data.nickname;

    this.players = [{nickname: nickname, socket: socket, sign: 65}];

    this.turn;
    this.limit =  data.limit;

    this.nextPlayer = function(){
        var first_sign = 65,
            diff = this.turn - first_sign;

        if(diff >= 0 && diff < this.limit -1){
            return this.turn+1;
        }else{
            return first_sign;
        }
    }

    this.find = function(sign){
        for(var i in this.players){
            if(this.players[i].sign === sign){
                return this.players[i];
            }
        }
    }

    return this;
};

exports.isFull = function (board) {

    for (var i = 0; i < board.length; i++)
        if (board[i] == 0)
            return false;

    return true;
};

exports.isWon = function (board) {

    var i, j, k;

    //horizontally
    for (j = 0; j < 7; j++) {
        for (i = 0 + 7 * j; i < 4 + 7 * j; i++) {
            if ((board[i] === board[i + 1] && board[i + 1] === board[i + 2] && board[i + 2] === board[i + 3]) && board[i]) {
                return board[i];
            }
        }
    }

    //vertically
    for (j = 0; j < 7; j++) {
        for (i = j; i < 28; i = i + 7) {
            if ((board[i] === board[i + 7] && board[i + 7] === board[i + 14] && board[i + 14] === board[i + 21]) && board[i]) {
                return board[i];
            }
        }
    }

    //Diagonally left
    for (j = 0, k = 4; j <= 21; j = j + 7, k--) {
        for (i = 0; i <= k; i++) {
            if ((board[j + 8 * i] === board[j + 8 + 8 * i] && board[j + 8 + 8 * i] === board[j + 16 + 8 * i] &&
                board[j + 16 + 8 * i] === board[j + 24 + 8 * i]) && board[j + 8 * i]) {
                    return board[j + 8 * i];
            }
        }
    }

    for (j = 1, k = 3; j <= 3; j++, k--) {
        for (i = 0; i <= k; i++) {
            if ((board[j + 16 + 8 * i] === board[j + 24 + 8 * i] && board[j + 8 + 8 * i] === board[j + 16 + 8 * i] && board[j + 8 * i] === board[j + 8 + 8 * i]) && board[j + 8 * i]) {
                return board[j + 8 * i];
            }
        }
    }

    //Diagonally right
    for (j = 3, k = 0; j <= 5; j++, k++) {
        for (i = 0; i <= k; i++) {
            if ((board[j + 6 * i] === board[j + 6 + 6 * i] && board[j + 6 + 6 * i] === board[j + 12 + 6 * i] &&
                board[j + 12 + 6 * i] === board[j + 18 + 6 * i]) && board[j + 6 * i]) {
                    return board[j + 6 * i];
            }
        }
    }

    for (j = 6, k = 4; j <= 27; j = j + 7, k--) {
        for (i = 0; i <= k; i++) {
            if ((board[j + 6 * i] === board[j + 6 + 6 * i] && board[j + 6 + 6 * i] === board[j + 12 + 6 * i] &&
                board[j + 12 + 6 * i] === board[j + 18 + 6 * i]) && board[j + 6 * i]) {
                    return board[j + 6 * i];
            }
        }
    }

    return 0;
};

exports.createGame = function(games, socket, data, hash){

    var new_game_id = hash;

    if(new_game_id == null){
        var u = 'ksjdsdfdsdfwpknvsln'+(new Date()).getTime();
        new_game_id = crypto.createHash('md5').update(u).digest("hex");

        games[new_game_id] = new exports.Game(new_game_id, socket, data);

        socket.emit('gameCreated', { game_id: new_game_id, sign: games[new_game_id].players[0].sign });
    }
};

exports.joinGame = function (games, socket, data) {


    for (var i in games){
        var players = games[i].players;
        if (!(players.length >= games[i].limit)) {
            players.push({nickname: data.nickname, socket: socket, sign: players[players.length - 1].sign+1});


            if(players.length == games[i].limit){
                var turn = Math.floor((Math.random()*games[i].limit));
                games[i].turn = players[turn].sign;
                for(var j in players){
                    players[j].socket.emit('gameStart', {
                        game_id: games[i].game_id,
                        turn: players[turn].sign,
                        sign: players[j].sign,
                        turn_nickname: players[turn].nickname
                    });
                }
            }else{
                socket.emit('notice', {info: "You joined game, waiting for oponents"});
            }

            return;
        }
    }

    socket.emit('noFreeGames');
};

exports.move = function (game, socket, data) {

    var square = data.square;
    var players = game.players;

    for(var i in players){
        if(players[i].socket === socket && game.turn !== players[i].sign){
            socket.emit('error', { description: 'Not your turn'});
            return false;
        }
    }

    if (game.board[square] > 0){
        socket.emit('error', {description: 'Not empty square'});
        return false;
    }

    var currentPlayer = game.find(game.nextPlayer());

    console.log(currentPlayer);

    for(var i in players){
       players[i].socket.emit('move', data);
        if(players[i].socket !== socket && data.sign > 0 ){
            socket.emit('notice', {info: "Your Turn"});
        }else if(data.sign > 0 && players[i].socket === socket){
            players[i].socket.emit('notice', {info: "\""+currentPlayer.nickname+"\" Turn"});
        }
    }

    //confirm your move
    if(data.sign === -1){
       socket.emit('confirm', data);
       return false;
    }else if(data.sign === 0){
       return false;
    }

    game.board[square] = data.sign;

    game.turn = game.nextPlayer();

    var winner = exports.isWon(game.board);

    if (winner || exports.isFull(game.board)) {
        for(var i in players){
            players[i].socket.emit('gameOver', { winner: winner });
        }

        return true;
    }

    return false;
};

exports.disconnect = function(games, socket){

    for(var i in games){

        if(games[i].players.length === 0){
            delete games[i];

            console.log(games);

            return;
        }

        for(var j in games[i].players){
            if(games[i].players[j].socket === socket){
                var sign = games[i].players[j].sign;

                games[i].players.splice(j, 1);

                for(var k in games[i].players){
                    games[i].players[k].socket.emit('playerDisconnect', {sign: sign});
                }

                return;
            }
        }
    }
}
