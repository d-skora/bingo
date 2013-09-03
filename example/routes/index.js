exports.index = function(req, res){
    res.render('index', {
        title: 'TicTacToe Game'
    });
};
