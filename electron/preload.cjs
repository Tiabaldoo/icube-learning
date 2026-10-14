const { contextBridge, ipcRenderer } = require('electron');
contextBridge.exposeInMainWorld('learningContent', {
  load: () => ipcRenderer.invoke('learning-content:load'),
  check: () => ipcRenderer.invoke('learning-content:check'),
  install: () => ipcRenderer.invoke('learning-content:install'),
});
