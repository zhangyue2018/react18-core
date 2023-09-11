import { FiberNode } from "./ReactFiber";
import { markUpdateLaneFromFiberToRoot } from "./ReactFiberConcurrentUpdates";
import assigin from 'shared/assign';

// 定义状态更新的类型标签
export const UpdateState = 0;

/**
 * 初始化Fiber节点的更新队列
 * @param {FiberNode} fiber - 需要初始化更新队列的Fiber节点
 */
export function initialUpdateQueue(fiber) {
    const queue = {
        shared: {
            pending: null
        }
    };
    fiber.updateQueue = queue;
}

/**
 * 创建一个状态更新对象
 * @returns {Update} - 更新对象
 */
export function createUpdate() {
    const update = {tag: UpdateState};
    return update;
}

/**
 * 将更新对象添加到Fiber节点的更新队列中
 * @param {FiberNode} fiber - 需要添加更新的Fiber节点 
 * @param {Update} update - 待添加的更新对象 
 * @returns {FiberNode} - fiber根节点
 */
export function enqueueUpdate(fiber, update) {
    const updateQueue = fiber.updateQueue;
    const pending = updateQueue.shared.pending;
    if(pending === null) {
        update.next = update;
    } else {
        update.next = pending.next;
        pending.next = update;
    }
    updateQueue.shared.pending = update;

    return markUpdateLaneFromFiberToRoot(fiber);
}

/**
 * 根据老状态和更新队列中的更新，计算最新的状态
 * @param {FiberNode} workInProgress - 需要计算新状态的fiber节点 
 */
export function processUpdateQueue(workInProgress) {
    const queue = workInProgress.updateQueue;
    const pendingQueue = queue.shared.pending;
    if(pendingQueue !== null) {
        queue.shared.pending = null;
        const lastPendingUpdate = pendingQueue;
        const firstPendingUpdate = pendingQueue.next;

        lastPendingUpdate.next = null; // 把环断开
        let newState = workInProgress.memoizedState;
        let update = firstPendingUpdate;
        while(update) {
            newState = getStateFromUpdate(update, newState);
            update = update.next;
        }
        workInProgress.memoizedState = newState;
    }
}
/**
 * 根据老状态和更新对象计算新状态
 * @param {Update} update - 更新对象 
 * @param {*} prevState - 老状态
 * @returns {*} - 新状态
 */
function getStateFromUpdate(update, prevState) {
    const { payload } = update;
    return assigin({}, prevState, payload);
}