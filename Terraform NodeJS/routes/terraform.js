const express = require('express');
const path = require('path');
const router = express.Router();
const multer = require('multer');
const fs = require('fs');
const bodyParser = require('body-parser');
const { exec } = require('child_process');


const configFilePath = 'C:\\terraform-k8s-ben\\NodeJS Terraform\\config.json'
// const terraformFilePath = '../../../main.tf';
const terraformFilePath = 'C:\\terraform-k8s-ben\\main.tf'
const configJS = 'C:\\terraform-k8s-ben\\NodeJS Terraform'

// Middleware to handle JSON payloads
router.use(bodyParser.json());

//!! variable buat upload file
// Set upload folder as storage
const storage = multer.diskStorage({
    destination: function (req, file, cb) {
        cb(null, configJS); // Folder penyimpanan
    },
    filename: function (req, file, cb) {
        cb(null, file.originalname); // Simpan file dengan nama asli
    }
});

// Filter untuk hanya mengizinkan file dengan tipe .tf
const fileFilter = (req, file, cb) => {
    if (path.extname(file.originalname) === '.json') {
        cb(null, true); // Terima file
    } else {
        cb(new Error('Only .tf files are allowed!'), false); // Tolak file lain
    }
};

// Middleware untuk menangani upload file
const upload = multer({ storage: storage, fileFilter: fileFilter });

router.post('/config/add', async (req, res) => {
    try {
        const newConfig = req.body;

        // read existing config file
        let config = {};
        if (fs.existsSync(configFilePath)) {
        config = JSON.parse(fs.readFileSync(configFilePath, 'utf8'));
        }

        // add new config content
        config = { ...config, ...newConfig };
        let vmKey = Object.keys(newConfig)
        
        // write content to config file
        fs.writeFileSync(configFilePath, JSON.stringify(config, null, 2), 'utf8');

        res.status(200).send({ status: 'success', newResources:vmKey});
    } catch (error) {
        console.error('Error updating config.json:', error);
        res.status(500).send({ status: 'error', message: error.message });
    }
});

router.post('/config/delete', async (req, res) => {
    try {
        const  {configName}  = req.body;

        let config = {};
        if (fs.existsSync(configFilePath)) {
        config = JSON.parse(fs.readFileSync(configFilePath, 'utf8'));
        }

        for (let index = 0; index < configName.length; index++) {
            if (config[configName[index]]) {
                delete config[configName[index]];
          
                // Tulis kembali ke file config.json
                fs.writeFileSync(configFilePath, JSON.stringify(config, null, 2), 'utf8');
                console.log(`Entry ${configName[index]} telah dihapus dari config.json.`);
            } else {
            res.status(404).send({ status: 'error', message: `Key ${configName[index]} tidak ditemukan dalam config.json.` });
            }   
        }
        res.status(200).send({ status: 'success', delResources:configName });
    } catch (error) {
        console.error('Error updating config.json:', error);
        res.status(500).send({ status: 'error', message: error.message });
    }
})

router.post('/tmain/add', async (req, res) => {
    const {newResources} = req.body;
    let allTerraformContent = '';
    let config = {};
    if (fs.existsSync(configFilePath)) {
    config = JSON.parse(fs.readFileSync(configFilePath, 'utf8'));
    }

    for (let index = 0; index < newResources.length; index++) {
        if (config[newResources[index]]) {
            let terraformTemplate = '';

            if(config[newResources[index]].os=='ubuntu'){
                console.log(config[newResources[index]])
terraformTemplate = `
//start ${newResources[index]}
resource "vsphere_virtual_machine" "${newResources[index]}" {
    name = "${config[newResources[index]].name}"
    resource_pool_id = data.vsphere_resource_pool.resource_pool.id
    datastore_id = data.vsphere_datastore.datastore.id
    folder = vsphere_folder.parent.path

    num_cpus = 4
    memory = 8192

    guest_id = data.vsphere_virtual_machine.template.guest_id
    scsi_type = data.vsphere_virtual_machine.template.scsi_type

    wait_for_guest_net_timeout = 0

    disk {
        label = "disk0"
        size = data.vsphere_virtual_machine.template2.disks.0.size
        thin_provisioned = true
    }

    network_interface {
        network_id = data.vsphere_network.network.id
        adapter_type = data.vsphere_virtual_machine.template.network_interface_types[0]
    }

    clone {
        template_uuid = data.vsphere_virtual_machine.template.id
        timeout = 180
        customize {
            linux_options {
                host_name = "${config[newResources[index]].host_name}"
                domain = "${config[newResources[index]].domain}"
            }
            network_interface {
                ipv4_address = "${config[newResources[index]].ipv4_address}"
                ipv4_netmask = ${config[newResources[index]].ipv4_netmask}
            }
            ipv4_gateway = "${config[newResources[index]].ipv4_gateway}"
            dns_server_list = ${JSON.stringify(config[newResources[index]].dns_server_list)}
        }
    }
} 
// //end ${newResources[index]}`;         
            }else{
                console.log(config[newResources[index]])
terraformTemplate = `
//start ${newResources[index]}
resource "vsphere_virtual_machine" "${newResources[index]}" {
    name = "${config[newResources[index]].name}"
    resource_pool_id = data.vsphere_resource_pool.resource_pool.id
    datastore_id = data.vsphere_datastore.datastore.id
    folder = vsphere_folder.parent.path

    num_cpus = 4
    memory = 8192
    firmware = "efi"

    guest_id = data.vsphere_virtual_machine.template2.guest_id
    scsi_type = data.vsphere_virtual_machine.template2.scsi_type

    wait_for_guest_net_timeout = 0

    disk {
        label = "disk0"
        size = data.vsphere_virtual_machine.template2.disks.0.size
        thin_provisioned = data.vsphere_virtual_machine.template2.disks.0.thin_provisioned
    }

    network_interface {
        network_id = data.vsphere_network.network.id
        adapter_type = data.vsphere_virtual_machine.template2.network_interface_types[0]
    }

    clone {
        template_uuid = data.vsphere_virtual_machine.template2.id
        timeout = 180
        customize {
            windows_options {
                computer_name = "${config[newResources[index]].computer_name}"
                admin_password = "${config[newResources[index]].admin_password}"
            }
            network_interface {
                ipv4_address = "${config[newResources[index]].ipv4_address}"
                ipv4_netmask = ${config[newResources[index]].ipv4_netmask}
            }
            ipv4_gateway = "${config[newResources[index]].ipv4_gateway}"
            dns_server_list = ${JSON.stringify(config[newResources[index]].dns_server_list)}
        }
    }
} 
// //end ${newResources[index]}`;
            }
            allTerraformContent += `\n${terraformTemplate}`;
        } else {
        res.status(404).send({ status: 'error', message: `Key ${configName} tidak ditemukan dalam config.json.` });
        }
    }
    const existingTerraformContent = fs.readFileSync(terraformFilePath, 'utf8');
    const newTerraformContent = existingTerraformContent + allTerraformContent;
    fs.writeFileSync(terraformFilePath, newTerraformContent, 'utf8');

    let infoHost={}
    for (let index2 = 0; index2 < newResources.length; index2++) {
        const keyObject = newResources[index2]
        infoHost[keyObject]={
            "role":config[newResources[index2]].role,
            "os":config[newResources[index2]].os,
            "ip":config[newResources[index2]].ipv4_address
        }
    }
    // console.log(infoHost)
    res.status(200).send({ status: 'success',infoHost:infoHost });
})

