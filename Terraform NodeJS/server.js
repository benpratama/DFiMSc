const express = require('express')
const app = express()
const fs = require('fs');
var cors = require('cors');


app.use(cors({
  origin: ['http://localhost:3000', 'http://127.0.0.1:3000', 'http://140.116.234.100:23632'],
}));

const port = 8001;
//! detail endpoint

const Terraform = require('./routes/terraform')

app.use('/terraform', Terraform);

app.listen(port, () => {
    console.log('Monitoring System server running on port '+port);
  });