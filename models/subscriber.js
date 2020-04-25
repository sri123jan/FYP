const mongoose = require('mongoose');
const Schema = mongoose.Schema;

const subscriberSchema = new Schema({
    channel : {
        type: String,
        required: true
    },
    username : {
        type: String,
        required: true
    }
});

const Subscriber = mongoose.model('subscriber', subscriberSchema);
module.exports = Subscriber;