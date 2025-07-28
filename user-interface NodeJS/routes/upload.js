const express = require("express");
const router = express.Router();
const multer = require("multer");
const AdmZip = require("adm-zip");
const fs = require("fs");

// Konfigurasi storage Multer dengan destination dinamis
// const storage = multer.diskStorage({
//     destination: function (req, file, cb) {
//       let dest = "";
//       if (file.fieldname === "DataProcessingDocker") {
//         dest = "C:/Manufacturing Service/IPM/DataProcessing";
//       } else if (file.fieldname === "GUIDocker") {
//         dest = "C:/Manufacturing Service/IPM/Gui";
//       } else if (file.fieldname === "ParserServiceDocker") {
//         dest = "C:/Manufacturing Service/IPM/ParserService";
//       } else if (file.fieldname === "ServiceDocker") {
//         dest = "C:/Manufacturing Service/IPM/Service";
//       } else if (file.fieldname === "TokenDocker") {
//         dest = "C:/Manufacturing Service/IPM/TokenService";
//       }
//       // Buat folder jika belum ada
//       if (!fs.existsSync(dest)) {
//         fs.mkdirSync(dest, { recursive: true });
//       }
//       cb(null, dest);
//     },
//     filename: function (req, file, cb) {
//       // Simpan file dengan nama tetap "Dockerfile-runtime"
//       cb(null, "Dockerfile-runtime");
//     },
// });

// const getDestinationFolder = (fieldname) => {
//   if (fieldname === "DataProcessingFile") {
//     return "C:/Manufacturing Service/IPM/DataProcessing";
//   } else if (fieldname === "GUIFile") {
//     return "C:/Manufacturing Service/IPM/gui";
//   } else if (fieldname === "ParserFile") {
//     return "C:/Manufacturing Service/IPM/ParserService";
//   } else if (fieldname === "ServiceFile") {
//     return "C:/Manufacturing Service/IPM/Service";
//   } else if (fieldname === "TokenFile") {
//     return "C:/Manufacturing Service/IPM/TokenService";
//   }
//   return null;
// };
// const storage2 = multer.diskStorage({
//   destination: (req, file, cb) => {
//     const dest = getDestinationFolder(file.fieldname);
//     if (!dest) {
//       return cb(new Error("Folder tujuan tidak ditemukan"), null);
//     }
//     // Pastikan folder tujuan ada, jika tidak buat folder tersebut
//     if (!fs.existsSync(dest)) {
//       fs.mkdirSync(dest, { recursive: true });
//     }
//     // Simpan file sementara di folder sementara, misalnya "uploads/"
//     const tempFolder = "uploads/";
//     if (!fs.existsSync(tempFolder)) {
//       fs.mkdirSync(tempFolder, { recursive: true });
//     }
//     cb(null, tempFolder);
//   },
//   filename: (req, file, cb) => {
//     // Simpan file sementara dengan nama aslinya
//     cb(null, file.originalname);
//   },
// });

// const upload = multer({ storage: storage });
// const upload2 = multer({ storage: storage2 });

// router.post(
//     "/upload",
//     upload.fields([
//       // DOCKER
//       { name: "DataProcessingDocker", maxCount: 1 },
//       { name: "GUIDocker", maxCount: 1 },
//       { name: "ParserServiceDocker", maxCount: 1 },
//       { name: "ServiceDocker", maxCount: 1 },
//       { name: "TokenDocker", maxCount: 1 }
//     ]),
//     (req, res) => {
//       console.log(req)
//       try {
//         res.status(200).send("File berhasil diupload dan disimpan ke folder yang sesuai.");
//       } catch (error) {
//         console.error(error);
//         res.status(500).send("Terjadi kesalahan saat memproses file.");
//       }
//     }
//   );

// router.post(
//     "/upload2",
//     upload2.fields([
//       { name: "DataProcessingFile", maxCount: 1 },
//       { name: "GUIFile", maxCount: 1 },
//       { name: "ParserFile", maxCount: 1 },
//       { name: "ServiceFile", maxCount: 1 },
//       { name: "TokenFile", maxCount: 1 }
//     ]),
//     (req, res) => {
//       try {
//         // Proses setiap file yang diterima
//         for (const field in req.files) {
//           const fileData = req.files[field][0];
//           const tempFilePath = fileData.path;
//           const destinationFolder = getDestinationFolder(fileData.fieldname);
//           if (!destinationFolder) continue;
  
//           // Ekstrak file ZIP ke folder tujuan
//           const zip = new AdmZip(tempFilePath);
//           zip.extractAllTo(destinationFolder, true);
  
//           // Hapus file ZIP sementara
//           fs.unlinkSync(tempFilePath);
//         }
  
//         res.status(200).send("File ZIP berhasil diekstrak dan dipindahkan ke folder yang sesuai.");
//       } catch (error) {
//         console.error(error);
//         res.status(500).send("Terjadi kesalahan saat ekstraksi file ZIP.");
//       }
//     }
//   );  

const destinationFolder_DataProcessing = "C:/Manufacturing Service/IPM/DataProcessing";
const destinationFolder_Gui = "C:/Manufacturing Service/IPM/Gui";
const destinationFolder_ParserService = "C:/Manufacturing Service/IPM/ParserService";
const destinationFolder_Service = "C:/Manufacturing Service/IPM/Service";
const destinationFolder_Token = "C:/Manufacturing Service/IPM/TokenService";

