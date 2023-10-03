import {
    scheduleCallback as Scheduler_scheduleCallback,
    shouldYield,
    ImmediatePriority as ImmediateSchedulerPriority,
    UserBlockingPriority as UserBlockingSchedulerPriority,
    NormalPriority as NormalSchedulerPriority,
    IdlePriority as IdleSchedulerPriority,
} from "./Scheduler";
import { createWorkInProgress } from './ReactFiber';
import { beginWork } from './ReactFiberBeginWork';
import { completedWork } from './ReactFiberCompleteWork';
import { MutationMask, NoFlags, Passive } from "./ReactFiberFlags";
import {
    commitMutationEffectsOnFiber,
    commitPassiveUnmountEffects,
    commitPassiveMountEffects,
    commitLayoutEffects
} from './ReactFiberCommitWork';
import { finishQueueingConcurrentUpdates } from './ReactFiberConcurrentUpdates';
import {
    ContinuousEventPriority,
    DefaultEventPriority,
    DiscreteEventPriority,
    IdleEventPriority,
    getCurrentUpdatePriority,
    lanesToEventPriority,
    setCurrentUpdatePriority
} from "./ReactEventPriorities";
import { NoLane, NoLanes, SyncLane, getHighestPriorityLane, getNextLanes, includesBlockingLane, markRootUpdated } from "./ReactFiberLane";
import { getCurrentEventPriority } from 'react-dom-bindings/src/client/ReactDOMHostConfig';
import { scheduleSyncCallback, flushSyncCallbacks } from './ReactFiberSyncTaskQueue';

let workInProgressRoot = null;
let workInProgressRootRenderLanes = NoLanes;

// 工作中的整个fiber树
let workInProgress = null;
let rootDoesHavePassiveEffect = false;
let rootWithPendingPassiveEffects = null;

const RootInProgress = 0;
const RootCompleted = 5;
let workInProgressRootExitStatus = RootInProgress;

/**
 * 在fiber上计划更新根节点
 * @param {*} root - 根节点
 */
export function scheduleUpdateOnFiber(root, fiber, lane) {
    markRootUpdated(root, lane);
    ensureRootIsScheduled(root);
}
/**
 * 确保根节点被调度执行
 * @param {*} root - 根节点
 */
function ensureRootIsScheduled(root) {
    const nextLanes = getNextLanes(root, NoLanes);
    if(nextLanes === NoLanes) {
        return;
    }
    let newCallbackPriority = getHighestPriorityLane(nextLanes);
    let newCallbackNode;

    if(newCallbackPriority === SyncLane) {
        scheduleSyncCallback(performSyncWorkOnRoot.bind(null, root));
        queueMicrotask(flushSyncCallbacks);
        newCallbackNode = null;
    } else {
        let schedulerPriorityLevel;
        switch(lanesToEventPriority(nextLanes)) {
            case DiscreteEventPriority:
                schedulerPriorityLevel = ImmediateSchedulerPriority;
                break;
            case ContinuousEventPriority:
                schedulerPriorityLevel = UserBlockingSchedulerPriority;
                break;
            case DefaultEventPriority:
                schedulerPriorityLevel = NormalSchedulerPriority;
                break;
            case IdleEventPriority:
                schedulerPriorityLevel = IdleSchedulerPriority;
                break;
            default:
                schedulerPriorityLevel = NormalSchedulerPriority;
                break;
        }
        newCallbackNode = Scheduler_scheduleCallback(schedulerPriorityLevel, performConcurrentWorkOnRoot.bind(null, root));
    }
    root.callbackNode = newCallbackNode;
}

function performSyncWorkOnRoot(root){
    const lanes = getNextLanes(root);
    renderRootSync(root, lanes);
    const finishedWork = root.current.alternate;
    root.finishedWork = finishedWork;
    commitRoot(root);
    return null;
}

/**
 * 执行根节点上的并发工作
 * @param {*} root - 根节点
 */
function performConcurrentWorkOnRoot(root, didTimeout) {
    const originalCallbackNode = root.callbackNode;
    const lanes = getNextLanes(root, NoLanes);
    if(lanes === NoLanes) {
        return null;
    }
    // 不包括阻塞车道，而且没有超时，则可以用时间切片
    const shouldTimeSlice = !includesBlockingLane(root, lanes) && !didTimeout;
    const exitStatus = shouldTimeSlice ? renderRootConcurrent(root, lanes) : renderRootSync(root, lanes);
    // 根节点下面的任务都执行完了
    if(exitStatus !== RootInProgress) {
        const finishedWork = root.current.alternate;
        // fiberRoot的finishedWork和页面基本上是一致的（当然会有一个时间差）
        // fiberRoot.finishedWork完成赋值后，接着进行commitRoot操作，将真实DOM挂载到页面
        root.finishedWork = finishedWork;
        commitRoot(root);
    }
    if(root.callbackNode === originalCallbackNode) {
        return performConcurrentWorkOnRoot.bind(null, root);
    }
    return null;
}

