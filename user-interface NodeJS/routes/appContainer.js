const express = require("express");
const router = express.Router();
const multer = require('multer');
const fs = require('fs-extra');
const path = require('path');
const bodyParser = require('body-parser');
const yauzl = require('yauzl');

router.use(bodyParser.json());

// Temp folder untuk file upload
const upload = multer({
  dest: 'C:/IM_Project2/temp',
  limits: { fileSize: 10 * 1024 * 1024 * 1024 } // Maks 10 GB
});

const TEMPLATE_PATH = path.join(__dirname, "..", "DockerFileTemplate", "Dockerfile-runtime");

const HELM_TEMPLATE_PATH = path.join(__dirname, "..", "HelmTemplate","template.yml");


router.post('/upload', upload.single('zipFile'), async (req, res) => {
  try {
    const zipPath = req.file.path;
    const originalName = req.file.originalname;

    // Cek ekstensi file
    if (!originalName.endsWith('.zip')) {
      await fs.unlink(zipPath);
      return res.status(400).json({ error: 'Only .zip files are allowed.' });
    }

    const folderName = path.parse(originalName).name;
    const extractPath = path.join("C:", "IM_Project2", folderName);

    // Validasi keamanan nama folder
    if (folderName.includes('..') || folderName.includes('/') || folderName.includes('\\')) {
      await fs.unlink(zipPath);
      return res.status(400).json({ error: 'Invalid file name.' });
    }

    // // Cek jika folder tujuan sudah ada
    // if (await fs.pathExists(extractPath)) {
    //   await fs.unlink(zipPath);
    //   return res.status(400).json({ error: 'Project folder already exists.' });
    // }

    // Pastikan file zip stabil
    const waitUntilFileStable = async (filePath, retries = 3, interval = 500) => {
      let lastSize = -1;
      for (let i = 0; i < retries; i++) {
        const stat = await fs.stat(filePath);
        if (stat.size === lastSize) return true;
        lastSize = stat.size;
        await new Promise(resolve => setTimeout(resolve, interval));
      }
      return false;
    };

    if (!(await waitUntilFileStable(zipPath))) {
      await fs.unlink(zipPath);
      return res.status(400).json({ error: 'File upload may be incomplete. Try again.' });
    }

    // 4) Jika folder belum ada, buat. Jika sudah ada, kita tetap lanjut (merge).
    await fs.ensureDir(extractPath);

    // 5) Ekstraksi file ZIP menggunakan yauzl
    await new Promise((resolve, reject) => {
      yauzl.open(zipPath, { lazyEntries: true }, (err, zipfile) => {
        if (err) return reject(err);

        zipfile.readEntry();
        zipfile.on('entry', (entry) => {
          // 5.a. Skip file ZIP di dalam folder Dependency level 1
          const entryParts = entry.fileName.split('/');
          if (
            entryParts.length >= 2 &&
            entryParts[0].toLowerCase() === 'dependency' &&
            path.extname(entry.fileName).toLowerCase() === '.zip'
          ) {
            return zipfile.readEntry();
          }

          // 5.b. Jika entry adalah folder (akhiran '/'), buat foldernya
          if (/\/$/.test(entry.fileName)) {
            const dirPath = path.join(extractPath, entry.fileName);
            fs.mkdirSync(dirPath, { recursive: true });
            return zipfile.readEntry();
          }

          // 5.c. Jika entry adalah file, tapi namanya Dockerfile-runtime, skip
          //      (agar file Dockerfile-runtime yang sudah ada tidak tertimpa)
          if (entry.fileName.endsWith('Dockerfile-runtime')) {
            // Lewatkan menulis file ini, langsung ke entry berikutnya
            return zipfile.readEntry();
          }

          // 5.d. Normal: buat folder parent, lalu tulis filenya
          const filePath = path.join(extractPath, entry.fileName);
          fs.mkdirSync(path.dirname(filePath), { recursive: true });
          zipfile.openReadStream(entry, (err, readStream) => {
            if (err) return reject(err);
            const writeStream = fs.createWriteStream(filePath);
            writeStream.on('close', () => zipfile.readEntry());
            readStream.pipe(writeStream);
          });
        });

        zipfile.on('end', resolve);
        zipfile.on('error', reject);
      });
    });

    // 6) Susun ulang struktur file setelah ekstraksi
    const fileStructure = [];
    fileStructure.push({ type: 'mainProject', depthlvl: 0, path: folderName });

    const readStructure = async (dir, relative = '', depth = 1, maxDepth = 2) => {
      if (depth > maxDepth) return;

      const items = await fs.readdir(dir);
      for (const item of items) {
        const fullPath = path.join(dir, item);
        const relativePath = path.join(relative, item);

        // Skip isi folder Dependency di root (depth 1)
        if (depth === 1 && item === 'Dependency') {
          continue;
        }

        // --- PENAMBAHAN LOGIKA FILTERING UNTUK FOLDER DENGAN PREFIX "helm-" ---
        // Cek apakah item adalah folder dan namanya diawali dengan "helm-" (case-insensitive)
        // Penting: Lakukan stat dulu untuk memastikan itu direktori sebelum memfilter berdasarkan nama
        let stat;
        try {
          stat = await fs.stat(fullPath);
        } catch (err) {
          console.warn('Failed to stat file:', fullPath, err.message);
          continue;
        }

        if (stat.isDirectory() && item.toLowerCase().startsWith('helm-')) {
          console.log(`Skipping folder with 'helm-' prefix from structure: ${relativePath}`);
          continue; // Lewati folder ini dan semua isinya dari pembacaan struktur
        }
        // --- AKHIR PENAMBAHAN LOGIKA FILTERING ---

        // Pindahkan stat = await fs.stat(fullPath); ke atas agar bisa digunakan oleh filter helm-
        // let stat; // Ini sudah dideklarasikan di atas

        // try {
        //   stat = await fs.stat(fullPath);
        // } catch (err) {
        //   console.warn('Failed to stat file:', fullPath, err.message);
        //   continue;
        // }

        if (stat.isDirectory()) {
          fileStructure.push({ type: 'folder', depthlvl: depth, path: relativePath });
          await readStructure(fullPath, relativePath, depth + 1, maxDepth);
        } else {
          // Skip semua file .zip (dimanapun)
          if (path.extname(item).toLowerCase() === '.zip') {
            continue;
          }
          fileStructure.push({ type: 'file', path: relativePath });
        }
      }
    };

    await readStructure(extractPath);

    // 7) Hapus file zip sementara
    await fs.unlink(zipPath);

    // 8) Return JSON struktur
    res.json({
      message: 'File extracted successfully (merge mode).',
      structure: fileStructure,
    });

  } catch (error) {
    console.error('Error during extraction:', error);
    if (error.code === 'Z_BUF_ERROR') {
      return res.status(413).json({ error: 'File too large or corrupted. Please try again.' });
    } else {
      return res.status(500).json({ error: 'Something went wrong during extraction.' });
    }
  }
});

