const express = require('express');
const router = express.Router();
const fs = require('fs');
const bodyParser = require('body-parser');
const { exec } = require('child_process');

const clusterinfo = require('../models/clusterInfo')
const timeserie = require('../models/data')

router.use(bodyParser.json());

router.get('/config', async (req, res)=>{
    try {
        let configStatus = await clusterinfo.find({});
        // console.log(configStatus[0].created)

        return res.status(200).send({stat:'success',data:configStatus[0].created});
    } catch (error) {
        console.error("Error saat mengambil data:", error);
        return res.status(500).send({stat:'failed',data:null});
    }
});

router.get('/data', async (req, res)=>{
    try {
        let data = await timeserie.findOne().sort({ timestamp: -1 });
        // console.log(configStatus[0].created)

        return res.status(200).send({stat:'success',data:data});
    } catch (error) {
        console.error("Error saat mengambil data:", error);
        return res.status(500).send({stat:'failed',data:null});
    }
});

module.exports = router;