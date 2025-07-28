const express = require("express");
const router = express.Router();
const bodyParser = require('body-parser');

const log = require('../models/k8sManagerLog')
const VMs = require('../models/virtualMachines')
const k8sClusters = require('../models/k8sCluster')

router.use(bodyParser.json());

// get k8s_deployment_logs
router.get('/data', async (req, res)=>{
    try {
        let data = await log.find({}).sort({ datetime: -1 }).limit(8);
        
        let formattedData = data.map(item => {
            const dt = new Date(item.datetime);
            const yyyy = dt.getFullYear();
            const mm = String(dt.getMonth() + 1).padStart(2, '0');
            const dd = String(dt.getDate()).padStart(2, '0');
            const hh = String(dt.getHours()).padStart(2, '0');
            const min = String(dt.getMinutes()).padStart(2, '0');

            return {
                ...item._doc, // salin semua properti dokumen MongoDB
                datetime: `${yyyy}-${mm}-${dd} ${hh}:${min}`
            };
        });

        return res.status(200).send({stat:'success',data:formattedData});
    } catch (error) {
        console.error("Error saat mengambil data:", error);
        return res.status(500).send({stat:'failed',data:null});
    }
});

//write k8s_deployment_logs
router.post('/write', async (req, res) => {
    try {
      const { msg, status } = req.body;
  
      const logEntry = new log({
        msg,
        status,
        datetime: new Date() // otomatis timestamp
      });
  
      await logEntry.save();
  
      res.status(201).json({ stat: 'success', data: logEntry });
    } catch (error) {
      console.error('Error saving log:', error);
      res.status(500).json({ stat: 'failed', error: error.message });
    }
});

//get all vm yang role-nya null
router.get('/vmunrole', async (req, res)=>{
    try {
        let data = await VMs.find({ role: null}, { title: 1, name: 1, os:1, ipv4_address:1 , _id: 1 });
        
        return res.status(200).send({stat:'success',data:data});
    } catch (error) {
        console.error("Error saat mengambil data:", error);
        return res.status(500).send({stat:'failed',data:null});
    }
});

//update role vm
router.post('/updaterole', async (req, res) => {
    try {
        const { updateVmRole } = req.body;
        if (!updateVmRole || !Array.isArray(updateVmRole)) {
          return res.status(400).json({
            stat: "failed",
            message: "Data updateVmRole harus berupa array."
          });
        }
    
        // Buat array promise untuk update setiap VM berdasarkan _id
        const updatePromises = updateVmRole.map(vmData => {
          const { _id, role } = vmData;
          // Pastikan _id dan role ada
          if (!_id || !role) {
            return null;
          }
          return VMs.findByIdAndUpdate(
            _id,
            { role },
            { new: true }
          );
        });
    
        // Filter promise yang null (jika ada data yang tidak lengkap)
        const validPromises = updatePromises.filter(p => p !== null);
        
        const updatedDocs = await Promise.all(validPromises);
    
        return res.status(200).json({
          stat: "success",
          data: updatedDocs
        });
    } catch (error) {
        console.error("Error updating VM roles:", error);
        return res.status(500).json({
            stat: "failed",
            error: error.message
        });
    }
});

// get k8s_deployment_logs
router.get('/cluster', async (req, res)=>{
    try {
        let data = await k8sClusters.find({})

        return res.status(200).send({stat:'success',data:data});
    } catch (error) {
        console.error("Error saat mengambil data:", error);
        return res.status(500).send({stat:'failed',data:null});
    }
});

router.post('/insertCluster', async (req, res) => {
    try {
        const clusterData = req.body;
        const newCluster = new k8sClusters(clusterData);
        const savedCluster = await newCluster.save();
        res.status(201).json({ stat: "success", data: savedCluster });
    } catch (error) {
        console.error("Error inserting cluster:", error);
        res.status(500).json({ stat: "failed", error: error.message });
    }
});

module.exports = router;