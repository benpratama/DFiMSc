const express = require('express');
const router = express.Router();
const fs = require('fs');
const bodyParser = require('body-parser');
const { exec } = require('child_process');
const YAML = require('yamljs');

// Middleware to handle JSON payloads
router.use(bodyParser.json());

const directoryPath = '/home/administrator/ansible_v1.21';

// const inventory1Path = ''
// const inventory2Path = ''
// const inventory3Path = ''

// const deleteUbuntuPath = ''
// const deleteWindowsPath = ''

//!! 0.playbook-test-connection.yml
router.get('/playbook/testconnection', async (req, res) => {
    const command  = 'ansible-playbook -i inventory1 -i inventory2 -i inventory3 0.playbook-test-connection.yml'

    exec(command, { cwd: directoryPath }, (error, stdout, stderr) => {
        if (error) {
            // console.error(`Error executing command: ${error.message}`);
            return res.status(500).json({ error: error.message });
        }

        if (stderr) {
            // console.error(`Standard Error: ${stderr}`);
            return res.status(500).json({ error: stderr });
        }

        // console.log(`Standard Output: ${stdout}`);
        res.status(200).json({ output: stdout });
    });
});

router.get('/playbook/cp/connection', async (req, res) => {
    const command  = 'ansible-playbook -i inventory1 0.1.playbook-test-connection.yml'

    exec(command, { cwd: directoryPath }, (error, stdout, stderr) => {
        if (error) {
            // console.error(`Error executing command: ${error.message}`);
            return res.status(500).json({ error: error.message });
        }

        if (stderr) {
            // console.error(`Standard Error: ${stderr}`);
            return res.status(500).json({ error: stderr });
        }

        console.log(`Standard Output: ${stdout}`);
        res.status(200).json({ status:'success',output: stdout });
    });
});

router.get('/playbook/wn-u/connection', async (req, res) => {
    const command  = 'ansible-playbook -i inventory2 0.2.playbook-test-connection.yml'

    exec(command, { cwd: directoryPath }, (error, stdout, stderr) => {
        if (error) {
            // console.error(`Error executing command: ${error.message}`);
            return res.status(500).json({ error: error.message });
        }

        if (stderr) {
            // console.error(`Standard Error: ${stderr}`);
            return res.status(500).json({ error: stderr });
        }

        // console.log(`Standard Output: ${stdout}`);
        res.status(200).json({ status:'success',output: stdout });
    });
});

router.get('/playbook/wn-w/connection', async (req, res) => {
    const command  = 'ansible-playbook -i inventory3 0.3.playbook-test-connection.yml'

    exec(command, { cwd: directoryPath }, (error, stdout, stderr) => {
        if (error) {
            // console.error(`Error executing command: ${error.message}`);
            return res.status(500).json({ error: error.message });
        }

        if (stderr) {
            // console.error(`Standard Error: ${stderr}`);
            return res.status(500).json({ error: stderr });
        }

        // console.log(`Standard Output: ${stdout}`);
        res.status(200).json({ status:'success',output: stdout });
    });
});

//!! 1.playbook-docker-install-ubuntu-cp.yml
router.get('/playbook/cp/i-dkr', async (req, res) => {
    const command  = 'ansible-playbook -i inventory1 1.playbook-docker-install-ubuntu-cp.yml'

    exec(command, { cwd: directoryPath }, (error, stdout, stderr) => {
        if (error) {
            // console.error(`Error executing command: ${error.message}`);
            return res.status(500).json({ error: error.message });
        }

        if (stderr) {
            // console.error(`Standard Error: ${stderr}`);
            return res.status(500).json({ error: stderr });
        }

        console.log(`Standard Output: ${stdout}`);
        res.status(200).json({ status:'success',output: stdout });
    });
});

//!! 2.playbook-k8s-install-ubuntu-from-binary-cp.yml
router.get('/playbook/cp/i-k8s', async (req, res) => {
    const command  = 'ansible-playbook -i inventory1 2.playbook-k8s-install-ubuntu-from-binary-cp.yml'

    exec(command, { cwd: directoryPath }, (error, stdout, stderr) => {
        if (error) {
            // console.error(`Error executing command: ${error.message}`);
            return res.status(500).json({ error: error.message });
        }

        if (stderr) {
            // console.error(`Standard Error: ${stderr}`);
            return res.status(500).json({ error: stderr });
        }

        console.log(`Standard Output: ${stdout}`);
        res.status(200).json({ status:'success',output: stdout });
    });
});

