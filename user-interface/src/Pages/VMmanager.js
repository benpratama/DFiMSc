import React, { useState, useEffect } from "react";
import '../App.css';
import ubuntuLogo from "../assets/Ubuntu.png";
import windowsLogo from "../assets/Windows.png";

import { TerraformAPI, AnsibleAPI, BackendAPI } from '../axios';

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
      const raw_title = card.title; // Ambil title dari data
      if (!raw_title) return; // Lewati jika tidak ada title
      if(!card.os || !card.name)return

      const output = {};
  
      // Simpan properti OS dalam huruf kecil
      output.os = card.os ? card.os.toLowerCase() : "";
  
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
      const title = raw_title.replaceAll(" ", "_");
      result[title] = output;
    });
  
    return result;
}

function delay(ms) {
    return new Promise(resolve => setTimeout(resolve, ms));
}

//!! FUNCTION BACKEND (WRITE LOG)
async function writeLog(msg,status) {
    const endpoint = "/vmmanager/write";
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
  const endpoint = '/vmmanager/data';
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

//!! FUNCTION BACKEND (WRITE VIRTUAL MACHINES)
async function addVM(vms) {
    const endpoint = "/vmmanager/add";
    try {
        const response = await BackendAPI.post(
        endpoint,
        {
            VMs: vms,
        },
        {
            headers: {
            "Content-Type": "application/json",
            },
        }
        );
        // console.log("VM saved:", response.data);
    } catch (error) {
        console.error("Error Write Log:", error);
    }
}

//!! FUNCTION BACKEND (GET VIRTUAL MACHINES)
async function GetVirtualMachines() {
  const endpoint = '/vmmanager/vms';
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

//!! FUNCTION LANJUTAN
//!! Terraform buat main (2)
async function TerrafromCreateMain(newResources){
    const TMainAdd = "/terraform/tmain/add"
  
    try {
        await writeLog("Create Configuration File", "Process")
    //   console.log("==Start== create Main.tf "+ new Date());
      const response = await TerraformAPI.post(
        TMainAdd,
        JSON.stringify({ newResources }),
        { headers: { 'Content-Type': 'application/json' } }
      );
      if (response.data.status==="success") {
        // console.log("==End== create Main.tf "+ new Date());
        await delay(8000) 
        var infoHost = response.data.infoHost;
        await TerraformCommandApply(newResources, infoHost);
      }
    } catch (error) {
      console.error("Error in TerrafromCreateMain:", error);
    }
}

//!! Terraform exe main (3)
async function TerraformCommandApply(newResources){
    const CommandApply = "/terraform/command/apply"
  
    try {
      await writeLog("Build and setup Virtual Machines", "Process")
    //   console.log("==Start== apply main.tf "+ new Date());
      const response = await TerraformAPI.post(
        CommandApply,
        JSON.stringify({ newResources }),
        { headers: { 'Content-Type': 'application/json' } }
      );
  
      if (response.data.status === "success") {
        // console.log("==End== apply main.tf "+ new Date());
      } else {
        // console.log("Terraform command application failed.");
      }
    } catch (error) {
      console.error("Error in TerraformCommandApply:", error);
    }
}

//!! Terraform delete object in config.jSON
async function TerrafromDeleteVm_config(title){
    const deleteConfig = "/terraform/config/delete";

    try {
        const response = await TerraformAPI.post(
        deleteConfig,
        JSON.stringify({ configName: [title] }),
        { headers: { 'Content-Type': 'application/json' } }
        );
        if (response.data.status === "success") {
        console.log("==Delete VM in config.json " + new Date());
        }
    } catch (error) {
        console.error("Error in TerrafromDeleteVm_config:", error);
    }
}

//!! Terraform exec delete command
async function TerrafromDeleteVm_command(title){
    const deleteConfig = "/terraform/command/destroy";

    try {
        const response = await TerraformAPI.post(
        deleteConfig,
        JSON.stringify({ delResources: [title] }),
        { headers: { 'Content-Type': 'application/json' } }
        );
        if (response.data.status === "success") {
            await delay(3000)
            await TerrafromDeleteVm_mainTF(title)
        }
    } catch (error) {
        console.error("Error in TerrafromDeleteVm_command:", error);
    }
}


//!! Terraform delete vm block in main.tf
async function TerrafromDeleteVm_mainTF(title){
    const deleteConfig = "/terraform/tmain/delete";

    try {
        const response = await TerraformAPI.post(
        deleteConfig,
        JSON.stringify({ delResources: [title] }),
        { headers: { 'Content-Type': 'application/json' } }
        );
        if (response.data.status === "success") {
        console.log("==Delete VM in main.tf " + new Date());
        }
    } catch (error) {
        console.error("Error in TerrafromDeleteVm_mainTF:", error);
    }
}

//!! delete informasi VM di mongodb
async function deleteVM(title) {
    const endpoint = "/vmmanager/delete";
    try {
        const response = await BackendAPI.post(
        endpoint,
        {
            vmTitle: title,
        },
        {
            headers: {
            "Content-Type": "application/json",
            },
        }
        );
        if (response.data.status === "success") {
            console.log("==Delete VM in mongoDB " + new Date());
        }
    } catch (error) {
        console.error("Error delete VM:", error);
    }
}

//! funtion check duplicati
function checkDuplicates(transformed,vms) {
    const errors = [];
    // Iterasi setiap key (title) pada transformed
    for (const title in transformed) {
        if (transformed.hasOwnProperty(title)) {
        const newVM = transformed[title];
        // Field yang akan dicek secara umum
        const fieldsToCheck = ["ipv4_address", "name"];
        
        // Tambahkan field khusus berdasarkan OS
        if (newVM.os && newVM.os.toLowerCase() === "ubuntu") {
            fieldsToCheck.push("host_name");
        } else if (newVM.os && newVM.os.toLowerCase() === "windows") {
            fieldsToCheck.push("computer_name");
        }
        
        // Lakukan pengecekan untuk setiap VM yang sudah ada
        vms.forEach((existingVM) => {
            fieldsToCheck.forEach((field) => {
            if (
                newVM[field] &&
                existingVM[field] &&
                newVM[field] === existingVM[field]
            ) {
                errors.push(
                `Duplicate found for field "${field}" in "${title}": ${newVM[field]}`
                );
            }
            });
        });
        }
    }
    return errors;
}

function updateNewInputKeys(newInput, existingVMs) {
    let maxIndex = 0;
  
    // Cari index maksimum dari existingVMs berdasarkan title
    existingVMs.forEach((vm) => {
      // Misal title: "Virtual_Machine_1" atau "Virtual_Machine_3"
      const parts = vm.title.split("_");
      const num = parseInt(parts[parts.length - 1], 10);
      if (num > maxIndex) {
        maxIndex = num;
      }
    });
  
    // Buat objek baru untuk data input dengan key yang telah diperbarui
    const updatedInput = {};
  
    // Iterasi setiap key di newInput
    Object.keys(newInput).forEach((oldKey) => {
      maxIndex += 1; // increment nomor
      const newKey = `Virtual_Machine_${maxIndex}`;
      updatedInput[newKey] = newInput[oldKey];
    });
  
    return updatedInput;
  }

function VMmanager (){
    const [logs, setLogs] = useState([]);
    const [vms, setVMs] = useState([]);
    const UploadConfig = "/terraform/tmain/upload2"
    const [errorMessages, setErrorMessages] = useState([]);
    const [cards, setCards] = useState([
      ]);

    const getInitialFormData = () => {
        const initialData = {};
        cards.forEach((card, index) => {
          initialData[`card[${index}].title`] = card.title;
        });
        return initialData;
    };

    const deleteCardByIndex = (indexToDelete) => {
        setFormData((prevData) => {
          const newData = {};
          Object.keys(prevData).forEach((key) => {
            // Jika key tidak dimulai dengan `card[2].`, masukkan ke newData
            if (!key.startsWith(`card[${indexToDelete}].`)) {
              newData[key] = prevData[key];
            }
          });
          return newData;
        });
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
          title: `Virtual Machine ${newCardIndex+1}`
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
        deleteCardByIndex(indexToDelete)

        const newCards = cards.filter((_, index) => index !== indexToDelete);
        setCards(newCards);
    };

    const handleSubmit = async (e) => {
        e.preventDefault();
        const transformed = transformData(formData);

        const duplicateErrors = checkDuplicates(transformed, vms);
        if (duplicateErrors.length > 0) {
            setErrorMessages(duplicateErrors);
            return;
          } else {
            setErrorMessages([]); // reset error jika tidak ada duplikasi
            const newVmsData = updateNewInputKeys(transformed,vms)
            try {
                const response = await TerraformAPI.post(
                    UploadConfig, 
                    newVmsData,
                    { headers: { "Content-Type": "application/json" } }
                );
    
                
                if (response.data.status === "success") {
                    setCards([])
                    await delay(5000);
                    await writeLog("Start Build Virtual Machines", "Start")
                    await TerrafromCreateMain(response.data.newResources); // Panggil API selanjutnya
                    addVM(newVmsData)
                    await writeLog("Virtual Machines Finished", "Finished")
                    setFormData(getInitialFormData());
                
                }else{
                  await writeLog("Format Data Error", "Error")
                }
                
            } catch (error) {
                console.error("Error in handleSubmit:", error);
            }
          }
        
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
        const interval = setInterval(() => {
            GetVirtualMachines().then((result) => {
            if (result.stat === 'success') {
                setVMs(result.data);
            }
          });
        }, 10000); // Cek setiap 5 detik
      
        return () => clearInterval(interval); // Bersihkan interval saat unmount
    }, []);

    const handleDeleteVM = async(vmTitle,displayTitle)=>{
        await writeLog("Start destroy "+ displayTitle, "Start")
        TerrafromDeleteVm_config(vmTitle)
        await delay(2000);
        await TerrafromDeleteVm_command(vmTitle)
        await delay(5000);
        await deleteVM(vmTitle)
        await writeLog(+displayTitle+" successfully destroy", "Finished")
    }

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
            Virtual Machine Manager
          </div>
        </div>
        <div className="d-flex justify-content-center" style={{marginTop:".2rem",marginBottom:".5rem"}}>
            <button className="btn" onClick={addCard} style={{ backgroundColor: "#AEEA94", color: "black", fontWeight:"bold", border:"2px solid black" }}>
                Add New VM
            </button>
        </div>
        
        <form onSubmit={handleSubmit}>
          {/* button */}
          <div className="d-flex justify-content-center" style={{marginTop:".2rem",marginBottom:".5rem"}}>
            <button type="submit" className="btn btn-primary ms-3" style={{ backgroundColor: "#77CDFF", color: "black", fontWeight:"bold", border:"2px solid black" }}>
                Build Virtual Machines
            </button>
          </div>
            {errorMessages.length > 0 && (
                <div className="alert alert-danger" role="alert">
                <strong>INFO ERROR</strong>
                <ul>
                    {errorMessages.map((msg, index) => (
                    <li key={index}>{msg}</li>
                    ))}
                </ul>
                </div>
            )}

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

        <hr/>
        {/* LIST OF VMs */}
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
            List of Virtual Machines
          </div>
        </div>

        <div className="card-container d-flex flex-wrap gap-3 justify-content-left" style={{marginTop:".7rem"}}>
            {vms.map((vm) => {
                const displayTitle = vm.title.replace(/_/g, " ");
                const logo = vm.os.toLowerCase() === "ubuntu" ? ubuntuLogo : windowsLogo;
                return (
                <div
                    key={vm._id}
                    className="card"
                    style={{
                    width: "17rem",
                    border: "1px solid #ccc",
                    borderRadius: "8px",
                    boxShadow: "0 2px 5px rgba(0,0,0,0.1)",
                    }}
                >
                    <div className="card-body">
                      <div className="d-flex align-items-center mb-2">
                          <h5 className="card-title mb-0">{displayTitle}</h5>
                          <img
                          src={logo}
                          alt="OS Logo"
                          style={{
                              width: "30px",
                              height: "30px",
                              marginLeft: "0.5rem",
                          }}
                          />
                          
                      </div>
                  
                      <p className="card-text" style={{marginBottom:".3rem"}}>
                          <strong className="vm-label">OS:</strong> {vm.os}
                      </p>
                      <p className="card-text" style={{marginBottom:".3rem"}}>
                          <strong className="vm-label">Name:</strong> {vm.name}
                      </p>
                      <p className="card-text" style={{marginBottom:".3rem"}}>
                          <strong className="vm-label">IPv4 Address:</strong> {vm.ipv4_address}
                      </p>
                      {/* <p className="card-text">
                          <strong>Netmask:</strong> {vm.ipv4_netmask}
                      </p>
                      <p className="card-text">
                          <strong>Gateway:</strong> {vm.ipv4_gateway}
                      </p>
                      <p className="card-text">
                          <strong>DNS Server List:</strong> {vm.dns_server_list.join(", ")}
                      </p> */}
                      {vm.os.toLowerCase() === "ubuntu" ? (
                          <>
                          <p className="card-text" style={{marginBottom:".3rem"}}>
                              <strong className="vm-label">Host Name:</strong> {vm.host_name}
                          </p>
                          <p className="card-text" style={{marginBottom:".3rem"}}>
                              <strong className="vm-label">Domain:</strong> {vm.domain}
                          </p>
                          </>
                      ) : (
                          <>
                          <p className="card-text" style={{marginBottom:"2rem"}}>
                              <strong className="vm-label">Computer Name:</strong> {vm.computer_name}
                          </p>
                          </>
                      )}
                      <div className="d-flex justify-content-center">
                          <button
                            type="button"
                            className="btn btn-danger"
                            onClick={() => handleDeleteVM(vm.title, displayTitle)}
                            disabled={vm.role !== null}
                            style={{ color: "black", background:"#F95454" }}
                          >
                            Delete
                          </button>
                      </div>
                    </div>
                </div>
                );
            })}
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
            Virtual Machine Deployment Log
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


export default VMmanager