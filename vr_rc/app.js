const express = require('express');
const { spawn } = require('child_process');
const path = require('path');

const app = express();
const port = 3000;

// 정적 파일 제공
app.use(express.static(path.join(__dirname, 'public')));

app.get('/', (req, res) => {
  res.sendFile(path.join(__dirname, 'public', 'index.html'));
});

// VR-control 페이지 제공
app.get('/VR-control', (req, res) => {
  res.sendFile(path.join(__dirname, 'public', 'VR-control.html'));
});

// 비디오 스트리밍 엔드포인트
app.get('/video', (req, res) => {
  const ffmpeg = spawn('ffmpeg', [
    '-f', 'v4l2',
    '-i', '/dev/video0',
    '-f', 'mjpeg',
    '-q:v', '10',         // 품질 (10: 낮은 품질, 1: 높은 품질)
    '-r', '15',           // FPS (15 프레임/초)
    '-s', '640x480',      // 해상도
    '-threads', '4',      // 멀티 스레드 사용
    '-preset', 'ultrafast', // 빠른 처리
    '-tune', 'zerolatency', // 최소 지연 시간
    'pipe:1'              // 표준 출력으로 스트림 전송
  ]);

  // 멀티파트 스트리밍 설정
  res.setHeader('Content-Type', 'multipart/x-mixed-replace; boundary=frame');

  // FFmpeg 스트림 데이터 처리
  ffmpeg.stdout.on('data', (data) => {
    res.write('--frame\r\n');
    res.write('Content-Type: image/jpeg\r\n\r\n');
    res.write(data);
    res.write('\r\n');
  });

  // FFmpeg 에러 처리
  ffmpeg.stderr.on('data', (data) => {
    console.error(`FFmpeg error: ${data}`);
  });

  // FFmpeg 종료 처리
  ffmpeg.on('close', (code) => {
    console.log(`FFmpeg process exited with code ${code}`);
    res.end();
  });

  // 클라이언트 연결 종료 처리
  req.on('close', () => {
    console.log('Client disconnected. Stopping FFmpeg.');
    ffmpeg.kill('SIGINT'); // FFmpeg 프로세스 종료
  });
});

// 서버 시작
app.listen(port, '0.0.0.0', () => {
  console.log(`Access the server at http://localhost:${port} or http://<Your-IP>:${port}`);
});