//!! 3.playbook-k8s-setup-ubuntu-cp.yml
router.get('/playbook/cp/s-cp', async (req, res) => {
    const command  = 'ansible-playbook -i inventory1 3.playbook-k8s-setup-ubuntu-cp.yml'

    exec(command, { cwd: directoryPath }, (error, stdout, stderr) => {
        if (error) {
            // console.error(`Error executing command: ${error.message}`);
            return res.status(500).json({ error: error.message });
        }

        if (stderr) {
            // console.error(`Standard Error: ${stderr}`);
            return res.status(500).json({ error: stderr });
        }

        console.log(`Standard Output: ${stdout}`);
        res.status(200).json({ status:'success',output: stdout });
    });
});

//!! 4.playbook-docker-install-ubuntu-wn.yml
router.get('/playbook/wn-u/i-dkr', async (req, res) => {
    const command  = 'ansible-playbook -i inventory2 4.playbook-docker-install-ubuntu-wn.yml'

    exec(command, { cwd: directoryPath }, (error, stdout, stderr) => {
        if (error) {
            // console.error(`Error executing command: ${error.message}`);
            return res.status(500).json({ error: error.message });
        }

        if (stderr) {
            // console.error(`Standard Error: ${stderr}`);
            return res.status(500).json({ error: stderr });
        }

        // console.log(`Standard Output: ${stdout}`);
        res.status(200).json({ output: stdout });
    });
});

//!! 5.playbook-k8s-install-ubuntu-from-binary-wn.yml
router.get('/playbook/wn-u/i-k8s', async (req, res) => {
    const command  = 'ansible-playbook -i inventory2 5.playbook-k8s-install-ubuntu-from-binary-wn.yml'

    exec(command, { cwd: directoryPath }, (error, stdout, stderr) => {
        if (error) {
            console.error(`Error executing command: ${error.message}`);
            return res.status(500).json({ error: error.message });
        }

        if (stderr) {
            console.error(`Standard Error: ${stderr}`);
            return res.status(500).json({ error: stderr });
        }

        console.log(`Standard Output: ${stdout}`);
        res.status(200).json({ output: stdout });
    });
});

//!! 6.playbook-docker-install-windows.yml
router.get('/playbook/wn-w/i-dkr', async (req, res) => {
    const command  = 'ansible-playbook -i inventory3 6.playbook-docker-install-windows.yml'

    exec(command, { cwd: directoryPath }, (error, stdout, stderr) => {
        if (error) {
            // console.error(`Error executing command: ${error.message}`);
            return res.status(500).json({ error: error.message });
        }

        if (stderr) {
            // console.error(`Standard Error: ${stderr}`);
            return res.status(500).json({ error: stderr });
        }

        // console.log(`Standard Output: ${stdout}`);
        res.status(200).json({ output: stdout });
    });
});

//!! 7.playbook-k8s-install-windows.yml
router.get('/playbook/wn-w/i-k8s', async (req, res) => {
    const command  = 'ansible-playbook -i inventory3 7.playbook-k8s-install-windows.yml'

    exec(command, { cwd: directoryPath }, (error, stdout, stderr) => {
        if (error) {
            // console.error(`Error executing command: ${error.message}`);
            return res.status(500).json({ error: error.message });
        }

        if (stderr) {
            // console.error(`Standard Error: ${stderr}`);
            return res.status(500).json({ error: stderr });
        }

        // console.log(`Standard Output: ${stdout}`);
        res.status(200).json({ output: stdout });
    });
});

//!! 8.playbook-k8s-release-ubuntu.yml
router.get('/playbook/wn-u/rls-node', async (req, res) => {
    const command  = 'ansible-playbook -i inventory1 8.playbook-k8s-release-ubuntu.yml'

    exec(command, { cwd: directoryPath }, (error, stdout, stderr) => {
        if (error) {
            // console.error(`Error executing command: ${error.message}`);
            return res.status(500).json({ error: error.message });
        }

        if (stderr) {
            // console.error(`Standard Error: ${stderr}`);
            return res.status(500).json({ error: stderr });
        }

        // console.log(`Standard Output: ${stdout}`);
        res.status(200).json({ output: stdout });
    });
});

