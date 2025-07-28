const mongoose = require('mongoose');

const resource = new mongoose.Schema({
    msg: { type: String, required: true }, // Anda bisa mengubah menjadi Number jika Mem berupa angka.
    status: { type: String, required: true }, // Anda bisa mengubah menjadi Number jika CPU berupa angka.
    datetime: { type: Date, required: false } // Disesuaikan dengan struktur sebenarnya
},{ versionKey: false });

module.exports = mongoose.model('k8s_deployment_logs', resource);