// router.post("/generate-dockerfiles", async (req, res) => {
//   const data = req.body;

//   // 1) Ambil projectName, lalu pisahkan dari data komponen
//   const projectName = data.projectName || "default-project";
//   const componentsOnly = { ...data };
//   delete componentsOnly.projectName;

//   // Validasi: harus objek dan bukan array
//   if (
//     typeof componentsOnly !== "object" ||
//     componentsOnly === null ||
//     Array.isArray(componentsOnly)
//   ) {
//     return res.status(400).json({
//       error:
//         "Payload harus objek JSON dengan key 'projectName' dan key‐key komponen berupa array",
//     });
//   }

//   // 2) Baca template Dockerfile
//   let template;
//   try {
//     template = fs.readFileSync(TEMPLATE_PATH, "utf8");
//   } catch (err) {
//     console.error("Gagal membaca template:", err);
//     return res
//       .status(500)
//       .json({ error: "Cannot read Dockerfile template." });
//   }

//   // 3) Temukan marker "# @CUSTOM TEXT AREA"
//   const lines = template.split(/\r?\n/);
//   const markerIndices = [];
//   lines.forEach((line, idx) => {
//     if (line.trim() === "# @CUSTOM TEXT AREA") {
//       markerIndices.push(idx);
//     }
//   });
//   if (markerIndices.length < 2) {
//     return res.status(500).json({
//       error:
//         "Template harus memiliki dua marker '# @CUSTOM TEXT AREA'.",
//     });
//   }
//   const [firstMarkerIdx, secondMarkerIdx] = markerIndices;

//   // 4) Proses setiap komponen
//   const errors = [];

//   // Tentukan BASE_OUTPUT_DIR sebagai folder upload (multer.dest)
//   // Di sini diasumsikan: "C:/IM_Project/temp"
//   const BASE_UPLOAD_DIR = "C:/IM_Project";