//!! 9.playbook-k8s-release-windows.yml
router.get('/playbook/wn-w/rls-node', async (req, res) => {
    const command  = 'ansible-playbook -i inventory1 9.playbook-k8s-release-windows.yml'

    exec(command, { cwd: directoryPath }, (error, stdout, stderr) => {
        if (error) {
            // console.error(`Error executing command: ${error.message}`);
            return res.status(500).json({ error: error.message });
        }

        if (stderr) {
            // console.error(`Standard Error: ${stderr}`);
            return res.status(500).json({ error: stderr });
        }

        // console.log(`Standard Output: ${stdout}`);
        res.status(200).json({ output: stdout });
    });
});

//! ====== Only for ubuntu (add SSH) ======
router.post('/key/add', async(req,res)=>{
    const ips = req.body.listIP
    console.log(ips)
    const command ="sshpass -p '@ut0Lab95619' ssh-copy-id -i ~/.ssh/id_rsa.pub -o StrictHostKeyChecking=no administrator@"
    let results = [];

    // Helper function to execute command for each IP
    const executeCommand = (ip) => new Promise((resolve, reject) => {
        exec(command + ip, (error, stdout, stderr) => {
            if (error) {
                console.error(`Error executing command for IP ${ip}: ${error.message}`);
                return reject({ ip, error: error.message, type: 'error' });
            }
            if (stderr) {
                console.error(`Execution warnings for IP ${ip}: ${stderr}`);
                return resolve({ ip, output: stderr, type: 'stderr' });
            }
            console.log(`Execution result for IP ${ip}: ${stdout}`);
            resolve({ ip, output: stdout, type: 'stdout' });
        });
    });

    // Process all IPs
    Promise.all(ips.map(ip => executeCommand(ip)))
        .then((results) => {
            res.json({ status: 'success', results: results.map(result => result.value) });
        })

})

router.post('/key/delete', async(req,res)=>{
    const ips = req.body.listIP;
    const command = "ssh-keygen -f '/home/administrator/.ssh/known_hosts' -R ";
    let results = [];

    // Helper function to execute command for each IP
    const executeCommand = (ip) => new Promise((resolve, reject) => {
        exec(command + ip, (error, stdout, stderr) => {
            if (error) {
                console.error(`Error executing command for IP ${ip}: ${error.message}`);
                return reject({ ip, error: error.message, type: 'error' });
            }
            if (stderr) {
                console.error(`Execution warnings for IP ${ip}: ${stderr}`);
                return resolve({ ip, output: stderr, type: 'stderr' });
            }
            console.log(`Execution result for IP ${ip}: ${stdout}`);
            resolve({ ip, output: stdout, type: 'stdout' });
        });
    });

    // Process all IPs
    Promise.all(ips.map(ip => executeCommand(ip)))
        .then((results) => {
            res.json({ status: 'success', results });
        })
        .catch(error => {
            res.status(500).json({ status: 'error', message: 'Failed to process all IPs', error });
        });
})

//! ====== INVENTORY ======
    //! CONTROL PLANE //
router.post('/inventory1/add',async(req,res)=>{
    const { ip } = req.body;
    console.log('1')
    console.log(ip)

    // const a ='D:\\THESIS\\CODE\\ansbile v1.21'
    const inventoryFilePath = directoryPath+'/inventory1'

    if (!ip) {
        return res.status(400).json({ error: 'IP address is required' });
    }

    // Read inventory file
    let inventoryContent = fs.readFileSync(inventoryFilePath, 'utf8');

    // Find [control_plane] group
    const controlPlaneIndex = inventoryContent.indexOf('[control_plane]');
    
    if (controlPlaneIndex === -1) {
        return res.status(400).json({ error: '[control_plane] group not found in inventory file' });
    }

    // Find [control_plane] group
    const controlPlaneVarsIndex = inventoryContent.indexOf('[control_plane:vars]', controlPlaneIndex);
    const endIndex = controlPlaneVarsIndex !== -1 ? controlPlaneVarsIndex : inventoryContent.length;

    // Extract IPs
    let controlPlaneSection = inventoryContent.substring(controlPlaneIndex, endIndex);
 
    
    // Clean up any existing comma-separated IPs and split them into new lines
    controlPlaneSection = controlPlaneSection.replace(/,/g, '\n').trim();
    
    // Add new IP address if it doesn't already exist
    for (let index = 0; index < ip.length; index++) {
        if (!controlPlaneSection.includes(ip[index])) {
            controlPlaneSection += `\n${ip[index]}`;
        } else {
            return res.status(400).json({ error: 'IP address already exists in the inventory file' });
        }
    }
    
    // Rebuild the inventory content with the properly formatted control_plane section
    inventoryContent = inventoryContent.slice(0, controlPlaneIndex) + controlPlaneSection + '\n\n\n' + inventoryContent.slice(endIndex);

    // Write the updated content back to the inventory file
    fs.writeFileSync(inventoryFilePath, inventoryContent, 'utf8');

    res.status(200).json({ message: 'IP address added successfully' });
})

