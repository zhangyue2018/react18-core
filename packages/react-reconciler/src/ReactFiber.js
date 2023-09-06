import { HostRoot } from 'react-reconciler/src/ReactWorkTags';
import { NoFlags } from 'react-reconciler/src/ReactFiberFlags';

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
    this.sutreeFlags = NoFlags; // 子节点相应的标记
    this.alternate = null; // 双缓存策略，当前用于显示的fiber和当前处理更新的fiber的互相指向
    this.index = 0; // 序号，父节点中的第几个子节点
}

export function createFiber(tag, pendingProps, key) {
    return new FiberNode(tag, pendingProps, key);
}

export function createHostRootFiber() {
    return createFiber(HostRoot, null, null);
}