//   Object.keys(componentsOnly).forEach((componentPathKey) => {
//     const valuesArray = componentsOnly[componentPathKey];
//     if (!Array.isArray(valuesArray)) {
//       errors.push(
//         `Value untuk key '${componentPathKey}' bukan array.`
//       );
//       return;
//     }

//     // 5) Buat customLines (opsional sisipkan projectName di depan)
//     // Contoh jika ingin baris pertama menunjukkan projectName:
//     //    const headerLine = `# Project: ${projectName}`;
//     //    const customLines = [headerLine, ...valuesArray.map(txt => txt)];
//     // Jika cukup array saja:
//     const customLines = valuesArray.map((txt) => txt);

//     // 6) Rekonstruksi isi Dockerfile
//     const before = lines.slice(0, firstMarkerIdx + 1);
//     const after = lines.slice(secondMarkerIdx);
//     const resultLines = [...before, ...customLines, ...after];
//     const finalContent = resultLines.join("\r\n");

//     // 7) Tentukan direktori target:
//     //    C:/IM_Project/temp/<projectName>/<componentPathKey>/
//     const targetDir = path.join(
//       BASE_UPLOAD_DIR,
//       projectName,
//       componentPathKey
//     );
//     try {
//       fs.mkdirSync(targetDir, { recursive: true });
//     } catch (err) {
//       errors.push(
//         `Gagal membuat direktori ${targetDir}: ${err.message}`
//       );
//       return;
//     }

//     // 8) Tulis file Dockerfile-runtime di dalam targetDir
//     const targetFilePath = path.join(targetDir, "Dockerfile-runtime");
//     try {
//       fs.writeFileSync(targetFilePath, finalContent, "utf8");
//     } catch (err) {
//       errors.push(
//         `Gagal menulis file ${targetFilePath}: ${err.message}`
//       );
//       return;
//     }
//   });

//   if (errors.length > 0) {
//     return res.status(500).json({ error: errors });
//   }
//   return res.json({
//     message:
//       "Dockerfile-runtime berhasil dibuat untuk semua komponen di folder upload.",
//   });
// });

// router.post("/generate-dockerfiles", async (req, res) => {
//   const data = req.body;

//   // Ambil projectName, lalu pisahkan data komponen
//   const projectName = data.projectName || "";
//   const componentsOnly = { ...data };
//   delete componentsOnly.projectName;

//   // Validasi bentuk data
//   if (
//     typeof componentsOnly !== "object" ||
//     componentsOnly === null ||
//     Array.isArray(componentsOnly)
//   ) {
//     return res.status(400).json({
//       error:
//         "Payload harus objek JSON dengan key 'projectName' dan key‐key komponen berupa objek { values, port, endpoint }",
//     });
//   }

//   // Baca template Dockerfile
//   let template;
//   try {
//     template = fs.readFileSync(TEMPLATE_PATH, "utf8");
//   } catch (err) {
//     console.error("Gagal membaca template:", err);
//     return res
//       .status(500)
//       .json({ error: "Cannot read Dockerfile template." });
//   }

//   // Pisahkan setiap baris
//   const lines = template.split(/\r?\n/);

//   // Temukan semua marker TEXT AREA dan PORT
//   const textAreaMarkers = [];
//   const portMarkers = [];
//   lines.forEach((line, idx) => {
//     if (line.trim() === "# @CUSTOM TEXT AREA") {
//       textAreaMarkers.push(idx);
//     }
//     if (line.trim() === "# @CUSTOM PORT") {
//       portMarkers.push(idx);
//     }
//   });

//   if (textAreaMarkers.length < 2 || portMarkers.length < 2) {
//     return res.status(500).json({
//       error:
//         "Template harus memiliki dua marker '# @CUSTOM TEXT AREA' dan dua marker '# @CUSTOM PORT'.",
//     });
//   }

//   // Indeks pertama/ kedua untuk TEXT AREA
//   const [firstTextIdx, secondTextIdx] = textAreaMarkers;
//   // Indeks pertama/ kedua untuk PORT
//   const [firstPortIdx, secondPortIdx] = portMarkers;

//   // Siapkan array untuk menampung error tiap komponen
//   const errors = [];
//   // Folder dasar output sesuai multer.dest
//   const BASE_UPLOAD_DIR = "C:/IM_Project";

//   // Loop setiap komponen
//   Object.keys(componentsOnly).forEach((componentPathKey) => {
//     const compObj = componentsOnly[componentPathKey];
//     if (
//       typeof compObj !== "object" ||
//       compObj === null ||
//       Array.isArray(compObj)
//     ) {
//       errors.push(
//         `Value untuk key '${componentPathKey}' harus objek { values, port, endpoint }.`
//       );
//       return;
//     }

