import React, { Component } from 'react';
import '../../App.css';

const AVM = ()=>{
    return(
        <>
            <div className='row my-4 justify-content-center'>
                    <div className="col-md-5 d-flex justify-content-center align-items-center">
                        <div className='sub_title nowrap'>
                            Dockerfile test
                        </div>
                        <div className="input-group mb-3">
                            
                            <select className="form-select" id="project">
                            <option selected>Choose...</option>
                            <option value="IPM">IPM</option>
                            <option value="AVM">AVM</option>
                            </select>
                            <label className="input-group-text" htmlFor="project">Project</label>
                        </div>
                    </div>
                    <div className="col-md-5 d-flex justify-content-center align-items-center">
                        <div className='sub_title nowrap'>
                            X project
                        </div>
                        <div className="input-group mb-3">
                            
                            <select className="form-select" id="project">
                            <option selected>Choose...</option>
                            <option value="IPM">IPM</option>
                            <option value="AVM">AVM</option>
                            </select>
                            <label className="input-group-text" htmlFor="project">Project</label>
                        </div>
                    </div>
            </div>
            <div className='row my-4 justify-content-center'>
                <div className="col-md-5 d-flex justify-content-center align-items-center">
                    <div className='sub_title nowrap'>
                        Dockerfile test
                    </div>
                    <div className="input-group mb-3">
                        
                        <select className="form-select" id="project">
                        <option selected>Choose...</option>
                        <option value="IPM">IPM</option>
                        <option value="AVM">AVM</option>
                        </select>
                        <label className="input-group-text" htmlFor="project">Project</label>
                    </div>
                </div>
                <div className="col-md-5 d-flex justify-content-center align-items-center">
                    <div className='sub_title nowrap'>
                        X project
                    </div>
                    <div className="input-group mb-3">
                        
                        <select className="form-select" id="project">
                        <option selected>Choose...</option>
                        <option value="IPM">IPM</option>
                        <option value="AVM">AVM</option>
                        </select>
                        <label className="input-group-text" htmlFor="project">Project</label>
                    </div>
                </div>
            </div>
        </>
    )
}

export default AVM