router.get('/inventory1/delete',async(req,res)=>{
    // const a ='D:\\THESIS\\CODE\\ansbile v1.21'
    const inventoryFilePath = directoryPath+'/inventory1'

    // Read inventory file
    let inventoryContent = fs.readFileSync(inventoryFilePath, 'utf8');

    // Find [control_plane] group
    const controlPlaneIndex = inventoryContent.indexOf('[control_plane]');
    
    if (controlPlaneIndex === -1) {
        return res.status(400).json({ error: '[control_plane] group not found in inventory file' });
    }

    // Find [control_plane] group
    const controlPlaneVarsIndex = inventoryContent.indexOf('[control_plane:vars]', controlPlaneIndex);
    const endIndex = controlPlaneVarsIndex !== -1 ? controlPlaneVarsIndex : inventoryContent.length;

    // Extract IPs
    let controlPlaneSection='[control_plane]'
    inventoryContent = inventoryContent.slice(0, controlPlaneIndex) + controlPlaneSection + '\n\n\n' + inventoryContent.slice(endIndex);

    // Write the updated content back to the inventory file
    fs.writeFileSync(inventoryFilePath, inventoryContent, 'utf8');

    res.status(200).json({ message: 'IP address added successfully' });
})

    //! WORKER - UBUNTU //
router.post('/inventory2/add',async(req,res)=>{
    const { ip } = req.body;
    console.log('2')
    console.log(ip)

    // const a ='D:\\THESIS\\CODE\\ansbile v1.21'
    const inventoryFilePath = directoryPath+'/inventory2'

    if (!ip) {
        return res.status(400).json({ error: 'IP address is required' });
    }

    // Read inventory file
    let inventoryContent = fs.readFileSync(inventoryFilePath, 'utf8');

    // Find [control_plane] group
    const workerUbuntuIndex = inventoryContent.indexOf('[workers_ubuntu]');
    
    if (workerUbuntuIndex === -1) {
        return res.status(400).json({ error: '[workers_ubuntu] group not found in inventory file' });
    }

    // Find [control_plane] group
    const workerUbuntuVarsIndex = inventoryContent.indexOf('[workers_ubuntu:vars]', workerUbuntuIndex);
    const endIndex = workerUbuntuVarsIndex !== -1 ? workerUbuntuVarsIndex : inventoryContent.length;

    // Extract IPs
    let workerUbuntuSection = inventoryContent.substring(workerUbuntuIndex, endIndex);
    
    
    // Clean up any existing comma-separated IPs and split them into new lines
    workerUbuntuSection = workerUbuntuSection.replace(/,/g, '\n').trim();
    
    // Add new IP address if it doesn't already exist
    for (let index = 0; index < ip.length; index++) {
        if (!workerUbuntuSection.includes(ip[index])) {
            workerUbuntuSection += `\n${ip[index]}`;
        } else {
            return res.status(400).json({ error: 'IP address already exists in the inventory file' });
        }
    }
    
    // Rebuild the inventory content with the properly formatted control_plane section
    inventoryContent = inventoryContent.slice(0, workerUbuntuIndex) + workerUbuntuSection + '\n\n\n' + inventoryContent.slice(endIndex);

    // Write the updated content back to the inventory file
    fs.writeFileSync(inventoryFilePath, inventoryContent, 'utf8');

    res.status(200).json({ message: 'IP address added successfully' });
})

router.get('/inventory2/delete',async(req,res)=>{
    // const a ='D:\\THESIS\\CODE\\ansbile v1.21'
    const inventoryFilePath = directoryPath+'/inventory2'

    let workerUbuntuSection='[workers_ubuntu]'

    // Read inventory file
    let inventoryContent = fs.readFileSync(inventoryFilePath, 'utf8');

    // Find [control_plane] group
    const workerUbuntuIndex = inventoryContent.indexOf('[workers_ubuntu]');
    
    if (workerUbuntuIndex === -1) {
        return res.status(400).json({ error: '[workers_ubuntu] group not found in inventory file' });
    }

    // Find [control_plane] group
    const workerUbuntuVarsIndex = inventoryContent.indexOf('[workers_ubuntu:vars]', workerUbuntuIndex);
    const endIndex = workerUbuntuVarsIndex !== -1 ? workerUbuntuVarsIndex : inventoryContent.length;

    // delete IPs
    inventoryContent = inventoryContent.slice(0, workerUbuntuIndex) + workerUbuntuSection + '\n\n\n' + inventoryContent.slice(endIndex);

    // Write the updated content back to the inventory file
    fs.writeFileSync(inventoryFilePath, inventoryContent, 'utf8');

    res.status(200).json({ message: 'IP address deleted successfully' });
})

    //! WORKER - WINDOWS //
