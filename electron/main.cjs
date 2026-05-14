const { app, BrowserWindow, dialog } = require('electron');
const path = require('path');
const { spawn } = require('child_process');
const http = require('http');

let mainWindow = null;
let pythonProcess = null;
const BACKEND_PORT = 8000;

function findPython() {
  const { execSync } = require('child_process');
  // 打包后 PATH 可能不同，优先尝试绝对路径
  const candidates = [
    '/usr/bin/python3',
    '/usr/local/bin/python3',
    '/opt/homebrew/bin/python3',
    'python3',
    'python',
  ];
  for (const cmd of candidates) {
    try {
      const result = execSync(`"${cmd}" --version 2>&1`, { encoding: 'utf-8' });
      if (result.includes('Python 3')) return cmd;
    } catch {}
  }
  return null;
}

function ensureDependencies(pythonCmd) {
  // 处理 asar 打包后的路径：server 被 asarUnpack 解包到 .unpacked 目录
  let serverDir = path.join(__dirname, '..', 'server');
  if (serverDir.includes('.asar')) {
    serverDir = serverDir.replace('.asar', '.asar.unpacked');
  }
  const { execSync } = require('child_process');
  try {
    execSync(`"${pythonCmd}" -m pip install -r "${path.join(serverDir, 'requirements.txt')}" -q 2>/dev/null`, {
      cwd: serverDir,
      stdio: 'ignore',
    });
    return true;
  } catch {
    return false;
  }
}

function startBackend(pythonCmd) {
  // 处理 asar 打包后的路径：server 被 asarUnpack 解包到 .unpacked 目录
  let serverDir = path.join(__dirname, '..', 'server');
  if (serverDir.includes('.asar')) {
    serverDir = serverDir.replace('.asar', '.asar.unpacked');
  }

  pythonProcess = spawn(pythonCmd, [
    '-m', 'uvicorn', 'main:app',
    '--host', '0.0.0.0',
    '--port', String(BACKEND_PORT),
  ], {
    cwd: serverDir,
    stdio: ['ignore', 'pipe', 'pipe'],
  });

  pythonProcess.stderr.on('data', (data) => {
    console.log('[Backend]', data.toString());
  });

  pythonProcess.on('error', (err) => {
    console.error('Failed to start backend:', err);
  });

  pythonProcess.on('exit', (code) => {
    console.log('Backend exited with code:', code);
    pythonProcess = null;
  });
}

function waitForBackend(retries = 30) {
  return new Promise((resolve) => {
    function check(n) {
      if (n <= 0) return resolve(false);
      http.get(`http://127.0.0.1:${BACKEND_PORT}/health`, (res) => {
        resolve(res.statusCode === 200);
      }).on('error', () => {
        setTimeout(() => check(n - 1), 500);
      });
    }
    check(retries);
  });
}

function createWindow() {
  mainWindow = new BrowserWindow({
    width: 1200,
    height: 800,
    minWidth: 800,
    minHeight: 600,
    title: '中文韵律标记助手',
    webPreferences: {
      preload: path.join(__dirname, 'preload.cjs'),
      nodeIntegration: false,
      contextIsolation: true,
    },
  });

  // Load built frontend
  const distPath = path.join(__dirname, '..', 'dist', 'index.html');
  mainWindow.loadFile(distPath);

  mainWindow.on('closed', () => {
    mainWindow = null;
  });
}

app.whenReady().then(async () => {
  const pythonCmd = findPython();
  if (!pythonCmd) {
    dialog.showErrorBox(
      '未找到 Python 3',
      '请先安装 Python 3。\n可从 python.org 下载，或用 brew install python3。'
    );
    app.quit();
    return;
  }

  // Ensure dependencies
  ensureDependencies(pythonCmd);

  // Start backend
  startBackend(pythonCmd);

  // Wait for backend readiness
  const ready = await waitForBackend();
  if (!ready) {
    dialog.showErrorBox(
      '后端启动失败',
      '无法启动分析服务，请确认 Python 3 和依赖已正确安装。'
    );
    app.quit();
    return;
  }

  // Create window
  createWindow();
});

app.on('window-all-closed', () => {
  if (pythonProcess) {
    pythonProcess.kill();
    pythonProcess = null;
  }
  app.quit();
});

app.on('before-quit', () => {
  if (pythonProcess) {
    pythonProcess.kill();
    pythonProcess = null;
  }
});
