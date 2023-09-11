import { scheduleCallback } from "scheduler";
import { createWorkInProgress } from './ReactFiber';
import { beginWork } from './ReactFiberBeginWork';

// 工作中的整个fiber树
let workInProgress = null;

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
    // commitRoot(root);
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

    workInProgress = null; // todo:别忘记删除
    // if(next === null) {
    //     completeUnitOfWork(unitOfWork);
    // } else {
    //     workInProgress = next;
    // }
}
/**
 * 完成一个工作单元
 * @param {*} unitOfWork - 工作单元
 */
function completeUnitOfWork(unitOfWork) {
    console.log('开始completeWork阶段');
}