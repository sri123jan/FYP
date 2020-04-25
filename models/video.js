const mongoose = require('mongoose');
const Schema = mongoose.Schema;

const VideoSchema = new Schema({
    id: {
        type: String
    },
    username: {
        type: String,
        required: true
    },
    title: {
        type: String,
        required: true
    },
    description: {
        type: String,
        required: true
    },
    language: {
        type: String,
        required: true
    },
    viewsCount: {
        type: Number,
        default: 0
    }
});

const Video = mongoose.model('video', VideoSchema);

module.exports = Video;