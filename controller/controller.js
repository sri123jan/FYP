const passport = require('passport');
const User = require('../models/user');

var routes = function(app){
    app.get('/', (req, res) => {
        res.render('home', { user: req.user });
    });
    
    app.get('/login', (req, res) => {
        res.render('login', {msg: ''});
    });
    
    app.post('/login', function(req, res) {
        passport.authenticate('local', function(err, user) {
            if (err) { return err }
            if (!user) {
                res.render('login', {msg: 'Invalid username or password'})
            }
            req.logIn(user, function(err) {
                if (err) { return err; }
                if (user.usertype=="Streamer"){
                    res.redirect('/broadcast/'+user.username);
                }
                res.redirect('/');
            });
          })(req, res);
    });
    
    app.get('/logout', function(req, res){
        req.logout();
        res.redirect('/');
    });

    app.get('/signup', function(req, res){
        res.render('signup', {msg: ''});
    });

    app.post('/signup', function(req, res){
        User.findOne({ email: req.body.email }, function(err, user){
            if (err) { return err }
            if(!user){
                var newuser = new User(req.body);
                newuser.save();
                res.redirect('/login');
            }
            else{
                res.render('signup', {msg: 'Email already in use'})
            }
        });
    });

    app.get('/broadcast/:username', function(req, res){
        res.render('broadcast', { user: req.user, username: req.params.username });
    });
    app.get('/:username', function(req, res){
        if(req.user == null){
            res.redirect('login');
        }
        res.render('video', {username: req.params.username});
    });
};

module.exports = routes;