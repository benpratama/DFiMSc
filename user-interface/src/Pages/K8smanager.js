import React, { useState, useEffect } from "react";
import Select, { components } from "react-select";
import '../App.css';
import ubuntuLogo from "../assets/Ubuntu.png";
import windowsLogo from "../assets/Windows.png";
import { v4 as uuidv4 } from "uuid";
import Tree from "react-d3-tree";

import { TerraformAPI, AnsibleAPI, BackendAPI } from '../axios';



function delay(ms) {
    return new Promise(resolve => setTimeout(resolve, ms));
}


//!! FUNCTION BACKEND (WRITE LOG)
async function writeLog(msg,status) {
    const endpoint = "/k8smanager/write";
    try {
        const response = await BackendAPI.post(
        endpoint,
        {
            msg: msg,
            status: status,
        },
        {
            headers: {
            "Content-Type": "application/json",
            },
        }
        );
        // console.log("Log saved:", response.data);
    } catch (error) {
        console.error("Error Write Log:", error);
    }
}

//!! FUNCTION BACKEND (GET LOG)
async function GetDeploymentLog() {
    const endpoint = '/k8smanager/data';
    try {
        const response = await BackendAPI.get(endpoint, {
        headers: {
            'Content-Type': 'application/json', 
        },
        });
    
    //   console.log(response.data); // untuk cek response
        return response.data;
    } catch (error) {
        console.error("Error in GetDeploymentLog:", error);
        return { stat: 'failed', data: [] }; // fallback
    }
}

//!! FUNTION GET VM UNROLE
async function GetVMunRole() {
    const endpoint = '/k8smanager/vmunrole';
    try {
        const response = await BackendAPI.get(endpoint, {
        headers: {
            'Content-Type': 'application/json', 
        },
        });
        return response.data;
    } catch (error) {
        console.error("Error in GetVMunRole:", error);
        return { stat: 'failed', data: [] }; // fallback
    }
}

//!! FUNTION update VM ROLE
async function updateVMRole(data) {
    const endpoint = '/k8smanager/updaterole';
    try {
        const response = await BackendAPI.post(
        endpoint,
        {updateVmRole:data},
        {
            headers: {
            'Content-Type': 'application/json'
            }
        }
        );
        return response.data.stat;
    } catch (error) {
        console.error("Error in updateVMRole:", error);
        return { stat: 'failed', data: [] }; // fallback
    }
}

//!! FUNTION GET K8s Cluster
async function GetK8sClusters() {
    const endpoint = '/k8smanager/cluster';
    try {
        const response = await BackendAPI.get(endpoint, {
        headers: {
            'Content-Type': 'application/json', 
        },
        });
        return response.data;
    } catch (error) {
        console.error("Error in GetVMunRole:", error);
        return { stat: 'failed', data: [] }; // fallback
    }
}

//!! FUNCTION BACKEND (WRITE LOG)
async function addK8sCluster(clusterData) {
    const endpoint = "/k8smanager/insertCluster";
    try {
        const response = await BackendAPI.post(
        endpoint,
        clusterData,
        {
            headers: { "Content-Type": "application/json" },
        }
        );
        console.log("Cluster added:", response.data);
        return response.data;
    } catch (error) {
        console.error("Error adding cluster:", error);
        throw error;
    }
}

//!! select Control Plane
const CustomOption = (props) => {
    const { data } = props;
    return (
      <components.Option {...props}>
        <div style={{ display: "flex", alignItems: "center" }}>
            <span>{data.displayTitle} - {data.name}</span>
            <img
                src={data.logo}
                alt="OS Logo"
                style={{ width: "25px", height: "25px", marginLeft: "1rem" }}
            />
        </div>
      </components.Option>
    );
};
  
const VMCP = ({ options, onChange, value }) => {
    return (
        <Select
            options={options}
            value={value} // pastikan value dioper ke sini
            onChange={onChange}
            components={{ Option: CustomOption }}
            placeholder="Choose..."
        />
    );
};

const VMWorker = ({ options, onChange }) => {
    return (
        <Select
            options={options}
            onChange={onChange}
            components={{ Option: CustomOption }}
            placeholder="Choose..."
        />
    );
};

