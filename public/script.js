const express = require("express");
const https = require("https");
const fs = require("fs");
const { Server } = require("socket.io");

const app = express();

// HTTPS 설정 (자체 서명된 인증서)
const options = {
  key: fs.readFileSync("key.pem"),
  cert: fs.readFileSync("cert.pem"),
};

const server = https.createServer(options, app);
const io = new Server(server);

const peerConnectionConfig = {
  iceServers: [{ urls: "stun:stun.l.google.com:19302" }],
};

// 정적 파일 서빙 (HTML, JavaScript)
app.use(express.static("public"));

// WebSocket 연결 처리
io.on("connection", (socket) => {
  console.log("Client connected");

  let peerConnection;  // peerConnection을 연결된 클라이언트마다 개별로 처리

  socket.on("signal", async (data) => {
    // peerConnection이 아직 없다면, offer를 받을 때 생성
    if (!peerConnection) {
      peerConnection = new RTCPeerConnection(peerConnectionConfig);

      // ICE 후보를 시그널링 서버로 전송
      peerConnection.onicecandidate = (event) => {
        if (event.candidate) {
          socket.emit("signal", { candidate: event.candidate });
        }
      };

      // 원격 스트림을 처리하여 클라이언트로 송출
      peerConnection.ontrack = (event) => {
        io.emit("remoteStream", event.streams[0]);
      };
    }

    if (data.sdp) {
      if (data.sdp.type === "offer") {
        // offer 받은 경우
        await peerConnection.setRemoteDescription(new RTCSessionDescription(data.sdp));
        const answer = await peerConnection.createAnswer();
        await peerConnection.setLocalDescription(answer);
        socket.emit("signal", { sdp: peerConnection.localDescription });
      } else if (data.sdp.type === "answer") {
        // answer 받은 경우
        await peerConnection.setRemoteDescription(new RTCSessionDescription(data.sdp));
      }
    }

    if (data.candidate) {
      // ICE candidate 처리
      await peerConnection.addIceCandidate(new RTCIceCandidate(data.candidate));
    }
  });

  socket.on("disconnect", () => {
    console.log("Client disconnected");
    if (peerConnection) {
      peerConnection.close();
    }
  });
});

// 서버 시작
server.listen(3000, () => {
  console.log("Server running at https://localhost:3000");
});
