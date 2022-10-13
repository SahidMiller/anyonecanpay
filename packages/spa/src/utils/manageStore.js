import { get, set, createStore } from 'idb-keyval';
export const manageStore = createStore("manager");

export default manageStore;
