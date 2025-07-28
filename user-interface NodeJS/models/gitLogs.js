const mongoose = require('mongoose');

const resource = new mongoose.Schema({
    commitID: { type: String, required: true }, 
    date: { type: Date, required: true }, 
    msg: { type: String, required: true }, 
    sts: { type: String, required: false},
   
},{ versionKey: false });

module.exports = mongoose.model('git_logs', resource);