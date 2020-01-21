// import { Worker, WorkerOptions } from 'worker_threads';

// namespace workerpool {
//     export class WorkerPool<T, N> {
//         private _taskQueue: TaskQueue<Task<T, N>> = new TaskQueue();
//         private _workersById: { [key: string]: Worker } = {};
//         private _activeWorkersById: { [key: string]: boolean } = {};
//         constructor(public filepath: string, public maxWorkers: number) {
//             this.init();
//         }
//         public run(getData: () => T) {
//             return new Promise<N>((resolve, reject) => {
//                 const availableWorkerId = this.getInactiveWorkerId();

//                 const newTask: Task<T, N> = {
//                     callback: (error, result) => {
//                         if (error) {
//                             return reject(error);
//                         }
//                         return resolve(result);
//                     },
//                     getData,
//                 };

//                 if (availableWorkerId === -1) {
//                     this._taskQueue.push(newTask);
//                     return null;
//                 }

//                 this.runWorker(availableWorkerId, newTask);
//             });
//         }
//         private init() {
//             if (this.maxWorkers < 1) {
//                 return null;
//             }
//             for (let i = 0; i < this.maxWorkers; i++) {
//                 const initWorker = new Worker(this.filepath);
//                 this._workersById[i] = initWorker;
//                 this._activeWorkersById[i] = false;
//             }
//         }

//         private getInactiveWorkerId(): number {
//             for (let i = 0; i < this.maxWorkers; i += 1) {
//                 if (!this._activeWorkersById[i]) {
//                     return i;
//                 }
//             }
//             return -1;
//         }

//         private async runWorker(workerId: number, task: Task<T, N>) {
//             const worker = this._workersById[workerId];
//             this._activeWorkersById[workerId] = true;
//             const messageCallback = (result: N) => {
//                 task.callback(null, result);
//                 cleanUp();
//             };
//             const errorCallback = (error: any) => {
//                 task.callback(error);
//                 cleanUp();
//             };
//             const cleanUp = () => {
//                 worker.removeAllListeners('message');
//                 worker.removeAllListeners('error');
//                 this._activeWorkersById[workerId] = false;
//                 if (this._taskQueue.length() === 0) {
//                     return null;
//                 }

//                 this.runWorker(workerId, this._taskQueue.pop()!);
//             };
//             worker.once('message', messageCallback);
//             worker.once('error', errorCallback);
//             worker.postMessage(await task.getData());
//         }
//     }

//     export class TaskQueue<T> {
//         private _store: T[] = [];
//         public push(val: T) {
//             this._store.push(val);
//         }

//         public pop(): T | undefined {
//             return this._store.shift();
//         }

//         public length(): number {
//             return this._store.length;
//         }
//     }

//     export interface Task<T, N> {
//         callback: TaskCallback<N>;
//         getData: () => T;
//     }

//     export type TaskCallback<N> = (err: any, result?: N) => void;
// }
