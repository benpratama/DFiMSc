const mongoose = require('mongoose');

const resource = new mongoose.Schema({
    timestamp: { type: Date, required: true },
    Mem: { type: String, required: true }, // Anda bisa mengubah menjadi Number jika Mem berupa angka.
    CPU: { type: String, required: true }, // Anda bisa mengubah menjadi Number jika CPU berupa angka.
    Nodes: { type: Object, required: false } // Disesuaikan dengan struktur sebenarnya
},{ versionKey: false });

module.exports = mongoose.model('resource_usages', resource);