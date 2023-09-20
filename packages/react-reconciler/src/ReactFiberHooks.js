import ReactSharedInternals from "shared/ReactSharedInternals";
import { scheduleUpdateOnFiber } from "./ReactFiberWorkLoop";
import { enqueueConcurrentHookUpdate } from './ReactFiberConcurrentUpdates';

const { ReactCurrentDispatcher } = ReactSharedInternals;
// 设置当前正在渲染的Fiber节点为null
let currentlyRenderingFiber = null;
// 设置当前进行中的Hook为null
let workInProgressHook = null;
let currentHook = null;

// Dispatcher对象在组件Mount时使用的Hooks
const HooksDispatcherOnMount = {
    useReducer: mountReducer
}

const HooksDispatcherOnUpdate = {
    useReducer: updateReducer
}

/**
 * Mount期间用于处理useReducer hook的函数
 * @param {Function} reducer 进行state更新的函数
 * @param {*} initialArg - reducer函数的初始参数
 * @returns {Array} 包含最新state和dispatch函数的数组
 */
function mountReducer(reducer, initialArg) {
    const hook = mountWorkInProgressHook();
    hook.memoizedState = initialArg; // 记录当前hook的初始状态
    const queue = {
        pending: null // 初始化pending队列为null
    }
    hook.queue = queue; // 将queue对象赋值给hook的queue属性
    const dispatch = (queue.dispatch = dispatchReducerAction.bind(null, currentlyRenderingFiber, queue));
    return [hook.memoizedState, dispatch];
}

function updateReducer(reducer) {
    const hook = updateWorkInProgressHook();
    const queue = hook.queue;
    const current = currentHook;
    const pendingQueue = queue.pending;
    let newState = current.memoizedState;

    if(pendingQueue !== null) {
        queue.pending = null;
        const firstUpdate = pendingQueue.next;
        let update = firstUpdate;
        do {
            const action = update.action;
            newState = reducer(newState, action);
            update = update.next;
        } while(update !== null && update !== firstUpdate)
    }

    hook.memoizedState = newState;
    return [hook.memoizedState, queue.dispatch];
}

/**
 * Dispatch函数，用于处理reducer action的派发
 * @param {Object} fiber - 当前正在处理的Fiber节点
 * @param {Object} queue - 包含pending状态的队列
 * @param {*} action - 需要被处理的action
 */
function dispatchReducerAction(fiber, queue, action) {
    const update = {
        action,
        next: null
    }
    const root = enqueueConcurrentHookUpdate(fiber, queue, update);
    scheduleUpdateOnFiber(root);
}

/**
 * 在mount期间为每个hook创建一个新的工作进度(work-in-progress)对象
 * @returns {Object} - 包含memoizedState，queue，next的hook对象
 */
function mountWorkInProgressHook() {
    const hook = {
        memoizedState: null,
        queue: null,
        next: null
    }
    if(workInProgressHook === null) {
        // 如果当前没有进行中的hook，设置新的hook为进行中的hook，并将其设置为当前渲染fiber的状态
        currentlyRenderingFiber.memoizedState = workInProgressHook = hook;
    } else {
        // 如果已经有进行中的hook，将新的hook添加到链表的最后，并将其设置为当前进行中的hook
        workInProgressHook = workInProgressHook.next = hook;
    }
    return workInProgressHook; // 返回当前进行中的hook
}

function updateWorkInProgressHook() {
    if(currentHook === null) {
        const current = currentlyRenderingFiber.alternate;
        currentHook = current.memoizedState;
    } else {
        currentHook = currentHook.next;
    }
    const newHook = {
        memoizedState: currentHook.memoizedState,
        queue: currentHook.queue,
        next: null
    }
    if(workInProgressHook === null) {
        currentlyRenderingFiber.memoizedState = workInProgressHook = newHook;
    } else {
        workInProgressHook = workInProgressHook.next = newHook;
    }
    return workInProgressHook;
}

/**
 * 用hooks渲染组件
 * @param {Object} current 当前的fiber节点
 * @param {Object} workInProgress 正在进行的Fiber节点
 * @param {Function} Component 需要渲染的组件
 * @param {Object} props 组件的props
 * @returns {*} 组件的子节点
 */
export function renderWithHooks(current, workInProgress, Component, props) {
    currentlyRenderingFiber = workInProgress; // 设置当前正在渲染的fiber节点
    if(current !== null && current.memoizedState !== null) {
        ReactCurrentDispatcher.current = HooksDispatcherOnUpdate
    } else {
        ReactCurrentDispatcher.current = HooksDispatcherOnMount; // 设置当前的Dispatcher
    }
    const children = Component(props); // 通过组件和props渲染子节点
    currentlyRenderingFiber = null;
    workInProgressHook = null;
    currentHook = null;
    return children; // 返回子节点
}