import { scheduleCallback } from "scheduler";
import { createWorkInProgress } from './ReactFiber';

// 工作中的整个fiber树
let workInProgress = null;

export function scheduleUpdateOnFiber(root) {
    ensureRootIsScheduled(root);

}

function ensureRootIsScheduled(root) {
    scheduleCallback(performConcurrentWorkOnRoot.bind(null, root));
}

function performConcurrentWorkOnRoot(root) {
    renderRootSync(root);
    const finishedWork = root.current.alternate;
    // fiberRoot的finishedWork和页面基本上是一致的（当然会有一个时间差）
    // fiberRoot.finishedWork完成赋值后，接着进行commitRoot操作，将真实DOM挂载到页面
    root.finishedWork = finishedWork;
    // commitRoot(root);
}

function renderRootSync(root) {
    prepareFreshStack(root);
    workLoopSync();
}

function prepareFreshStack(root) {
    workInProgress = createWorkInProgress(root.current, null); // root.current是rootFiber
}

function workLoopSync() {
    while(workInProgress !== null) {
        performUnitOfWork(workInProgress);
    }
}

// unitOfWork是一个fiber
function performUnitOfWork(unitOfWork) {
    const current = unitOfWork.alternate;
    // current是老的节点（对应当前页面的节点），unitOfWork是新的节点
    const next = beginWork(current, unitOfWork);
    unitOfWork.memoizedProps = unitOfWork.pendingProps;
    if(next === null) {
        completeUnitOfWork(unitOfWork);
    } else {
        workInProgress = next;
    }
}

function completeUnitOfWork(unitOfWork) {
    console.log('开始completeWork阶段');
}