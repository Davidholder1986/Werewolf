const express = require('express');
const app = express();
const http = require('http').Server(app);
const io = require('socket.io')(http);

app.use('/style', express.static(__dirname + '/style'));
app.get('/', (req, res) => res.sendFile(__dirname + '/index.html'));

var people_logged_in = {};
var num_people_connected = 0;
var players_voted = 0;

function AllPeopleReady() {
    for (id in people_logged_in) {
        id = people_logged_in[id]
        if (id.gameReady == false) {
            console.log(id)
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
    console.log('All Ready')
    return true;
}

io.on('connection', (socket) => {
    console.log('Player Connected');
    num_people_connected += 1;

    socket.on('name', (name) => {
        people_logged_in[socket.id] = { 'name' : name, gameReady: false, gameStarted: false, index: 0, person: 'villager', status: 'alive' };
        console.log(people_logged_in);
    });

    socket.on('personReady', (name) => {
        people_logged_in[socket.id].gameReady = true;
        console.log(socket.id)
        if (AllPeopleReady()) {
            console.log(name + ' ready')
            io.emit('gameStarting', (people_logged_in))
        }
    });

    socket.on('playerKilled', (name) => {
        for (id in people_logged_in) {
            id = people_logged_in[id]
            console.log(id.name);
            if (id.name == name) {
                id.status = 'dead';
            }
        }
        io.emit('playerDeathUpdate', (people_logged_in))

    });

    socket.on('playerVoted', (name) => {
        for (id in people_logged_in) {
            id = people_logged_in[id]
            console.log(id.name);
            if (id.name == name) {
                id.status = 'dead';
            }
        }
        players_voted += 1
        if (players_voted == num_people_connected) {
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

http.listen(3000, () => console.log('Listening on port 3000!'));
