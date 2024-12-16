const express = require('express');
const { spawn } = require('child_process');
const { exec } = require('child_process');
const path = require('path');

const app = express();
const port = 3000;

app.use(express.static(path.join(__dirname, 'public')));

app.get('/VR-control', (req, res) => {
  res.sendFile(path.join(__dirname, 'public', 'VR-control.html'));
});

app.get('/video', (req, res) => {
  const ffmpeg = spawn('ffmpeg', [
    '-f', 'v4l2',
    '-i', '/dev/video0', 
    '-f', 'mjpeg',
    '-q:v', '10', //quality
    '-r', '15', //FPS
    '-s', '640x480',
    '-threads', '4',
    '-rw_timeout', '5000000',
    '-fflags', 'nobuffer',
    '-rtbufsize', '1500k',
    '-max_delay', '1000000',
    '-preset', 'ultrafast',
    '-tune', 'zerolatency',
    'pipe:1'
  ]);

  res.setHeader('Content-Type', 'multipart/x-mixed-replace; boundary=frame');

  ffmpeg.stdout.on('data', (data) => {
    res.write('--frame\r\n');
    res.write('Content-Type: image/jpeg\r\n\r\n');
    res.write(data);
    res.write('\r\n');
  });

  ffmpeg.stderr.on('data', (data) => {
    console.error(`FFmpeg error: ${data}`);
  });

  ffmpeg.on('close', (code) => {
    console.log(`FFmpeg process exited with code ${code}`);
    exec('sudo fuser /dev/video0', (error, stdout, stderr) => {

        if (error) {
            console.error(`exec check pid error: ${error}`);
            return;
        }
        if(stdout){
            let Cam_PID = stdout.split(' ').filter(pid => pid.trim() !== '');
            console.log('PID of the processes using /dev/video0:', Cam_PID);
            exec(`sudo kill -9 ${Cam_PID[0]}`, (error, stdout, stderr) => {
                if (error) {
                    console.error(`exec kill pid error: ${err}`);
                    return;
                }
                if (stderr) {
                    console.error(`stderr for kill PID: ${stderr}`);
                    return;
                }
                else {
                    console.log("Success Kill Cam_PID!!");
                }
            });
        }
        else if (stderr) {
            console.log(`stderr for check pid: ${stderr}`);
        }
    });
    res.end();
  });
});


app.listen(port, '0.0.0.0', () => {
  console.log(`access to http://localhost:${port} or http://<Your-IP>:${port}.`);
});
