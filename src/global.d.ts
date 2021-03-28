declare global {
    interface Window {
      myAPI: MyAPI;
    }
  }
    
export interface MyAPI {
  openData: (func: Function) => void;
  saveData: (func: Function) => void;
  sendSaveData: (filepath: string, data: object) => void
  deleteData: (func: Function) => void;
}

