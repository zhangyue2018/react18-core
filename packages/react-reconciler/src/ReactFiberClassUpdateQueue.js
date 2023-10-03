import { FiberNode } from "./ReactFiber";
import { markUpdateLaneFromFiberToRoot, enqueueConcurrentClassUpdate } from "./ReactFiberConcurrentUpdates";
import assigin from 'shared/assign';
import { NoLanes, isSubsetOfLane, mergeLanes } from "./ReactFiberLane";

// 定义状态更新的类型标签
export const UpdateState = 0;

/**
 * 初始化Fiber节点的更新队列
 * @param {FiberNode} fiber - 需要初始化更新队列的Fiber节点
 */
export function initialUpdateQueue(fiber) {
    const queue = {
        baseState: fiber.memoizedState,
        firstBaseUpdate: null,
        lastBaseUpdate: null,
        shared: {
            pending: null
        }
    };
    fiber.updateQueue = queue;
}

/**
 * 创建更新对象
 * @param {number} lane - 车道信息
 * @returns {object} 返回一个新的更新对象
 */
export function createUpdate(lane) {
    const update = { tag: UpdateState, lane, next: null };
    return update;
}

/**
 * 将更新对象添加到Fiber节点的更新队列中
 * @param {object} fiber - 需要添加更新的Fiber节点
 * @param {object} update - 待添加的更新对象 
 * @param {number} lane - 车道信息
 * @returns {object} - 更新后的fiber对象
 */
export function enqueueUpdate(fiber, update, lane) {
    const updateQueue = fiber.updateQueue;
    const sharedQueue = updateQueue.shared;
    return enqueueConcurrentClassUpdate(fiber, sharedQueue, update, lane);
}

/**
 * 处理更新队列
 * @param {object} workInProgress - 当前工作的fiber
 * @param {*} nextProps - 下一个属性集合
 * @param {*} renderLanes - 渲染车道
 */
export function processUpdateQueue(workInProgress, nextProps, renderLanes) {
    const queue = workInProgress.updateQueue;
    let firstBaseUpdate = queue.firstBaseUpdate;
    let lastBaseUpdate = queue.lastBaseUpdate;
    const pendingQueue = queue.shared.pending;
    if(pendingQueue !== null) {
        queue.shared.pending = null;
        const lastPendingUpdate = pendingQueue;
        const firstPendingUpdate = lastPendingUpdate.next;
        lastPendingUpdate.next = null;
        if(lastBaseUpdate === null) {
            firstBaseUpdate = firstPendingUpdate;
        } else {
            lastBaseUpdate.next = firstPendingUpdate;
        }
        lastBaseUpdate = lastPendingUpdate;
    }

    // firstBaseUpdate是肯定不为null的
    if(firstBaseUpdate !== null) {
        let newState = queue.baseState;
        let newLanes = NoLanes;
        let newBaseState = null;
        let newFirstBaseUpdate = null;
        let newLastBaseUpdate = null;
        let update = firstBaseUpdate;

        do {
            const updateLane = update.lane;
            if(!isSubsetOfLane(renderLanes, updateLane)) {
                const clone = {
                    id: update.id,
                    lane: updateLane,
                    payload: update.payload
                };
                if(newLastBaseUpdate === null) {
                    newFirstBaseUpdate = newLastBaseUpdate = clone;
                    newBaseState = newState;
                } else {
                    newLastBaseUpdate = newLastBaseUpdate.next = clone;
                }
                newLanes = mergeLanes(newLanes, updateLane);
            } else {
                if(newLastBaseUpdate !== null) {  // 保证更新顺序的一致性
                    const clone = {
                        id: update.id,
                        lane: 0,
                        payload: update.payload
                    };
                    newLastBaseUpdate = newLastBaseUpdate.next = clone;
                }
                newState = getStateFromUpdate(update, newState);
            }
            update = update.next;
        } while(update);

        if(!newLastBaseUpdate) {
            newBaseState = newState;
        }
        queue.baseState = newBaseState;
        queue.firstBaseUpdate = newFirstBaseUpdate;
        queue.lastBaseUpdate = newLastBaseUpdate;
        workInProgress.lanes = newLanes;
        workInProgress.memoizedState = newState;
    }
}
/**
 * 根据老状态和更新对象计算新状态
 * @param {object} update - 更新对象 
 * @param {*} prevState - 上一个状态
 * @param {*} nextProps - 下一个属性集合
 * @returns {*} - 新状态
 */
function getStateFromUpdate(update, prevState, nextProps) {
    const { payload } = update;
    return assigin({}, prevState, payload);
}

/**
 * 克隆更新队列
 * @param {object} current - 当前状态下的fiber对象
 * @param {object} workInProgress - 正在工作的fiber对象
 */
export function cloneUpdateQueue(current, workInProgress) {
    const workInProgressQueue = workInProgress.updateQueue;
    const currentQueue = current.updateQueue;
    if(currentQueue === workInProgressQueue) {
        const clone = {
            baseState: currentQueue.baseState,
            firstBaseUpdate: currentQueue.firstBaseUpdate,
            lastBaseUpdate: currentQueue.lastBaseUpdate,
            shared: currentQueue.shared
        };
        workInProgress.updateQueue = clone;
    }
}