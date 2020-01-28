const passport = require('passport');
const User = require('../models/user');

var routes = function(app){
    app.get('/', (req, res) => {
        res.render('home', { user: req.user });
    });
    
    app.get('/login', (req, res) => {
        res.render('login');
    });
    
    app.post('/login',
        passport.authenticate('local', { failureRedirect: '/login' }),
        function(req, res) {
            res.redirect('/');
    });
    
    app.get('/logout', function(req, res){
        req.logout();
        res.redirect('/');
    });

    app.get('/signup', function(req, res){
        res.render('signup', {msg: ''});
    });

    app.post('/signup', function(req, res){
        User.findOne({ username: req.body.username }, function(err, user){
            if (err) { return err }
            if(!user){
                var newuser = new User(req.body);
                newuser.save();
                res.redirect('/login');
            }
            else{
                res.render('signup', {msg: 'User already exists'})
            }
        });
    });
};

module.exports = routes;