import React, { useState, useEffect } from "react";
import '../App.css';

import { TerraformAPI, AnsibleAPI, BackendAPI } from '../axios';

function delay(ms) {
    return new Promise(resolve => setTimeout(resolve, ms));
}

function transformData(flatData) {
    const cardsByIndex = {};
  
    // Mengelompokkan data berdasarkan index card
    Object.keys(flatData).forEach(key => {
      // Ekstrak index dan property menggunakan regex
      const match = key.match(/^card\[(\d+)\]\.(.+)$/);
      if (match) {
        const index = match[1];
        const prop = match[2];
        if (!cardsByIndex[index]) {
          cardsByIndex[index] = {};
        }
        cardsByIndex[index][prop] = flatData[key];
      }
    });
  
    const result = {};
  
    // Proses setiap card yang telah dikelompokkan
    Object.keys(cardsByIndex).forEach(index => {
      const card = cardsByIndex[index];
      const title = card.title; // Ambil title dari data
      if (!title) return; // Lewati jika tidak ada title
      if(!card.os || !card.name)return

      const output = {};
  
      // Simpan properti OS dalam huruf kecil
      output.os = card.os ? card.os.toLowerCase() : "";
    
      // Tentukan role berdasarkan title:
        if(title ==='ConrolPlane'){
            output.role = "ControlPlane";
        }else{
            output.role = "WorkerNode";
        }
  
      // Salin properti yang umum (name, ipv4, dns, dll.)
      if (card.name) {
        output.name = card.name;
      }
      if (card.ipv4_address) {
        output.ipv4_address = card.ipv4_address;

        output.ip_code = Number(card.ipv4_address.slice(-3))
      }
      if (card.ipv4_netmask) {
        // Ubah string netmask menjadi angka
        output.ipv4_netmask = Number(card.ipv4_netmask);
      }
      if (card.ipv4_gateway) {
        output.ipv4_gateway = card.ipv4_gateway;
      }
      if (card.dns_server_list) {
        // Ubah string menjadi array dengan memisahkan berdasarkan koma
        output.dns_server_list = card.dns_server_list.split(",").map(s => s.trim());
      }
  
      // Jika OS adalah Ubuntu, gunakan host_name dan domain
      if (output.os === "ubuntu") {
        if (card.host_name) {
          output.host_name = card.host_name;
        }
        if (card.domain) {
          output.domain = card.domain;
        }
      }
      // Jika OS adalah Windows, ganti host_name menjadi computer_name dan ambil admin_password
      else if (output.os === "windows") {
        if (card.computer_name) {
          output.computer_name = card.computer_name;
        }
        if (card.admin_password) {
          output.admin_password = card.admin_password;
        }
      }
  
      // Masukkan hasil transformasi ke objek result dengan key berupa title
      result[title] = output;
    });
  
    return result;
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
        console.log('TerrafromCreateMain')
        await delay(8000) 
        var infoHost = response.data.infoHost;

        // console.log(infoHost)
        // {
        //   "ConrolPlane": {
        //       "role": "ControlPlane",
        //       "os": "ubuntu",
        //       "ip": "192.168.3.211"
        //   },
        //   "WorkerNode1": {
        //       "role": "WorkerNode",
        //       "os": "windows",
        //       "ip": "192.168.3.212"
        //   }
        // }
        
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


function BuildK8s (){
    const [cards, setCards] = useState([
        { title: "ConrolPlane"},
        { title: "WorkerNode1"},
      ]);

    const getInitialFormData = () => {
        const initialData = {};
        cards.forEach((card, index) => {
          initialData[`card[${index}].title`] = card.title;
        });
        return initialData;
    };

    const [formData, setFormData] = useState(getInitialFormData);

    useEffect(() => {
        setFormData((prevData) => {
            const newData = { ...prevData };
            cards.forEach((card, index) => {
            if (!newData.hasOwnProperty(`card[${index}].title`)) {
                newData[`card[${index}].title`] = card.title;
            }
            });
            return newData;
        });
    }, [cards]);
    

    const addCard = () => {
        const newCardIndex = cards.length ;
        const newCard = {
          title: `WorkerNode ${newCardIndex}`
        };
        setCards([...cards, newCard]);
    };

    const handleChange = (e) => {
        const { name, value } = e.target;
        setFormData((prevData) => ({
          ...prevData,
          [name]: value,
        }));
    };

    const handleDelete = (indexToDelete) => {
        if (cards[indexToDelete].title === "ConrolPlane" || cards[indexToDelete].title === "WorkerNode1" ) {
            return;
        }

        const newCards = cards.filter((_, index) => index !== indexToDelete);
        setCards(newCards);
    };
    
    const UploadConfig = "/terraform/tmain/upload2"

    const handleSubmit = async (e) => {
        e.preventDefault();
        const transformed = transformData(formData);
        try {
            const response = await TerraformAPI.post(
              UploadConfig, 
              transformed,
              { headers: { "Content-Type": "application/json" } }
            );
            
            if (response.data.status === "success") { // Tutup modal jika upload sukses
              await delay(5000);
              console.log("Start creating cluster " + new Date());

              // console.log(response.data.newResources)
              // ['ConrolPlane', 'WorkerNode1']

              await TerrafromCreateMain(response.data.newResources); // Panggil API selanjutnya
              console.log("Cluster finished " + new Date());
            //   setSchemaError(false);
            setFormData(getInitialFormData());
            } else {
            //   setSchemaError(true);
            }
          } catch (error) {
            console.error("Error in handleSubmit:", error);
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
            Kubernetes Cluster Configuration
          </div>
        </div>
        <form onSubmit={handleSubmit}>
          {/* button */}
          <div className="d-flex justify-content-center" style={{marginTop:".2rem",marginBottom:".5rem"}}>
            <button className="btn btn-success" onClick={addCard} style={{ backgroundColor: "#AEEA94", color: "black", fontWeight:"bold", border:"2px solid black" }}>
              Add New VM
            </button>
            <button type="submit" className="btn btn-primary ms-3" style={{ backgroundColor: "#77CDFF", color: "black", fontWeight:"bold", border:"2px solid black" }}>
                Build Kubernetes Cluster
            </button>
          </div>

            <div
                className="card-container"
                style={{ display: "flex", flexWrap: "wrap", gap: "1rem" }}
            >
            {cards.map((card, index) => (
                <div
                key={index}
                className="card"
                style={{
                  border: "3px solid black",
                  width:"25rem"
                }}
                >
                    <div className="card-body">
                        {/* TITLE */}
                        <input
                            type="hidden"
                            className="form-control"
                            id={`name-${index}`}
                            name={`card[${index}].title`}
                            value={card.title}
                        />
                        <h5 className="card-title">{card.title}</h5>

                        {/* OS */}
                        <div className=" d-flex" style={{marginBottom:".2rem"}}>
                            <label htmlFor={`input-${index}`} className="form-label me-2">os</label>
                            <select
                                id={`os-${index}`}
                                className="form-select"
                                name={`card[${index}].os`}
                                value={formData[`card[${index}].os`] || "none"}
                                onChange={handleChange}
                            >
                                {(card.title === "ConrolPlane" ? 
                                    <>
                                        <option value="none" disabled>Choose...</option>
                                        <option value="ubuntu">Ubuntu</option>
                                    </>
                                    :
                                    <>
                                        <option value="none" disabled>Choose...</option>
                                        <option value="ubuntu">Ubuntu</option>
                                        <option value="windows">Windows</option>
                                    </>
                                )}
                            </select>
                        </div>

                        {/* NAME */}
                        <div className="d-flex" style={{marginBottom:".2rem"}}>
                            <label htmlFor={`input-${index}`} className="form-label me-2">name</label>
                            <input
                                type="text"
                                className="form-control"
                                id={`name-${index}`}
                                name={`card[${index}].name`}
                                onChange={handleChange}
                            />
                        </div>

                        {/* HOST NAME/ COMPUTER NAME */}
                        <div className="d-flex" style={{marginBottom:".2rem"}}>
                            {(formData[`card[${index}].os`] === "ubuntu" || formData[`card[${index}].os`] === "none") && (
                                <>
                                    <label htmlFor={`input-${index}`} className="form-label nowrap me-2">Host name</label>
                                    <input
                                    type="text"
                                    className="form-control"
                                    id={`host_name-${index}`}
                                    name={`card[${index}].host_name`}
                                    onChange={handleChange}
                                    />
                                </>
                            )}
                            {(formData[`card[${index}].os`] === "windows")&&(
                                <>
                                    <label htmlFor={`input-${index}`} className="form-label nowrap me-2">Computer name</label>
                                    <input
                                        type="text"
                                        className="form-control"
                                        id={`computer_name-${index}`}
                                        name={`card[${index}].computer_name`}
                                        onChange={handleChange}
                                    />
                                </>
                            )}
                        </div>

                        {/* DOMAIN/ADMIN PASSWORD */}
                        <div className="d-flex" style={{marginBottom:".2rem"}}>
                            {(formData[`card[${index}].os`] === "ubuntu" || formData[`card[${index}].os`] === "none") && (
                                <>
                                    <label htmlFor={`input-${index}`} className="form-label nowrap me-2">Domain</label>
                                    <input
                                        type="text"
                                        className="form-control"
                                        id={`domain-${index}`}
                                        name={`card[${index}].domain`}
                                        onChange={handleChange}
                                    />
                                </>
                            )}
                            {(formData[`card[${index}].os`] === "windows")&&(
                                <>
                                    <label htmlFor={`input-${index}`} className="form-label nowrap me-2">Admin Password</label>
                                    <input
                                        type="text"
                                        className="form-control"
                                        id={`admin_password-${index}`}
                                        name={`card[${index}].admin_password`}
                                        onChange={handleChange}
                                    />
                                </>
                            )}
                        </div>

                        {/* IPV4 ADDRESS */}
                        <div className="d-flex" style={{marginBottom:".2rem"}}>
                            <label htmlFor={`input-${index}`} className="form-label nowrap me-2">ipv4 address</label>
                            <input
                                type="text"
                                className="form-control"
                                id={`input-${index}`}
                                name={`card[${index}].ipv4_address`}
                                onChange={handleChange}
                            />
                        </div>

                        {/* IPV4 NETMASK */}
                        <div className="d-flex" style={{marginBottom:".2rem"}}>
                            <label htmlFor={`input-${index}`} className="form-label nowrap me-2">ipv4 netmask</label>
                            <input
                                type="text"
                                className="form-control"
                                id={`input-${index}`}
                                name={`card[${index}].ipv4_netmask`}
                                onChange={handleChange}
                            />
                        </div>

                        {/* IPV4 GATEWAY */}
                        <div className="d-flex" style={{marginBottom:".2rem"}}>
                            <label htmlFor={`input-${index}`} className="form-label nowrap me-2">ipv4 gateway</label>
                            <input
                                type="text"
                                className="form-control"
                                id={`input-${index}`}
                                name={`card[${index}].ipv4_gateway`}
                                onChange={handleChange}
                            />
                        </div>

                        {/* DNS SERVER LISTK */}
                        <div className="d-flex" style={{marginBottom:".2rem"}}>
                            <label htmlFor={`input-${index}`} className="form-label nowrap me-2">dns server list</label>
                            <input
                                type="text"
                                className="form-control"
                                id={`input-${index}`}
                                name={`card[${index}].dns_server_list`}
                                onChange={handleChange}
                            />
                        </div>

                        {/* BTN DELETEK */}
                        <button type="button" className="btn btn-danger" onClick={() => handleDelete(index)} style={{ backgroundColor: "#EF5A6F", color: "black"}}>
                            Delete
                        </button>
                    </div>
                </div>
            ))}
            </div>
        </form>
      </>
    )
}




export default BuildK8s