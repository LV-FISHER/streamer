const socket = io();
const messages = document.getElementById('messages');

socket.on('chat message', msg => addMessage(msg));
socket.on('emoji vote', emoji => addMessage(`Audience Reacted: ${emoji}`));

function addMessage(content) {
  const div = document.createElement('div');
  div.textContent = content;
  messages.appendChild(div);
  messages.scrollTop = messages.scrollHeight;
}

function sendMessage() {
  const input = document.getElementById('inputMessage');
  const msg = input.value.trim();
  if (msg) {
    socket.emit('chat message', msg);
    input.value = '';
  }
}

function vote(emoji) {
  socket.emit('emoji vote', emoji);
}

function toggleMenu() {
  const menu = document.getElementById('menu');
  menu.style.display = menu.style.display === 'flex' ? 'none' : 'flex';
}

function saveStreamKey() {
  const key = document.getElementById('streamKey').value;
  alert(`Stream Key Saved: ${key}`);
}

async function listCameras() {
  const devices = await navigator.mediaDevices.enumerateDevices();
  const selector = document.getElementById('cameraSelector');
  selector.innerHTML = '';
  devices
    .filter(device => device.kind === 'videoinput')
    .forEach((device, index) => {
      const option = document.createElement('option');
      option.value = device.deviceId;
      option.textContent = device.label || `Camera ${index + 1}`;
      selector.appendChild(option);
    });
}

async function startCamera() {
  const deviceId = document.getElementById('cameraSelector').value;
  const stream = await navigator.mediaDevices.getUserMedia({ video: { deviceId }, audio: true });
  document.getElementById('videoElement').srcObject = stream;
}

async function startGameStream() {
  try {
    const stream = await navigator.mediaDevices.getDisplayMedia({
      video: {
        displaySurface: "monitor",
        frameRate: 60,
        cursor: "always"
      },
      audio: {
        echoCancellation: true,
        noiseSuppression: true
      }
    });

    document.getElementById('videoElement').srcObject = stream;
    window.mediaStream = stream;
  } catch (err) {
    alert('Game streaming failed: ' + err.message);
  }
}
async function startRecording() {
  try {
    const stream = await navigator.mediaDevices.getDisplayMedia({ video: true, audio: true });
    document.getElementById('videoElement').srcObject = stream;
    window.recordingChunks = [];
    const mediaRecorder = new MediaRecorder(stream);

    mediaRecorder.ondataavailable = e => {
      if (e.data.size > 0) window.recordingChunks.push(e.data);
    };

    mediaRecorder.onstop = () => {
      const blob = new Blob(window.recordingChunks, { type: 'video/webm' });
      const url = URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = 'recording.webm';
      a.click();
    };

    mediaRecorder.start();
    document.getElementById('stopBtn').disabled = false;
    window.mediaRecorder = mediaRecorder;
  } catch (err) {
    alert('Could not start recording: ' + err.message);
  }
}

async function startWebcamOverlay() {
  const stream = await navigator.mediaDevices.getUserMedia({ video: true, audio: false });
  const cam = document.getElementById('webcamOverlay');
  cam.srcObject = stream;
  cam.style.display = 'block';
}

function stopRecording() {
  if (window.mediaRecorder) {
    window.mediaRecorder.stop();
    document.getElementById('stopBtn').disabled = true;
  }
}

function previewImage(event) {
  const file = event.target.files[0];
  const img = document.getElementById('mediaPreview');
  if (file) {
    img.src = URL.createObjectURL(file);
    img.style.display = 'block';
  } else {
    img.style.display = 'none';
  }
}

// Connectivity detection
window.addEventListener('load', () => {
  listCameras();
  document.getElementById('offlineNotice').style.display = navigator.onLine ? 'none' : 'block';
});

window.addEventListener('online', () => {
  document.getElementById('offlineNotice').style.display = 'none';
});

window.addEventListener('offline', () => {
  document.getElementById('offlineNotice').style.display = 'block';
});

function updateOverlay(title, note) {
  const titleEl = document.getElementById('streamTitle');
  const noteEl = document.getElementById('overlayNote');
  if (titleEl) titleEl.textContent = title;
  if (noteEl) noteEl.textContent = note;
}

function toggleOverlay() {
  const overlay = document.getElementById('overlayPanel');
  if (overlay) {
    const isVisible = overlay.style.display !== 'none';
    overlay.style.display = isVisible ? 'none' : 'block';
  }
}

function toggleOverlayImage() {
  const img = document.getElementById('overlayImage');
  img.style.display = (img.style.display === 'none' || !img.style.display) ? 'block' : 'none';
}

function toggleOverlayVideo() {
  const vid = document.getElementById('overlayVideo');
  vid.style.display = (vid.style.display === 'none' || !vid.style.display) ? 'block' : 'none';
}


function toggleWebcamOverlay() {
  const webcam = document.getElementById('webcamOverlay');
  if (!webcam) return;

  if (webcam.style.display === 'none' || !webcam.style.display) {
    navigator.mediaDevices.getUserMedia({ video: true, audio: false })
      .then(stream => {
        webcam.srcObject = stream;
        webcam.style.display = 'block';
      })
      .catch(err => {
        console.error('Webcam access denied:', err);
        alert('Could not access webcam: ' + err.message);
      });
  } else {
    const tracks = webcam.srcObject?.getTracks();
    if (tracks) tracks.forEach(track => track.stop());
    webcam.srcObject = null;
    webcam.style.display = 'none';
  }
}

