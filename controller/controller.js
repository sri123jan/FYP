const passport = require('passport');
const User = require('../models/user');
const Video = require('../models/video');
const Notification = require('../models/notification');
const Subscriber = require('../models/subscriber')
var formidable = require('formidable');
var path = require('path');
var multer  = require('multer')
var storage = multer.diskStorage({
    destination: function (req, file, cb) {
      cb(null, './uploads/')
    },
    filename: function (req, file, cb) {
      cb(null, Date.now() + '-' + file.originalname);
    }
})
var upload = multer({ storage: storage })

var routes = function(app, broadcaster){

    app.get('/', function(req, res) {
        if (req.user == null){
            res.redirect('login');
        }
        else if(req.user.usertype == "Streamer"){
            res.redirect('/broadcast/dashboard');
        }
        else{
            var liveStreamer = [];
            User.find({usertype: "Streamer"}, function(err, users){
                if (users){
                    Object.keys(users).forEach(function(key){
                        if (broadcaster[users[key].username]){
                            liveStreamer.push(users[key]);
                        }
                    });
                }
            });

            var channelList = [];
            User.find({usertype: "Streamer"}).then(function(users){
                for (i=0; i< users.length; i++){
                    channelList.push(users[i]);
                }
                Subscriber.aggregate(
                    [{
                        $group: {
                            _id: "$channel",
                            count: { $sum: 1 }
                        }
                    }], (err, result) => {
                        Subscriber.find({username: req.user.username}).then((subscribers) => {
                            res.render('home', { user: req.user, liveStreamer: liveStreamer, subscribersList: subscribers, channelList: channelList, count: result});
                        })
                    }
                )
            })
        }
    });

    app.post('/', (req, res) =>{
        if(req.body.subscribed == "yes"){
            var subscriber = new Subscriber();
            subscriber.channel = req.body.channel;
            subscriber.username = req.user.username;
            subscriber.save();
            res.end();
        }
        else{
            Subscriber.findOneAndDelete({channel: req.body.channel, username: req.user.username}).then(() =>{
                res.end('/');
            });
        }
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
                    res.redirect('/broadcast/dashboard');
                }
                res.redirect('/');
            });
          })(req, res);
    });
    
    app.get('/logout', function(req, res){
        req.logout();
        res.redirect('/login');
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

    app.post('/isStreaming', function(req,res){
        User.findOne({username: req.body.username}, function(err, user){
            res.send({isStreaming: user.isStreaming});
        })
    });

    app.get('/broadcast/dashboard', function(req, res){
        res.render('dashboard', {user: req.user})
    });

    app.get('/broadcast/account', function(req, res){
        res.render('broadcast-account', {user: req.user, error: '', success: ''})
    })

    app.post('/broadcast/account', upload.single('avatar'), (req, res) =>{
        User.findOne({username: req.user.username}, (err, user) => {
            if(req.body.password == req.body.password1){
                if(req.file){
                    user.image = req.file.path;
                }
                user.name = req.body.name;
                user.email = req.body.email;
                user.passpord = req.body.password;
                user.save();
                res.render('broadcast-account', {user: user, success: "Account updated successfully", error: ''});
            }
            else{
                res.render('broadcast-account', {user: req.user, error: "Password didn't match", success: ''});
            }
        })
    });
    // broadcaster
    app.get('/broadcast/:username', function(req, res){
        Video.find({username: req.params.username}).then((videos) => {
            res.render('broadcast', { user: req.user, username: req.params.username, length:videos.length });
        })
    });

    app.post('/broadcast/:username', function(req, res){
        var newVideo = new Video(req.body);
        newVideo.username = req.user.username;
        newVideo.id = req.body.socketid;
        newVideo.save();

        Subscriber.find({channel: req.user.username})
        .then(function(subscribers){
            subscribers.forEach(subs => {
                var newNotification = new Notification();
                newNotification.broadcaster = req.user.username
                newNotification.viewer = subs.username;
                newNotification.read = false;
                newNotification.save();
            });
        });
        
        User.findOne({username: req.user.username}, function(err, user){
            user.isStreaming = true;
            user.liveVideoId = newVideo._id;
            user.save();
        });
        res.send();
    });

    

    //viewer
    app.get('/channels', function(req, res){
        if (req.user == null){
            res.redirect('login');
        }
        else{
            Subscriber.aggregate(
                [{
                    $group: {
                        _id: "$channel",
                        count: { $sum: 1 }
                    }
                }], (err, result) => {
                    Subscriber.find({username: req.user.username}).then((subscribers) => {
                        res.render('channels', { user: req.user, subscribersList: subscribers, result: result});
                    })
                }
            )
        }
    });

    app.post('/channels', function(req, res){
        Subscriber.findOne({username: req.user.username, channel: req.body.channel}, function(err, subscriber){
            if (!subscriber){
                var subs = new Subscriber();
                subs.username = req.user.username;
                subs.channel = req.body.channel;
                subs.save();
                res.status(204).send();
            }
            else{
                res.redirect('/channels');
            }
        });
    });

    app.get('/notification', function(req, res){
        var subsList = []
        Subscriber.find({username: req.user.username}).then(function(subscribers){
            subsList = subscribers;
        })
        var notificationList = []
        Notification.find({viewer: req.user.username, read: false}).then(function(notifications){
            notifications.forEach( (noti) => {
                subsList.forEach((subs) => {
                    if(subs.channel == noti.broadcaster){
                        notificationList.push(noti);
                    }
                });
            })
            res.send(notificationList);
        });
    });

    app.post('/notification', function(req, res, done){
        var filter = {viewer: req.user.username, broadcaster: req.body.broadcaster, read: false}
        var update = {read: true}
        Notification.findOneAndUpdate(filter, update).then(function(){
            res.end();
        });
    });

    app.get('/account', (req, res) =>{
        Subscriber.find().then(function(subscribers){
            res.render('account', {user: req.user, error: '', success: '', subscribersList: subscribers});
        });
    });

    app.post('/account', upload.single('avatar'), (req, res) =>{
        Subscriber.find().then(function(subscribers){
            User.findOne({username: req.user.username}, (err, user) => {
                if(req.body.password == req.body.password1){
                    if(req.file){
                        user.image = req.file.path;
                    }
                    user.name = req.body.name;
                    user.email = req.body.email;
                    user.passpord = req.body.password;
                    user.save();
                    res.render('account', {user: user, success: "Account updated successfully", error: '', subscribersList: subscribers});
                }
                else{
                    res.render('account', {user: req.user, error: "Password didn't match", success: '', subscribersList: subscribers});
                }
            })
        })
    });

    app.get('/:username', function(req, res){
        if(req.user == null){
            res.redirect('login');
        }
        else{ 
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
                    User.findOne({username: req.params.username}, (err, user) => {
                        Video.findOne({_id: user.liveVideoId}, (er, video) => {
                            video.viewsCount += 1;
                            video.save();
                            Subscriber.find({username: req.user.username}).then((subscribers) => {
                                Subscriber.findOne({username: req.user.username, channel: req.params.username}, (eerr, subs) => {
                                    if(subs){
                                        res.render('video', {user: req.user, broadcaster: video, subscribersList: subscribers, subs: true, username: req.params.username, video: video, time: timePassed, viewer: req.user.username});
                                    }
                                    else{
                                        res.render('video', {user: req.user, broadcaster: video, subscribersList: subscribers, subs: false, username: req.params.username, video: video, time: timePassed, viewer: req.user.username});
                                    }
                                })
                            })
                        })
                    });
                }else{
                    res.redirect('/individual/'+req.params.username)
                }
            });
        }
    });

    app.post('/stop-streaming', (req, res) => {
        User.findOne({username: req.user.username}, function(err, user){
            user.isStreaming = false;
            user.save();
            res.send();
        })
    });

    app.get('/individual/:username', (req, res) =>{
        User.findOne({username: req.params.username}, (err, user) =>{
            Video.find({username: req.params.username}).then(videos => {
                var liveVideo = {}
                var videoList = []
                videos.forEach((video) => {
                    var time = Date.now() - video._id.getTimestamp();
                    var timePassed;
                    if(time< 60000){
                        timePassed = Math.round(time/1000) + " second ago"
                    }
                    else if(time >= 60000 && time < 3600000){
                        timePassed = Math.round(time/60000) + " minute ago"
                    }
                    else if(time >= 3600000 && time < 86400000){
                        timePassed = Math.round(time/3600000) + " hour ago"
                    }
                    else if(time >= 86400000){
                        timePassed = Math.round(time/86400000) + " day ago"
                    }
                    videoList.push([video, timePassed]);
                    if (video._id == user.liveVideoId){
                        liveVideo = video;
                    }
                });
                Subscriber.find({username: req.user.username}).then(function(subscribers){
                    Subscriber.findOne({username: req.user.username, channel: req.params.username}, (eerr, subs) => {
                        if(subs){
                            res.render('individual-streamer', {user: req.user, videos: videoList, individual: user, subs: true, subscribersList: subscribers, liveVideo: liveVideo});
                        }
                        else{
                            res.render('individual-streamer', {user: req.user, videos: videoList, individual: user, subs: false, subscribersList: subscribers, liveVideo: liveVideo});                            
                        }
                    })
                });
            });
        });
    });

    app.get('/subscribers/:username', (req, res) => {
        var subsCount = 0;
        var viewsList = [];
        var videoCount = 0;
        Subscriber.find({channel: req.user.username}).then((subscribers) => {
            subsCount = subscribers.length;
            
            Video.find({username: req.params.username}).then((videos) => {
                viewsList = videos;
                videoCount = videos.length;
                res.send({subsCount: subsCount, viewsList: viewsList.reverse(), videoCount: videoCount});
            });
        }); 
    });
};

module.exports = routes;