if (!fs.existsSync(destinationFolder_DataProcessing)) {
  fs.mkdirSync(destinationFolder_DataProcessing, { recursive: true });
}

if (!fs.existsSync(destinationFolder_Gui)) {
  fs.mkdirSync(destinationFolder_Gui, { recursive: true });
}

if (!fs.existsSync(destinationFolder_ParserService)) {
  fs.mkdirSync(destinationFolder_ParserService, { recursive: true });
}

if (!fs.existsSync(destinationFolder_Service)) {
  fs.mkdirSync(destinationFolder_Service, { recursive: true });
}

if (!fs.existsSync(destinationFolder_Token)) {
  fs.mkdirSync(destinationFolder_Token, { recursive: true });
}

const tempFolder = "uploads/";
if (!fs.existsSync(tempFolder)) {
  fs.mkdirSync(tempFolder, { recursive: true });
}

const storage = multer.diskStorage({
  destination: (req, file, cb) => {
    // Untuk file Dockerfile (langsung ke folder tujuan)
    if (file.fieldname === "DataProcessingDocker") {
      cb(null, destinationFolder_DataProcessing);
    } else if (file.fieldname === "GUIDocker") {
      cb(null, destinationFolder_Gui);
    } else if (file.fieldname === "ParserServiceDocker") {
      cb(null, destinationFolder_ParserService);
    } else if (file.fieldname === "ServiceDocker") {
      cb(null, destinationFolder_Service);
    } else if (file.fieldname === "TokenDocker") {
      cb(null, destinationFolder_Token);
    }
    // Untuk file ZIP, simpan sementara di folder uploads/
    else if (file.fieldname === "DataProcessingFile" || file.fieldname === "GUIFile" || file.fieldname === "ParserFile" || file.fieldname === "ServiceFile" || file.fieldname === "TokenFile" ) {
      cb(null, tempFolder);
    } else {
      cb(null, tempFolder);
    }
  },
  filename: (req, file, cb) => {
    // Untuk Dockerfile, simpan dengan nama statis "Dockerfile-runtime"
    if (file.fieldname === "DataProcessingDocker" || file.fieldname === "GUIDocker" || file.fieldname === "ParserServiceDocker" || file.fieldname === "ServiceDocker" || file.fieldname === "TokenDocker") {
      cb(null, "Dockerfile-runtime");
    } else {
      // Untuk file ZIP, gunakan nama asli
      cb(null, file.originalname);
    }
  }
});

const upload = multer({ storage });

router.post(
  "/upload",
  upload.fields([
    { name: "DataProcessingDocker", maxCount: 1 },
    { name: "DataProcessingFile", maxCount: 1 },

    { name: "GUIDocker", maxCount: 1 },
    { name: "GUIFile", maxCount: 1 },

    { name: "ParserServiceDocker", maxCount: 1 },
    { name: "ParserFile", maxCount: 1 },

    { name: "ServiceDocker", maxCount: 1 },
    { name: "ServiceFile", maxCount: 1 },

    { name: "TokenDocker", maxCount: 1 },
    { name: "TokenFile", maxCount: 1 }
  ]),
  (req, res) => {
    try {
      // Proses file ZIP untuk Data Processing
      if (req.files["DataProcessingFile"]) {
        const zipFile = req.files["DataProcessingFile"][0];
        const zip = new AdmZip(zipFile.path);
        // Ekstrak isi ZIP ke folder Data Processing
        zip.extractAllTo(destinationFolder_DataProcessing, true);
        // Hapus file ZIP dari folder sementara
        fs.unlinkSync(zipFile.path);
      }
  
      // Proses file ZIP untuk GUI
      if (req.files["GUIFile"]) {
        const zipFile = req.files["GUIFile"][0];
        const zip = new AdmZip(zipFile.path);
        // Ekstrak isi ZIP ke folder GUI
        zip.extractAllTo(destinationFolder_Gui, true);
        // Hapus file ZIP dari folder sementara
        fs.unlinkSync(zipFile.path);
      }

      // Proses file ZIP untuk ParserService
      if (req.files["ParserFile"]) {
        const zipFile = req.files["ParserFile"][0];
        const zip = new AdmZip(zipFile.path);
        // Ekstrak isi ZIP ke folder GUI
        zip.extractAllTo(destinationFolder_ParserService, true);
        // Hapus file ZIP dari folder sementara
        fs.unlinkSync(zipFile.path);
      }

      // Proses file ZIP untuk ParserService
      if (req.files["ServiceFile"]) {
        const zipFile = req.files["ServiceFile"][0];
        const zip = new AdmZip(zipFile.path);
        // Ekstrak isi ZIP ke folder GUI
        zip.extractAllTo(destinationFolder_Service, true);
        // Hapus file ZIP dari folder sementara
        fs.unlinkSync(zipFile.path);
      }

      // Proses file ZIP untuk ParserService
      if (req.files["TokenFile"]) {
        const zipFile = req.files["TokenFile"][0];
        const zip = new AdmZip(zipFile.path);
        // Ekstrak isi ZIP ke folder GUI
        zip.extractAllTo(destinationFolder_Token, true);
        // Hapus file ZIP dari folder sementara
        fs.unlinkSync(zipFile.path);
      }
  
      res.status(200).send("File berhasil diupload dan diproses.");
    } catch (error) {
      console.error("Error processing upload:", error);
      res.status(500).send("Terjadi kesalahan saat memproses file.");
    }
  }
);

module.exports = router;