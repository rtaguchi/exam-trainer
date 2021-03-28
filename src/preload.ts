import { contextBridge, ipcRenderer } from 'electron'

contextBridge.exposeInMainWorld('myAPI', {
  openData: (func: Function) => {
    ipcRenderer.on('open', (event, args) => func(args))
  },
  saveData: (func: Function) => {
    ipcRenderer.on('save', (event, args) => func(args))
  },
  sendSaveData: (filepath: string, data: object) => {
    ipcRenderer.send('savedata', filepath, data)
  },
  deleteData: (func: Function) => {
    ipcRenderer.on('delete', (event, args) => func(args))
  }
})