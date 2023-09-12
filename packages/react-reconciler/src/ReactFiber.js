import { HostComponent, HostRoot, HostText, IndeterminateComponent } from 'react-reconciler/src/ReactWorkTags';
import { NoFlags } from 'react-reconciler/src/ReactFiberFlags';

/**
 * 构造函数，用于创建一个新的Fiber节点
 * @param {*} tag - fiber的类型，如函数组件、类组件、原生组件、根元素等
 * @param {*} pendingProps - 新属性，等待处理或者说生效的属性
 * @param {*} key - 唯一标识
 */
export function FiberNode(tag, pendingProps, key) {
    this.tag = tag; // 代表fiber节点的类型
    this.key = key;
    this.type = null; // 代表fiber节点对应虚拟DOM的类型
    this.stateNode = null; // 可以先理解成，指向真实的DOM节点
    this.return = null; // 指向父Fiber节点
    this.sibling = null; // 指向兄弟Fiber节点
    this.pendingProps = pendingProps; // 等待生效的props
    this.memoizedProps = null; // 当前已经生效了的props
    this.memoizedState = null; // 当前已经生效了的state
    this.updateQueue = null;  // fiber节点中等待更新的东西
    this.flags = NoFlags; // 相应的标记，比如需要被删除、新增、修改等
    this.subtreeFlags = NoFlags; // 子节点相应的标记
    this.alternate = null; // 双缓存策略，当前用于显示的fiber和当前处理更新的fiber的互相指向
    this.index = 0; // 序号，父节点中的第几个子节点
}

/**
 * 用于创建新的Fiber节点
 * @param {*} tag - fiber的类型
 * @param {*} pendingProps - 新属性
 * @param {*} key - 唯一标识
 * @returns {FiberNode} - 新的fiber节点
 */
export function createFiber(tag, pendingProps, key) {
    return new FiberNode(tag, pendingProps, key);
}

/**
 * 创建新的HostRoot类型的fiber节点
 * @returns {FiberNode} - 新的HostRoot类型的fiber节点
 */
export function createHostRootFiber() {
    return createFiber(HostRoot, null, null);
}

/**
 * 基于旧的Fiber节点和新的属性创建一个新的Fiber节点
 * @param {FiberNode} current - 旧的Fiber节点
 * @param {*} pendingProps - 新的属性
 * @returns {FiberNode} - 新的Fiber节点
 */
export function createWorkInProgress(current, pendingProps) {
    let workInProgress = current.alternate;
    if(workInProgress === null) {
        workInProgress = createFiber(current.tag, pendingProps, current.key);
        workInProgress.type = current.type;
        workInProgress.stateNode = current.stateNode;
        workInProgress.alternate = current;
        current.alternate = workInProgress;
    } else {
        workInProgress.pendingProps = pendingProps;
        workInProgress.type = current.type;
        workInProgress.flags = NoFlags;
        workInProgress.subtreeFlags = NoFlags;
    }
    workInProgress.child = current.child;
    workInProgress.memoizedProps = current.memoizedProps;
    workInProgress.memoizedState = current.memoizedState;
    workInProgress.updateQueue = current.updateQueue;
    workInProgress.sibling = current.sibling;
    workInProgress.index = current.index;
    return workInProgress;
}

/**
 * 从虚拟DOM创建新的Fiber节点
 * @param {*} element - 虚拟DOM元素
 * @returns {FiberNode} - 新的Fiber节点
 */
export function createFiberFromElement(element) {
    const { type, key, props: pendingProps } = element;
    return createFiberFromTypeAndProps(type, key, pendingProps);
}

/**
 * 从类型和属性创建新的Fiber节点
 * @param {*} type - Fiber节点的类型
 * @param {*} key - 唯一标识
 * @param {*} pendingProps - 新的属性
 * @returns {FiberNode} - 新的Fiber节点
 */
function createFiberFromTypeAndProps(type, key, pendingProps) {
    let tag = IndeterminateComponent;
    if(typeof type === 'string') {
        tag = HostComponent;
    }
    const fiber = createFiber(tag, pendingProps, key);
    fiber.type = type;
    return fiber;
}

/**
 * 创建一个新的文本类型的Fiber节点
 * @param {*} content - 文本内容
 * @returns {FiberNode} - 新的文本类型的Fiber节点
 */
export function createFiberFromText(content) {
    return createFiber(HostText, content, null);
}