//     const { values, port, endpoint } = compObj;
//     if (!Array.isArray(values)) {
//       errors.push(
//         `Properti 'values' untuk key '${componentPathKey}' bukan array.`
//       );
//       return;
//     }
//     // port dan endpoint boleh string kosong

//     // === Susun baris untuk TEXT AREA ===
//     // Satu baris per item di values
//     const customTextLines = values.map((txt) => txt);

//     // === Susun baris untuk PORT ===
//     // Jika port string tidak kosong, buat satu baris "EXPOSE <port>"
//     const customPortLines = [];
//     if (port && port.trim() !== "") {
//       customPortLines.push(`EXPOSE ${port}`);
//     }

//     // === Rekonstruksi isi Dockerfile ===
//     // 1) Ambil semua baris sebelum dan termasuk marker TEXT AREA pertama
//     const beforeText = lines.slice(0, firstTextIdx + 1);
//     // 2) Ambil semua baris antara TEXT AREA kedua dan PORT pertama
//     const betweenTextAndPort = lines.slice(secondTextIdx, firstPortIdx + 1);
//     // 3) Ambil semua baris antara PORT kedua dan akhir
//     const afterPort = lines.slice(secondPortIdx);

//     // Sekarang gabungkan:
//     // - beforeText
//     // - customTextLines
//     // - betweenTextAndPort (dimulai dari marker TEXT AREA kedua)
//     // - customPortLines
//     // - afterPort
//     const resultLines = [
//       ...beforeText,
//       ...customTextLines,
//       ...betweenTextAndPort,
//       ...customPortLines,
//       ...afterPort,
//     ];

//     const finalContent = resultLines.join("\r\n");

//     // === Simpan file ke C:/IM_Project/temp/<projectName>/<componentPathKey>/Dockerfile-runtime ===
//     const targetDir = path.join(
//       BASE_UPLOAD_DIR,
//       projectName,
//       componentPathKey
//     );
//     try {
//       fs.mkdirSync(targetDir, { recursive: true });
//     } catch (err) {
//       errors.push(
//         `Gagal membuat direktori ${targetDir}: ${err.message}`
//       );
//       return;
//     }

//     const targetFilePath = path.join(targetDir, "Dockerfile-runtime");
//     try {
//       fs.writeFileSync(targetFilePath, finalContent, "utf8");
//     } catch (err) {
//       errors.push(
//         `Gagal menulis file ${targetFilePath}: ${err.message}`
//       );
//       return;
//     }
//   });

//   if (errors.length > 0) {
//     return res.status(500).json({ error: errors });
//   }

//   return res.json({
//     message:
//       "Dockerfile-runtime berhasil dibuat untuk semua komponen di folder upload.",
//   });
// });


