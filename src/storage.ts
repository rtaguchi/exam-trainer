import localForage from 'localforage';

const store = localForage.createInstance({
    name: 'app'
})
export const setState = (key: string, value: any) => store.setItem(key, value)
export const getState = (key: string): any => store.getItem(key);
export const deleteState = () => store.clear();