/**
 * 提交根节点
 * @param {*} root - 根节点
 */
function commitRoot(root) {
    const previousUpdatePriority = getCurrentUpdatePriority();
    try {
        setCurrentUpdatePriority(DiscreteEventPriority);
        commitRootImpl(root);
    } finally {
        setCurrentUpdatePriority(previousUpdatePriority);
    }
    
}

function commitRootImpl(root) {
    const { finishedWork } = root;
    workInProgressRoot = null;
    workInProgressRootRenderLanes = null;

    if((finishedWork.subtreeFlags & Passive) !== NoFlags || (finishedWork.flags & Passive) !== NoFlags) {
        if(!rootDoesHavePassiveEffect) {
            rootDoesHavePassiveEffect = true;
            Scheduler_scheduleCallback(NormalSchedulerPriority, flushPassiveEffect);
        }
    }

    root.callbackNode = null;
    const subtreeHasEffects = (finishedWork.subtreeFlags & MutationMask) != NoFlags;
    const rootHasEffects = (finishedWork.flags & MutationMask) != NoFlags;

    if(subtreeHasEffects || rootHasEffects) {
        commitMutationEffectsOnFiber(finishedWork, root);
        commitLayoutEffects(finishedWork, root);
        if(rootDoesHavePassiveEffect) {
            rootDoesHavePassiveEffect = false;
            rootWithPendingPassiveEffects = root;
        }
    }
    root.current = finishedWork;
}

function flushPassiveEffect() {
    if(rootWithPendingPassiveEffects !== null) {
        const root = rootWithPendingPassiveEffects;
        commitPassiveUnmountEffects(root, root.current);
        commitPassiveMountEffects(root, root.current);
    }
}


function renderRootConcurrent(root, renderLanes) {
    if(workInProgressRoot !== root || workInProgressRootRenderLanes !== renderLanes) {
        prepareFreshStack(root, renderLanes);
    }
    workLoopConcurrent();
    if(workInProgress !== null) {
        return RootInProgress;
    }
    return workInProgressRootExitStatus;
}

function workLoopConcurrent() {
    while(workInProgress !== null && !shouldYield()) {
        performUnitOfWork(workInProgress);
    }
}

/**
 * 同步渲染根节点
 * @param {*} root 
 */
function renderRootSync(root, renderLanes) {
    if(root !== workInProgressRoot || workInProgressRootRenderLanes !== renderLanes) {
        prepareFreshStack(root, renderLanes);
    }
    workLoopSync();
}
/**
 * 准备一个新的工作栈
 * @param {*} root - 根节点
 */
function prepareFreshStack(root, renderLanes) {
    workInProgress = createWorkInProgress(root.current, null); // root.current是rootFiber
    workInProgressRootRenderLanes = renderLanes;
    workInProgressRoot = root;
    finishQueueingConcurrentUpdates();
}
/**
 * 同步工作循环
 */
function workLoopSync() {
    while(workInProgress !== null) {
        performUnitOfWork(workInProgress);
    }
}

/**
 * 执行一个工作单元
 * @param {*} unitOfWork - 工作单元
 */
// unitOfWork是一个fiber
function performUnitOfWork(unitOfWork) {
    const current = unitOfWork.alternate;
    // current是老的节点（对应当前页面的节点），unitOfWork是新的节点
    const next = beginWork(current, unitOfWork, workInProgressRootRenderLanes);
    unitOfWork.memoizedProps = unitOfWork.pendingProps;

    if(next === null) {
        completeUnitOfWork(unitOfWork);
    } else {
        workInProgress = next;
    }
}
/**
 * 完成一个工作单元
 * @param {*} unitOfWork - 工作单元
 */
function completeUnitOfWork(unitOfWork) {
    let completeWork = unitOfWork;
    do {
        const current = completeWork.alternate;
        const returnFiber = completeWork.return;
        completedWork(current, completeWork);
        const siblingFiber = completeWork.sibling;
        if(siblingFiber !== null) {
            workInProgress = siblingFiber;
            return;
        }
        completeWork = returnFiber;
        workInProgress = completeWork;
    } while(completeWork !== null);

    if(workInProgressRootExitStatus === RootInProgress) {
        workInProgressRootExitStatus = RootCompleted;
    }
}

export function requestUpdateLane() {
    const updateLane = getCurrentUpdatePriority();
    if(updateLane !== NoLane) {
        return updateLane;
    }
    const eventLane = getCurrentEventPriority();
    return eventLane;
}