const express = require("express");
const router = express.Router();

// get virtual_machines
router.get('/test', async (req, res)=>{
    try{
        
        return res.status(200).send({stat:'success',msg:'run well'});
    } catch (error) {
        return res.status(500).send({stat:'failed',msg:'not run'});
    }
});


module.exports = router;