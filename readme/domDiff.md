## dom diff算法：比较的是老的fiber树和新的虚拟DOM树
## 一、新虚拟DOM是单节点
    1.老fiber不存在，直接生成新fiber
    2.老fiber存在，遍历fiber及其兄弟fiber节点，找到与虚拟DOM的key相同且type相同的fiber：
        2.1 找到了这样的fiber（可能并不是链条中第一个fiber），则复用这个fiber，并且删除其他的兄弟fiber
        2.2 没有找到符合条件的fiber，则生成一个新的fiber，并且删除老fiber及其兄弟fiber节点
## 二、新虚拟DOM是数组
### 1.多节点的三轮比较：
### 第1轮：按序比较，key不同立即终止；key如果相同，则继续比较type，type相同则复用老fiber，type不同则创建新的fiber（并且删除老fiber），然后继续第一轮比较。
### 第二轮：经过第一轮，如果老节点已经全部没有了，则剩下的新的虚拟DOM节点全部创建新的fiber
### 第三轮：如果经过第一轮，还有剩下的老节点，并且还有新的虚拟DOM还没有遍历完：
    1.将老fiber的key或索引和新fiber对象建立对应关系。
    2.遍历新的虚拟DOM，用虚拟DOM的key或索引查找是否有可复用的老fiber。如果找到了，则复用这个fiber，同时根据老fiber的位置判断是否给老fiber添加插入标记；如果没有找到可复用的fiber，则生成新的fiber，并给fiber添加插入的标记。


# 比较原始版本的dom diff算法和react18版本的dom diff算法：
## 渲染流程的不同：
### 原始版本：虚拟DOM-真实DOM-挂载，dom diff比较的是新老虚拟dom树，比较结果生成的是一个新的虚拟DOM树。
### Fiber版本：虚拟DOM-Fiber-真实DOM-挂载，dom diff比较的是老fiber树和新的虚拟DOM树，比较结果生成的是一个新的fiber树。
