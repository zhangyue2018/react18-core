import { HostRoot } from "./ReactWorkTags";
// 并发队列数组
const concurrentQueue = [];
// 并发队列索引
let concurrentQueuesIndex = 0;

/**
 * 将更新加入并发队列
 * @param {object} fiber - fiber对象
 * @param {object} queue - 更新队列
 * @param {object} update - 更新对象
 * @param {number} lane - 车道信息
 */
function enqueueUpdate(fiber, queue, update, lane) {
    concurrentQueue[concurrentQueuesIndex++] = fiber;
    concurrentQueue[concurrentQueuesIndex++] = queue;
    concurrentQueue[concurrentQueuesIndex++] = update;
    concurrentQueue[concurrentQueuesIndex++] = lane;
}

/**
 * 将钩子更新加入并发队列
 * @param {object} fiber - fiber对象
 * @param {object} queue - 更新队列
 * @param {object} update - 更新对象
 * @param {number} lane - 车道信息
 * @returns {object|null} - 更新的fiber的根，如果不存在则返回null
 */
export function enqueueConcurrentHookUpdate(fiber, queue, update, lane) {
    enqueueUpdate(fiber, queue, update, lane);
    return getRootForUpdateFiber(fiber);
}

/**
 * 将类组件更新加入并发队列
 * @param {object} fiber - fiber对象
 * @param {object} queue - 更新队列
 * @param {object} update - 更新对象
 * @param {number} lane - 车道信息
 * @returns {object|null} - 更新的fiber的根，如果不存在则返回null
 */
export function enqueueConcurrentClassUpdate(fiber, queue, update, lane) {
    enqueueUpdate(fiber, queue, update, lane);
    return getRootForUpdateFiber(fiber);
}

/**
 * 获取更新的fiber的根节点
 * @param {object} sourceFiber - 源fiber节点
 * @returns {object|null} fiber的根节点，如果不存在则返回null
 */
function getRootForUpdateFiber(sourceFiber) {
    let node = sourceFiber;
    let parent = node.return;
    while(parent !== null) {
        node = parent;
        parent = node.return;
    }
    return node.tag === HostRoot ? node.stateNode : null;
}

/**
 * 完成并发更新的排队
 */
export function finishQueueingConcurrentUpdates() {
    const endIndex = concurrentQueuesIndex;
    concurrentQueuesIndex = 0;
    let i=0;
    while(i < endIndex) {
        const fiber = concurrentQueue[i++];
        const queue = concurrentQueue[i++];
        const update = concurrentQueue[i++];
        const lane = concurrentQueue[i++];
        if(queue !== null && update !== null) {
            const pending = queue.pending;
            if(pending === null) {
                update.next = update;
            } else {
                update.next = pending.next;
                pending.next = update;
            }
            queue.pending = update
        }
    }
}

export function markUpdateLaneFromFiberToRoot(sourceFiber) {
    let node = sourceFiber;
    let parent = sourceFiber.return;
    while(parent !== null) {
        node = parent;
        parent = parent.return;
    }
    if(node.tag === HostRoot) {
        return node.stateNode
    }
    return null;
}