function findDuplicateValues(dataArray) {
    const seen = new Set();
    const duplicates = [];
    
    dataArray.forEach((item) => {
      if (seen.has(item.value)) {
        duplicates.push(item.label);
      } else {
        seen.add(item.value);
      }
    });
    return duplicates;
}

// ============== ANSIBLE API ================
//! Ansible del Key (4)
async function AnsibleDelKey(listIP){
    const DeleteKey = "/ansible/key/delete"

    try {
        console.log("==Start== Delete key "+ new Date());
        const response = await AnsibleAPI.post(
        DeleteKey,
        JSON.stringify({ listIP }),
        { headers: { 'Content-Type': 'application/json' } }
        );
        
        if (response.data.status === 'success') {
            console.log("==End== Delete key "+ new Date());
            await AnsibleAddKey(listIP);  // Ensure this completes before returning
        }
    } catch (error) {
        console.error("Error in AnsibleDelKey:", error);
    }
}

//! Ansible add Key (5)
async function AnsibleAddKey(listIP){
    const AddKey = "/ansible/key/add"

    try {
        console.log("==Start== Add key "+ new Date());
        const response =  AnsibleAPI.post(
        AddKey, //! endponint
        JSON.stringify({ listIP }), //! data diubah jadi bentuk json object
        { headers: { 'Content-Type': 'application/json' } }
        )
        console.log("==End== Add key "+ new Date());
    } catch (error) {
        console.error("Error in AnsibleAddKey:", error);
    }

}

//! MAIN FUNCTION
async function InventoryProcess(infoHost){
    let CP_IPs = []
    let Wn_ubt_IPs = []
    let Wn_win_IPs = []
  
    for (const key in infoHost) {
  
      if (infoHost[key].role === "ControlPlane") {
        CP_IPs.push(infoHost[key].ip);
      }
      if (infoHost[key].role === "WorkerNode" && infoHost[key].os === "ubuntu") {
        Wn_ubt_IPs.push(infoHost[key].ip)
      } 
      if (infoHost[key].role === "WorkerNode" && infoHost[key].os === "windows"){
        Wn_win_IPs.push(infoHost[key].ip)
      }
  
    }
    console.log('CP_IPs: '+CP_IPs)
    console.log('Wn_ubt_IPs: '+Wn_ubt_IPs)
    console.log('Wn_win_IPs: '+Wn_win_IPs)
    try {
      console.log('run InventoryProcess')
      if (CP_IPs.length !== 0) {
        console.log('star CP process '+ new Date())
        writeLog('Set up Control Plane','Process') //DISINI_LOG 3
        await DellInventory1()
        await delay(10000)
        await AddInventory1(CP_IPs);
        await delay(10000)
        await TestConnectionCP();
        await delay(10000)
        writeLog('Install Docker on Control Plane','Process') //DISINI_LOG 3
        await InstallDockerCP();
        await delay(10000)
        writeLog('Install Kubernetes on Control Plane','Process')
        await InstallK8sCP();
        await delay(10000)
        await InitAsCP();
        console.log('end CP process '+ new Date())
        writeLog('Control Plane setup completed','Process') //DISINI_LOG 4
      } 
      if(Wn_ubt_IPs.length!==0) {
        console.log('star WN-U process '+ new Date())
        writeLog('Set up Ubuntu Worker Node','Process') //DISINI_LOG 5
        await DellInventory2()
        await delay(10000)
        await AddInventory2(Wn_ubt_IPs)
        await delay(10000)
        await TestConnectionWnU()
        await delay(10000)
        writeLog('Install Docker on  Ubuntu Worker Node','Process') //DISINI_LOG 5
        await InstallDockerWnU()
        await delay(10000)
        writeLog('Install Kubernetes on  Ubuntu Worker Node','Process') //DISINI_LOG 5
        await InstallK8sWnU()
        console.log('end WN-U process '+ new Date())
        writeLog('Ubuntu Worker Node setup completed','Process') //DISINI_LOG 6
      }
      if(Wn_win_IPs.length!==0){
        console.log('star WN-W process '+ new Date())
        writeLog('Set up Windows Worker Node','Process') //DISINI_LOG 7
        await DellInventory3()
        await delay(10000)
        await AddInventory3(Wn_win_IPs)
        await delay(10000)
        await TestConnectionWnW()
        await delay(10000)
        writeLog('Install Docker on Windows Worker Node','Process') //DISINI_LOG 5
        await InstallDockerWnW()
        await delay(10000)
        writeLog('Install Kubernetes on Windows Worker Node','Process') //DISINI_LOG 5
        await InstallK8sWnW()
        console.log('end WN-W process '+ new Date())
        writeLog('Windows Worker Node setup completed','Process') //DISINI_LOG 8
      }
      console.log('End InventoryProcess '+ new Date())
    } catch (error) {
      console.error('An error occurred during CP installation:', error);
    }
}

