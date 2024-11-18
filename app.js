const express = require('express');
const { spawn } = require('child_process');

const app = express();
const port = 3000;

// app.use(express.static(path.hoin(__dirname,'public')));

// app.get('/VR-control', (req, res) => {
//     res.sendFile(path.join(__dirname,'public','index.html'));
// });

app.get('/video', (req, res) => {
  // MJPEG 스트리밍을 위한 FFmpeg 명령
  const ffmpeg = spawn('ffmpeg', [
    '-f', 'dshow', // Windows에서 DirectShow 사용
    '-i', 'video=HD USB Camera', // 카메라 장치 이름
    '-f', 'mjpeg',
    '-q:v', '10', //quality
    '-r', '30', //FPS
    '-s', '640x480',
    '-threads', '4', // CPU 코어 수에 맞게 설정
    '-rw_timeout', '5000000', // 5초로 설정 (단위: 마이크로초)
    '-fflags', 'nobuffer',    // 버퍼링 최소화
    '-rtbufsize', '1500k', // 실시간 버퍼
    '-max_delay', '1000000', // 최대 지연 시간
    '-preset', 'ultrafast',  // 빠른 프리셋
    '-tune', 'zerolatency',  // 낮은 지연 모드
    'pipe:1'
  ]);

  // HTTP 응답 헤더 설정
  res.setHeader('Content-Type', 'multipart/x-mixed-replace; boundary=frame');
  
  // FFmpeg 출력 스트림을 HTTP 응답으로 전달
  ffmpeg.stdout.on('data', (data) => {
    res.write('--frame\r\n');
    res.write('Content-Type: image/jpeg\r\n\r\n'); // 각 프레임을 JPEG 이미지로 처리
    res.write(data);  // 이미지 데이터 전송
    res.write('\r\n'); // 프레임 구분자
  });

  ffmpeg.stderr.on('data', (data) => {
    console.error(`FFmpeg error: ${data}`);
  });

  ffmpeg.on('close', (code) => {
    console.log(`FFmpeg process exited with code ${code}`);
    res.end(); // 스트리밍 종료
  });
});


app.listen(port, '0.0.0.0', () => {
  console.log(`서버가 http://localhost:${port} 또는 http://<Your-IP>:${port}에서 실행 중입니다.`);
});
