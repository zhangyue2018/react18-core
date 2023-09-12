import { REACT_ELEMENT_TYPE } from "shared/ReactSymbols";
import { isArray } from "shared/isArray";
import { createFiberFromElement, createFiberFromText } from './ReactFiber';
import { Placement } from "./ReactFiberFlags";

/**
 * 创建childReconciler的函数
 * @param {boolean} shouldTrackSideEffects - 是否需要跟踪副作用
 * @returns {function} - reconcileChildFibers - 用于处理子Fiber的函数
 * 这个函数会根据传入的shouldTrackSideEffects参数返回一个函数reconcileChildFibers，
 * reconcileChildFibers函数可以根据新旧Fiber进行比较并返回处理结果
 */
function createChildReconciler(shouldTrackSideEffects) {

    /**
     * 将新创建的元素转换为fiber
     * @param {Fiber} returnFiber - 新的父Fiber 
     * @param {Fiber} currentFirstFiber - 老的父fiber第一个子fiber 
     * @param {object} element - 新的子虚拟DOM元素 
     * @returns {Fiber} created - 返回新创建的Fiber
     */
    function reconcileSingleElement(returnFiber, currentFirstFiber, element) {
        const created = createFiberFromElement(element);
        created.return = returnFiber;
        return created;
    }

    /**
     * 为新创建的Fiber设置索引，并在必要时设置副作用
     * @param {Fiber} newFiber - 新创建的Fiber 
     * @param {number} newIdx - 新的索引
     */
    function placeChild(newFiber, newIdx) {
        newFiber.index = newIdx;
        if(shouldTrackSideEffects) {
            newFiber.flags |= Placement;
        }
    }

    /**
     * 根据新的子节点(虚拟DOM)创建Fiber
     * @param {Fiber} returnFiber - 新的父Fiber
     * @param {object} newChild - 新的子节点
     * @returns {Fiber|null} - 返回新创建的Fiber，或null
     */
    function createChild(returnFiber, newChild) {
        if(typeof newChild === 'string' && newChild !== '' || typeof newChild === 'number') {
            const created = createFiberFromText(`${newChild}`);
            created.return = returnFiber;
            return created;
        }
        if(typeof newChild === 'object' && newChild !== null) {
            switch(newChild.$$typeof) {
                case REACT_ELEMENT_TYPE: {
                    const created = createFiberFromElement(newChild);
                    created.return = returnFiber;
                    return created;
                }
                default:
                    break;
            }
        }
        return null;
    }
    
    /**
     * 将新的子节点数组和旧的子Fiber进行比较，并返回新的子Fiber
     * @param {Fiber} returnFiber - 新的父Fiber
     * @param {Fiber} currentFirstFiber - 老的父Fiber第一个子Fiber
     * @param {Array} newChildren - 新的子虚拟DOM数组
     * @returns {Fiber} resultingFirstChild - 返回的新的子Fiber
     */
    function reconcileChildrenArray(returnFiber, currentFirstFiber, newChildren) {
        let resultingFirstChild = null;
        let previousNewFiber = null;
        let newIdx = 0;
        for(; newIdx < newChildren.length; newIdx++) {
            const newFiber = createChild(returnFiber, newChildren[newIdx]);
            if(newFiber === null) continue;
            placeChild(newFiber, newIdx); 
            if(previousNewFiber === null) {
                resultingFirstChild = newFiber;
            } else {
                previousNewFiber.sibling = newFiber;
            }
            previousNewFiber = newFiber;
        }
        return resultingFirstChild;
    }

    /**
     * 设置副作用
     * @param {Fiber} newFiber - 新创建的Fiber 
     * @returns {Fiber} newFiber - 返回新创建的Fiber
     */
    function placeSingleChild(newFiber) {
        if(shouldTrackSideEffects) {
            newFiber.flags |= Placement;
        }
        return newFiber;
    }

    /**
     * 比较子Fibers
     * @param {Fiber} returnFiber - 新的父Fiber
     * @param {Fiber} currentFirstFiber - 老的父fiber第一个子fiber
     * @param {object} newChild - 新的子虚拟DOM
     * @returns {Fiber|null} - result - 返回的新的子Fiber或者null
     */
    function reconcileChildFibers(returnFiber, currentFirstFiber, newChild) {
        if(typeof newChild === 'object' && newChild !== null) {
            switch(newChild.$$typeof) {
                case REACT_ELEMENT_TYPE:
                    return placeSingleChild(reconcileSingleElement(returnFiber, currentFirstFiber, newChild));
                default:
                    break;
            }
        }
        if(isArray(newChild)) {
            return reconcileChildrenArray(returnFiber, currentFirstFiber, newChild);
        }
        return null;
    }
    return reconcileChildFibers
}
// 如果没有老父fiber，初次挂载的时候用这个
export const mountChildFibers = createChildReconciler(false);
// 有老父fiber，更新的时候用这个
export const reconcileChildFibers = createChildReconciler(true);