//! Ansible Delete Inventory1  (_6)
async function DellInventory1(){
    
    const DeleteInventory1 = '/ansible//inventory1/delete'
    
    try {
      console.log('==Start== Delete Inventory1 (_6)) '+ new Date())
      const response = await AnsibleAPI.get(
        DeleteInventory1, //! endponint
        // JSON.stringify({ip}), //! data diubah jadi bentuk json object
        {
          headers: {
            'Content-Type': 'application/json', //! data yang dikirim bentuk json
          },
        }
      )
      console.log('==End== Delete Inventory1 (_6)) '+ new Date())
    } catch (error) {
      console.error("Error in AnsibleAddKey:", error);
    }
}
  
//! Ansible add Inventory CP (6)
async function AddInventory1(ip){
    const InventoryCP = '/ansible/inventory1/add'

    try {
        console.log('==Start== add ip to invent (6) '+ new Date())
        const response= await AnsibleAPI.post(
        InventoryCP, //! endponint
        JSON.stringify({ip}), //! data diubah jadi bentuk json object
        {
            headers: {
            'Content-Type': 'application/json', //! data yang dikirim bentuk json
            },
        }
        )
        console.log('==End== add ip to invent (6) '+ new Date())
    } catch (error) {
        console.error("Error in AnsibleAddKey:", error);
    }
}
  
//! Ansible Test connection CP (7)
async function TestConnectionCP(){

    const Plabook_0_1 = '/ansible/playbook/cp/connection'

    try {
        console.log('==Start== Test CP connection (7) '+ new Date())
        const response = await AnsibleAPI.get(
        Plabook_0_1, //! endponint
        // JSON.stringify({ip}), //! data diubah jadi bentuk json object
        {
            headers: {
            'Content-Type': 'application/json', //! data yang dikirim bentuk json
            },
        }
        )
        console.log('==End== Test CP connection (7) '+ new Date())
    } catch (error) {
        console.error("Error in AnsibleAddKey:", error);
    }
}
  
//! Ansible Install Docker CP (8)
async function InstallDockerCP(){

    const installDocker = '/ansible/playbook/cp/i-dkr'

    try {
        console.log('==Start== Install Docker (8) ' + new Date());
        const response = await AnsibleAPI.get(installDocker, {
          headers: {
            'Content-Type': 'application/json',
          },
        });
        console.log('==End== Install Docker (8) ' + new Date());
        return response.data;
    } catch (error) {
        console.error("Error in InstallDockerCP:", error);
    }
}
  
//! Ansible Install K8s CP (9)
async function InstallK8sCP(){

    const installK8s = '/ansible/playbook/cp/i-k8s'

    try {
        console.log('==Start== Install K8s (9) '+ new Date())
        const response = await AnsibleAPI.get(
        installK8s, //! endponint
        // JSON.stringify({ip}), //! data diubah jadi bentuk json object
        {
            headers: {
            'Content-Type': 'application/json', //! data yang dikirim bentuk json
            },
        }
        )
        console.log('==End== Install K8s (9) '+ new Date())
    } catch (error) {
        console.error("Error in AnsibleAddKey:", error);
    }
}
  
//! Ansible init as CP (10)
async function InitAsCP(){

    const initAsCP = '/ansible/playbook/cp/s-cp'

    try {
        console.log('==Start== Init as CP (10) '+ new Date())
        const response = await AnsibleAPI.get(
        initAsCP, //! endponint
        // JSON.stringify({ip}), //! data diubah jadi bentuk json object
        {
            headers: {
            'Content-Type': 'application/json', //! data yang dikirim bentuk json
            },
        }
        )
        console.log('==End== Init as CP (10) '+ new Date())
    } catch (error) {
        console.error("Error in AnsibleAddKey:", error);
    }
}
  
