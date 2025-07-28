const mongoose = require('mongoose');

const resource = new mongoose.Schema({
    title: { type: String, required: true },
    os: { type: String, required: true },
    name: { type: String, required: true },
    ipv4_address: { type: String, required: true },
    ip_code: { type: Number, required: true },
    ipv4_netmask: { type: Number, required: true },
    ipv4_gateway: { type: String, required: true },
    dns_server_list: { type: Array, required: true },
    host_name: { type: String, required: false },
    domain: { type: String, required: false },
    computer_name: { type: String, required: false },
    admin_password: { type: String, required: false },
    role: { type: String, default: null }
},{ versionKey: false });

module.exports = mongoose.model('virtual_machines', resource);