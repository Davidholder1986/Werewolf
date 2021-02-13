const express = require('express');
const app = express();
const http = require('http').Server(app);
const io = require('socket.io')(http);
const port = process.env.PORT || 3000;

app.use('/style', express.static(__dirname + '/style'));
app.get('/', (req, res) => res.sendFile(__dirname + '/index.html'));

var people_logged_in = {};
var num_people_connected = 0;
var players_voted = 0;
var players_alive = 0
var votes = {}

function AllPeopleReady() {
    for (id in people_logged_in) {
        id = people_logged_in[id]
        if (id.gameReady == false) {
            return false;
        }
    }
    var werewolfIndex = Math.floor(Math.random() * num_people_connected)
    var count = 0;
    for (id in people_logged_in) {
        id = people_logged_in[id]
        id.gameStarted = true;
        id.index = count
        if (count == werewolfIndex) {
            id.person = 'werewolf';
        }
        count += 1
    }
    return true;
}

function kill_voted_out_player() {
    const max_votes = Math.max.apply(null, Object.values(votes));
    console.log('max votes: ' + max_votes)
    Object.entries(votes).forEach(([key, value]) => {
        if (value >= max_votes) {
            for (id in people_logged_in) {
                id = people_logged_in[id]
                console.log('key: ' + key)
                console.log('name: ' + id.name)
                if (id.name == key) {
                    id.status = 'dead';
                    console.log('is dead: ' + id.name)
                }
            }
        }
    });
}

function update_players_alive() {
    for (id in people_logged_in) {
        id = people_logged_in[id]
        if (id.status == 'alive') {
            players_alive += 1
        }
    }
}

io.on('connection', (socket) => {
    console.log('Player Connected');
    num_people_connected += 1;

    socket.on('name', (name) => {
        people_logged_in[socket.id] = { 'name' : name, gameReady: false, gameStarted: false, index: 0, person: 'villager', status: 'alive'};
        console.log(people_logged_in);
    });

    socket.on('personReady', (name) => {
        people_logged_in[socket.id].gameReady = true;
        if (AllPeopleReady()) {
            io.emit('gameStarting', (people_logged_in))
        }
    });

    socket.on('playerKilled', (name) => {
        for (id in people_logged_in) {
            id = people_logged_in[id]
            if (id.name == name) {
                id.status = 'dead';
            }
        }
        update_players_alive()
        if (players_alive == 1)
        {
            io.emit('gameOver', (people_logged_in))
        }
        io.emit('playerDeathUpdate', (people_logged_in))

    });

    socket.on('playerVoted', (name) => {
        if (votes[name] >= 1) {
            votes[name] += 1
        } else {
            votes[name] = 1;
        }

        players_voted += 1

        console.log('players voted: ' + players_voted)
        console.log(players_voted == num_people_connected)

        if (players_voted == num_people_connected) {
            kill_voted_out_player()
            console.log('test')
            console.log(people_logged_in)
            io.emit('playerVoteUpdate', (people_logged_in))
        }


    });

    socket.on('disconnect', () => {
     console.log('Player Disconnected');
     delete people_logged_in[socket.id];
     num_people_connected -= 1;
     console.log(people_logged_in);
  });


})

http.listen(port, () => console.log('Listening on port 3000!'));