// =============== WORKER NODE UBUNTU =================
//! Ansible Delete Inventory2  (_11)
async function DellInventory2(){

    const DeleteInventory2 = '/ansible//inventory2/delete'

    try {
        console.log('== Start== Delete Inventory2 (_11)) '+ new Date())
        const response = await AnsibleAPI.get(
        DeleteInventory2, //! endponint
        // JSON.stringify({ip}), //! data diubah jadi bentuk json object
        {
            headers: {
            'Content-Type': 'application/json', //! data yang dikirim bentuk json
            },
        }
        )
        console.log('== End== Delete Inventory2 (_11)) '+ new Date())
    } catch (error) {
        console.error("Error in AnsibleAddKey:", error);
    }
}
  
//! Ansible add Inventory WN-U (11)
async function AddInventory2(ip){
    const InventoryWnU = '/ansible/inventory2/add'

    try {
        console.log('== Start== add ip to invent WN-U (11) '+ new Date())
        const response= await AnsibleAPI.post(
        InventoryWnU, //! endponint
        JSON.stringify({ip}), //! data diubah jadi bentuk json object
        {
            headers: {
            'Content-Type': 'application/json', //! data yang dikirim bentuk json
            },
        }
        )
        console.log('== End== add ip to invent WN-U (11) '+ new Date())
    } catch (error) {
        console.error("Error in AnsibleAddKey:", error);
    }
}
  
//! Ansible Test connection WN-U (12)
async function TestConnectionWnU(){

    const Plabook_0_2 = '/ansible/playbook/wn-u/connection'

    try {
        console.log('== Start== Test WN-U connection (12) '+ new Date())
        const response = await AnsibleAPI.get(
        Plabook_0_2, //! endponint
        // JSON.stringify({ip}), //! data diubah jadi bentuk json object
        {
            headers: {
            'Content-Type': 'application/json', //! data yang dikirim bentuk json
            },
        }
        )
        console.log('== End== Test WN-U connection (12) '+ new Date())
    } catch (error) {
        console.error("Error in AnsibleAddKey:", error);
    }
}
  
//! Ansible Install Docker WN-U (13)
async function InstallDockerWnU(){

    const installDocker = '/ansible/playbook/wn-u/i-dkr'

    try {
        console.log('== Start== Install Docker WN-U (13) '+ new Date())
        const response = await AnsibleAPI.get(
        installDocker, //! endponint
        // JSON.stringify({ip}), //! data diubah jadi bentuk json object
        {
            headers: {
            'Content-Type': 'application/json', //! data yang dikirim bentuk json
            },
        }
        )
        console.log('== End== Install Docker WN-U (13) '+ new Date())
    } catch (error) {
        console.error("Error in AnsibleAddKey:", error);
    }
}
  
//! Ansible Install K8s WN-U (14)
async function InstallK8sWnU(){

    const installK8s = '/ansible/playbook/wn-u/i-k8s'

    try {
        console.log('== Start== Install K8s WN-U 14) '+ new Date())
        const response = await AnsibleAPI.get(
        installK8s, //! endponint
        // JSON.stringify({ip}), //! data diubah jadi bentuk json object
        {
            headers: {
            'Content-Type': 'application/json', //! data yang dikirim bentuk json
            },
        }
        )
        console.log('== End== Install K8s WN-U 14) '+ new Date())
    } catch (error) {
        console.error("Error in AnsibleAddKey:", error);
    }
}
  
// =============== WORKER NODE WINDOWS =================
//! Ansible Delete Inventory2  (_15)
async function DellInventory3(){

    const DeleteInventory2 = '/ansible//inventory3/delete'

    try {
        console.log('==Start== Delete Inventory3 (_15)) '+ new Date())
        const response = await AnsibleAPI.get(
        DeleteInventory2, //! endponint
        // JSON.stringify({ip}), //! data diubah jadi bentuk json object
        {
            headers: {
            'Content-Type': 'application/json', //! data yang dikirim bentuk json
            },
        }
        )
        console.log('==End== Delete Inventory3 (_15)) '+ new Date())
    } catch (error) {
        console.error("Error in AnsibleAddKey:", error);
    }
}
  
