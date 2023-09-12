// import { appendInitialChild } from "react-dom-bindings/src/client/ReactDOMHostConfig";
import { MutationMask, Placement } from "./ReactFiberFlags";
import { HostComponent, HostRoot, HostText } from "./ReactWorkTags";
import { appendInitialChild, insertBefore } from "react-dom-bindings/src/client/ReactDOMHostConfig";

/**
 * 递归遍历所有子节点并在每个fiber上应用mutation副作用
 * @param {Fiber} root - Fiber树的根节点
 * @param {Fiber} parentFiber - 当前fiber节点的父节点
 */
function recursivelyTraverMutationEffects(root, parentFiber) {
    if(parentFiber.subtreeFlags & MutationMask) {
        let { child } = parentFiber;
        while(child !== null) {
            commitMutationEffectsOnFiber(child, root);
            child = child.sibling;
        }
    }
}

/**
 * 应用fiber节点上的调和副作用
 * @param {Fiber} finishedWork - 已完成的工作单位，即fiber节点
 */
function commitReconciliationEffects(finishedWork) {
    const { flags } = finishedWork;
    if(flags & Placement) {
        commitPlacement(finishedWork);
    }
}

/**
 * 判断是否为宿主父节点
 * @param {Fiber} fiber - fiber节点
 * @returns {boolean} - 是宿主父节点则返回true，否则返回false
 */
function isHostParent(fiber) {
    return fiber.tag === HostComponent || fiber.tag === HostRoot;
}

/**
 * 获取fiber节点的宿主父节点
 * @param {Fiber} fiber - fiber 
 * @returns {Fiber} - fiber节点的宿主父节点
 */
function getHostParentFiber(fiber) {
    let parent = fiber.return;
    while(parent !== null) {
        if(isHostParent(parent)) {
            return parent;
        }
        parent = parent.return;
    }
}

/**
 * 获取宿主兄弟节点
 * @param {Fiber} fiber - fiber
 * @returns {Node|null} - 如果存在宿主兄弟节点则返回，否则返回null
 */
function getHostSibling(fiber) {
    let node = fiber;
    sibling: while(true) {
        while(node.sibling === null) {
            if(node.return === null || isHostParent(node.return)) {
                return null;
            }
            node = node.return;
        }
        node = node.sibling;
        
        while(node.tag !== HostComponent && node.tag !== HostText) {
            if(node.flags & Placement) {
                continue sibling;
            } else {
                node = node.child;
            }
        }
        if(!(node.flags & Placement)) {
            return node.stateNode
        }
    }
}

/**
 * 将节点插入或者附加到父节点
 * @param {Fiber} node - fiber
 * @param {Node} before - 参考节点 
 * @param {Node} parent - 父节点
 */
function insertOrAppendPlacementNode(node, before, parent) {
    const { tag } = node;
    const isHost = tag === HostComponent || tag === HostText;
    if(isHost) {
        const { stateNode } = node;
        if(before) {
            insertBefore(parent, stateNode, before);
        } else {
            appendInitialChild(parent, stateNode);
        }
    } else {
        const { child } = node;
        if(child) {
            insertOrAppendPlacementNode(child, before, parent);
            let { sibling } = child;
            while(sibling !== null) {
                insertOrAppendPlacementNode(sibling, before, parent);
                sibling = sibling.sibling;
            }
        }
    }
}

/**
 * 提交位置
 * @param {Fiber} finishedWork - 已完成的工作单位，即fiber节点 
 */
function commitPlacement(finishedWork) {
    const parentFiber = getHostParentFiber(finishedWork);
    switch(parentFiber.tag) {
        case HostRoot: {
            const parent = parentFiber.stateNode.containerInfo;
            const before = getHostSibling(finishedWork);
            insertOrAppendPlacementNode(finishedWork, before, parent);
            break;
        }
        case HostComponent: {
            const parent = parentFiber.stateNode;
            const before = getHostSibling(finishedWork);
            insertOrAppendPlacementNode(finishedWork, before, parent);
            break;
        }
    }

}

/**
 * 遍历fiber树并在每个fiber上应用mutation副作用
 * @param {Fiber} finishedWork - 已完成的工作单位，即fiber节点
 * @param {Fiber} root - fiber树的根节点
 */
export function commitMutationEffectsOnFiber(finishedWork, root) {
    switch(finishedWork.tag) {
        case HostRoot:
        case HostComponent:
        case HostText: {
            recursivelyTraverMutationEffects(root, finishedWork);
            commitReconciliationEffects(finishedWork);
        }
    }
}