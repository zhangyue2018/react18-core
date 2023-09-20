import { NoFlags, Update } from "./ReactFiberFlags";
import { HostRoot, HostComponent, HostText, FunctionComponent } from "./ReactWorkTags";
import {
    createTextInstance,
    createInstance,
    appendInitialChild,
    finalizeInitialChildren,
    prepareUpdate
} from 'react-dom-bindings/src/client/ReactDOMHostConfig'

/**
 * 为完成的fiber节点对应的DOM节点添加所有子DOM节点
 * @param {DOM} parent - 完成的fiber节点对应的真实DOM节点 
 * @param {*} workInProgress - 已完成的fiber节点
 * @returns 
 */
function appendAllChildren(parent, workInProgress) {
    let node = workInProgress.child;
    while(node) {
        if(node.tag === HostComponent || node.tag === HostText) {
            appendInitialChild(parent, node.stateNode);
        } else if(node.child !== null) {
            node = node.child;
            continue;
        }
        if(node === workInProgress) {
            return;
        }
        while(node.sibling === null) {
            if(node.return === null || node.return === workInProgress) {
                return;
            }
            node = node.return;
        }
        node = node.sibling;
    }
}

function markUpdate(workInProgress) {
    workInProgress.flags |= Update;
}

function updateHostComponent(current, workInProgress, type, newProps) {
    const oldProps = current.memoizedProps;
    const instance = workInProgress.stateNode;
    const updatePayload = prepareUpdate(instance, type, oldProps, newProps);
    workInProgress.updateQueue = updatePayload;
    if(updatePayload) {
        markUpdate(workInProgress);
    }
}

/**
 * 完成一个fiber节点
 * @param {Fiber} current - 当前旧的Fiber节点
 * @param {Fiber} workInProgress - 新建的Fiber节点
 */
export function completedWork(current, workInProgress) {
    const newProps = workInProgress.pendingProps;
    switch(workInProgress.tag) {
        case HostRoot:
            bubbleProperties(workInProgress);
            break;
        case HostComponent:
            const { type } = workInProgress;
            if(current !== null && workInProgress.stateNode !== null) {
                updateHostComponent(current, workInProgress, type, newProps);
            } else {
                const instance = createInstance(type, newProps, workInProgress);
                appendAllChildren(instance, workInProgress);
                workInProgress.stateNode = instance;
                finalizeInitialChildren(instance, type, newProps);
            }
            bubbleProperties(workInProgress);
            break;
        case FunctionComponent:
            bubbleProperties(workInProgress);
            break;
        case HostText:
            const newText = newProps;
            workInProgress.stateNode = createTextInstance(newText);
            workInProgress.child = null; // 为了解决bubbleProperties的bug添加，如果后期出错，需要再改动
            bubbleProperties(workInProgress);
            break;
    }
}

/**
 * 冒泡处理已完成的Fiber节点的属性
 * @param {Fiber} completedWork - 已完成的Fiber节点
 */
function bubbleProperties(completedWork) {
    let subtreeFlags = NoFlags;
    let child = completedWork.child;
    while(child !== null) {
        subtreeFlags |= child.subtreeFlags;
        subtreeFlags |= child.flags;
        child = child.sibling;
    }
    completedWork.subtreeFlags = subtreeFlags;
}