//! Ansible add Inventory WN-W (15)
async function AddInventory3(ip){
    const InventoryWnW = '/ansible/inventory3/add'

    try {
        console.log('==Start ==add ip to invent WN-W (15) '+ new Date())
        const response= await AnsibleAPI.post(
        InventoryWnW, //! endponint
        JSON.stringify({ip}), //! data diubah jadi bentuk json object
        {
            headers: {
            'Content-Type': 'application/json', //! data yang dikirim bentuk json
            },
        }
        )
        console.log('==End ==add ip to invent WN-W (15) '+ new Date())
    } catch (error) {
        console.error("Error in AnsibleAddKey:", error);
    }
}
  
//! Ansible Test connection WN-W (16)
async function TestConnectionWnW(){

    const Plabook_0_3 = '/ansible/playbook/wn-w/connection'

    try {
        console.log('==Start ==Test WN-W connection (16) '+ new Date())
        const response = await AnsibleAPI.get(
        Plabook_0_3, //! endponint
        // JSON.stringify({ip}), //! data diubah jadi bentuk json object
        {
            headers: {
            'Content-Type': 'application/json', //! data yang dikirim bentuk json
            },
        }
        )
        console.log('==End ==Test WN-W connection (16) '+ new Date())
    } catch (error) {
        console.error("Error in AnsibleAddKey:", error);
    }
}
  
//! Ansible Install Docker WN-W (17)
async function InstallDockerWnW(){

    const installDocker = '/ansible/playbook/wn-w/i-dkr'

    try {
        console.log('==Start ==Install Docker WN-W (17) '+ new Date())
        const response = await AnsibleAPI.get(
        installDocker, //! endponint
        // JSON.stringify({ip}), //! data diubah jadi bentuk json object
        {
            headers: {
            'Content-Type': 'application/json', //! data yang dikirim bentuk json
            },
        }
        )
        console.log('==End ==Install Docker WN-W (17) '+ new Date())
    } catch (error) {
        console.error("Error in AnsibleAddKey:", error);
    }
}
  
//! Ansible Install K8s WN-W (18)
async function InstallK8sWnW(){
    const installK8s = '/ansible/playbook/wn-w/i-k8s'

    try {
        console.log('==Start ==Install K8s WN-W 18) '+ new Date())
        const response = await AnsibleAPI.get(
        installK8s, //! endponint
        // JSON.stringify({ip}), //! data diubah jadi bentuk json object
        {
            headers: {
            'Content-Type': 'application/json', //! data yang dikirim bentuk json
            },
        }
        )
        console.log('==End ==Install K8s WN-W 18) '+ new Date())
    } catch (error) {
        console.error("Error in AnsibleAddKey:", error);
    }
}


