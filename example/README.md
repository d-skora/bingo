TicTacToeNodejs
===============

*Framework: Express

*Stylesheet engine: Sylabus

*View engine: Jade

*Chat libary: Socket.io

Protocol Description
====================

Events
------

*  createGame:
    - server: create new game & add it to global variable
    - client: on click create button run server event
*  joinGame:
    - server: search for free game
    - client: on click join button run server event
*  move:
    - server: confirm, set move & check result of a match
    - client: set square value on board
*  confirm:
    - client: display confirm window & send info to server
*  gameOver:
    - client: disable board click and enable join&create buttons
* disconnect:
    - server: delete player from game list of players or delete game, if list of players is empty
* disconnectPlayer:
    - client: change color of disconnected player fields to 
