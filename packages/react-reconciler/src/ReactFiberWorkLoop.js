import { scheduleCallback } from "scheduler";
import { createWorkInProgress } from './ReactFiber';
import { beginWork } from './ReactFiberBeginWork';
import { completedWork } from './ReactFiberCompleteWork';
import { MutationMask, NoFlags, Passive } from "./ReactFiberFlags";
import {
    commitMutationEffectsOnFiber,
    commitPassiveUnmountEffects,
    commitPassiveMountEffects
} from './ReactFiberCommitWork';
import { finishQueueingConcurrentUpdates } from './ReactFiberConcurrentUpdates';

// 工作中的整个fiber树
let workInProgress = null;
let rootDoesHavePassiveEffect = false;
let rootWithPendingPassiveEffects = null;

/**
 * 在fiber上计划更新根节点
 * @param {*} root - 根节点
 */
export function scheduleUpdateOnFiber(root) {
    ensureRootIsScheduled(root);

}
/**
 * 确保根节点被调度执行
 * @param {*} root - 根节点
 */
function ensureRootIsScheduled(root) {
    scheduleCallback(performConcurrentWorkOnRoot.bind(null, root));
}
/**
 * 执行根节点上的并发工作
 * @param {*} root - 根节点
 */
function performConcurrentWorkOnRoot(root) {
    renderRootSync(root);
    const finishedWork = root.current.alternate;
    // fiberRoot的finishedWork和页面基本上是一致的（当然会有一个时间差）
    // fiberRoot.finishedWork完成赋值后，接着进行commitRoot操作，将真实DOM挂载到页面
    root.finishedWork = finishedWork;
    commitRoot(root);
}

/**
 * 提交根节点
 * @param {*} root - 根节点
 */
function commitRoot(root) {
    const { finishedWork } = root;
    if((finishedWork.subtreeFlags & Passive) !== NoFlags || (finishedWork.flags & Passive) !== NoFlags) {
        if(!rootDoesHavePassiveEffect) {
            rootDoesHavePassiveEffect = true;
            scheduleCallback(flushPassiveEffect);
        }
    }

    const subtreeHasEffects = (finishedWork.subtreeFlags & MutationMask) != NoFlags;
    const rootHasEffects = (finishedWork.flags & MutationMask) != NoFlags;

    if(subtreeHasEffects || rootHasEffects) {
        commitMutationEffectsOnFiber(finishedWork, root);
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

/**
 * 同步渲染根节点
 * @param {*} root 
 */
function renderRootSync(root) {
    prepareFreshStack(root);
    workLoopSync();
}
/**
 * 准备一个新的工作栈
 * @param {*} root - 根节点
 */
function prepareFreshStack(root) {
    workInProgress = createWorkInProgress(root.current, null); // root.current是rootFiber
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
    const next = beginWork(current, unitOfWork);
    unitOfWork.memoizedProps = unitOfWork.pendingProps;

    // workInProgress = null; // todo:别忘记删除
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
    } while(completeWork !== null)
}