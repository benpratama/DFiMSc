const express = require('express')
const app = express()
const mongoose = require('mongoose');

var cors = require('cors');
require('dotenv').config()

app.use(cors({
  origin: ['http://localhost:3000', 'http://127.0.0.1:3000'],
}));

const port = 8003;


mongoose.connect(process.env.MONGO_URI)
  .then(() => console.log('Connected to MongoDB'))
  .catch((err) => console.error('Error connecting to MongoDB:', err));


//! detail endpoint
const Backend = require('./routes/backend')
const Upload = require('./routes/upload')
const vmManager = require('./routes/vmManager')
const k8sManager = require('./routes/k8sManager')
const appManager = require('./routes/appManager')
const appContainer = require('./routes/appContainer')
const test = require('./routes/test')


app.use('/ui', Backend);
app.use('/upload', Upload);
app.use('/vmmanager',vmManager);
app.use('/k8smanager',k8sManager);
app.use('/appmanager',appManager);
app.use('/appcontainer',appContainer);
app.use('/test',test);

app.listen(port, () => {
    console.log('Monitoring System server running on port '+port);
  });