router.post('/tmain/delete', async (req, res) => {

    try {
        const {delResources} = req.body;

        var terraformContent = fs.readFileSync(terraformFilePath, 'utf8');
        var newContent = ""
        for (let index = 0; index < delResources.length; index++) {
            // find resource start
            const resourceStart = terraformContent.indexOf(`//start ${delResources[index]}`)-2;
            if (resourceStart === -1) {
                res.status(404).send({ status: 'error', message: `Key ${delResources[index]} not found` });
            }

            //find resource end
            const resourceEnd = terraformContent.indexOf(`//end ${delResources[index]}`) + 6 +delResources[index].length;
            if (resourceEnd === -1) {
                res.status(404).send({ status: 'error', message: `Key ${delResources[index]} not found` });
            }

            //delete content
            const updatedContent = terraformContent.slice(0, resourceStart) + terraformContent.slice(resourceEnd);
            if (index < delResources.length) {
                terraformContent=updatedContent
            }
            newContent=updatedContent
        }
        
        fs.writeFileSync(terraformFilePath, newContent, 'utf8');

        res.status(200).send({ status: 'success' });

    } catch (error) {
        console.error('Error updating config.json:', error);
        res.status(500).send({ status: 'error', message: error.message })
    }
})

router.post('/tmain/upload', upload.single('file') , async (req, res) => {

    const filePath = path.join(configJS, req.file.originalname);

    fs.readFile(filePath, 'utf8', (err, data) => {
        if (err) {
            return res.status(500).json({ status: "Error",message: 'Error reading the file' })
        }

        try {
            const jsonData = JSON.parse(data); // Parsing data JSON

            // Ambil semua kunci dari objek JSON
            const keys = Object.keys(jsonData);

            // Mengirimkan respon dengan kunci dari objek JSON
            res.status(200).json({ status:"success",message: 'File uploaded and read successfully', newResources: keys });
        } catch (err) {
            res.status(500).json({ status: "Error",message: 'Error parsing JSON' })
        }
    });

})

router.get('/tmain/download', async (req, res) => {
    const fileName = 'config.json';
    const filePath = path.join(__dirname,'..','files', fileName);

    res.download(filePath, fileName, (err) => {
        if (err) {
            console.error('Error downloading file:', err);
            res.status(500).send('Error downloading file');
        }
    });
})

router.post('/command/apply', (req, res) => {
    
    // const command = req.body.command;
    const {newResources} = req.body;

    const cwd = path.join('C:', 'terraform-k8s-ben')
    let prefix = "terraform apply "
    let mid = "-target=vsphere_virtual_machine."
    let end = "-auto-approve"

    let all_mid = ""
    for (let index = 0; index < newResources.length; index++) {
        all_mid += mid+newResources[index]+' '
    }

    let command = prefix+all_mid+end    

    exec(command, {cwd}, (error, stdout, stderr) => {
        if (error) {
            return res.status(400).json({ error: stderr });
        }
        res.status(200).send({ status: 'success'})
    });
});

router.post('/command/destroy', (req, res) => {
    
    // const command = req.body.command;
    const {delResources} = req.body;

    const cwd = path.join('C:', 'terraform-k8s-ben')
    let prefix = "terraform destroy "
    let mid = "-target=vsphere_virtual_machine."
    let end = "-auto-approve"

    let all_mid = ""
    for (let index = 0; index < delResources.length; index++) {
        all_mid += mid+delResources[index]+' '
    }

    let command = prefix+all_mid+end
    
    exec(command, {cwd}, (error, stdout, stderr) => {
        if (error) {
            return res.status(400).json({ error: stderr });
        }
        res.json({ output: stdout });
    });
});

router.get('/test', async (req, res) => {
    res.status(200).send({ status: 'success'});
})

module.exports = router;