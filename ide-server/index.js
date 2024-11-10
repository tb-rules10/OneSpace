const http = require('http');
const express = require('express');
const pty = require('node-pty');
const fs = require('fs/promises');
const path = require('path');
const cors = require('cors');
const chokidar = require('chokidar');
const { Server: SocketServer } = require('socket.io');

// Configurations
const bashPath = process.env.BASH_PATH || 'C:\\Program Files\\Git\\bin\\bash.exe';
const userDir = path.resolve(__dirname, 'playgrounds'); // Base user directory
const port = process.env.PORT || 5000;

// Initialize Express and HTTP Server
const app = express();
const server = http.createServer(app);
const io = new SocketServer(server, {
  cors: { origin: '*' }
});

app.use(cors());
app.use(express.json());

// Node-PTY Process
const ptyProcess = pty.spawn(bashPath, [], {
  name: 'xterm-color',
  cols: 80,
  rows: 30,
  cwd: userDir,
  env: process.env,
});

ptyProcess.onData((data) => io.emit('terminal:data', data));

chokidar.watch(userDir, {
  ignored: /(^|[\/\\])node_modules/,
  persistent: true
}).on('all', (event, filePath) => {
  // Detect file changes and emit refresh event
  io.emit('file-refresh');
});

// Socket.IO Connection
io.on('connection', (socket) => {
  console.log('-->> Socket connected:', socket.id);

  // Handle code update from client
  socket.on('code-update', async (content, filePath) => {
    const fullPath = path.join(userDir, filePath);
    try {
      // Ensure that the directory exists
      const dirPath = path.dirname(fullPath);
      await fs.mkdir(dirPath, { recursive: true });

      // Write content to the file
      await fs.writeFile(fullPath, content);
      console.log(`File updated: ${filePath}`);
    } catch (error) {
      console.error(`Error writing file: ${error.message}`);
      socket.emit('error', { message: 'Failed to update file' });
    }
  });

  // Handle terminal write from client
  socket.on('terminal:write', (data) => {
    ptyProcess.write(data);
  });

  // Cleanup on disconnect
  socket.on('disconnect', () => {
    console.log('-->> Socket disconnected:', socket.id);
  });
});

// Routes
app.get('/', (req, res) => {
  res.json({ msg: "Hi from TB!" });
});

// Get file tree structure
app.get('/files', async (req, res) => {
  const projectName = req.query.projectName;

  if (!projectName) 
    return res.status(400).json({ error: 'Project name is required' });

  const projectDir = path.resolve(userDir, projectName);

  try {
    const folderExists = await fs
      .access(projectDir, fs.constants.F_OK)
      .then(() => true)
      .catch(() => false);

    if (!folderExists) 
      await fs.mkdir(projectDir, { recursive: true });

    const fileTree = await generateFileTree(projectDir);
    res.json({ tree: fileTree });
  } catch (error) {
    console.error('Error generating file tree:', error);
    res.status(500).json({ error: 'Failed to generate file tree' });
  }
});

// Get file content
app.get('/files/content', async (req, res) => {
  const projectName = req.query.projectName; 
  const filePath = req.query.path;
  const fullPath = path.join(projectName, filePath);

  if (!filePath) 
    return res.status(400).json({ error: 'File path is required' });

  try {
    const content = await fs.readFile(path.join(userDir, fullPath), 'utf-8');
    res.json({ content });
  } catch (error) {
    console.error("Error reading file:", error);
    res.status(404).json({ error: "File not found" });
  }
});

// Generate file tree structure
async function generateFileTree(directory) {
  const tree = {};

  async function buildTree(currDir, currTree) {
    const files = await fs.readdir(currDir);

    for (const file of files) {
      const filePath = path.join(currDir, file);
      const stat = await fs.stat(filePath);

      if (stat.isDirectory()) {
        if (file !== 'node_modules') {
          currTree[file] = {};
          await buildTree(filePath, currTree[file]);
        }
      } else {
        currTree[file] = null;
      }
    }
  }

  await buildTree(directory, tree);
  return tree;
}

// Start Server
server.listen(port, () => {
  console.log(`🐋 Server running on port ${port}`);
});
