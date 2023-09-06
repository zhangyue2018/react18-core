## Fiber架构之前：
堆栈的递归调和算法(dom diff):阻塞主线程，出现卡顿现象

虚拟DOM -> 真实DOM -> 挂载到容器节点

- 执行javascript
- 样式的重新计算
- 布局更新
- 绘制
- 合成
- 显示在屏幕

const myCallback = (result) => {
    result.didTimeout // 是否因为超时而调用
    timeRemaining // 

}
requestIdleCallback（myCallback, {timeout: 1000}）: 允许我们在浏览器的空闲时段，执行一些后台的或者低优先级的任务

## 什么是Fiber架构：
Fiber架构是React为了解决性能问题和提升调度能力而引入的一种新的内部实现机制。
它主要通过重新组织渲染过程，使React可以更有效的执行渲染任务。

## Fiber是什么：
是一种数据结构：
{
    type,
    key,
    props,
    stateNode,
    return,
    child,
    sibling,
    flags,
    alternate
}

虚拟DOM树 -> Fiber树 -> 真实DOM -> 挂载

## 双缓冲策略
当前渲染树
工作进程树
提交阶段

## 工作循环
work loop:React内部处理更新和渲染任务的主要过程。分为两个阶段：

协调：负责计算新的组件状态和虚拟DOM。
拆分成较小的工作单元

提交：负责将新的虚拟DOM应用到实际的DOM上。

## 设计Fiber架构的动机是什么？---性能，调度，可扩展性
1.为了改善性能，更新渲染过程大任务拆分成小任务，在事件循环中交替执行，使React处理大型应用和复杂场景时，有更好的性能。
2.支持并发模式，支持任务的优先级。
3.更好的可维护性和可扩展性。
