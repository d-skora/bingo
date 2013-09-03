$(document).ready(function(){

    var game_id,
    sign,
    turn,
    dialog = $("#dialog"),
    list = $('#list');

    var socket = io.connect();

    dialog.dialog({
        autoOpen: false,
        width: 400
    });

    $("#create_action").click(function() {
        var formHtml;

        dialog.addClass("create");

        formHtml = '<label for="nickname">Nickname:</label><input type="text" id="nickname" /><br />' +
            '<label for="limit">Nb of Player</label><select id="limit">';

        for(var i= 2; i < 8; i++){
            formHtml += '<option value="'+i+'">'+i+'</option>';
        }

        formHtml += '</select><br /><input type="submit" value="Submit" />';

        dialog.html(formHtml);
        dialog.dialog("open");
        dialog.addClass("create");

    });

    dialog.find('input[type="submit"]').live("click", function(){
        var data = Object();
        var event;

        if(dialog.hasClass("create")){
            data.nickname = $("#nickname").val();
            data.limit = $("#limit").val();
            event = "createGame";
        }else if(dialog.hasClass("join")){
            data.nickname =  $("#nickname").val();
            event = "joinGame";
        }

        if(data.nickname !== ''){
            socket.emit(event, data);
            dialog.dialog("close");
        }

    });

    $("#join_action").click(function() {
        var formHtml;

        formHtml = '<label for="nickname">Nickname:</label><input type="text" id="nickname" />';

        formHtml += '<input type="submit" value="Submit" />';

        dialog.html(formHtml);
        dialog.dialog("open");
        dialog.addClass("join");
    });

    socket.on('gameCreated', function (data) {
        list.prepend('<div class="list-item">Free game created, awaiting opponent</div>');
        game_id = data.game_id;

        $("#create_action").off('click');
        $("#join_action").off('click');
    });

    socket.on('gameStart', function (data) {
        game_id = data.game_id;
        turn = data.turn;
        sign = data.sign;

        $("#create_action").off('click');
        $("#join_action").off('click');
        $(".square").html("");

        $('.square').click(function () {
            var square = parseFloat( $(this).attr('id').substr(1) );
            socket.emit('move', {game_id: game_id, square: square, sign: -1});
        });


        if (turn === sign)
            list.prepend('<div class="list-item">Game started, your turn</div>');
        else
            list.prepend('<div class="list-item">Game started, '+data.turn_nickname+' Turn</div>');
    });

    socket.on('move', function (data) {
        var square = '#b'+data.square,
            value = '';

        if (data.sign > 0) {
            value = String.fromCharCode(data.sign);
        } else if (data.sign == -1) {
            value = '?';
        }

        $(square).html(value);

        turn = data.turn;
    });

    socket.on('error', function (data) {
        alert(data.description);
    });

    socket.on('notice', function (data) {
        list.prepend('<div class="list-item">'+data.info+'</div>');
    });

    socket.on('confirm', function (data) {
        if(data.confirm = confirm("Are you sure ?")){
            data.sign = sign;
        }else{
            data.sign = 0;
        }
        socket.emit('move', data);
    });

    socket.on('noFreeGames', function() {
        list.prepend('<div class="list-item">No Free Games</div>');
    });

    socket.on('gameOver', function (data) {
        if (data.winner == sign)
            list.prepend('<div class="list-item">You Win</div>');
        else if (data.winner == 0)
            list.prepend('<div class="list-item">Draw</div>');
        else
            list.prepend('<div class="list-item">You Lose</div>');

        $("#create_action").click(function() {
            socket.emit('createGame');
        });

        $("#join_action").click(function() {
            socket.emit('joinGame');
        });

        $(".square").off('click');
    });

    socket.on("playerDisconnect", function (data) {

        $(".square").each(function(){
             console.log($(this).html() === String.fromCharCode(data.sign));

             if($(this).html() === String.fromCharCode(data.sign)){
                 $(this).addClass("disapear");
             }
        });
    });
});