function K8smanager(){
    const [logs, setLogs] = useState([]);
    const [vmunrole, setVmunrole] = useState([]);
    const [vmcp, setVmcp] = useState([]);
    const [selectedCP, setSelectedCP] = useState(null);
    const [selectedWorker, setSelectedWorker] = useState([]);
    const [workerNodes, setWorkerNodes] = useState([{ id: uuidv4() }]);
    const [duplicateError, setDuplicateError] = useState("");
    const [k8scluster, setK8scluster] = useState([])

    const addWorkerNode = () => {
        setWorkerNodes([...workerNodes, { id: uuidv4() }]);
    };

    const handleDeleteWorker = (idToDelete) => {
        if (workerNodes.length === 1) return;
        setWorkerNodes((prevNodes) => {
            // Cari index dari worker yang akan dihapus
            const indexToDelete = prevNodes.findIndex((worker) => worker.id === idToDelete);
            
            // Update state selectedWorkers berdasarkan index worker yang dihapus
            setSelectedWorker((prevSelected) => {
            const newSelected = [...prevSelected];
            if (indexToDelete > -1) {
                newSelected.splice(indexToDelete, 1);
            }
            return newSelected;
            });
            
            // Kembalikan array workerNodes tanpa worker yang dihapus
            return prevNodes.filter((worker) => worker.id !== idToDelete);
        });
    };

    useEffect(() => {
        const interval = setInterval(() => {
            GetDeploymentLog().then((result) => {
            if (result.stat === 'success') {
                setLogs(result.data);
            }
            });
        }, 10000); // Cek setiap 5 detik
        
        return () => clearInterval(interval); // Bersihkan interval saat unmount
    }, []);

    useEffect(() => {
        GetVMunRole().then((result) => {
            if (result.stat === 'success') {
                setVmunrole(result.data);

                const ubuntuVMs = result.data.filter(
                    (vm) => vm.os.toLowerCase() === "ubuntu"
                  );
                setVmcp(ubuntuVMs);
            }
        });
    }, []);

    useEffect(() => {
        const interval = setInterval(() => {
            GetK8sClusters().then((result) => {
            if (result.stat === 'success') {
                setK8scluster(result.data);
            }
            });
        }, 10000); // Cek setiap 5 detik
        
        return () => clearInterval(interval); // Bersihkan interval saat unmount
    }, []);

    const optionsCP = vmcp.map((vm) => {
        const displayTitle = vm.title.replace(/_/g, " ");
        const logo = vm.os.toLowerCase() === "ubuntu" ? ubuntuLogo : windowsLogo;
        return {
          value: vm._id,
          label: displayTitle,
          name: vm.name,
          logo: logo,
          displayTitle: displayTitle,
        };
    });

    const optionsWKR = vmunrole.map((vm) => {
        const displayTitle = vm.title.replace(/_/g, " ");
        const logo = vm.os.toLowerCase() === "ubuntu" ? ubuntuLogo : windowsLogo;
        return {
          value: vm._id,
          label: displayTitle,
          name: vm.name,
          logo: logo,
          displayTitle: displayTitle,
        };
    });

    const getSelectedVMs = (submittedData, vmData) =>{
        // Untuk setiap item di submittedData, cari VM di vmData yang memiliki _id sama dengan item.value
        // const selectedVMs = submittedData.map(item => {
        //   return vmData.find(vm => vm._id === item.value);
        // }).filter(vm => vm !== undefined); // Filter untuk menghapus nilai undefined jika tidak ada yang cocok

        const selectedVMs = submittedData.map(item => {
            // Cari VM berdasarkan _id yang sama dengan item.value
            const matchingVM = vmData.find(vm => vm._id === item.value);
            if (matchingVM) {
              // Buat object baru dengan menggabungkan properti dari matchingVM dan properti role dari item
              return { ...matchingVM, role: item.role };
            }
            return null;
          }).filter(vm => vm !== null); // Hapus nilai null jika tidak ditemukan
      
        return selectedVMs;
    }

    const getUbuntuIPv4Address  = (submittedData)=>{
        // Inisialisasi array hasil
        const ubuntuIPs = [];
        
        // Iterasi data yang disubmit
        submittedData.forEach((item) => {
            // Cari VM di vmunrole yang memiliki _id yang sesuai dengan submitted value
            const matchingVM = vmunrole.find(vm => vm._id === item.value);
            // Jika ditemukan dan os-nya "ubuntu" (case insensitive)
            if (matchingVM && matchingVM.os.toLowerCase() === "ubuntu") {
            ubuntuIPs.push(matchingVM.ipv4_address);
            }
        });
        
        return ubuntuIPs;
    }
    
    const addRoles = (selectedCP, selectedWorker) => {
        // Jika selectedCP ada, tambahkan role "ControlPlane"
        const updatedCP = selectedCP ? { ...selectedCP, role: "ControlPlane" } : null;
        
        // Untuk setiap worker di selectedWorker, tambahkan role "WorkerNode"
        const updatedWorker = selectedWorker.map((worker) => ({
          ...worker,
          role: "WorkerNode",
        }));
        
        return { updatedCP, updatedWorker };
    }

    const transformSubmittedData = (dataArray)=>{
        return dataArray.reduce((acc, cur) => {
          acc[cur.title] = {
            role: cur.role,
            os: cur.os,
            ip: cur.ipv4_address
          };
          return acc;
        }, {});
    }
    const transformCluster = (dataArray)=>{
        // Cari VM dengan role "ControlPlane"
        const cp = dataArray.find(item => item.role === "ControlPlane");
        if (!cp) {
            console.error("ControlPlane tidak ditemukan!");
            return null;
        }
        
        // Ubah title control plane agar underscore diganti spasi
        const cpName = cp.title.replace(/_/g, " ");
        
        // Filter worker nodes hanya dengan role "WorkerNode"
        const workers = dataArray.filter(item => item.role === "WorkerNode");
        
        // Map children dengan menggunakan title worker (dengan underscore diganti spasi)
        const children = workers.map((worker, index) => ({
            role: `Worker Node ${index + 1}`,
            name: worker.title.replace(/_/g, " ")
        }));
        
        // Kembalikan objek cluster baru
        return {
            role: cp.role, // "ControlPlane"
            name: cpName,  // misalnya "Virtual Machine 1"
            children: children, // hanya VM dengan role WorkerNode
            clusterName: "cluster-"+(k8scluster.length+1)  
        };
      }

    const handleSubmit = async (e) => {
        e.preventDefault();
        const vmAddRole = addRoles(selectedCP,selectedWorker)
        const allData = [vmAddRole.updatedCP, ...vmAddRole.updatedWorker];
        const duplicates = findDuplicateValues(allData);

        if (duplicates.length === 0) {
            writeLog('Start creating Kubernetes Cluster','Start') //DISINI_LOG 1
            
            const raw_infoHost = getSelectedVMs(allData,vmunrole)
            const listIP = getUbuntuIPv4Address(raw_infoHost)
            const infoHost = transformSubmittedData(raw_infoHost)

            setDuplicateError("");
            setSelectedCP(null)
            setSelectedWorker([])
            setWorkerNodes([{ id: uuidv4() }])

            await updateVMRole(raw_infoHost)
            await AnsibleDelKey(listIP)
            await InventoryProcess(infoHost);
            writeLog('Kubernetes Cluster creation completed','Finished') //DISINI_LOG 9
            
            const transformedCluster = transformCluster(raw_infoHost)
            await addK8sCluster(transformedCluster)
        } else {
            setDuplicateError(`Duplicate found in: ${duplicates.join(", ")}`);
        }
    };
    
    return(
        <>
            <div style={{ textAlign: "center" }}>
                <div
                    style={{
                    display: "inline-block",
                    fontSize: "1.3rem",
                    background: "#FF8383",
                    padding: "0.5rem",
                    borderRadius: "10px",
                    fontWeight:"bold"
                    }}
                >
                    Kubernetes Manager
                </div>
            </div>

            <div className="d-flex justify-content-center" style={{marginTop:".2rem",marginBottom:".5rem"}}>
                <button className="btn" style={{ backgroundColor: "#AEEA94", color: "black", fontWeight:"bold", border:"2px solid black"}} onClick={addWorkerNode}>
                    Add Worker Node
                </button>
            </div>
 
            <form  onSubmit={handleSubmit}>
                {/* button */}
                <div className="d-flex justify-content-center" style={{marginTop:".2rem",marginBottom:".5rem",marginRight:"1rem"}}>
                    <button type="submit" className="btn btn-primary ms-3" style={{ backgroundColor: "#77CDFF", color: "black", fontWeight:"bold", border:"2px solid black" }}>
                        Build K8s Cluster
                    </button>
                </div>

                {duplicateError && (
                    <div className="alert alert-danger mt-2">
                    {duplicateError}
                    </div>
                )}
                {/* Control Plane */}
                <div className="d-flex justify-content-center" style={{marginTop:".2rem",marginBottom:".5rem",marginRight:"1rem"}}>
                    <div className="d-flex" style={{ marginBottom: ".2rem" }}>
                        <label className="form-label me-2 nowrap">Control Plane</label>
                        <div style={{ width: "22rem"}}>
                            <VMCP options={optionsCP} onChange={setSelectedCP} value={selectedCP} />
                        </div>
                    </div>
                </div>
                
                {/* Worker Nodes */}
                {workerNodes.map((node, index) => (
                    <div
                        key={node.id}
                        className="d-flex justify-content-center align-items-center"
                        style={{ marginTop: ".2rem", marginBottom: ".5rem", marginLeft: "0.5rem" }}
                    >
                        <div className="d-flex align-items-center" style={{ marginBottom: ".2rem" }}>
                            <label className="form-label me-2 nowrap">Worker Node {index + 1}</label>
                            <div style={{ width: "20rem" }}>
                                <VMWorker
                                    options={optionsWKR}
                                    onChange={(value) => {
                                        setSelectedWorker((prev) => {
                                            const newValues = [...prev];
                                            newValues[index] = value;
                                            return newValues;
                                        });
                                    }}
                                />
                            </div>
                        </div>
                        {/* Tombol Delete di samping VMWorker */}
                        <button
                        type="button"
                        className="btn btn-danger ms-2"
                        onClick={() => handleDeleteWorker(node.id)}
                        style={{ backgroundColor: "#EF5A6F", color: "black" }}
                        disabled={index === 0}
                        >
                            Delete
                        </button>
                    </div>
                ))}
            </form>
            <hr/>
            {/* STRUCTURE */}
            <div style={{ textAlign: "center" }}>
                <div
                    style={{
                    display: "inline-block",
                    fontSize: "1.3rem",
                    background: "#E7FBB4",
                    padding: "0.5rem",
                    borderRadius: "10px",
                    fontWeight:"bold"
                    }}
                >
                    K8s Cluster Structure
                </div>
            </div>
            
            <div className="container" style={{marginTop:".7rem"}}>
                <div className="row d-flex justify-content-center">
                    {k8scluster.map((cluster) => (
                    <div key={cluster._id} className="col-md-3">
                        <div
                        className="card"
                        style={{
                            border: "1px solid #ccc",
                            borderRadius: "8px",
                            width:"20rem",
                            height:"18rem",
                            boxShadow: "0 2px 5px rgba(0,0,0,0.1)",
                        }}
                        >
                        <div className="card-body">
                        {/* <h5 className="card-title text-center">{cluster.clusterName}</h5> */}
                            <p className="card-text">
                                <strong className="vm-label">Control Plane:</strong> {cluster.name}
                            </p>
                            {cluster.children && cluster.children.length > 0 && (
                            <>
                                <h6 className="vm-label">Worker Nodes:</h6>
                                <ul className="list-group list-group-flush">
                                {cluster.children.map((worker, index) => (
                                    <li key={index} className="list-group-item">
                                    <strong className="vm-label">{worker.role}: </strong> {worker.name} 
                                    </li>
                                ))}
                                </ul>
                            </>
                            )}
                        </div>
                        </div>
                    </div>
                    ))}
                </div>
            </div>

            <hr/>
            {/* HISTORY */}
            <div style={{ textAlign: "center" }}>
                <div
                    style={{
                    display: "inline-block",
                    fontSize: "1.3rem",
                    background: "#E7FBB4",
                    padding: "0.5rem",
                    borderRadius: "10px",
                    fontWeight:"bold"
                    }}
                >
                    K8s Deployment Log
                </div>
            </div>
            
            <div className="d-flex justify-content-center" style={{marginTop:"1rem",marginBottom:"2rem"}}>
                <table className="min-w-full table-brdr text-sm text-center" >
                    <thead className="bg-gray-200">
                    <tr>
                        <th className="px-4 py-2 table-brdr">Status</th>
                        <th className="px-4 py-2 table-brdr">Message</th>
                        <th className="px-4 py-2 table-brdr">Datetime</th>
                    </tr>
                    </thead>
                    <tbody className="table-brdr">
                    {logs.map((log) => (
                        <tr
                        key={log._id}
                        className={
                        log.status?.toLowerCase() === "start"
                            ? "row-start"
                            : log.status?.toLowerCase() === "process"
                            ? "row-process"
                            : log.status?.toLowerCase() === "finished"
                            ? "row-finished"
                            : log.status?.toLowerCase() === "error"
                            ? "row-error"
                            :""
                        }
                    >
                        <td className="px-4 py-2 table-brdr">{log.status}</td>
                        <td className="px-4 py-2 table-brdr">{log.msg}</td>
                        <td className="px-4 py-2 table-brdr">{log.datetime}</td>
                        </tr>
                    ))}
                    </tbody>
                </table>
            </div>
        </>
    )
}

export default K8smanager