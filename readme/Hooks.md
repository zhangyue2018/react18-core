# useReducer的实现逻辑：
## 分为初始挂载阶段、更新阶段，且两个阶段React.useReducer对应的实现逻辑不一样

## 初始挂载阶段：
### 1.每调用一次React.useReducer，就创建并保存一个新的hook对象（包含属性：memoizedState-状态值，queue: {pending}-更新动作队列，next-指向下一个兄弟hook（即同一个fiber中的不同hook对象），dispatch-绑定了相关参数的reducer函数）;
### 2.挂载阶段，执行完React.reducer后的返回值，会成为真实DOM的属性（可能是style，children或者其他属性）。
### 3.创建新的真实DOM之后，更新DOM的属性，确保使用的数据是我们想要的数据。

## 执行完React.useReducer之后，返回的其中一个值是dispatch函数，当通过某种途径触发这个函数的执行时，会触发react的更新阶段。此过程如下：
### 1.对同一个dispatch可能执行多次，这样每个hook对象就会有多个update产生，将这些update暂时存储在全局变量中。
### 2.找到FiberRoot，触发react更新
### 3.进入到更新流程前，遍历全局变量，从中取出hook的更新updates，将同一个hook的不同更新都收束在hook的queue队列中。

## 更新阶段：
### 1.更新阶段，React.useReducer的逻辑发生变化。
### 2.再次执行到React.useReducer函数时，获取到fiber节点上的hook对象
### 3.遍历hook.queue队列，计算所有的update，计算出最新的state，存放在hook对象。
### 4.执行完React.reducer后的返回值，会成为fiber的newProps，最终会成为真实DOM的属性（可能是style，children或者其他属性）。
### 5.复用真实DOM或者创建新的真实DOM，同时对比需要更新的DOM属性props，将对比结果存在fiber.updateQueue中。
### 6.更新真实DOM属性，确保使用的数据是我们想要的数据。