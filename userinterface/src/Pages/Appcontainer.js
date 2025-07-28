import React, { useState, useEffect  } from 'react';
import '../App.css';

import { BackendAPI } from '../axios'

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


const Appcontianer = ()=>{

    const [file, setFile] = useState(null);
    const [status, setStatus] = useState("");
    const [structure, setStructure ] = useState([]);
    const [selectedComponent, setSelectedComponent] = useState(null);
    const [selectedDepthlvl, setSelectedDepthlvl] = useState(null);
    const [textAreas, setTextAreas] = useState([""]); //rootTextAreas
    const [componentInfo, setComponentInfo] = useState({});
    const [componentInherited, setComponentInherited] = useState({});
    const [componentOrder, setComponentOrder] = useState({});
    const [k8scluster, setK8scluster] = useState([])

    const [active, setActive] = useState(null);
    const lightColor = "#C2FFC7";
    const darkColor = "#8FD6A2";

    // select project component
    const handleClick = (componentName,depthlvl) => {
        setSelectedComponent(componentName);
        setSelectedDepthlvl(depthlvl);
        console.log("Clicked component:", componentName,"|",depthlvl);
        // Tambahkan navigasi, detail loader, atau apapun di sini
    };

    // simpan file yang dipilih (select project)
    const handleFileChange = (e) => {
        const selected = e.target.files[0];
        if (!selected) return;
        if (!selected.name.endsWith(".zip")) {
        alert("Hanya file .zip yang diperbolehkan!");
        e.target.value = null;
        return;
        }
        setFile(selected);
        setStatus("");          // reset status
    };

    // Upload file saat tombol Upload ditekan
    const handleUpload = async () => {
        if (!file) {
            alert("Silakan pilih file .zip terlebih dahulu.");
            return;
        }

        // Persiapkan FormData
        const formData = new FormData();
        formData.append("zipFile", file); // sesuaikan nama field di backend
        try {
            // Upload lewat Axios instance
            const response = await BackendAPI.post(
            "/appcontainer/upload",
            formData,
            {
                // biarkan Axios set boundary otomatis
                headers: {
                "Content-Type": "multipart/form-data",
                },
            }
            );

            // Respon sukses
            const data = response.data;
            setStructure(data.structure);
            // setStatus("✅ Upload Successful!");
            console.log("Upload result:", data);
        } catch (error) {
            // Error dari server
            if (error.response) {
            const errMsg = error.response.data?.error || "Unknown error";
            setStatus(`❌ Fail: ${errMsg}`);
            console.error("Server error:", error.response.data);
            } else {
            // Network / timeout / CORS, dll.
            setStatus(`❌ Network error: ${error.message}`);
            console.error("Network error:", error);
            }
        }
    };

// General
    // Tambah satu textarea baru
    const handleAdd = () => {
        setTextAreas([...textAreas, '']);
    };

    // Hapus textarea berdasarkan index
    const handleRemove = (idx) => {
        setTextAreas(textAreas.filter((_, i) => i !== idx));
    };

    // Update isi textarea
    const handleChange = (idx, newVal) => {
        const updated = [...textAreas];
        updated[idx] = newVal;
        setTextAreas(updated);
    };

    // Fungsi util untuk menukar dua elemen pada array
    const swapItems = (fromIdx, toIdx) => {
        const updated = [...textAreas];
        [updated[fromIdx], updated[toIdx]] = [updated[toIdx], updated[fromIdx]];
        setTextAreas(updated);
    };

    // Pindahkan elemen di index idx satu posisi ke atas (jika idx > 0)
    const handleMoveUp = (idx) => {
        if (idx <= 0) return;
        swapItems(idx, idx - 1);
    };

    // Pindahkan elemen di index idx satu posisi ke bawah (jika idx < last)
    const handleMoveDown = (idx) => {
        if (idx >= textAreas.length - 1) return;
        swapItems(idx, idx + 1);
    };

// Detail
    // === 1. Inisialisasi componentInfo ketika `structure` berubah ===
    useEffect(() => {
        // Cari list semua komponen (depthlvl === 1)
        const komponenList = structure
        .filter((item) => item.depthlvl === 1)
        .map((item) => item.path);

        // Buat object awal dengan tiap key = path, value = { textAreas: [""] }
         const initialInfo = {};
        komponenList.forEach((path) => {
        initialInfo[path] = { 
          locals: [],
          port: "",
          endpoint:""
        };
        });
        setComponentInfo(initialInfo);


        // 2. Buat object baru untuk componentInherited
        const initialInherited = {};
        komponenList.forEach((path) => {
            // clone array rootTextAreas
            initialInherited[path] = [...textAreas];
        });

        setComponentInherited(initialInherited);

        // 5.d. Inisialisasi componentOrder: semua inherited masuk dulu, lalu local (local masih kosong)
        const initialOrder = {};
        komponenList.forEach((path) => {
        // Buat entry inherited: id = "in-0", "in-1", dll
        const inhEntries = textAreas.map((_, idx) => ({
            id: `in-${idx}`,
            type: "inherited",
        }));
        initialOrder[path] = inhEntries;
        });
        setComponentOrder(initialOrder);


    }, [structure, textAreas]);
     
     // === 6. Tambah satu TextArea Lokal di satu komponen ===
  const handleAddLocal = (component) => {
    const newId = `loc-${Date.now()}`; // ID unik untuk Local

    // 6.a. Tambah objek { id, value:"" } ke componentInfo[component].locals
    setComponentInfo((prev) => {
      const updated = { ...prev };
      const oldLocals = updated[component]?.locals || [];
      updated[component] = {
        locals: [...oldLocals, { id: newId, value: "" }],
      };
      return updated;
    });

    // 6.b. Tambah entry { id:newId, type:"local" } ke componentOrder[component] di akhir
    setComponentOrder((prev) => {
      const updated = { ...prev };
      const oldOrder = updated[component] || [];
      updated[component] = [
        ...oldOrder,
        { id: newId, type: "local" },
      ];
      return updated;
    });
  };


  // === 7. Hapus satu TextArea Lokal di satu komponen (berdasarkan ID) ===
  const handleRemoveLocal = (component, entryId) => {
    // 7.a. Hapus dari componentInfo[component].locals dengan filter ID
    setComponentInfo((prev) => {
      const updated = { ...prev };
      const oldLocals = updated[component]?.locals || [];
      updated[component] = {
        locals: oldLocals.filter((item) => item.id !== entryId),
      };
      return updated;
    });

    // 7.b. Hapus dari componentOrder[component] entry { id:entryId, type:"local" }
    setComponentOrder((prev) => {
      const updated = { ...prev };
      updated[component] = (updated[component] || []).filter(
        (e) => !(e.id === entryId && e.type === "local")
      );
      return updated;
    });
  };


  // === 8. Ubah isi Local TextArea (berdasarkan ID) ===
  const handleChangeLocalValue = (component, entryId, newVal) => {
    setComponentInfo((prev) => {
      const updated = { ...prev };
      const oldLocals = updated[component]?.locals || [];
      updated[component] = {
        locals: oldLocals.map((item) =>
          item.id === entryId ? { ...item, value: newVal } : item
        ),
      };
      return updated;
    });
  };


  // === 9. Hapus satu TextArea Inherited di satu komponen (berdasarkan index inherited) ===
  const handleRemoveInheritedInComponent = (component, inhIndex) => {
    // 9.a. Hapus string di componentInherited[component][inhIndex]
    setComponentInherited((prev) => {
      const updated = { ...prev };
      const arr = [...updated[component]];
      arr.splice(inhIndex, 1);
      updated[component] = arr;
      return updated;
    });

    // 9.b. Dari componentOrder[component], hapus entry yang id-nya sama "in-{inhIndex}"
    setComponentOrder((prev) => {
      const updated = { ...prev };
      const allInhEntries = (updated[component] || []).filter(
        (e) => e.type === "inherited"
      );
      const toRemoveId = allInhEntries[inhIndex]?.id;
      if (toRemoveId) {
        updated[component] = (updated[component] || []).filter(
          (e) => !(e.id === toRemoveId && e.type === "inherited")
        );
      }
      return updated;
    });
  };


  // === 10. Reorder Local (atas/bawah), melewati inherited dan antar‐Local ===
  const handleMoveLocalUp = (component, entryId) => {
    setComponentOrder((prev) => {
      const updated = { ...prev };
      const arr = [...(updated[component] || [])];
      const idx = arr.findIndex(
        (e) => e.id === entryId && e.type === "local"
      );
      if (idx > 0) {
        [arr[idx - 1], arr[idx]] = [arr[idx], arr[idx - 1]];
      }
      updated[component] = arr;
      return updated;
    });
  };

  const handleMoveLocalDown = (component, entryId) => {
    setComponentOrder((prev) => {
      const updated = { ...prev };
      const arr = [...(updated[component] || [])];
      const idx = arr.findIndex(
        (e) => e.id === entryId && e.type === "local"
      );
      if (idx >= 0 && idx < arr.length - 1) {
        [arr[idx], arr[idx + 1]] = [arr[idx + 1], arr[idx]];
      }
      updated[component] = arr;
      return updated;
    });
  };

  //  // === handleSendJSON ===
  // const handleSendJSON = async () => {
  //   // 1) Ambil nama project dari structure (depthlvl = 0)
  //   const projectName =
  //   structure.find((item) => item.depthlvl === 0)?.path || "";

  //   // 2) Bangun payload JSON, mulai dengan menyisipkan projectName
  //   const payload = {
  //   projectName, // menambahkan informasi nama project
  //   };

  //   // 3) Loop setiap komponen untuk membuat objek { values, port, endpoint }
  // const allComponents = Object.keys(componentOrder);
  // allComponents.forEach((comp) => {
  //   const orderArr = componentOrder[comp] || [];
  //   // a) Susun array values sesuai urutan
  //   const values = orderArr.map((entry) => {
  //     if (entry.type === "inherited") {
  //       const inhIdx = parseInt(entry.id.split("-")[1], 10);
  //       return componentInherited[comp]?.[inhIdx] || "";
  //     } else {
  //       const localObj = (
  //         componentInfo[comp]?.locals || []
  //       ).find((item) => item.id === entry.id);
  //       return localObj?.value || "";
  //     }
  //   });

  //   // b) Ambil port dan endpoint dari state
  //   const portValue = componentInfo[comp]?.port || "";
  //   const endpointValue = componentInfo[comp]?.endpoint || "";

  //   // c) Simpan di payload
  //   payload[comp] = {
  //     values,
  //     port: portValue,
  //     endpoint: endpointValue,
  //   };
  // });

  //   // 2) Kirim ke backend
  //   try {
  //       // Kirim JSON payload ke endpoint /api/generate-dockerfiles
  //       const response = await BackendAPI.post(
  //           "/appcontainer/generate-dockerfiles",
  //           payload,
  //           {
  //           headers: {
  //               "Content-Type": "application/json",
  //           },
  //           }
  //       );

  //       // Respon sukses
  //       const data = response.data;
  //       console.log("Response backend:", data);
  //       alert("Dockerfile berhasil dibuat di server.");
  //   } catch (error) {
  //       // Error dari server (response tersedia)
  //       if (error.response) {
  //           const errMsg = error.response.data?.error || "Unknown error";
  //           alert(`❌ Fail: ${errMsg}`);
  //           console.error("Server error:", error.response.data);
  //       } else {
  //           // Network / timeout / CORS, dll.
  //           alert(`❌ Network error: ${error.message}`);
  //           console.error("Network error:", error);
  //       }
  //   }
  // };

  // Ubah nilai port untuk sebuah komponen
  const handleChangePort = (component, newPort) => {
    setComponentInfo((prev) => {
      const updated = { ...prev };
      updated[component] = {
        ...updated[component],
        port: newPort
      };
      return updated;
    });
  };

  // Ubah nilai endpoint untuk sebuah komponen
  const handleChangeEndpoint = (component, newEndpoint) => {
    setComponentInfo((prev) => {
      const updated = { ...prev };
      updated[component] = {
        ...updated[component],
        endpoint: newEndpoint
      };
      return updated;
    });
  };

//HELM CHART
  const components = structure
    .filter((item) => item.depthlvl === 1)
    .map((item) => item.path);

    // ===== 1. State IMAGE (global) =====
  const [imageRepo, setImageRepo] = useState("");

  // ===== 2. State TAG per-komponen =====
  const [tags, setTags] = useState(
    components.reduce((acc, comp) => {
      acc[comp] = "";
      return acc;
    }, {})
  );

  // ===== 3. State SERVICE per-komponen =====
  const [serviceTypes, setServiceTypes] = useState(
    components.reduce((acc, comp) => {
      acc[comp] = "";
      return acc;
    }, {})
  );
  const [servicePorts, setServicePorts] = useState(
    components.reduce((acc, comp) => {
      acc[comp] = "";
      return acc;
    }, {})
  );
  const [serviceIps, setServiceIps] = useState(
    components.reduce((acc, comp) => {
      acc[comp] = "";
      return acc;
    }, {})
  );

  // ===== 4. State AUTOSCALING per-komponen =====
  const [autoscalingEnabled, setAutoscalingEnabled] = useState(false);
  const [minReplicas, setMinReplicas] = useState(
    components.reduce((acc, comp) => {
      acc[comp] = "";
      return acc;
    }, {})
  );
  const [maxReplicas, setMaxReplicas] = useState(
    components.reduce((acc, comp) => {
      acc[comp] = "";
      return acc;
    }, {})
  );
  const [targetCPU, setTargetCPU] = useState("80"); // shared

  // ===== 5. State VOLUME_HOSTPATH per-komponen =====
  const [volumeHostPaths, setVolumeHostPaths] = useState(
    components.reduce((acc, comp) => {
      acc[comp] = "";
      return acc;
    }, {})
  );
  // Node name (single input, bukan per-komponen)
  const [volumeNode, setVolumeNode] = useState("");

  // ===== 6. State ODBC (dua sub-section: ipmDB & ipmSTDB) =====
  const [dbCDB, setCDB] = useState({
    name: "",
    uid: "",
    pwd: "",
    ip: "",
  });
  const [dbSTDB, setSTDB] = useState({
    name: "",
    uid: "",
    pwd: "",
    ip: "",
  });

  // ===== Handlers per-komponen =====
  const handleTagChange = (comp, value) => {
    setTags((prev) => ({ ...prev, [comp]: value }));
  };
  const handleServiceTypeChange = (comp, value) => {
    setServiceTypes((prev) => ({ ...prev, [comp]: value }));
  };
  const handleServicePortChange = (comp, value) => {
    setServicePorts((prev) => ({ ...prev, [comp]: value }));
  };
  const handleServiceIpChange = (comp, value) => {
    setServiceIps((prev) => ({ ...prev, [comp]: value }));
  };
  const handleMinReplicasChange = (comp, value) => {
    setMinReplicas((prev) => ({ ...prev, [comp]: value }));
  };
  const handleMaxReplicasChange = (comp, value) => {
    setMaxReplicas((prev) => ({ ...prev, [comp]: value }));
  };
  const handleVolumeHostPathChange = (comp, value) => {
    setVolumeHostPaths((prev) => ({ ...prev, [comp]: value }));
  };

  // Handler ODBC ipmDB
  const handleCDBChange = (field, value) => {
    setCDB((prev) => ({ ...prev, [field]: value }));
  };
  // Handler ODBC ipmSTDB
  const handleSTDBChange = (field, value) => {
    setSTDB((prev) => ({ ...prev, [field]: value }));
  };

  // ===== HANDLE SUBMIT =====
  const handleSubmit = (e) => {
    e.preventDefault();

    // 1) Bangun IMAGE object
    const image = {
      repository: imageRepo,
      pullPolicy: "IfNotPresent",
      tag: { ...tags },
    };

    // 2) Bangun SERVICE object per-komponen
    const service = components.reduce((acc, comp) => {
      acc[comp] = {
        type: serviceTypes[comp],
        port: servicePorts[comp],
        ip: serviceIps[comp],
      };
      return acc;
    }, {});

    // 3) Bangun AUTOSCALING object per-komponen
    const autoscaling = components.reduce((acc, comp) => {
      acc[comp] = {
        enabled: autoscalingEnabled,
        minReplicas: minReplicas[comp],
        maxReplicas: maxReplicas[comp],
        targetCPUUtilizationPercentage: targetCPU,
      };
      return acc;
    }, {});

    // 4) Bangun VOLUME object per-komponen, plus node global
    const volume = {
      node: volumeNode,
      hostPath: components.reduce((acc, comp) => {
        acc[comp] = volumeHostPaths[comp];
        return acc;
      }, {}),
    };

    // 5) Bangun ODBC object dua bagian
    const odbc = {
      ipmDB: { type: "sqlserver", ...dbCDB },
      ipmSTDB: { type: "sqlserver", ...dbSTDB },
    };

    // 6) Gabungkan menjadi payload akhir
    const payload = { image, service, autoscaling, volume, odbc };
    console.log("Payload Helm Chart:", payload);
    // Kirim payload ke backend jika perlu…
  };


     // === handleSendJSON ===
  // const handleSendJSON = async () => {
  //   // 1) Ambil nama project dari structure (depthlvl = 0)
  //   const projectName =
  //   structure.find((item) => item.depthlvl === 0)?.path || "";

  //   // 2) Bangun payload JSON, mulai dengan menyisipkan projectName
  //   const payload = {
  //   projectName, // menambahkan informasi nama project
  //   };

  //   // 3) Loop setiap komponen untuk membuat objek { values, port, endpoint }
  // const allComponents = Object.keys(componentOrder);
  // allComponents.forEach((comp) => {
  //   const orderArr = componentOrder[comp] || [];
  //   // a) Susun array values sesuai urutan
  //   const values = orderArr.map((entry) => {
  //     if (entry.type === "inherited") {
  //       const inhIdx = parseInt(entry.id.split("-")[1], 10);
  //       return componentInherited[comp]?.[inhIdx] || "";
  //     } else {
  //       const localObj = (
  //         componentInfo[comp]?.locals || []
  //       ).find((item) => item.id === entry.id);
  //       return localObj?.value || "";
  //     }
  //   });

  //   // b) Ambil port dan endpoint dari state
  //   const portValue = componentInfo[comp]?.port || "";
  //   const endpointValue = componentInfo[comp]?.endpoint || "";

  //   // c) Simpan di payload
  //   payload[comp] = {
  //     values,
  //     port: portValue,
  //     endpoint: endpointValue,
  //   };
  // });

  //   // 2) Kirim ke backend
  //   try {
  //       // Kirim JSON payload ke endpoint /api/generate-dockerfiles
  //       const response = await BackendAPI.post(
  //           "/appcontainer/generate-dockerfiles",
  //           payload,
  //           {
  //           headers: {
  //               "Content-Type": "application/json",
  //           },
  //           }
  //       );

  //       // Respon sukses
  //       const data = response.data;
  //       console.log("Response backend:", data);
  //       alert("Dockerfile berhasil dibuat di server.");
  //   } catch (error) {
  //       // Error dari server (response tersedia)
  //       if (error.response) {
  //           const errMsg = error.response.data?.error || "Unknown error";
  //           alert(`❌ Fail: ${errMsg}`);
  //           console.error("Server error:", error.response.data);
  //       } else {
  //           // Network / timeout / CORS, dll.
  //           alert(`❌ Network error: ${error.message}`);
  //           console.error("Network error:", error);
  //       }
  //   }
  // };

  const handleSendJSON = async () => {
  // 1) Ambil nama project dari structure (depthlvl = 0)
  const projectName =
    structure.find((item) => item.depthlvl === 0)?.path || "";

  // 2) Mulai bangun payload dengan projectName
  const payload = { projectName };

  // === A) Bagian Dockerfile ===
  const allComponents = Object.keys(componentOrder);
  allComponents.forEach((comp) => {
    const orderArr = componentOrder[comp] || [];

    // a) Susun array values sesuai urutan (inherited + local)
    const values = orderArr.map((entry) => {
      if (entry.type === "inherited") {
        const inhIdx = parseInt(entry.id.split("-")[1], 10);
        return componentInherited[comp]?.[inhIdx] || "";
      } else {
        const localObj = (componentInfo[comp]?.locals || []).find(
          (item) => item.id === entry.id
        );
        return localObj?.value || "";
      }
    });

    // b) Ambil port & endpoint
    const portValue = componentInfo[comp]?.port || "";
    const endpointValue = componentInfo[comp]?.endpoint || "";

    // c) Simpan di payload[comp]
    payload[comp] = {
      values,
      port: portValue,
      endpoint: endpointValue,
    };
  });

  // === B) Bagian Helm Chart ===

  // 1) Image
  const image = {
    repository: imageRepo,
    pullPolicy: "IfNotPresent",
    tag: { ...tags },
  };

  // 2) Service per-komponen
  const service = components.reduce((acc, comp) => {
    acc[comp] = {
      type: serviceTypes[comp],
      port: servicePorts[comp],
      ip: serviceIps[comp],
    };
    return acc;
  }, {});

  // 3) Autoscaling per-komponen
  const autoscaling = components.reduce((acc, comp) => {
    acc[comp] = {
      minReplicas: minReplicas[comp],
      maxReplicas: maxReplicas[comp]
    };
    return acc;
  }, {});

  // 4) Volume: global node + hostPath per-komponen
  const volume = {
    node: volumeNode,
    hostPath: components.reduce((acc, comp) => {
      acc[comp] = volumeHostPaths[comp];
      return acc;
    }, {}),
  };

  // 5) ODBC dua sub-section
  const odbc = {
    CDB:  { type: "sqlserver", ...dbCDB },
    STDB:{ type: "sqlserver", ...dbSTDB },
  };

  // 6) Gabungkan Helm ke dalam payload
  payload.helm = { image, service, autoscaling, volume, odbc };

  // === C) Kirim ke backend ===
  try {
    const response = await BackendAPI.post(
      "/appcontainer/generate-dockerfiles",
      payload,
      { headers: { "Content-Type": "application/json" } }
    );
    console.log("Response backend:", response.data);
    alert("Dockerfile & Helm Chart berhasil dikirim ke server.");
  } catch (error) {
    if (error.response) {
      const errMsg = error.response.data?.error || "Unknown error";
      alert(`❌ Fail: ${errMsg}`);
      console.error("Server error:", error.response.data);
    } else {
      alert(`❌ Network error: ${error.message}`);
      console.error("Network error:", error);
    }
  }
};


  useEffect(() => {
    GetK8sClusters()
      .then((result) => {
        if (result.stat === "success") {
          // Ambil array clusters
          const clusters = result.data;

          // Flat-map ke semua children.name
          const childrenNames = clusters.flatMap(cluster =>
            // Pastikan children ada
            Array.isArray(cluster.children)
              ? cluster.children.map(child => child.name)
              : []
          );

          setK8scluster(childrenNames); // ["Virtual Machine 2", "Virtual Machine 3", "Virtual Machine 4"]
        }
      })
      .catch((err) => {
        console.error("Failed to fetch clusters:", err);
      });
  }, []);

    return(
        <>
        <div style={{margin: "1rem"}}>
            <div class="row">
                {/* KOLOM KIRI */}
                <div className="col-sm-3 mx-auto" style={{ border: "1px solid black", textAlign: "center", padding: "1rem" }}>
                    <span style={{ display: "block", fontWeight: "bold", marginBottom: "1rem" }}>
                        Upload IM Project
                    </span>

                    <div className="row mb-3" style={{ alignItems: "center" }}>
                        {/* Kolom input file */}
                        <div className="col">
                            <input className="form-control" type="file" id="formFile" accept=".zip" onChange={handleFileChange} />
                        </div>

                        {/* Kolom tombol upload */}
                        <div className="col-auto">
                            <button className="btn btn-primary" onClick={handleUpload} disabled={!file} style={{
                            marginTop: "0.5rem",
                            backgroundColor: "#8DD8FF", // biru muda
                            color: "#000",             // hitam
                            border: "1px solid #8DD8FF"
                          }}> Upload </button>
                        </div>
                    </div>

                    {status && ( <div style={{ marginTop: "1rem", fontWeight: "bold" }}>{status}</div> )}

                    {structure.length > 0 && (
                        <div style={{ fontFamily: "monospace", marginTop: "1rem", textAlign: "left" }}>
                            {/* Ambil project utama */}
                            <div style={{ display: "flex", alignItems: "center", gap: "0.5rem" }}>
                                <strong>Project Name:</strong>
                                {structure
                                    .filter((item) => item.depthlvl === 0)
                                    .map((comp, idx) => (
                                    <div
                                        key={idx}
                                        onClick={() => handleClick(comp.path, comp.depthlvl)}
                                        style={{
                                        cursor: "pointer",
                                        textDecoration: "underline",
                                        color: selectedComponent === comp.path ? "blue" : "black"
                                        }}
                                    >
                                        {comp.path}
                                    </div>
                                ))}
                            </div>
                            <div style={{ marginTop: "0.5rem" }}>
                                <strong>Project components:</strong>
                                <div style={{ marginLeft: "2rem", marginTop: "0.5rem" }}>
                                {structure
                                    .filter(item => item.depthlvl === 1)
                                    .map((comp, idx) => (
                                    <div
                                        key={idx}
                                        onClick={() => handleClick(comp.path, comp.depthlvl)}
                                        style={{
                                        cursor: "pointer",
                                        textDecoration: "underline",
                                        color: selectedComponent === comp.path ? "blue" : "black"
                                        }}
                                    >
                                        {comp.path}
                                    </div>
                                    ))}
                                </div>
                            </div>
                        </div>
                    )}
                  {structure.length > 0 && (
                    <>
                    <button type="button" onClick={handleSendJSON} className="btn btn-success" style={{ marginTop: "1rem", marginLeft: "0.5rem",
                              backgroundColor: "#C2FFC7", // biru muda
                              color: "#000",             // hitam
                              border: "1px solid #C2FFC7"}} >
                      Generate IM Project Configuration
                    </button>   
                    <button type="button" onClick={handleSendJSON} className="btn btn-success" style={{ marginTop: "1rem", marginLeft: "0.5rem",
                              backgroundColor: "#FF8282", // biru muda
                              color: "#000",             // hitam
                              border: "1px solid #FF8282"}} >
                      Upload to Repository
                    </button>
                    </>  
                  )}
                </div>

                {/* KOLOM KANAN */}
                <div class="col-sm-8 mx-auto" style={{ border: "1px solid black", textAlign: "center", padding: "1rem",maxHeight: "45rem",overflowY: "auto",overflowX: "hidden" }}>
                    {selectedDepthlvl===0 ?
                    <>
                      {/* SETUP BUTTON */}
                      <div style={{textAlign: "center", display: "flex", alignItems: "center", gap: "1rem"}}>
                        <button
                          type="button"
                          onClick={() => setActive("docker")}
                          className="btn"
                          style={{
                            backgroundColor: active === "docker" ? darkColor : lightColor,
                            color: "#000",
                            border: `1px solid ${active === "docker" ? darkColor : lightColor}`,
                            padding: "0.5rem 1rem",
                          }}
                        >
                          Setup Docker
                        </button>

                        <button
                          type="button"
                          onClick={() => setActive("helm")}
                          className="btn"
                          style={{
                            backgroundColor: active === "helm" ? darkColor : lightColor,
                            color: "#000",
                            border: `1px solid ${active === "helm" ? darkColor : lightColor}`,
                            padding: "0.5rem 1rem",
                          }}
                        >
                          Setup Helm
                        </button>
                      </div>
                      {active==='docker'?
                        // DOCKER
                        <> 
                          {/* DATABASE */}
                          <span style={{ display: "block", fontWeight: "bold", marginBottom: "1rem" }}>
                              {structure.find(s => s.type === "mainProject")?.path || "N/A"} General Configuration
                          </span>
                          <div className="d-flex justify-content-between" style={{ gap: "1rem" }}>
                            {/* Box 1: CDB */}
                            <div
                              id="box1"
                              style={{
                                flex: 1,
                                border: "1px solid #ccc",
                                padding: "1rem",
                                borderRadius: "4px",
                              }}
                            >
                              <label style={{ fontWeight: "bold" }}>CDB</label>
                              <div
                                style={{
                                  display: "grid",
                                  gridTemplateColumns: "1fr 1fr",
                                  gap: "0.5rem",
                                }}
                              >
                                {/* DNS → name */}
                                <div>
                                  <label htmlFor="dns_CDB" style={{ fontWeight: "bold", display: "block" }}>
                                    DNS
                                  </label>
                                  <input
                                    id="dns_CDB"
                                    name="dns_CDB"
                                    type="text"
                                    className="form-control mt-1"
                                    placeholder="Input DNS"
                                    value={dbCDB.name}
                                    onChange={(e) => handleCDBChange("name", e.target.value)}
                                  />
                                </div>

                                {/* IP → ip */}
                                <div>
                                  <label htmlFor="ip_CDB" style={{ fontWeight: "bold", display: "block" }}>
                                    IP
                                  </label>
                                  <input
                                    id="ip_CDB"
                                    name="ip_CDB"
                                    type="text"
                                    className="form-control mt-1"
                                    placeholder="Input IP"
                                    value={dbCDB.ip}
                                    onChange={(e) => handleCDBChange("ip", e.target.value)}
                                  />
                                </div>

                                {/* PWD → pwd */}
                                <div>
                                  <label htmlFor="pwd_CDB" style={{ fontWeight: "bold", display: "block" }}>
                                    PWD
                                  </label>
                                  <input
                                    id="pwd_CDB"
                                    name="pwd_CDB"
                                    type="password"
                                    className="form-control mt-1"
                                    placeholder="Input Password"
                                    value={dbCDB.pwd}
                                    onChange={(e) => handleCDBChange("pwd", e.target.value)}
                                  />
                                </div>

                                {/* UID → uid */}
                                <div>
                                  <label htmlFor="uid_CDB" style={{ fontWeight: "bold", display: "block" }}>
                                    UID
                                  </label>
                                  <input
                                    id="uid_CDB"
                                    name="uid_CDB"
                                    type="text"
                                    className="form-control mt-1"
                                    placeholder="Input UID"
                                    value={dbCDB.uid}
                                    onChange={(e) => handleCDBChange("uid", e.target.value)}
                                  />
                                </div>
                              </div>
                            </div>

                            {/* Box 2: STDB */}
                            <div
                              id="box2"
                              style={{
                                flex: 1,
                                border: "1px solid #ccc",
                                padding: "1rem",
                                borderRadius: "4px",
                              }}
                            >
                              <label style={{ fontWeight: "bold" }}>STDB</label>
                              <div
                                style={{
                                  display: "grid",
                                  gridTemplateColumns: "1fr 1fr",
                                  gap: "0.5rem",
                                }}
                              >
                                {/* DNS → name */}
                                <div>
                                  <label htmlFor="dns_STDB" style={{ fontWeight: "bold", display: "block" }}>
                                    DNS
                                  </label>
                                  <input
                                    id="dns_STDB"
                                    name="dns_STDB"
                                    type="text"
                                    className="form-control mt-1"
                                    placeholder="Input DNS"
                                    value={dbSTDB.name}
                                    onChange={(e) => handleSTDBChange("name", e.target.value)}
                                  />
                                </div>

                                {/* IP → ip */}
                                <div>
                                  <label htmlFor="ip_STDB" style={{ fontWeight: "bold", display: "block" }}>
                                    IP
                                  </label>
                                  <input
                                    id="ip_STDB"
                                    name="ip_STDB"
                                    type="text"
                                    className="form-control mt-1"
                                    placeholder="Input IP"
                                    value={dbSTDB.ip}
                                    onChange={(e) => handleSTDBChange("ip", e.target.value)}
                                  />
                                </div>

                                {/* PWD → pwd */}
                                <div>
                                  <label htmlFor="pwd_STDB" style={{ fontWeight: "bold", display: "block" }}>
                                    PWD
                                  </label>
                                  <input
                                    id="pwd_STDB"
                                    name="pwd_STDB"
                                    type="password"
                                    className="form-control mt-1"
                                    placeholder="Input Password"
                                    value={dbSTDB.pwd}
                                    onChange={(e) => handleSTDBChange("pwd", e.target.value)}
                                  />
                                </div>

                                {/* UID → uid */}
                                <div>
                                  <label htmlFor="uid_STDB" style={{ fontWeight: "bold", display: "block" }}>
                                    UID
                                  </label>
                                  <input
                                    id="uid_STDB"
                                    name="uid_STDB"
                                    type="text"
                                    className="form-control mt-1"
                                    placeholder="Input UID"
                                    value={dbSTDB.uid}
                                    onChange={(e) => handleSTDBChange("uid", e.target.value)}
                                  />
                                </div>
                              </div>
                            </div>
                          </div>
                      <hr/>
                        {/* DOCKERFILE */}
                        <span style={{ display: "block", fontWeight: "bold", marginBottom: "1rem" }}>
                            {structure.find(s => s.type === "mainProject")?.path || "N/A"} General DockerFile Setup
                        </span>
                        {textAreas.map((value, idx) => (
                        <div
                          key={idx}
                          style={{
                            position: "relative",
                            marginBottom: "1rem",
                            padding: "0.75rem",
                            border: "1px solid #ccc",
                            borderRadius: "5px",
                            backgroundColor: "#fafafa",
                          }}
                        >
                          {/* Tombol Move Up, Move Down & Remove */}
                        <div
                          style={{
                            position: "absolute",
                            top: "8px",
                            right: "8px",
                            display: "flex",
                            gap: "0.4rem",
                          }}
                        >
                          {/* Tombol Up */}
                          {idx > 0 && (
                            <button
                              type="button"
                              onClick={() => handleMoveUp(idx)}
                              className="btn btn-sm"
                              style={{
                                backgroundColor: "#6c757d", /* abu-abu gelap */
                                color: "#fff",
                                padding: "0.25rem 0.5rem",
                                fontSize: "0.85rem",
                                lineHeight: 1,
                                border: "none",
                              }}
                            >
                              ↑
                            </button>
                          )}

                          {/* Tombol Down */}
                          {idx < textAreas.length - 1 && (
                            <button
                              type="button"
                              onClick={() => handleMoveDown(idx)}
                              className="btn btn-sm"
                              style={{
                                backgroundColor: "#6c757d", /* abu-abu gelap */
                                color: "#fff",
                                padding: "0.25rem 0.5rem",
                                fontSize: "0.85rem",
                                lineHeight: 1,
                                border: "none",
                              }}
                            >
                              ↓
                            </button>
                          )}

                          {/* Tombol Remove */}
                          <button
                            type="button"
                            onClick={() => handleRemove(idx)}
                            className="btn btn-sm"
                            style={{
                              backgroundColor: "#dc3545", /* merah */
                              color: "#fff",
                              padding: "0.25rem 0.5rem",
                              fontSize: "0.85rem",
                              lineHeight: 1,
                              border: "none",
                            }}
                          >
                            &times;
                          </button>
                        </div>

                          {/* Textarea */}
                          <textarea
                            value={value}
                            onChange={(e) => handleChange(idx, e.target.value)}
                            rows={3}
                            className="form-control"
                            placeholder={`Input ${idx + 1}`}
                            style={{
                              resize: "vertical",
                              paddingRight: "3rem" /* ruang untuk tombol di kanan atas */,
                            }}
                          />
                        </div>
                        ))}
                        <button
                          type="button"
                          onClick={handleAdd}
                          className="btn"
                          style={{
                            marginTop: "0.5rem",
                            backgroundColor: "#8DD8FF", // biru muda
                            color: "#000",             // hitam
                            border: "1px solid #8DD8FF"
                          }}
                        >
                          Add General DockerFile Setup
                        </button>
                        </>:
                        // HELM
                        <>
                          {/* HELM CHART */}
                          <div style={{ maxWidth: 900, margin: "0 auto" }}>
                            {/* ===== SECTION IMAGE ===== */}
                            <h4>Image</h4>
                            <div className="row align-items-center mb-3">
                              <div className="col-sm-2 text-start">
                                <label
                                  htmlFor="imageRepo"
                                  className="form-label mb-0"
                                  style={{ color: "#000", fontSize: "0.9rem" }}
                                >
                                  Repository
                                </label>
                              </div>
                              <div className="col-sm-10">
                                <input
                                  type="text"
                                  id="imageRepo"
                                  className="form-control"
                                  placeholder="DockerHub/Project"
                                  value={imageRepo}
                                  onChange={(e) => setImageRepo(e.target.value)}
                                  style={{ fontSize: "1rem" }}
                                />
                              </div>
                            </div>
                            <hr />

                            {/* ===== SECTION TAG ===== */}
                            <h4>Image Version </h4>
                            {components.map((comp) => (
                              <div className="row align-items-center mb-3" key={comp}>
                                <div className="col-sm-2 text-start mb-2">
                                  <label
                                    htmlFor={`tag-${comp}`}
                                    className="form-label"
                                    style={{ color: "#000", fontSize: "1rem" }}
                                  >
                                    {comp}
                                  </label>
                                </div>
                                <div className="col-sm-10">
                                  <select
                                    id={`tag-${comp}`}
                                    className="form-select"
                                    style={{ fontSize: "1rem" }}
                                    value={tags[comp]}
                                    onChange={(e) => handleTagChange(comp, e.target.value)}
                                  >
                                    <option value="">— Select Image —</option>
                                    <option value="v1">v1</option>
                                    <option value="v2">v2</option>
                                    <option value="v3">v3</option>
                                    <option value="v4">v4</option>
                                    <option value="latest">latest</option>
                                  </select>
                                </div>
                              </div>
                            ))}

                            <hr />

                            {/* ===== SECTION SERVICE ===== */}
                            <h4>Service</h4>
                            <div className="row mb-3">
                              <div className="col-sm-2 fw-bold text-start" style={{ color: "#000", fontSize: "1.1rem", fontWeight: "600" }}>Component</div>
                              <div className="col-sm-3 fw-bold" style={{ color: "#000", fontSize: "1.1rem", fontWeight: "600" }}>Type</div>
                              <div className="col-sm-3 fw-bold" style={{ color: "#000", fontSize: "1.1rem", fontWeight: "600" }}>Port</div>
                              <div className="col-sm-4 fw-bold" style={{ color: "#000", fontSize: "1.1rem", fontWeight: "600" }}>ip</div>
                            </div>
                            {components.map((comp) => (
                            <div className="row align-items-center mb-3" key={comp}>
                              <div className="col-sm-2 text-start" style={{ color: "#000", fontSize: "1rem" }}>{comp}</div>
                              <div className="col-sm-3">
                                {/* <input
                                  type="text"
                                  className="form-control"
                                  placeholder="ClusterIP/NodePort"
                                  value={serviceTypes[comp]}
                                  onChange={(e) =>
                                    handleServiceTypeChange(comp, e.target.value)
                                  }
                                /> */}
                                <select
                                    className="form-select"
                                    value={serviceTypes[comp]}
                                    onChange={(e) => handleServiceTypeChange(comp, e.target.value)}
                                    style={{ fontSize: "1rem" }}
                                  >
                                    <option value="">-- Select type --</option>
                                    <option value="ClusterIP">ClusterIP</option>
                                    <option value="NodePort">NodePort</option>
                                  </select>
                              </div>
                              <div className="col-sm-3">
                                <input
                                  type="text"
                                  className="form-control"
                                  placeholder="Port"
                                  value={servicePorts[comp]}
                                  onChange={(e) =>
                                    handleServicePortChange(comp, e.target.value)
                                  }
                                />
                              </div>
                              <div className="col-sm-4">
                                <input
                                  type="text"
                                  className="form-control"
                                  placeholder="IP"
                                  value={serviceIps[comp]}
                                  onChange={(e) =>
                                    handleServiceIpChange(comp, e.target.value)
                                  }
                                />
                              </div>
                            </div>
                          ))}

                            <hr />

                            {/* ===== SECTION AUTOSCALING ===== */}
                            <h4>Autoscaling</h4>
                            <div className="row mb-3">
                              <div className="col-sm-4 fw-bold text-start" style={{ color: "#000", fontSize: "1.1rem", fontWeight: "600" }}>Component</div>
                              <div className="col-sm-4 fw-bold" style={{ color: "#000", fontSize: "1.1rem", fontWeight: "600" }}>min Replicas</div>
                              <div className="col-sm-4 fw-bold" style={{ color: "#000", fontSize: "1.1rem", fontWeight: "600" }}>max Replicas</div>
                            </div>
                            {components.map((comp) => (
                              <div className="row align-items-center mb-3" key={comp}>
                                <div className="col-sm-4 text-start" style={{ color: "#000", fontSize: "1rem" }}>{comp}</div>
                                <div className="col-sm-4">
                                  <input
                                    type="number"
                                    className="form-control"
                                    placeholder="Min"
                                    value={minReplicas[comp]}
                                    onChange={(e) => handleMinReplicasChange(comp, e.target.value)}
                                  />
                                </div>
                                <div className="col-sm-4">
                                  <input
                                    type="number"
                                    className="form-control"
                                    placeholder="Max"
                                    value={maxReplicas[comp]}
                                    onChange={(e) => handleMaxReplicasChange(comp, e.target.value)}
                                  />
                                </div>
                              </div>
                            ))}

                            <hr />

                            {/* ===== SECTION VOLUME ===== */}
                            <h4>Volume</h4>

                            {/* Header */}
                            <div className="row mb-3">
                              <div className="col-sm-2 fw-bold text-start" style={{ color: "#000", fontSize: "1.1rem", fontWeight: "600" }}>Component</div>
                              <div className="col-sm-10 fw-bold" style={{ color: "#000", fontSize: "1.1rem", fontWeight: "600" }}>Host Path</div>
                            </div>

                            {components.map((comp) => (
                              <div className="row align-items-center mb-3" key={comp}>
                                <div className="col-sm-2 text-start" style={{ color: "#000", fontSize: "1rem" }}>{comp}</div>
                                <div className="col-sm-10">
                                  <input
                                    type="text"
                                    className="form-control"
                                    placeholder="Input ServiceVolumePath"
                                    value={volumeHostPaths[comp]}
                                    onChange={(e) =>
                                      handleVolumeHostPathChange(comp, e.target.value)
                                    }
                                  />
                                </div>
                              </div>
                            ))}

                            {/* Input node terpisah di bawah tabel */}
                            {/* <div className="row align-items-center mb-3">
                              <div className="col-sm-2 text-start">
                                <label htmlFor="volumeNode" className="form-label" style={{ color: "#000", fontSize: "1rem" }}>
                                  Node
                                </label>
                              </div>
                              <div className="col-sm-10">
                                <input
                                  type="text"
                                  id="volumeNode"
                                  className="form-control"
                                  placeholder="Masukkan WorkernodeName"
                                  value={volumeNode}
                                  onChange={(e) => setVolumeNode(e.target.value)}
                                />
                              </div>
                            </div> */}
                            <div className="row align-items-center mb-3">
                              <div className="col-sm-2 text-start">
                                <label
                                  htmlFor="volumeNode"
                                  className="form-label"
                                  style={{ color: "#000", fontSize: "1rem" }}
                                >
                                  Node
                                </label>
                              </div>
                              <div className="col-sm-10">
                                <select
                                  id="volumeNode"
                                  className="form-select"
                                  style={{ fontSize: "1rem" }}
                                  value={volumeNode}
                                  onChange={(e) => setVolumeNode(e.target.value)}
                                >
                                  <option value="">— Select Worker Node —</option>
                                  {k8scluster.map((nodeName, idx) => (
                                    <option key={idx} value={nodeName}>
                                      {nodeName}
                                    </option>
                                  ))}
                                </select>
                              </div>
                            </div>

                            {/* ===== SUBMIT ===== */}
                            {/* <button
                              type="button"
                              onClick={handleSubmit}
                              className="btn btn-primary"
                            >
                              Generate Helm Chart
                            </button> */}
                          </div>
                        </>
                      }
                      

                    </>:
                    <>
                      {selectedComponent && (
                          <div style={{ border: "1px solid #ccc", padding: "1rem", borderRadius: 4,}}>
                            <h5 style={{ marginTop: 0 }}>
                              <strong>{selectedComponent}</strong> Component Setup
                            </h5>

                            {/* 11.c. Render berdasarkan componentOrder */}
                            {componentOrder[selectedComponent]?.map((entry, idx) => {
                              // Jika tipe "inherited"
                              if (entry.type === "inherited") {
                                // Cari index inherited di array componentInherited
                                // Karena id = "in-0", "in-1", dll → kita parse angka setelah "in-"
                                const inhIdx = parseInt(entry.id.split("-")[1], 10);
                                const value =
                                  componentInherited[selectedComponent]?.[inhIdx] || "";

                                return (
                                  <div
                                    key={entry.id}
                                    style={{
                                      position: "relative",
                                      marginBottom: "1rem",
                                      padding: "0.5rem",
                                      border: "1px dashed #888",
                                      borderRadius: 4,
                                      backgroundColor: "#f5f5f5",
                                    }}
                                  >
                                    <textarea
                                      value={value}
                                      readOnly
                                      rows={2}
                                      className="form-control"
                                    />
                                    <button
                                      type="button"
                                      onClick={() =>
                                        handleRemoveInheritedInComponent(selectedComponent, inhIdx)
                                      }
                                      style={{
                                        position: "absolute",
                                        top: 4,
                                        right: 4,
                                        padding: "0.2rem 0.5rem",
                                        cursor: "pointer",
                                        color: "#fff",
                                        backgroundColor: "#dc3545",
                                        border: "none",
                                        borderRadius: "4px",
                                      }}
                                    >
                                      &times;
                                    </button>
                                  </div>
                                );
                              }

                              // Jika tipe "local"
                              if (entry.type === "local") {
                                // Cari langsung objek local di componentInfo berdasarkan entry.id
                                const localObj = (
                                  componentInfo[selectedComponent]?.locals || []
                                ).find((item) => item.id === entry.id);
                                const value = localObj?.value || "";

                                return (
                                  <div
                                    key={entry.id}
                                    style={{
                                      position: "relative",
                                      marginBottom: "1rem",
                                      padding: "0.5rem",
                                      border: "1px solid #ddd",
                                      borderRadius: 4,
                                      backgroundColor: "#fafafa",
                                    }}
                                  >
                                    <textarea
                                      value={value}
                                      onChange={(e) =>
                                        handleChangeLocalValue(
                                          selectedComponent,
                                          entry.id,
                                          e.target.value
                                        )
                                      }
                                      rows={2}
                                      className="form-control"
                                      style={{ marginBottom: "0.5rem" }}
                                    />

                                    <div
                                      style={{
                                        position: "absolute",
                                        top: 4,
                                        right: 4,
                                        display: "flex",
                                        gap: "0.25rem",
                                      }}
                                    >
                                      {/* Tombol Move Up */}
                                      <button
                                        type="button"
                                        onClick={() =>
                                          handleMoveLocalUp(selectedComponent, entry.id)
                                        }
                                        className="btn btn-sm"
                                        style={{
                                          backgroundColor: "#6c757d", /* abu-abu gelap */
                                          color: "#fff",
                                          padding: "0.25rem 0.5rem",
                                          fontSize: "0.85rem",
                                          lineHeight: 1,
                                          border: "none",
                                          cursor: idx === 0 ? "not-allowed" : "pointer",
                                        }}
                                        disabled={idx === 0}
                                      >
                                        ↑
                                      </button>

                                      {/* Tombol Move Down */}
                                      <button
                                          type="button"
                                          onClick={() =>
                                            handleMoveLocalDown(selectedComponent, entry.id)
                                          }
                                          className="btn btn-sm"
                                          style={{
                                            backgroundColor: "#6c757d", /* abu-abu gelap */
                                            color: "#fff",
                                            padding: "0.25rem 0.5rem",
                                            fontSize: "0.85rem",
                                            lineHeight: 1,
                                            border: "none",
                                            cursor:
                                              idx === componentOrder[selectedComponent].length - 1
                                                ? "not-allowed"
                                                : "pointer",
                                          }}
                                          disabled={
                                            idx === componentOrder[selectedComponent].length - 1
                                          }
                                        >
                                          ↓
                                        </button>

                                      {/* Tombol Remove Local */}
                                      <button
                                        type="button"
                                        onClick={() => handleRemoveLocal(selectedComponent, entry.id)}
                                        className="btn btn-sm"
                                        style={{
                                          backgroundColor: "#dc3545", /* merah */
                                          color: "#fff",
                                          padding: "0.25rem 0.5rem",
                                          fontSize: "0.85rem",
                                          lineHeight: 1,
                                          border: "none",
                                          cursor: "pointer",
                                        }}
                                      >
                                        &times;
                                      </button>
                                    </div>
                                  </div>
                                );
                              }
                              return null;
                            })}

                          {/* 11.d. Tombol Add Local */}
                          <button
                            type="button"
                            onClick={() => handleAddLocal(selectedComponent)}
                            className="btn btn-primary"
                            style={{ marginTop: "1rem", marginTop: "0.5rem",
                            backgroundColor: "#8DD8FF", // biru muda
                            color: "#000",             // hitam
                            border: "1px solid #8DD8FF"}}
                          >
                            + Add Additional Setup
                          </button>
                          {/* PORT */}
                          <div style={{ marginTop: "1rem" }}>
                            <label
                              htmlFor={`port-${selectedComponent}`}
                              style={{ fontWeight: "bold", display: "block" }}
                            >
                              PORT
                            </label>
                            <input
                              id={`port-${selectedComponent}`}
                              name="port"
                              type="text"
                              className="form-control mt-1"
                              placeholder="Expose PORT"
                              value={componentInfo[selectedComponent]?.port || ""}
                              onChange={(e) =>
                                handleChangePort(selectedComponent, e.target.value)
                              }
                            />
                          </div>
                          <div style={{ marginTop: "1rem" }}>
                            <label
                              htmlFor={`endpoint-${selectedComponent}`}
                              style={{ fontWeight: "bold", display: "block" }}
                            >
                              End Point Setup
                            </label>
                            <textarea
                              id={`endpoint-${selectedComponent}`}
                              name="endpoint"
                              rows={3}
                              className="form-control mt-1"
                              placeholder="Input End Point"
                              value={componentInfo[selectedComponent]?.endpoint || ""}
                              onChange={(e) =>
                                handleChangeEndpoint(selectedComponent, e.target.value)
                              }
                            />
                          </div>
                        </div>
                      )}
                    </>}
                </div>
            </div>
        </div>
        </>
    )
}

export default Appcontianer