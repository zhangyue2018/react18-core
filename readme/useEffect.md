## useEffect--使用副作用:commitWork工作完成之后，执行副作用（也就是放在下一个宏任务中）
## React.useEffect的初始化挂载阶段和更新阶段的逻辑不同，初始化阶段使用的是mountEffect，更新阶段使用的是updateEffect。
### mountEffect：
### 1.每调用一次，就会创建一个hook对象加入到fiber的hook链表中；同时创建一个effect对象，将effect保存到hook.memoizedState，同时将effect加入到fiber的effect链表(fiber.updateQueue)中。
### 2.将当前fiber添加标记：需要执行副作用

### updateEffect:
### 1.每调用一次，从fiber的hook链表中取出一个hook对象（其实是创建了一个新的hook对象，然后复用了老hook的数据），根据传参，构建新的effect对象，将effect加入到新的fiber的effect链表（新fiber的effect链表是空的）中。
### 2.根据传参deps，对比新旧deps，如果完全相同，则说明没必要执行副作用，不给fiber添加副作用标记；如果有差异，则给fiber添加副作用标记。

## 在commitRoot执行完后，执行副作用时，先执行commitPassiveUnmountEffects，再执行commitPassiveMountEffects。
## 所以执行副作用时，一定会执行两个阶段，只不过在初始化渲染阶段，destroy还为赋值，所以commitPassiveUnmountEffects函数不执行destroy，
## 当commitPassiveMountEffects执行过一次之后（即create执行后，且有返回值），destroy才被赋值。这样后续的更新阶段destroy才会被执行。