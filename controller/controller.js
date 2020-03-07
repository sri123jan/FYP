const passport = require('passport');
const User = require('../models/user');
const Video = require('../models/video');

var routes = function(app, broadcaster){
    app.get('/', (req, res) => {
        
        User.find({usertype: "Streamer"}, function(err, users){
            var liveStreamer = [];
            if (users){
                Object.keys(users).forEach(function(key){
                    if (broadcaster[users[key].username]){
                        liveStreamer.push(users[key].username+'');
                    }
                });
            }
            res.render('home', { user: req.user, liveStreamer: liveStreamer });
        });
        
        
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

    app.post('/broadcast/:username', function(req, res){
        var newVideo = new Video(req.body);
        newVideo.username = req.user.username;
        newVideo.id = req.body.socketid;
        newVideo.save();
        res.status(204).send();
    });

    app.get('/:username', function(req, res){
        if(req.user == null){
            res.redirect('login');
            
        }
        Video.findOne({ id: broadcaster[req.params.username]+'' }, function (err, video){
            if (video){

                var time = Date.now() - video._id.getTimestamp();
                var timePassed;
                if(time< 60000){
                    timePassed = Math.round(time/1000) + " second ago"
                }
                else if(time >= 60000 && time < 3600000){
                    timePassed = Math.round(time/60000) + " minute ago"
                }
                else if(time => 3600000){
                    timePassed = Math.round(time/3600000) + " hour ago"
                }
                res.render('video', {username: req.params.username, video: video, time: timePassed});
            }
        })
    });

    
};

module.exports = routes;