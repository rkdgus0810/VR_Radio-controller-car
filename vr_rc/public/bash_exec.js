const { exec } = require('child_process');

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
