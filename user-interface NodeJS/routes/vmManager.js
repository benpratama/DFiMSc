const express = require("express");
const router = express.Router();
const bodyParser = require('body-parser');

const log = require('../models/vmManagerLog')
const VMs = require('../models/virtualMachines')


router.use(bodyParser.json());
// get vm_deployment_logs
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

//write vm_deployment_logs
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


// get virtual_machines
router.get('/vms', async (req, res)=>{
    try {
        let data = await VMs.find({});
        
        return res.status(200).send({stat:'success',data:data});
    } catch (error) {
        console.error("Error saat mengambil data:", error);
        return res.status(500).send({stat:'failed',data:null});
    }
});

//write virtual_machines
router.post('/add', async (req, res) => {
    try {
        const data = req.body.VMs;
        const savedDocs = [];

        // Iterasi setiap key dalam data
        for (const key in data) {
          if (data.hasOwnProperty(key)) {
            const vmData = data[key];
            // Tambahkan properti title berdasarkan key
            vmData.title = key;
    
            // Buat dokumen baru dan simpan ke MongoDB
            const newDoc = new VMs(vmData);
            const savedDoc = await newDoc.save();
            savedDocs.push(savedDoc);
          }
        }
  
      res.status(201).json({ stat: 'success', data: savedDocs });
    } catch (error) {
      console.error('Error saving log:', error);
      res.status(500).json({ stat: 'failed', error: error.message });
    }
});

//delete virtual_machines
router.post('/delete', async (req, res) => {
    try {
        const vmTitle  = req.body.vmTitle;
        if (!vmTitle) {
            return res.status(400).json({ stat: 'failed', message: 'No VM id provided' });
        }
      
        const deletedDoc = await VMs.findOneAndDelete({ title: vmTitle });
      
        if (!deletedDoc) {
            return res.status(404).json({ stat: 'failed', message: 'VM not found' });
        }
  
      res.status(201).json({ stat: 'success', data: deletedDoc });
    } catch (error) {
      console.error('Error saving log:', error);
      res.status(500).json({ stat: 'failed', error: error.message });
    }
});


module.exports = router;