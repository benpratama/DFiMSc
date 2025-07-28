const mongoose = require('mongoose');

const resource = new mongoose.Schema({
    role: { type: String, required: true }, // Anda bisa mengubah menjadi Number jika Mem berupa angka.
    name: { type: String, required: true }, // Anda bisa mengubah menjadi Number jika Mem berupa angka.
    clusterName: { type: String, required: true }, // Anda bisa mengubah menjadi Number jika Mem berupa angka.
    children: { type: Array, required: true }, // Anda bisa mengubah menjadi Number jika Mem berupa angka.
   
},{ versionKey: false });

module.exports = mongoose.model('k8s_clusters', resource);