const express = require('express');
const app = express();
var port = 3000;
const passport = require('passport');
const LocalStrategy = require('passport-local').Strategy;
const User = require('./models/user');
const mongoose = require('mongoose');
const controller = require('./controller/controller');

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

controller(app);

app.listen(port, function(){
    console.log('Connection made at '+ port);
})