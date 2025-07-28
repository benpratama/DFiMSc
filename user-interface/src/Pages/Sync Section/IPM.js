import React, {useState, useEffect} from 'react';
import '../../App.css';

import {BackendAPI } from '../../axios';

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
      const raw_type = card.type;
      if (!raw_type) return; 
      if(!card.imageBase || !card.port)return

      const output = {};
  
      // Salin properti yang umum (name, ipv4, dns, dll.)
      if (card.imageBase) {
        output.imageBase = card.imageBase;
      }
      if (card.port) {
        // Ubah string menjadi array dengan memisahkan berdasarkan koma
        output.port = card.port.split(",").map(s => s.trim());
      }
  
      // Masukkan hasil transformasi ke objek result dengan key berupa title
    //   const title = raw_title.replaceAll(" ", "_");
      result[raw_type] = output;
    });
  
    return result;
}

function checkDuplicateCardTypes(data) {
    // Ambil tipe dari setiap card berdasarkan key "card[i].type"
    const cardTypes = {};
    Object.keys(data).forEach(key => {
      const match = key.match(/^card\[(\d+)\]\.type$/);
      if (match) {
        const index = match[1];
        cardTypes[index] = data[key];
      }
    });
  
    // Hitung berapa kali setiap tipe muncul
    const typeCounts = {};
    for (const index in cardTypes) {
      const type = cardTypes[index];
      if (!typeCounts[type]) {
        typeCounts[type] = [];
      }
      typeCounts[type].push(index);
    }
  
    // Filter tipe yang muncul lebih dari sekali
    const duplicates = [];
    for (const type in typeCounts) {
      if (typeCounts[type].length > 1) {
        duplicates.push('Duplicate found in '+type)
      }
    }

    return duplicates;
}

function uploadDataDocker(data){

}

//!! FUNCTION BACKEND (GET logs)
async function GetLogs() {
    const endpoint = '/appmanager/logs';
    try {
      const response = await BackendAPI.get(endpoint, {
        headers: {
          'Content-Type': 'application/json', 
        },
      });
  
      return response.data;
    } catch (error) {
      console.error("Error in GetDeploymentLog:", error);
      return { stat: 'failed', data: [] }; // fallback
    }
}

//!! FUNCTION BACKEND (GET last Commit)
async function GetLastCommit() {
    const endpoint = '/appmanager/git-log';
    try {
      const response = await BackendAPI.get(endpoint, {
        headers: {
          'Content-Type': 'application/json', 
        },
      });
      
      return response.data;
    } catch (error) {
      console.error("Error in GetDeploymentLog:", error);
      return { stat: 'failed', data: [] }; // fallback
    }
}

