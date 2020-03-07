const path = require('path');
const express = require('express');
const app = express();

var port = 3000;
const passport = require('passport');
const LocalStrategy = require('passport-local').Strategy;
const User = require('./models/user');
const mongoose = require('mongoose');
const controller = require('./controller/controller');
var server = require('http').Server(app);
var io = require('socket.io')(server);


mongoose.connect('mongodb://localhost/test', {useUnifiedTopology: true,
useNewUrlParser: true});

passport.use(new LocalStrategy(
    function(username, password, done) {
        User.findOne({ username: username }, function (err, user) {
            if (err) { return done(err); }
            if (!user) { return done(null, false); }
            if (user.password != password) { return done(null, false); }
            return done(null, user);
      });
    }
));

passport.serializeUser(function(user, done) {
    done(null, user.id);
});
   
passport.deserializeUser(function(id, done) {
    User.findById(id, function (err, user) {
        done(err, user);
    });
});

app.use(require('cookie-parser')());
app.use(require('body-parser').urlencoded({ extended: true }));
app.use(require('express-session')({ secret: 'keyboard cat', resave: true, saveUninitialized: true }));
app.use(passport.initialize());
app.use(passport.session());

app.set('view engine', 'ejs');

app.use('/assets', express.static('assets'));

app.set('views', [path.join(__dirname, 'views'),
                      path.join(__dirname, 'views/broadcaster/'), 
                      path.join(__dirname, 'views/viewer/')]);



server.listen(port, function(){
    console.log('Connection made at '+ port);
})

let broadcaster = {};
let watcher = {};
controller(app, broadcaster);
io.sockets.on('error', e => console.log(e));

io.sockets.on('connection', function (socket) {
    socket.on('broadcaster', function (username) {
      broadcaster[username] = socket.id;
      
      socket.emit('broadcaster');
    });
    socket.on('watcher', function (username) {
      watcher[username] = socket.id;
      socket.to(broadcaster[username]).emit('watcher', socket.id);
    });
    socket.on('offer', function (id /* of the watcher */, message, data) {
      socket.to(id).emit('offer', socket.id /* of the broadcaster */, message, data);
    });
    socket.on('answer', function (id /* of the broadcaster */, message) {
      socket.to(id).emit('answer', socket.id /* of the watcher */, message);
    });
    socket.on('candidate', function (id, message) {
      socket.to(id).emit('candidate', socket.id, message);
    });
    socket.on('disconnect', function() {
      for (var k in broadcaster){
        if (broadcaster[k] === socket.id){
          delete broadcaster[k];
        }
      }
      socket.to(socket.id).emit('close', socket.id);
    });
});