import { MutationMask, Passive, Placement, Update, LayoutMask } from "./ReactFiberFlags";
import { FunctionComponent, HostComponent, HostRoot, HostText } from "./ReactWorkTags";
import { appendInitialChild, insertBefore, commitUpdate } from "react-dom-bindings/src/client/ReactDOMHostConfig";
import { HasEffect as HookHasEffect, Passive as HookPassive, Layout as HookLayout } from "./ReactHookEffectTags";

export function commitPassiveUnmountEffects(root, finishedWork) {  // destroy
    commitPassiveUnmountOnFiber(root, finishedWork);
}

export function commitPassiveMountEffects(root, finishedWork) {  // create
    commitPassiveMountOnFiber(root, finishedWork);
}

function commitPassiveUnmountOnFiber(root, finishedWork) {
    const flags = finishedWork.flags;
    switch(finishedWork.tag) {
        case HostRoot:
            recursivelyTranversePassiveUnmountEffects(root, finishedWork);
            break;
        case FunctionComponent:
            recursivelyTranversePassiveUnmountEffects(root, finishedWork);
            if(flags & Passive) {
                commitHookPassiveUnmountEffects(finishedWork, HookHasEffect | HookPassive);
            }
    }
}

function commitPassiveMountOnFiber(finishedRoot, finishedWork) {
    const flags = finishedWork.flags;
    switch(finishedWork.tag) {
        case HostRoot:
            recursivelyTranversePassiveMountEffects(finishedRoot, finishedWork);
            break;
        case FunctionComponent:
            recursivelyTranversePassiveMountEffects(finishedRoot, finishedWork);
            if(flags & Passive) {
                commitHookPassiveMountEffects(finishedWork, HookHasEffect | HookPassive);
            }
            break;
    }
}

function recursivelyTranversePassiveUnmountEffects(root, parentFiber) {
     if(parentFiber.subtreeFlags & Passive) {
        let child = parentFiber.child;
        while(child !== null) {
            commitPassiveUnmountOnFiber(root, child);
            child = child.sibling;
        }
    }
}

function recursivelyTranversePassiveMountEffects(root, parentFiber) {
    if(parentFiber.subtreeFlags & Passive) {
        let child = parentFiber.child;
        while(child !== null) {
            commitPassiveMountOnFiber(root, child);
            child = child.sibling;
        }
    }
}

function commitHookPassiveUnmountEffects(finishedWork, hookFlags) {
    commitHookEffectListUnmount(hookFlags, finishedWork);
}

function commitHookPassiveMountEffects(finishedWork, hookFlags) {
    commitHookEffectListMount(hookFlags, finishedWork);
}

function commitHookEffectListUnmount(flags, finishedWork) {
    const updateQueue = finishedWork.updateQueue;
    const lastEffect = updateQueue !== null ? updateQueue.lastEffect : null;
    if(lastEffect !== null) {
        const firstEffect = lastEffect.next;
        let effect = firstEffect;
        do {
            if((effect.tag & flags) === flags) {
                const destroy = effect.destroy;
                if(destroy !== undefined) {
                    effect.destroy = undefined;
                    destroy();
                }
            }
            effect = effect.next;
        } while(effect !== firstEffect)
    }
}

function commitHookEffectListMount(flags, finishedWork) {
    const updateQueue = finishedWork.updateQueue;
    const lastEffect = updateQueue !== null ? updateQueue.lastEffect : null;
    if(lastEffect !== null) {
        const firstEffect = lastEffect.next;
        let effect = firstEffect;
        do {
            if((effect.tag & flags) === flags) {
                const create = effect.create;
                effect.destroy = create();
            }
            effect = effect.next;
        } while(effect !== firstEffect)
    }
}

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
    const flags = finishedWork.flags;
    const current = finishedWork.alternate;
    switch(finishedWork.tag) {
        case FunctionComponent:
        case HostRoot:
        case HostText: {
            recursivelyTraverMutationEffects(root, finishedWork);
            commitReconciliationEffects(finishedWork);
        };
        case HostComponent: {
            recursivelyTraverMutationEffects(root, finishedWork);
            commitReconciliationEffects(finishedWork);
            if(flags & Update) {
                const instance = finishedWork.stateNode;
                if(instance !== null) {
                    const newProps = finishedWork.memoizedProps;
                    const oldProps = current !== null ? current.memoizedProps : newProps;
                    const type = finishedWork.type;
                    const updatePayload = finishedWork.updateQueue;
                    finishedWork.updateQueue = null;
                    if(updatePayload) {
                        commitUpdate(instance, updatePayload, type, oldProps, newProps, finishedWork);
                    }
                }
                if(flags & LayoutMask) {
                    commitHookEffectListUnmount(HookLayout, finishedWork);
                }
            }
            break;
        }
    }
}

export function commitLayoutEffects(finishedWork, root) {
    const current = finishedWork.alternate;
    commitLayoutEffectOnFiber(root, current, finishedWork);
}

function commitLayoutEffectOnFiber(finishedRoot, current, finishedWork) {
    const flags = finishedWork.flags;
    switch(finishedWork.tag) {
        case HostRoot:
            recursivelyTraverseLayoutEffects(finishedRoot, finishedWork);
            break;
        case FunctionComponent:
            recursivelyTraverseLayoutEffects(finishedRoot, finishedWork);
            if(flags & LayoutMask) {
                commitHookLayoutEffects(finishedWork, HookHasEffect | HookLayout);
            }
            break;
    }
}

function recursivelyTraverseLayoutEffects(root, parentFiber) {
    if(parentFiber.subtreeFlags & LayoutMask) {
        let child = parentFiber.child;
        while(child !== null) {
            const current = child.alternate;
            commitLayoutEffectOnFiber(root, current, child);
            child = child.sibling;
        }
    }
}


function commitHookLayoutEffects(finishedWork, hookFlags) {
    commitHookEffectListMount(hookFlags, finishedWork);
}


