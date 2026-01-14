import { io } from 'socket.io-client';

const socketUrl = 'http://120.26.202.182:3001'; // 后端服务器地址
const numberOfSubmissions = 300;
const delayBetweenSubmissionsMs = 500; // 每次提交之间的延迟

async function simulateSubmissions() {
  console.log(`Connecting to Socket.io server at ${socketUrl}...`);
  const socket = io(socketUrl);

  socket.on('connect', () => {
    console.log('Connected to Socket.io server.');
    sendSubmissions();
  });

  socket.on('connect_error', (err) => {
    console.error('Socket.io connection error:', err.message);
  });

  socket.on('disconnect', () => {
    console.log('Disconnected from Socket.io server.');
  });

  async function sendSubmissions() {
    for (let i = 1; i <= numberOfSubmissions; i++) {
      const name = `用户${i}`;
      console.log(`Submitting: ${name}`);
      socket.emit('user_submit', { name });
      await new Promise(resolve => setTimeout(resolve, delayBetweenSubmissionsMs));
    }
    console.log(`${numberOfSubmissions} submissions sent.`);
    socket.disconnect(); // 所有提交完成后断开连接
  }
}

simulateSubmissions();
