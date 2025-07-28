import axios from 'axios';

//server gede
const TerraformAPI = axios.create({
    // baseURL: 'http://140.116.234.100:23631'
});

//local
// const TerraformAPI = axios.create({
//     baseURL: 'http://localhost:8001'
// });

// Instance for API 2
const AnsibleAPI = axios.create({
    // baseURL: 'http://140.116.234.100:10921',
    timeout: 600000
});

const BackendAPI = axios.create({
    baseURL: 'http://localhost:8003'
});

export { TerraformAPI, AnsibleAPI, BackendAPI};