const mongoose = require('mongoose');
const Schema = mongoose.Schema;

const UserSchema = new Schema({
    name: {
        type: String,
        required: true
    },
    username:{
        type: String,
        required: true
    },
    password: {
        type: String,
        required: true
    },
    email: {
        type: String,
        required: true
    },
    usertype: {
        type: String,
        required: true
    },
    isStreaming: {
        type: Boolean,
        default: false
    },
    liveVideoId: {
        type: String,
        default: 0
    },
    image:{
        type: String
    }
});

const User = mongoose.model('user', UserSchema);

module.exports = User;