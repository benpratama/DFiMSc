import React, { useState, Component } from 'react';
import '../App.css';


// Section
import Default from "./Sync Section/DefaultSection";
import IPM from "./Sync Section/IPM";
import AVM from "./Sync Section/AVM"

const Appmanager = ()=>{
    const [activeSection, setActiveSection] = useState("none");
    console.log(activeSection)

    return(
        <>
            {/* JUDUL */}
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
                    Containerized Service
                </div>
            </div>
            
            {/* SELECT PROJECT */}
            <div className="top-section">
                <div className="container">
                    <div className="row my-3 justify-content-center">
                    <div className="col-md-4 d-flex justify-content-center align-items-center">
                        <label className="form-label nowrap me-3" >Select Project</label>
                        <div className="input-group">
                        <select
                            className="form-select"
                            id="project"
                            value={activeSection}
                            onChange={(e) => setActiveSection(e.target.value)}
                        >
                            <option value="none" disabled>
                            Choose...
                            </option>
                            <option value="IPM">IPM</option>
                            <option value="AVM">AVM</option>
                        </select>
                        <label className="input-group-text" htmlFor="project">
                            Project
                        </label>
                        </div>
                    </div>
                    </div>
                </div>
            </div>

            {/* SECTION */}
            <div className='row'>
                {activeSection === "none" && <Default />}
                {activeSection === "IPM" && <IPM />}
                {activeSection === "AVM" && <AVM />}
            </div>
        </>
    )
}

export default Appmanager