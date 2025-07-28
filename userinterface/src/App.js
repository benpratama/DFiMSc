import { useState, useRef,useEffect  } from 'react';

import './App.css';
import Button from 'react-bootstrap/Button';
import Modal from 'react-bootstrap/Modal';
import Form from 'react-bootstrap/Form';
import 'bootstrap/dist/css/bootstrap.min.css';
import 'bootstrap-icons/font/bootstrap-icons.css'
import imrc_logo from'./assets/imrc_logo.png'

// API
import { TerraformAPI, AnsibleAPI, BackendAPI } from './axios';

// Page
import Monitoring from "./Pages/Monitoring";
import Appmanager from "./Pages/Appmanager";
import Appcontianer from './Pages/Appcontainer';
import None from "./Pages/Default"
import BuildK8s from "./Pages/Buildk8s"
import VMManager from "./Pages/VMmanager"
import K8sManager from "./Pages/K8smanager"

//!! MODAL UPLOAD
//!! Terraform upload config (1)
function MyVerticallyCenteredModal(props) {

  const UploadConfig = "/terraform/tmain/upload"
  
  const [file, setFile] = useState(null);
  const [schemaError, setSchemaError] = useState(false);
  const fileInputRef = useRef(null)
  

  const handleFileChange = (e) => {
    setFile(e.target.files[0]);
};

  const uploadConfig = async ()=>{
    const formData = new FormData();
    formData.append('file', file); // Make sure 'file' aligns with what your server expects

    try {
      const response = await TerraformAPI.post(
        UploadConfig, formData,
        { headers: { 'Content-Type': 'multipart/form-data' } }
      );
      
      if (response.data.status==="success") {
        props.onHide(); // Close modal on successful upload
        await delay(5000)

        console.log("Start createing cluster "+ new Date());
        await TerrafromCreateMain(response.data.newResources);//untuk jalanin next api
        console.log("Cluster finished "+ new Date());
        setSchemaError(false);
      } else {
        setSchemaError(true);
      }
    } catch (error) {
    }
  }

  const handleClose = () => {
    // Reset error agar hilang ketika modal ditutup
    setSchemaError(false);
    // Panggil fungsi penutup modal (jika ada)
    props.onHide?.();
  };
  
  return (
    <Modal
      {...props}
      size="lg"
      aria-labelledby="contained-modal-title-vcenter"
      centered
    >
      <Modal.Header>
        <Modal.Title id="contained-modal-title-vcenter">
          Upload Cluster JSON File
        </Modal.Title>
        <button
              type="button"
              className="btn-close"
              onClick={handleClose}
            ></button>
      </Modal.Header>
      <Modal.Body>
        {schemaError && (
            <div
              className="modal-body d-flex justify-content-center align-items-center"
              style={{
                height: "15px",
                background: "#FF4545",
                marginBottom: "0.5rem",
                fontSize: "25px",
                fontWeight: "bold",
              }}
            >
              JSON does not match schema
            </div>
          )}
        <div className='d-flex justify-content-between'>
          <div className='ms-2 my-2'>
            <b>Clsuter Config File</b>
          </div>
          <div className='ms-3' style={{width:"70%"}}>
            <Form.Group controlId="formFile" className="mb-3">
              <Form.Control type="file" onChange={handleFileChange} ref={fileInputRef} />
            </Form.Group>
          </div>
        </div>

        {/* <div className='d-flex justify-content-between'>
          <div className='ms-2 my-2'>
            <b>Ansible Config file</b>
          </div>
          <div className='ms-3' style={{width:"70%"}}>
            <Form.Group controlId="formFile" className="mb-3">
              <Form.Control type="file" />
            </Form.Group>
          </div>
        </div> */}
      </Modal.Body>
      <Modal.Footer style={{justifyContent:"center"}}>
        <Button size="lg" style={{color:"white", fontWeight:"bold", background:"#3069de", border:"none"}} onClick={uploadConfig}>Create Kubernetes Cluster</Button>
      </Modal.Footer>
    </Modal>
  );
}

//!! FUNCTION LANJUTAN
//!! Terraform buat main (2)
async function TerrafromCreateMain(newResources){
  const TMainAdd = "/terraform/tmain/add"

  try {
    console.log("==Start== create Main.tf "+ new Date());
    const response = await TerraformAPI.post(
      TMainAdd,
      JSON.stringify({ newResources }),
      { headers: { 'Content-Type': 'application/json' } }
    );
    if (response.data.status==="success") {
      console.log("==End== create Main.tf "+ new Date());
      await delay(8000) 
      var infoHost = response.data.infoHost;
      await TerraformCommandApply(newResources, infoHost);
    }
  } catch (error) {
    console.error("Error in TerraformCommandApply:", error);
  }
}