router.post('/inventory3/add',async(req,res)=>{
    const { ip } = req.body;

    // const a ='D:\\THESIS\\CODE\\ansbile v1.21'
    const inventoryFilePath = directoryPath+'/inventory3'

    if (!ip) {
        return res.status(400).json({ error: 'IP address is required' });
    }

    // Read inventory file
    let inventoryContent = fs.readFileSync(inventoryFilePath, 'utf8');

    // Find [control_plane] group
    const workerWindowsIndex = inventoryContent.indexOf('[workers_win]');
    
    if (workerWindowsIndex === -1) {
        return res.status(400).json({ error: '[workers_win] group not found in inventory file' });
    }

    // Find [control_plane] group
    const workerWindowsVarsIndex = inventoryContent.indexOf('[workers_win:vars]', workerWindowsIndex);
    const endIndex = workerWindowsVarsIndex !== -1 ? workerWindowsVarsIndex : inventoryContent.length;

    // Extract IPs
    let workerWindowsSection = inventoryContent.substring(workerWindowsIndex, endIndex);
    
    
    // Clean up any existing comma-separated IPs and split them into new lines
    workerWindowsSection = workerWindowsSection.replace(/,/g, '\n').trim();
    
    // Add new IP address if it doesn't already exist
    for (let index = 0; index < ip.length; index++) {
        if (!workerWindowsSection.includes(ip[index])) {
            workerWindowsSection += `\n${ip[index]}`;
        } else {
            return res.status(400).json({ error: 'IP address already exists in the inventory file' });
        }
    }
    
    // Rebuild the inventory content with the properly formatted control_plane section
    inventoryContent = inventoryContent.slice(0, workerWindowsIndex) + workerWindowsSection + '\n\n\n' + inventoryContent.slice(endIndex);

    // Write the updated content back to the inventory file
    fs.writeFileSync(inventoryFilePath, inventoryContent, 'utf8');

    res.status(200).json({ message: 'IP address added successfully' });
})

router.get('/inventory3/delete',async(req,res)=>{
    // const a ='D:\\THESIS\\CODE\\ansbile v1.21'
    const inventoryFilePath = directoryPath+'/inventory3'

    let workerWindowsSection='[workers_win]'

    // Read inventory file
    let inventoryContent = fs.readFileSync(inventoryFilePath, 'utf8');

    // Find [control_plane] group
    const workerWindowsIndex = inventoryContent.indexOf('[workers_win]');
    
    if (workerWindowsIndex === -1) {
        return res.status(400).json({ error: '[workers_win] group not found in inventory file' });
    }

    // Find [control_plane] group
    const workerWindowsVarsIndex = inventoryContent.indexOf('[workers_win:vars]', workerWindowsIndex);
    const endIndex = workerWindowsVarsIndex !== -1 ? workerWindowsVarsIndex : inventoryContent.length;

    // delete IPs
    inventoryContent = inventoryContent.slice(0, workerWindowsIndex) + workerWindowsSection + '\n\n\n' + inventoryContent.slice(endIndex);

    // Write the updated content back to the inventory file
    fs.writeFileSync(inventoryFilePath, inventoryContent, 'utf8');

    res.status(200).json({ message: 'IP address deleted successfully' });
})


//! ====== delete yml ====== 
    //! WORKER - UBUNTU //
