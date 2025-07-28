const mongoose = require('mongoose');

const clusterInfo = new mongoose.Schema({
    created: { type: Boolean, required: true},
},{ versionKey: false });

module.exports = mongoose.model('cluster_infos', clusterInfo);