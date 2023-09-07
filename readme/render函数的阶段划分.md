## render函数分为两个阶段：渲染阶段、提交阶段
## 渲染阶段又可以分为beginWork和completeWork两个阶段，而提交阶段对应着commitWork。
## Fiber架构下：虚拟DOM -> Fiber树 -> 真实DOM -> 挂载到页面
## beginWork：虚拟DOM转化为Fiber树
## completeWork：Fiber树转化为真实DOM
## commitWork：真实DOM挂载到页面
## 渲染阶段可以中断恢复，提交阶段不可以