router.post("/generate-dockerfiles", async (req, res) => {

  const data = req.body;
  const helm = data.helm;

  // 1) Ambil projectName & pisahkan data komponen
  const projectName = data.projectName || "";
  // clone semua key lalu hilangkan projectName dan helm
  const componentsOnly = { ...data };
  delete componentsOnly.projectName;
  delete componentsOnly.helm;    

  // Validasi bentuk data
   if (
    typeof componentsOnly !== "object" ||
    componentsOnly === null ||
    Array.isArray(componentsOnly)
  ) {
    return res.status(400).json({
      error:
        "Payload harus objek JSON dengan key 'projectName', 'helm', dan key‐key komponen berupa objek { values, port, endpoint }",
    });
  }

  // 2) Baca template Dockerfile
  let template;
  try {
    template = fs.readFileSync(TEMPLATE_PATH, "utf8");
  } catch (err) {
    console.error("Gagal membaca template:", err);
    return res
      .status(500)
      .json({ error: "Cannot read Dockerfile template." });
  }

  // 3) Pecah menjadi array baris, lalu cari semua marker
  const lines = template.split(/\r?\n/);
  const textMarkers = [];
  const portMarkers = [];
  const endMarkers = [];

  lines.forEach((line, idx) => {
    if (line.trim() === "# @CUSTOM TEXT AREA") {
      textMarkers.push(idx);
    }
    if (line.trim() === "# @CUSTOM PORT") {
      portMarkers.push(idx);
    }
    if (line.trim() === "# @CUSTOM END") {
      endMarkers.push(idx);
    }
  });

  // Pastikan masing‐masing minimal dua marker
  if (
    textMarkers.length < 2 ||
    portMarkers.length < 2 ||
    endMarkers.length < 2
  ) {
    return res.status(500).json({
      error:
        "Template harus memiliki dua marker '# @CUSTOM TEXT AREA', dua '# @CUSTOM PORT', dan dua '# @CUSTOM END'.",
    });
  }

  // De‐destructuring indeks marker
  const [firstTextIdx, secondTextIdx] = textMarkers;
  const [firstPortIdx, secondPortIdx] = portMarkers;
  const [firstEndIdx, secondEndIdx] = endMarkers;

  // 4) Proses setiap komponen
  const errors = [];
  const BASE_UPLOAD_DIR = "C:/IM_Project2";

  Object.keys(componentsOnly).forEach((componentPathKey) => {
    const compObj = componentsOnly[componentPathKey];
    if (
      typeof compObj !== "object" ||
      compObj === null ||
      Array.isArray(compObj)
    ) {
      errors.push(
        `Value untuk key '${componentPathKey}' harus objek { values, port, endpoint }.`
      );
      return;
    }
 Object.keys(componentsOnly).forEach((componentPathKey) => {
    const compObj = componentsOnly[componentPathKey];
    const { values, port, endpoint } = compObj;
    if (!Array.isArray(values)) {
      errors.push(
        `Properti 'values' untuk key '${componentPathKey}' bukan array.`
      );
      return;
    }
    // port & endpoint boleh string kosong

    // === a) Siapkan baris untuk TEXT AREA (values) ===
    const customTextLines = values.map((txt) => txt);


    Object.keys(data).forEach((componentPathKey) => {
  // Lewatkan key "helm" (dan juga "projectName" jika perlu)
  if (componentPathKey === "helm" || componentPathKey === "projectName") {
    return;
  }

  const compObj = data[componentPathKey];

  // Sekarang aman melakukan destructuring
  const { values, port, endpoint } = compObj;

  if (!Array.isArray(values)) {
    errors.push(
      `Properti 'values' untuk key '${componentPathKey}' bukan array.`
    );
    return;
  }

  // port & endpoint boleh string kosong

  // === a) Siapkan baris untuk TEXT AREA (values) ===
  const customTextLines = values.map((txt) => txt);

  // …lanjutkan generate Dockerfile untuk komponen ini…
});

    // === b) Siapkan baris untuk PORT ===
    const customPortLines = [];
    if (port && port.trim() !== "") {
      const portsArray = port.split(',');
      portsArray.forEach(port => {
        // Trim spasi kosong dari setiap port dan pastikan bukan string kosong
        const trimmedPort = port.trim();
        if (trimmedPort !== "") {
          customPortLines.push(`EXPOSE ${trimmedPort}`);
        }
      });
    }

    // === c) Siapkan baris untuk ENDPOINT ===
    const customEndLines = [];
    if (endpoint && endpoint.trim() !== "") {
      customEndLines.push(endpoint);
    }

    // === d) Rekonstruksi Dockerfile -- gabungkan segmen di antara marker ===
    //  d.1. Semua baris hingga (inklusif) marker TEXT pertama
    const beforeText = lines.slice(0, firstTextIdx + 1);
    //  d.2. Baris mulai dari marker TEXT kedua hingga (inklusif) marker PORT pertama
    const betweenTextAndPort = lines.slice(secondTextIdx, firstPortIdx + 1);
    //  d.3. Baris mulai dari marker PORT kedua hingga (inklusif) marker END pertama
    const betweenPortAndEnd = lines.slice(secondPortIdx, firstEndIdx + 1);
    //  d.4. Baris mulai dari marker END kedua hingga akhir
    const afterEnd = lines.slice(secondEndIdx);

    //  d.5. Gabungkan semua segmen:
    //      beforeText
    //      customTextLines
    //      betweenTextAndPort
    //      customPortLines
    //      betweenPortAndEnd
    //      customEndLines
    //      afterEnd
    const resultLines = [
      ...beforeText,
      ...customTextLines,
      ...betweenTextAndPort,
      ...customPortLines,
      ...betweenPortAndEnd,
      ...customEndLines,
      ...afterEnd,
    ];

    const finalContent = resultLines.join("\r\n");

    // === e) Tulis file Dockerfile-runtime di C:/IM_Project/temp/<projectName>/<componentPathKey>/ ===
    const targetDir = path.join(
      BASE_UPLOAD_DIR,
      projectName,
      componentPathKey
    );
    try {
      fs.mkdirSync(targetDir, { recursive: true });
    } catch (err) {
      errors.push(
        `Gagal membuat direktori ${targetDir}: ${err.message}`
      );
      return;
    }

    const targetFilePath = path.join(targetDir, "Dockerfile-runtime");
    try {
      fs.writeFileSync(targetFilePath, finalContent, "utf8");
    } catch (err) {
      errors.push(
        `Gagal menulis file ${targetFilePath}: ${err.message}`
      );
      return;
    }
  });
});

  // --- B) Generate 1 Helm Chart saja ---
let helmTpl;
try {
  helmTpl = fs.readFileSync(HELM_TEMPLATE_PATH, "utf8");
} catch (e) {
  errors.push(`Tidak bisa baca template Helm‐Chart: ${e.message}`);
}

if (helmTpl) {
  // 1) Siapkan blok tag untuk semua komponen
  const tagLines = Object.entries(helm.image.tag)
    .map(([comp, tag]) => `      ${comp}: ${tag}`)
    .join("\n");

  // 2) Siapkan blok service.type, service.port, service.ip
  const typeLines = Object.entries(helm.service)
    .map(([comp, svc]) => `    ${comp}: ${svc.type}`)
    .join("\n");
  const portLines = Object.entries(helm.service)
    .map(([comp, svc]) => `    ${comp}: ${svc.port}`)
    .join("\n");
  const ipLines = Object.entries(helm.service)
    .map(([comp, svc]) => `    ${comp}: ${svc.ip}`)
    .join("\n");
  const minReplicasLines = Object.entries(helm.autoscaling)
    .map(([comp, svc]) => `    ${comp}: ${svc.minReplicas}`)
    .join("\n");
  const maxReplicasLines = Object.entries(helm.autoscaling)
    .map(([comp, svc]) => `    ${comp}: ${svc.maxReplicas}`)
    .join("\n");
  const hostPathLines = Object.entries(helm.volume.hostPath)
    .map(([comp, pathValue]) => `    ${comp}: ${pathValue}`)
    .join("\n");
  const replicaLines = Object.entries(helm.autoscaling)
  .map(([comp, cfg]) => `    ${comp}: 1`)
  .join("\n");

  // 3) Lakukan replace placeholder di template
  let chart = helmTpl
    .replace(
      "@image/repository",
      helm.image.repository
    )
    // kita ganti '@image/tag' dengan newline + semua tagLines
    .replace("@image/tag", "\n" + tagLines)
    .replace("@service/type", "\n" + typeLines)
    .replace("@service/port", "\n" + portLines)
    .replace("@service/ip", "\n" + ipLines)
    .replace("@autoscaling/minReplicas", "\n" + minReplicasLines)
    .replace("@autoscaling/maxReplicas", "\n" + maxReplicasLines)
    .replace("@component","\n" +replicaLines)
    .replace("@volume/hostPath", "\n" + hostPathLines)
    .replace("@volume/node",  helm.volume.node)

    // ==== ODBC: CDB ====
    .replace("@odbc/CDB/name", helm.odbc.CDB.name)
    .replace("@odbc/CDB/uid",  helm.odbc.CDB.uid)
    .replace("@odbc/CDB/pwd",  helm.odbc.CDB.pwd)
    .replace("@odbc/CDB/ip",   helm.odbc.CDB.ip)

    // ==== ODBC: STDB ====
    .replace("@odbc/STDB/name", helm.odbc.STDB.name)
    .replace("@odbc/STDB/uid",  helm.odbc.STDB.uid)
    .replace("@odbc/STDB/pwd",  helm.odbc.STDB.pwd)
    .replace("@odbc/STDB/ip",   helm.odbc.STDB.ip);

  // 4) Tulis satu file helm-chart.yaml di BASE_UPLOAD_DIR
  const helmPath = 'helm-'+projectName
  const outDir = path.join(BASE_UPLOAD_DIR,projectName,helmPath); // tanpa subfolder per-komponen
  try {
    fs.ensureDirSync(outDir);
    fs.writeFileSync(
      path.join(outDir, "values.yaml"),
      chart,
      "utf8"
    );
  } catch (e) {
    errors.push(`Gagal tulis Helm‐Chart: ${e.message}`);
  }
}


  if (errors.length > 0) {
    return res.status(500).json({ error: errors });
  }

  return res.json({
    message:
      "Dockerfile-runtime berhasil dibuat untuk semua komponen di folder upload.",
  });

});

module.exports = router;