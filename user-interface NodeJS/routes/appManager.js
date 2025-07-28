const express = require("express");
const router = express.Router();
const bodyParser = require('body-parser');
const fs = require('fs');
const path = require('path');
const { exec } = require('child_process');

const gitLogs = require('../models/gitLogs')

router.use(bodyParser.json());

function transformDockerfileContent(fileContent, config) {
    // Ganti parameter IMAGE-BASE
    let updatedContent = fileContent.replace(/@IMAGE-BASE/g, config.imageBase);
    
    // Ganti EXPOSE @PORT dengan baris EXPOSE untuk setiap port
    const portLines = config.port.map(port => `EXPOSE ${port}`).join('\n');
    updatedContent = updatedContent.replace(/EXPOSE\s+@PORT/g, portLines);
    
    return updatedContent;
}

function parseGitLogOutput(logOutput) {
    const lines = logOutput.split('\n');

  // Ambil commit ID dari baris pertama yang diawali "commit"
  const commitLine = lines.find(line => line.startsWith("commit"));
  const commitID = commitLine ? commitLine.replace("commit", "").trim() : "";

  // Ambil baris tanggal yang diawali "Date:"
  const dateLine = lines.find(line => line.startsWith("Date:"));
  let isoDate = "";
  if (dateLine) {
    // Hapus label "Date:" dan spasi tambahan
    const dateStr = dateLine.replace("Date:", "").trim();
    // Buat objek Date dari string
    const parsedDate = new Date(dateStr);
    // Ubah ke string ISO dan ganti "Z" dengan "+00:00"
    isoDate = parsedDate.toISOString().replace("Z", "+00:00");
  }

  // Cari baris pesan commit yang mengandung "msg:" dan "sts:" (dipisahkan dengan '|')
  const messageLine = lines.find(line => line.trim().startsWith("msg:"));
  let msg = "";
  let sts = "";
  if (messageLine) {
    const parts = messageLine.trim().split('|');
    msg = parts[0].replace(/^msg:\s*/i, '').trim();
    if (parts[1]) {
        sts = parts[1].trim().replace(/^sts:\s*/i, '');
    }
  }

  return { commitID, date: isoDate, msg, sts };
}

async function updateGitLogs(newData) {
    try {
      // Cari dokumen terakhir berdasarkan field date (atau _id jika tidak ada date)
      // Pastikan schema GitLog menyimpan field "date" sebagai Date atau string ISO.
      const lastLog = await gitLogs.findOne({}).sort({ date: -1 });
  
      // Jika data terakhir ada dan commitID-nya sama dengan newData.commitID, jangan insert
      if (lastLog && lastLog.commitID === newData.commitID) {
        return { status: "exists"};
      } else {
        // Jika commitID berbeda, insert data baru
        const inserted = await gitLogs.create(newData);
        return { status: "success Add"};
      }
    } catch (error) {
      console.error("Error updating git logs:", error);
      throw error;
    }
}

function runGitCommand(command, cwd) {
    return new Promise((resolve, reject) => {
      exec(command, { cwd }, (error, stdout, stderr) => {
        if (error) {
          return reject(error);
        }
        if (stderr) {
          console.error("Git stderr:", stderr);
        }
        resolve({ stdout, stderr });
      });
    });
}

//write DockerFile
router.post('/generatedf', async (req, res) => {
    try {
        const data = req.body.dataDF;
        const message_raw = req.body.message
        const keys = Object.keys(data)
        const targetFolder = path.join("C:", "IPM");

        for (let index = 0; index < keys.length; index++) {
            const key = keys[index]; // key sekarang adalah "DataProcessing", "GUI", dsb.
            let originalContent;
            if (key === "DataProcessing") {
                originalContent = fs.readFileSync(path.join("./DockerFileTemplate", "Dockerfile-runtime-DataProcessing"),"utf8");
            } else if (key === "GUI") {
                originalContent = fs.readFileSync(path.join("./DockerFileTemplate", "Dockerfile-runtime-GUI"),"utf8");
            } else if (key === "ParserService") {
                originalContent = fs.readFileSync(path.join("./DockerFileTemplate", "Dockerfile-runtime-Parser"),"utf8");
            } else if (key === "Service") {
                originalContent = fs.readFileSync(path.join("./DockerFileTemplate", "Dockerfile-runtime-Service"),"utf8");
            } else if (key === "TokenServer") {
                originalContent = fs.readFileSync(path.join("./DockerFileTemplate", "Dockerfile-runtime-Token"),"utf8");
            }

            var newContent = transformDockerfileContent(originalContent, data[key]);
            var targetPath = path.join("C:", "IPM", key, "DockerFile");
            fs.writeFileSync(targetPath, newContent, "utf8");
        }

        // commit
        var message = "msg: "+ message_raw +" | sts: Success" ;
        const gitAdd = `git add .`;
        await runGitCommand(gitAdd, targetFolder);

        const gitCommit = `git commit -m "${message}"`;
        await runGitCommand(gitCommit, targetFolder);

        const gitPush = `git push`;
        await runGitCommand(gitPush, targetFolder);
        
        res.status(201).json({ stat: 'success'});
    } catch (error) {
        console.error('Error saving log:', error);
        res.status(500).json({ stat: 'failed', error: error.message });
    }
});

router.get('/git-log', async (req, res) => {
    const repoPath = path.join("C:", "IPM");

    const command = 'git log -1';

    exec(command, { cwd: repoPath }, async (error, stdout, stderr) => {
        if (error) {
          console.error("Error executing git log:", error);
          return res.status(500).json({ status: "failed", error: error.message });
        }
        if (stderr) {
          console.error("Git log stderr:", stderr);
          return res.status(500).json({ status: "failed", error: stderr });
        }
    
        const lastLog = parseGitLogOutput(stdout);
        try {
          const respons = await updateGitLogs(lastLog);

            if(respons.status == "success Add"){
                res.status(200).json({ status: "success"});
            }else if(respons.status == "exists"){
                res.status(200).json({ status: "exists"});
            }

        } catch (err) {
          console.error("Error updating git logs:", err);
          res.status(500).json({ status: "failed", error: err.message });
        }
    });
})

router.get('/logs', async (req, res)=>{
    try {
        let data = await gitLogs.find({}).sort({ date: -1 }).limit(8);
        
        let formattedData = data.map(item => {
            const dt = new Date(item.date);
            const yyyy = dt.getFullYear();
            const mm = String(dt.getMonth() + 1).padStart(2, '0');
            const dd = String(dt.getDate()).padStart(2, '0');
            const hh = String(dt.getHours()).padStart(2, '0');
            const min = String(dt.getMinutes()).padStart(2, '0');

            return {
                ...item._doc, // salin semua properti dokumen MongoDB
                date: `${yyyy}-${mm}-${dd} ${hh}:${min}`
            };
        });

        return res.status(200).send({stat:'success',data:formattedData});
    } catch (error) {
        console.error("Error saat mengambil data:", error);
        return res.status(500).send({stat:'failed',data:null});
    }
});


module.exports = router;