router.post('/delete-yml-ubt/add',async(req,res)=>{

    const host = req.body
    console.log(host)

    // const a ='D:\\THESIS\\CODE\\ansbile v1.21'
    const ubuntuDeletePath = directoryPath+'/delete_ubuntu.yml'

    if (!host) {
        return res.status(400).json({ error: 'PC name is required' });
    }

    let yamlContent;
    try {
        yamlContent = YAML.load(ubuntuDeletePath);
    } catch (error) {
        return res.status(500).json({ error: 'Failed to load YAML file' });
    }

    // Add the new PC name to the Delete_node_ubuntu list
    if (!yamlContent.Delete_node_ubuntu) {
        yamlContent.Delete_node_ubuntu = [];
    }

    if (!yamlContent.Delete_node_ubuntu.includes(host)) {
        for (let index = 0; index < host.length; index++) {
            yamlContent.Delete_node_ubuntu.push(host[index]);
        }        
    } else {
        return res.status(400).json({ error: 'PC name already exists in the YAML file' });
    }

    // Convert the updated content back to YAML
    const updatedYamlContent = YAML.stringify(yamlContent, 4);

    // Write the updated content back to the YAML file
    try {
        fs.writeFileSync(ubuntuDeletePath, updatedYamlContent, 'utf8');
    } catch (error) {
        return res.status(500).json({ error: 'Failed to write to YAML file' });
    }

    res.status(200).json({ message: 'PC name added successfully' });

})

router.get('/delete-yml-ubt/delete',async(req,res)=>{
    // const a ='D:\\THESIS\\CODE\\ansbile v1.21'
    const ubuntuDeletePath = directoryPath+'/delete_ubuntu.yml'

    let yamlContent;
    try {
        yamlContent = YAML.load(ubuntuDeletePath);
    } catch (error) {
        return res.status(500).json({ error: 'Failed to load YAML file' });
    }

    // Check if the list exists, and then clear it
    if (yamlContent.Delete_node_ubuntu) {
        yamlContent.Delete_node_ubuntu = [];
    } else {
        return res.status(400).json({ error: 'PC list does not exist in the YAML file' });
    }

    // Convert the updated content back to YAML
    const updatedYamlContent = YAML.stringify(yamlContent, 4);

    // Write the updated content back to the YAML file
    try {
        fs.writeFileSync(ubuntuDeletePath, updatedYamlContent, 'utf8');
    } catch (error) {
        return res.status(500).json({ error: 'Failed to write to YAML file' });
    }

    res.status(200).json({ message: 'PC list cleared successfully' });
})

    //! WORKER - WINDOWS //
router.post('/delete-yml-win/add',async(req,res)=>{

    const {host} = req.body

    // const a ='D:\\THESIS\\CODE\\ansbile v1.21'
    const windowsDeletePath = directoryPath+'/delete_windows.yml'

    if (!host) {
        return res.status(400).json({ error: 'PC name is required' });
    }

    let yamlContent;
    try {
        yamlContent = YAML.load(windowsDeletePath);
    } catch (error) {
        return res.status(500).json({ error: 'Failed to load YAML file' });
    }

    // Add the new PC name to the Delete_node_windows list
    if (!yamlContent.Delete_node_windows) {
        yamlContent.Delete_node_windows = [];
    }

    if (!yamlContent.Delete_node_windows.includes(host)) {
        for (let index = 0; index < host.length; index++) {
            yamlContent.Delete_node_windows.push(host[index]);
        }        
    } else {
        return res.status(400).json({ error: 'PC name already exists in the YAML file' });
    }

    // Convert the updated content back to YAML
    const updatedYamlContent = YAML.stringify(yamlContent, 4);

    // Write the updated content back to the YAML file
    try {
        fs.writeFileSync(windowsDeletePath, updatedYamlContent, 'utf8');
    } catch (error) {
        return res.status(500).json({ error: 'Failed to write to YAML file' });
    }

    res.status(200).json({ message: 'PC name added successfully' });

})

router.get('/delete-yml-win/delete',async(req,res)=>{
    // const a ='D:\\THESIS\\CODE\\ansbile v1.21'
    const windowsDeletePath = directoryPath+'/delete_windows.yml'

    let yamlContent;
    try {
        yamlContent = YAML.load(windowsDeletePath);
    } catch (error) {
        return res.status(500).json({ error: 'Failed to load YAML file' });
    }

    // Check if the list exists, and then clear it
    if (yamlContent.Delete_node_windows) {
        yamlContent.Delete_node_windows = [];
    } else {
        return res.status(400).json({ error: 'PC list does not exist in the YAML file' });
    }

    // Convert the updated content back to YAML
    const updatedYamlContent = YAML.stringify(yamlContent, 4);

    // Write the updated content back to the YAML file
    try {
        fs.writeFileSync(windowsDeletePath, updatedYamlContent, 'utf8');
    } catch (error) {
        return res.status(500).json({ error: 'Failed to write to YAML file' });
    }

    res.status(200).json({ message: 'PC list cleared successfully' });
})
module.exports = router;