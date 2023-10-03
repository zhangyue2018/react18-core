
import { createHostRootFiber } from './ReactFiber';
import { initialUpdateQueue } from './ReactFiberClassUpdateQueue';
import { NoLanes } from './ReactFiberLane';

function FiberRootNode(containerInfo) {
    this.containerInfo = containerInfo;
    this.pendingLanes = NoLanes;
}

export function createFiberRoot(containerInfo) {
    const root = new FiberRootNode(containerInfo); // containerInfo--真实DOM
    const uninitializedFiber = createHostRootFiber();
    root.current = uninitializedFiber;
    uninitializedFiber.stateNode = root;
    initialUpdateQueue(uninitializedFiber);
    return root;
}