function IPM (){
    const [logs, setLogs] = useState([]);
    const [cards, setCards] = useState([]);
    const [errorMessages, setErrorMessages] = useState([]);
    const dataDockerEndpoint = '/appmanager/generatedf'
    const getInitialFormData = () => {
        const initialData = {};
        cards.forEach((card, index) => {
          initialData[`card[${index}].title`] = card.title;
        });
        return initialData;
    };

    const addCard = () => {
        const newCardIndex = cards.length ;
        const newCard = {
          title: `DockerFile ${newCardIndex+1}`
        };
        setCards([...cards, newCard]);
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
    const [message,setMessage] = useState('')

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
        const duplicateErrors = checkDuplicateCardTypes(formData)
        if (duplicateErrors.length > 0) {
            setErrorMessages(duplicateErrors);
            return;
          } else {
            setErrorMessages([]); // reset error jika tidak ada duplikasi
            const dataDF = transformData(formData);
            try {
                const response = await BackendAPI.post(
                    dataDockerEndpoint, //endpoint
                    { dataDF, message },
                    { headers: { "Content-Type": "application/json" } }
                );    
                
                if (response.data.stat === "success") {
                    setCards([])
                    setMessage('')
                    setFormData(getInitialFormData());
                }
                
            } catch (error) {
                console.error("Error in handleSubmit:", error);
            }
          }
    };

    //ini yang ambil commit terakhir
    useEffect(() => {
            const interval = setInterval(() => {
                GetLastCommit()
                GetLogs().then((result) => {
                if (result.stat === 'success') {
                  setLogs(result.data);
                }
              });
            }, 10000); // Cek setiap 5 detik
          
            return () => clearInterval(interval); // Bersihkan interval saat unmount
    }, []);

    return(
        <>
            <div className="d-flex justify-content-center" style={{marginTop:".2rem",marginBottom:".5rem"}}>
                <button className="btn" onClick={addCard} style={{ backgroundColor: "#AEEA94", color: "black", fontWeight:"bold", border:"2px solid black" }}>
                    Add New DockerFile
                </button>
            </div>

            <form onSubmit={handleSubmit}>
                {/* button */}
                <div className="d-flex justify-content-center" style={{marginTop:".2rem",marginBottom:".5rem"}}>
                    <button type="submit" className="btn btn-primary ms-3" style={{ backgroundColor: "#77CDFF", color: "black", fontWeight:"bold", border:"2px solid black" }}>
                        Containerize Application
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
                    style={{ display: "flex", flexWrap: "wrap", gap: "1rem", paddingBottom:"1rem" }}
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
                            <h5 className="card-title">{card.title}</h5>

                            {/* TYPE */}
                            <div className=" d-flex" style={{marginBottom:".2rem"}}>
                                <label htmlFor={`input-${index}`} className="form-label nowrap me-2">DockerFile Type</label>
                                <select
                                    id={`type-${index}`}
                                    className="form-select"
                                    name={`card[${index}].type`}
                                    value={formData[`card[${index}].type`] || "none"}
                                    onChange={handleChange}
                                >
                                    <option value="none" disabled>Choose...</option>
                                    <option value="DataProcessing">Data Processing</option>
                                    <option value="GUI">GUI</option>
                                    <option value="ParserService">Parser Service</option>
                                    <option value="Service">Service</option>
                                    <option value="TokenServer">Token Server</option>
                                </select>
                            </div>

                            {/* IMAGE BASE */}
                            <div className=" d-flex" style={{marginBottom:".2rem"}}>
                                <label htmlFor={`input-${index}`} className="form-label nowrap me-2">Image Base</label>
                                <select
                                    id={`imageBase-${index}`}
                                    className="form-select"
                                    name={`card[${index}].imageBase`}
                                    value={formData[`card[${index}].imageBase`] || "none"}
                                    onChange={handleChange}
                                >
                                    <option value="none" disabled>Choose...</option>
                                    <option value="mcr.microsoft.com/windows/servercore:1809">Windows Server Core 1809</option>  
                                </select>
                            </div>

                            {/* DNS SERVER LISTK */}
                            <div className="d-flex" style={{marginBottom:".2rem"}}>
                                <label htmlFor={`input-${index}`} className="form-label nowrap me-2">Port Export</label>
                                <input
                                    type="text"
                                    className="form-control"
                                    id={`input-${index}`}
                                    name={`card[${index}].port`}
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
                {cards.length > 0 && (
                    <div className="mb-3 mx-auto" style={{ width: "30%" }}>
                    <label htmlFor="exampleFormControlTextarea1" className="form-label d-block text-center">Change Log</label>
                    <textarea
                      style={{ border: "3px solid black", textAlign: "center", fontSize:"20px" }}
                      className="form-control"
                      id="exampleFormControlTextarea1"
                      rows="3"
                      value={message}
                      onChange={(e) => setMessage(e.target.value)}
                    ></textarea>
                  </div>
                )}
            </form>

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
                    IPM Containerized Log Activity
                </div>
            </div>

            <div className="d-flex justify-content-center" style={{marginTop:"1rem",marginBottom:"2rem"}}>
                <table className="min-w-full table-brdr text-sm text-center" >
                    <thead className="bg-gray-200">
                    <tr>
                        <th className="px-4 py-2 table-brdr">Message</th>
                        <th className="px-4 py-2 table-brdr">Status</th>
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
                        <td className="px-4 py-2 table-brdr">{log.msg}</td>
                        <td className="px-4 py-2 table-brdr">{log.sts}</td>
                        <td className="px-4 py-2 table-brdr">{log.date}</td>
                        </tr>
                    ))}
                    </tbody>
                </table>
            </div>
        </>
    )
}

export default IPM