//!! Terraform exe main (3)
async function TerraformCommandApply(newResources,infoHost){
  const CommandApply = "/terraform/command/apply"
  let listIP = []

  try {
    console.log("==Start== apply main.tf "+ new Date());
    const response = await TerraformAPI.post(
      CommandApply,
      JSON.stringify({ newResources }),
      { headers: { 'Content-Type': 'application/json' } }
    );

    if (response.data.status === "success") {
      console.log("==End== apply main.tf "+ new Date());
      for (const key in infoHost) {
        if (infoHost[key].os === "ubuntu") {
          listIP.push(infoHost[key].ip);
        }
      }
      await delay(240000) //4 menit
      await AnsibleDelKey(listIP);
      await InventoryProcess(infoHost);
    } else {
      console.log("Terraform command application failed.");
    }

    // if (response.data.status === "success") {
    //   console.log('asd')
      // const listIP = infoHost.filter(host => host.os === "ubuntu").map(host => host.ip);
      // // console.log('a mulai');
      // await AnsibleDelKey(listIP);
      // // console.log('b selesai');
      // await InventoryProcess(infoHost);
    // }
  } catch (error) {
    console.error("Error in TerraformCommandApply:", error);
  }
}


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
    console.log("==Start== Delete key "+ new Date());
    const response =  AnsibleAPI.post(
      AddKey, //! endponint
      JSON.stringify({ listIP }), //! data diubah jadi bentuk json object
      { headers: { 'Content-Type': 'application/json' } }
    )
    console.log("==End== Delete key "+ new Date());
  } catch (error) {
    console.error("Error in AnsibleAddKey:", error);
  }

  // AnsibleAPI.post(
  //   AddKey, //! endponint
  //   JSON.stringify({listIP}), //! data diubah jadi bentuk json object
  //   {
  //     headers: {
  //       'Content-Type': 'application/json', //! data yang dikirim bentuk json
  //     },
  //   }
  // ).then( async response => {
  //   console.log(response)
  //   console.log('c kelar')
  // })
}

function delay(ms) {
  return new Promise(resolve => setTimeout(resolve, ms));
}

