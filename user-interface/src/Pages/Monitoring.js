import { useState, useRef,useEffect  } from 'react';
import { BackendAPI } from '../axios';

import '../App.css';

//! === BACKEND API ===
async function GetClusterData (){

    const getClusterData = '/ui/data'
    try {
      const response = await BackendAPI.get(
        getClusterData, //! endponint
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
  

const Monitoring = ()=>{
    const [clusterData,setClusterData] = useState({});
    const [nodeCP,setNodeCP] = useState({})
    const [nodeWK,setNodeWK] = useState([])

    //! ambil data mentah
    useEffect(()=>{
        // GetClusterData().then (data=>{
        //     setClusterData(data.data)
        // })    
        const intervalId = setInterval(() => {
          GetClusterData().then(data => {
            setClusterData(data.data)
          }).catch(error => {
            console.error("Failed to fetch config info:", error);
          });
        }, 15000); // Setiap 60000 ms atau 1 menit
    
        return () => clearInterval(intervalId);
    },[])

    //! ambil data nodes dikelompokin jadi 2 nodeCP sama nodeWK
    useEffect(()=>{
        var NodeDetail = clusterData.Nodes
        if (NodeDetail !== undefined) {
            var ipCP =Object.keys(NodeDetail).find(key => NodeDetail[key].role === "control-plane");
            var dataCP = NodeDetail[ipCP]
            setNodeCP(dataCP)

            const workerNodes = Object.keys(NodeDetail).filter(key => NodeDetail[key].role === "worker-node").map(key => {
                return {
                    ip: key,
                    name: NodeDetail[key].name,
                    CPU: NodeDetail[key].CPU,
                    Mem: NodeDetail[key].Mem
                };
            });
    
            setNodeWK(workerNodes);
        }
    },[clusterData.Nodes])

    return(
        <>
            {/* BOX CPU AND MEMROY */}
            <div className="top-section">
            <div className='row'>
              <div className="col-md-6 d-flex justify-content-center align-items-center">
                <div className='container-with-title'>
                  <span className='box_head_title'>Current Usage</span>
                  <div className=" d-flex">
                    <div className="box cpu">
                      <i className="bi bi-cpu-fill" style={{fontSize:"3rem"}}></i>
                      <div className='box_info'>
                        <div className='usage_lable'>CPU</div>
                        <div className='usage_lable value'>{clusterData.CPU|| 0}%</div>
                      </div>
                    </div>
                    <div className="box memory">
                      <i className="bi bi-hdd-fill" style={{fontSize:"3rem"}}></i>
                      <div className='box_info'>
                        <div className='usage_lable'>Memory</div>
                        <div className='usage_lable value'>{clusterData.Mem|| 0}%</div>
                      </div>
                    </div>
                  </div>
                </div>
              </div>
              <div className="col-md-6 d-flex justify-content-center align-items-center">
                <div className='container-with-title'>
                  <span className='box_head_title'>Prediction Usage</span>
                  <div className=" d-flex"> {/* Kolom pertama untuk dua kotak di sebelah kiri */}
                    <div className="box cpu">
                      <i className="bi bi-cpu-fill" style={{fontSize:"3rem"}}></i>
                      <div className='box_info'>
                        <div className='usage_lable'>CPU </div>
                        <div className='usage_lable value'>{clusterData.pred_CPU || 0}%</div>
                      </div>
                    </div>
                    <div className="box memory">
                      <i className="bi bi bi-hdd-fill" style={{fontSize:"3rem"}}></i>
                      <div className='box_info'>
                        <div className='usage_lable'>Memory</div>
                        <div className='usage_lable value'>{clusterData.pred_Mem || 0}%</div>
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            </div>
            </div>  
            <hr />
            <div className="bottom-section">

          
            {/* K8S CLUSTER */}
            <div className='row'>
                <div className='box_head_title p_center'>
                  <span>Kubernetes Cluster</span>
                </div>
            </div>
            {/* MASTER NODE */}
            <div className='row my-4'>
              <div className="col-md-2 d-flex justify-content-center align-items-center">
                <div className='sub_title'>
                  Master Node <br/>Control plane
                </div>
              </div>
              <div className="col-md-10 d-flex justify-content-center align-items-center">
                <div className='k8s_cluster_box'>
                  <span className='col-md-4 k8s_cluster_sub_box' style={{paddingLeft:"2rem"}}>Control Plane: {nodeCP.name}</span>
                </div>
              </div>
            </div>
            {/* WORKER NODE */}
            <div className='row ms-5'>
              <div className='d-flex my-2 '>
                <div className="col-md-2 d-flex justify-content-center align-items-center">
                  <div className='sub_title'>
                  Worker Nodes
                  </div>
                </div>
                {nodeWK.length>=1 ? (
                    <div className="col-md-9 justify-content-center align-items-center">
                    <div className='k8s_cluster_box row'>
                      <div className="col-md-3 k8s_cluster_sub_box">
                        Worker Name: {nodeWK[0].name}
                      </div>
                      <div className="col-md-8 k8s_cluster_sub_box d-flex">
  
                        <div className="col-md-5 sub_box_usage d-flex cpu" style={{border:"solid 1px"}}>
                          <div className='col-md-6 sub_1'>
                            <div className='sub_box_usage_logo' >
                              <i className="bi bi-cpu-fill" style={{fontSize:"1.8rem"}}></i>
                            </div>
                            <div className='sub_box_usage_lable'>
                              CPU Usage
                            </div>
                          </div>
                          <div className='col-md-5 sub_box_usage_value'>
                            {nodeWK[0].CPU}%
                          </div>
                        </div>
  
                        <div className="col-md-5 sub_box_usage d-flex memory" style={{border:"solid 1px", marginLeft:"2rem"}}>
                          <div className='col-md-6 sub_1'>
                            <div className='sub_box_usage_logo' >
                              <i className="bi bi-hdd-fill" style={{fontSize:"2rem"}}></i>
                            </div>
                            <div className='sub_box_usage_lable'>
                              Memory Usage
                            </div>
                          </div>
                          <div className='col-md-5 sub_box_usage_value'>
                            {nodeWK[0].Mem}%
                          </div>
                        </div>
                      </div>
                    </div>
                    </div>
                ):(<></>)}
              </div>
                {nodeWK.length>1 ? (
                    nodeWK.slice(1).map((node, index) => (
                        <div key={index} className='d-flex my-2'>
                            <div className="col-md-2 d-flex justify-content-center align-items-center">
                            <div className='sub_title'>
                            </div>
                            </div>
                            <div className="col-md-9 justify-content-center align-items-center">
                            <div className='k8s_cluster_box row'>
                                <div className="col-md-3 k8s_cluster_sub_box">
                                Worker Name: {node.name}
                                </div>
                                <div className="col-md-8 k8s_cluster_sub_box d-flex">
            
                                <div className="col-md-5 sub_box_usage d-flex cpu" style={{border:"solid 1px"}}>
                                    <div className='col-md-6 sub_1'>
                                    <div className='sub_box_usage_logo' >
                                        <i className="bi bi-cpu-fill" style={{fontSize:"2rem"}}></i>
                                    </div>
                                    <div className='sub_box_usage_lable'>
                                        CPU Usage
                                    </div>
                                    </div>
                                    <div className='col-md-5 sub_box_usage_value'>
                                    {node.CPU}%
                                    </div>
                                </div>
            
                                <div className="col-md-5 sub_box_usage d-flex memory" style={{border:"solid 1px", marginLeft:"2rem"}}>
                                    <div className='col-md-6 sub_1'>
                                    <div className='sub_box_usage_logo' >
                                        <i className="bi bi-hdd-fill" style={{fontSize:"2rem"}}></i>
                                    </div>
                                    <div className='sub_box_usage_lable'>
                                        Memory Usage
                                    </div>
                                    </div>
                                    <div className='col-md-5 sub_box_usage_value'>
                                    {node.Mem}%
                                    </div>
                                </div>
                                </div>
                            </div>
                            </div>
                        </div>
                    ))
                ):
                (<></>)}
            </div>
            </div>
        </>
    )
}

export default Monitoring