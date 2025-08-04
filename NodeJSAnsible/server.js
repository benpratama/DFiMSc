const express = require('express')
const app = express()
const fs = require('fs');
var cors = require('cors');

app.use(cors({
  origin: ['http://localhost:3000', 'http://127.0.0.1:3000'],
}));

const port = 8001;
//! detail endpoint
const Ansible = require('./routes/ansible')

app.use('/ansible', Ansible);

app.listen(port, () => {
    console.log('Monitoring System server running on port '+port);
  });