//! A
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
      await DellInventory1()
      await delay(10000)
      await AddInventory1(CP_IPs);
      await delay(10000)
      await TestConnectionCP();
      await delay(10000)
      await InstallDockerCP();
      await delay(10000)
      await InstallK8sCP();
      await delay(10000)
      await InitAsCP();
      console.log('end CP process '+ new Date())
    } 
    if(Wn_ubt_IPs.length!==0) {
      console.log('star WN-U process '+ new Date())
      await DellInventory2()
      await delay(10000)
      await AddInventory2(Wn_ubt_IPs)
      await delay(10000)
      await TestConnectionWnU()
      await delay(10000)
      await InstallDockerWnU()
      await delay(10000)
      await InstallK8sWnU()
      console.log('end WN-U process '+ new Date())
    }
    if(Wn_win_IPs.length!==0){
      console.log('star WN-W process '+ new Date())
      await DellInventory3()
      await delay(10000)
      await AddInventory3(Wn_win_IPs)
      await delay(10000)
      await TestConnectionWnW()
      await delay(10000)
      await InstallDockerWnW()
      await delay(10000)
      await InstallK8sWnW()
      console.log('end WN-W process '+ new Date())
    }
    console.log('End InventoryProcess '+ new Date())
  } catch (error) {
    console.error('An error occurred during CP installation:', error);
    // Optionally, handle the error, e.g., retry the process, log to a service, etc.
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
    console.log('==Start== Install Docker (8) '+ new Date())
    const response = await AnsibleAPI.get(
      installDocker, //! endponint
      // JSON.stringify({ip}), //! data diubah jadi bentuk json object
      {
        headers: {
          'Content-Type': 'application/json', //! data yang dikirim bentuk json
        },
      }
    )
    console.log('==End== Install Docker (8) '+ new Date())
  } catch (error) {
    console.error("Error in AnsibleAddKey:", error);
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

//! === BACKEND API ===
async function GetConfigInfo (){

  const getConfigInfo = '/ui/config'
  try {
    const response = await BackendAPI.get(
      getConfigInfo, //! endponint
      // JSON.stringify({ip}), //! data diubah jadi bentuk json object
      {
        headers: {
          'Content-Type': 'application/json', //! data yang dikirim bentuk json
        },
      }
    )
    return response.data
  } catch (error) {
    console.error("Error in AnsibleAddKey:", error);
  }
}

function App() {
  const [configStat,setConfigStat] = useState(false); 
  const [activeMenu, setActiveMenu] = useState("none");


  //! ambil 
  useEffect(()=>{
    GetConfigInfo().then (data=>{
      setConfigStat(data.data)
    })    
  },[])

  //! Terraform endpoint
  const DownloadConifg = "/terraform/tmain/download"

  //! Terraform endpoint function
  const downloadConfig= () => {
    TerraformAPI.get(DownloadConifg,{
      responseType: 'blob'
    })
      .then(response => {
        const url = window.URL.createObjectURL(new Blob([response.data]));
        const link = document.createElement('a');
        link.href = url;

        link.setAttribute('download', 'config.json');

        // Append to the document
        document.body.appendChild(link);
        
        // Force download
        link.click();
        
        // Clean up and remove the link
        link.parentNode.removeChild(link);
      })
      .catch(error => {
        console.error('Error downloading config:', error);
      });
  };

  const [modalShow, setModalShow] = useState(false);

  // ini sidebar
  // return (  
  // // Menu
  //   <>
  //     <div className="container-fluid no-gutter" style={{ display: 'flex' }}>
  //       <div className='row' style={{ flex: 1 }}>
  //         <div className='col-auto min-vh-100 d-felx justify-content-between flex-column sidebar' >
  //           <div>
  //             <a className='text-decoration-none text-dark d-felx align-itemcenter ms-3 mt-2'>
  //               <div className='d-flex ms-2'>
  //                 <div>
  //                   <img src={imrc_logo} alt="logo-IM"/>
  //                 </div>
  //                 <div className='mt-2 ms-3'>
  //                   <span className='title' style={{fontSize:"2.5rem", fontWeight:"bold"}}>iMRC</span>
  //                 </div>
  //               </div>
  //             </a>
  //             <hr className='text-secondary'/>
  //             <ul className="nav nav-pills flex-column">
  //                 {/* Monitoring cluster */}
  //                 {/* <li className={`nav-item text-dark fs-4 my-1 item-menu ${activeMenu === "monitoring" ? "active" : ""}`}>
  //                   <a onClick={() => setActiveMenu("monitoring")} className="nav-link text-dark" style={{fontSize:"1.7rem"}} aria-current="page">
  //                     <div className='d-flex'>
  //                       <div style={{fontSize:"2rem"}}>
  //                         <i className='bi-diagram-3-fill'></i>
  //                       </div>
  //                       <div className='ms-3' style={{fontSize:"1.1rem", marginTop:"0.5rem"}}>
  //                         <b>Monitoring Cluster</b>
  //                       </div>
  //                     </div>
  //                   </a>
  //                 </li> */}
  //                 {/* Syncronizer */}
  //                 {/* <li className={`nav-item text-dark fs-4 my-1 item-menu ${activeMenu === "sync" ? "active" : ""}`}>
  //                   <a onClick={() => setActiveMenu("sync")} className="nav-link text-dark" style={{fontSize:"1.7rem"}} aria-current="page">
  //                     <div className='d-flex'>
  //                       <div style={{fontSize:"2rem"}}>
  //                         <i className=' bi bi bi-arrow-repeat'></i>
  //                       </div>
  //                       <div className='ms-3' style={{fontSize:"1.1rem", marginTop:"0.5rem"}}>
  //                         <b>Synchronizer</b>
  //                       </div>
  //                     </div>
  //                   </a>
  //                 </li> */}
  //                 {/* <hr /> */}
  //                 {/* Upload config */}
  //                 <li className="nav-item text-dark fs-4 my-1 item-menu">
  //                   <a onClick={() => setModalShow(true)} className="nav-link text-dark" style={{fontSize:"1.7rem"}} aria-current="page">
  //                     <div className='d-flex'>
  //                       <div style={{fontSize:"2rem"}}>
  //                         <i className=' bi bi-cloud-upload-fill'></i>
  //                       </div>
  //                       <div className='ms-3' style={{fontSize:"1.1rem", marginTop:"0.5rem"}}>
  //                         <b>Upload Config</b>
  //                       </div>
  //                     </div>
  //                   </a>
  //                 </li>
  //                 {/* Download Config */}
  //                 <li className="nav-item text-dark fs-4 my-1 item-menu">
  //                   <a className="nav-link text-dark" style={{fontSize:"1.7rem"}} aria-current="page" onClick={downloadConfig}>
  //                     <div className='d-flex'>
  //                       <div style={{fontSize:"2rem"}}>
  //                         <i className='bi bi-cloud-download-fill'></i>
  //                       </div>
  //                       <div className='ms-3' style={{fontSize:"1.1rem", marginTop:"0.5rem"}}>
  //                         <b>Download Config</b>
  //                       </div>
  //                     </div>
  //                   </a>
  //                 </li>
  //             </ul>
  //           </div>
  //         </div>
  //       </div>
  //       {/* bagian putih */}
  //       <div className='monitoring_sec' style={{ flex: 5, paddingLeft:"1rem", marginTop:"2rem", paddingRight:"1rem"}}>
  //         {/* {configStat === false?(
  //           <div className='noCluster'>
  //             <div className='noClusterText'>
  //                   No Kubernetes Cluster
  //               </div>
  //           </div>
  //         ):(
  //           <Monitoring></Monitoring>
  //         )} */}

  //         {/* Render konten tergantung activeMenu */}
  //         {activeMenu === "none" && <None />}
  //         {activeMenu === "monitoring" && <Monitoring />}
  //         {activeMenu === "sync" && <Sync />}
  //       </div>
  //     </div>

  //     <MyVerticallyCenteredModal
  //       show={modalShow}
  //       onHide={() => setModalShow(false)}
  //     />
  //   </>
    
  // );

  //ini navbar
  return(
    <>
      <nav className="navbar navbar-expand-lg navbar-light" style={{background:" #e3f2fd",padding:"0rem"}}>
        <div className="container-fluid">
          {/* logo */}
          <div className='d-flex ms-2 navbar-brand'>
            <div>
              <img src={imrc_logo} alt="logo-IM" style={{ width: "4rem", height: "auto" }}/>
            </div>
            <div className='mt-2'>
              <span className='title' style={{fontSize:"1.5rem", fontWeight:"bold"}}>iMRC</span>
            </div>
          </div>
          <button className="navbar-toggler" type="button" data-bs-toggle="collapse" data-bs-target="#navbarSupportedContent" aria-controls="navbarSupportedContent" aria-expanded="false" aria-label="Toggle navigation">
            <span className="navbar-toggler-icon"></span>
          </button>
          <div className="collapse navbar-collapse" id="navbarSupportedContent">
            <ul className="navbar-nav me-auto mb-2 mb-lg-0">
              <li className="nav-item" style={{fontSize:"1.5rem", }}>
                <a className="nav-link active" aria-current="page"  href='#' style={{fontWeight:"bold", fontSize:"1.2rem"}} onClick={() => setActiveMenu("vmManager")}>VM Manager</a>
              </li>
              <li className="nav-item" style={{fontSize:"1.5rem", }}>
                <a className="nav-link active" aria-current="page"  href='#' style={{fontWeight:"bold", fontSize:"1.2rem"}} onClick={() => setActiveMenu("k8sManager")}>K8s Manager</a>
              </li>
              <li className="nav-item" style={{fontSize:"1.5rem", }}>
                <a className="nav-link active" aria-current="page"  href='#' style={{fontWeight:"bold", fontSize:"1.2rem"}} onClick={() => setActiveMenu("Appcontainer")}>App Container</a>
              </li>
              {/* <li className="nav-item" style={{fontSize:"1.5rem", }}>
                <a className="nav-link active" aria-current="page" href='#' style={{fontWeight:"bold", fontSize:"1.2rem"}} onClick={() => setActiveMenu("buildK8s")}>Build K8s</a>
              </li> */}
            </ul>
          </div>
        </div>
      </nav>

      <div className='monitoring_sec' style={{ flex: 5, paddingLeft:"1rem", marginTop:".5rem", paddingRight:"1rem"}}>
          {/* {configStat === false?(
            <div className='noCluster'>
              <div className='noClusterText'>
                    No Kubernetes Cluster
                </div>
            </div>
          ):(
            <Monitoring></Monitoring>
          )} */}

          {/* Render konten tergantung activeMenu */}
          {activeMenu === "none" && <None />}
          {activeMenu === "monitoring" && <Monitoring />}
          {activeMenu === "Appcontainer" && <Appcontianer />}
          {/* {activeMenu === "k8sManager" && <BuildK8s />} */}
          {activeMenu === "vmManager" && <VMManager />}
          {activeMenu === "k8sManager" && <K8sManager />}
        </div>
    </>
  )
}

export default App;
