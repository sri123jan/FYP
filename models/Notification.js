const mongoose = require('mongoose');
const Schema = mongoose.Schema;

const NotificationSchema = new Schema({
    broadcaster : {
        type: String,
        required: true
    },
    viewer : {
        type: String,
        required: true
    },
    read : {
        type: Boolean
    }
});


const Notification = mongoose.model('notification', NotificationSchema);
module.exports = Notification;