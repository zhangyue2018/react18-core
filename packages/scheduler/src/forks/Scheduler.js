import { push, pop, peek } from './SchedulerMinHeap';
import {
    ImmediatePriority,
    UserBlockingPriority,
    NormalPriority,
    LowPriority,
    IdlePriority
} from './SchedulerPriorities';

const maxSigned31BitInt = 1073741823; // 0b11111111 11111111 11111111 1111111--31个1
const IMMEDIATE_PRIORITY_TIMEOUT = -1;
const USER_BLOCKING_PRIORITY_TIMEOUT = 250;
const NORMAL_PRIORITY_TIMEOUT = 5000;
const LOW_PRIORITY_TIMEOUT = 10000;
const IDLE_PRIORITY_TIMEOUT = maxSigned31BitInt;
let scheduleHostCallback = null;
let startTime = -1;
let currentTask = null;
let taskIdCounter = 1;
let taskQueue = [];
const frameInterval = 5;  // 预期的时间间隔（也就是预期5s把这个任务执行完）

const channel = new MessageChannel();
let port1 = channel.port1;
let port2 = channel.port2;
port1.onmessage = performWorkUntilDeadline;

/**
 * 获取当前时间
 * @returns {number} 当前时间，以毫秒为单位
 */
function getCurrentTime() {
    return performance.now();
}

/**
 * 调度回调函数
 * @param {ImmediatePriority | UserBlockingPriority | NormalPriority | LowPriority | IdlePriority} priorityLevel 
 * @param {Function} callback 要执行的回调函数
 * @returns {Object} 新创建的任务对象
 */
export function scheduleCallback(priorityLevel, callback) {
    const currentTime = getCurrentTime();
    const startTime = currentTime;
    let timeout;
    switch(priorityLevel) {
        case ImmediatePriority:
            timeout = IMMEDIATE_PRIORITY_TIMEOUT;
            break;
        case UserBlockingPriority:
            timeout = USER_BLOCKING_PRIORITY_TIMEOUT;
            break;
        case IdlePriority:
            timeout = IDLE_PRIORITY_TIMEOUT;
            break;
        case LowPriority:
            timeout = LOW_PRIORITY_TIMEOUT;
            break;
        case NormalPriority:
        default:
            timeout = NORMAL_PRIORITY_TIMEOUT;
            break;
    }
    const expirationTime = startTime + timeout;
    const newTask = {
        id: taskIdCounter++,
        callback,
        priorityLevel,
        startTime,
        expirationTime,
        sortIndex: expirationTime
    }
    push(taskQueue, newTask);
    requestHostCallback(workLoop);
    return newTask;
}

/**
 * 判断是否应该交还控制权给主机
 * @returns {boolean} 如果应该交还控制权给主机，则返回true，否则返回false
 */
function shouldYieldToHost() {
    const timeElapsed = getCurrentTime() - startTime; // 当前时间减去任务开始时间（也就是这个任务已经执行占用的时间）
    if(timeElapsed < frameInterval) {
        return false;
    }
    return true;
}

/**
 * 工作循环，执行任务队列中的任务
 * @param {number} startTime 工作循环的开始时间
 * @returns {boolean} 如果还有未完成的任务，返回true，否则返回false
 */
function workLoop(startTime) {
    let currentTime = startTime;
    currentTask = peek(taskQueue);
    while(currentTask !== null) {
        if(currentTask.expirationTime > currentTime && shouldYieldToHost()) {
            break;
        }
        const callback = currentTask.callback;
        if(typeof callback === 'function') {
            currentTask.callback = null;
            const didUserCallbackTimeout = currentTask.expirationTime <= currentTime;
            const continueationCallback = callback(didUserCallbackTimeout);
            if(typeof continueationCallback === 'function') {
                currentTask.callback = continueationCallback;
                return true;
            }
            if(currentTask === peek(taskQueue)) {
                pop(taskQueue);
            }
        } else {
            pop(taskQueue);
        }
        currentTask = peek(taskQueue);
    }
    if(currentTask !== null) {
        return true;
    }
    return false;
}

/**
 * 请求主机回调
 * @param {Function} workLoop 工作循环函数
 */
function requestHostCallback(workLoop) {
    scheduleHostCallback = workLoop;
    schedulePerformWorkUntilDeadline();
}

/**
 * 安排执行工作直到截止时间
 */
function schedulePerformWorkUntilDeadline() {
    port2.postMessage(null); // 执行时机，让浏览器在下一个宏任务执行（比setTimeout稍微早一点）
}

/**
 * 执行工作直到截止时间
 */
function performWorkUntilDeadline() { // 注册的onmessage监听函数
    if(scheduleHostCallback) {
        startTime = getCurrentTime();
        let hasMoreWork = true;
        try {
            hasMoreWork = scheduleHostCallback(startTime);
        } finally {
            if(hasMoreWork) {
                schedulePerformWorkUntilDeadline();
            } else {
                scheduleHostCallback = null;
            }
        }
    }
}

export {
    scheduleCallback as unstable_scheduleCallback,
    shouldYieldToHost as unstable_shouldYield,
    ImmediatePriority as unstable_ImmediatePriority,
    UserBlockingPriority as unstable_UserBlockingPriority,
    NormalPriority as unstable_NormalPriority,
    LowPriority as unstable_LowPriority,
    IdlePriority as unstable_IdlePriority
}