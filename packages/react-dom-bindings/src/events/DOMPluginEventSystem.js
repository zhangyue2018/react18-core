import { allNativeEvents } from './EventRegistry';
import * as SimpleEventPlugin from './plugins/SimpleEventPlugin';
import { IS_CAPTURE_PHASE } from './EventSystemFlags';
import { addEventCaptureListener, addEventBubbleListener } from './EventListener';
import { createEventListenerWrapperWithPriority } from './ReactDOMEventListener';
import getEventTarget from './getEventTarget';
import { HostComponent } from 'react-reconciler/src/ReactWorkTags';
import getListener from './getListener';

SimpleEventPlugin.registerEvents();

const listeningMarker = `_reactListening${Math.random().toString(36).slice(2)}`;

/**
 * 监听所有支持的事件
 * @param {Element} rootContainerElement 根容器元素 id为root的DOM元素
 */
export function listenToAllSupportedEvents(rootContainerElement) {
    // 如果此元素尚未标记为已监听，则监听所有原生事件
    if(!rootContainerElement[listeningMarker]) {
        allNativeEvents.forEach(domEventName => {
            listenToNativeEvent(domEventName, true, rootContainerElement);
            listenToNativeEvent(domEventName, false, rootContainerElement);
        });
    }
}

/**
 * 监听原生事件
 * @param {string} domEventName - DOM事件名称
 * @param {boolean} isCapturePhaseListener 是否在捕获阶段监听
 * @param {Element} target 目标元素
 */
export function listenToNativeEvent(domEventName, isCapturePhaseListener, target) {
    let eventSystemFlags = 0;
    if(isCapturePhaseListener) {
        eventSystemFlags |= IS_CAPTURE_PHASE;
    }
    addTrappedEventListener(target, domEventName, eventSystemFlags, isCapturePhaseListener);
}

/**
 * 添加受限制的事件监听器
 * @param {Element} targetContainer 目标容器元素
 * @param {string} domEventName - DOM事件名称
 * @param {number} eventSystemFlags 事件系统标记
 * @param {boolean} isCapturePhaseListener 是否在捕获阶段监听
 */
function addTrappedEventListener(targetContainer, domEventName, eventSystemFlags, isCapturePhaseListener) {
    // 创建带有优先级的事件监听器
    const listener = createEventListenerWrapperWithPriority(targetContainer, domEventName, eventSystemFlags);
    if(isCapturePhaseListener) {
        addEventCaptureListener(targetContainer, domEventName, listener);
    } else {
        addEventBubbleListener(targetContainer, domEventName, listener);
    }
}

/**
 * 在插件事件系统中分发事件
 * @param {string} domEventName DOM事件名称
 * @param {number} eventSystemFlags 事件系统标记
 * @param {Event} nativeEvent 原生事件
 * @param {Fiber} targetInst - Fiber目标实例
 * @param {Element} targetContainer - 目标容器元素
 */
export function dispatchEventForPluginEventSystem(domEventName, eventSystemFlags, nativeEvent, targetInst, targetContainer) {
    dispatchEventForPlugins(domEventName, eventSystemFlags, nativeEvent, targetInst, targetContainer);
}

/**
 * 累积单阶段监听器
 * @param {Fiber} targetFiber 目标Fiber实例
 * @param {string} reactName - react事件名称
 * @param {string} nativeEventType 原生事件类型
 * @param {boolean} isCapturePhase 是否在捕获阶段
 * @returns 
 */
export function accumulateSinglePhaseListener(targetFiber, reactName, nativeEventType, isCapturePhase) {
    const captureName = reactName + 'Capture';
    const reactEventName = isCapturePhase ? captureName : reactName;
    const listeners = [];
    let instance = targetFiber;
    while(instance !== null) {
        const { stateNode, tag } = instance;
        if(tag === HostComponent && stateNode !== null) {
            const listener = getListener(instance, reactEventName);
            if(listener) {
                listeners.push(createDispatchListener(instance, listener, stateNode));
            }
        }
        instance = instance.return;
    }

    return listeners;
}

/**
 * 创建分发监听器
 * @param {Fiber} instance - Fiber实例
 * @param {Function} listener - 监听器函数
 * @param {Element} currentTarget - 当前目标元素
 * @returns 
 */
function createDispatchListener(instance, listener, currentTarget) {
    return { instance, listener, currentTarget };
}

/**
 * 为插件分发事件
 * @param {string} domEventName DOM事件名称
 * @param {number} eventSystemFlags 事件系统标记
 * @param {Event} nativeEvent 原生事件
 * @param {Fiber} targetInst - Fiber目标实例
 * @param {Element} targetContainer 目标容器元素
 */
function dispatchEventForPlugins(domEventName, eventSystemFlags, nativeEvent, targetInst, targetContainer) {
    // 获取原生事件的目标
    const nativeEventTarget = getEventTarget(nativeEvent);
    const dispatchQueue = [];
    // 提取事件
    extractEvents(dispatchQueue, domEventName, targetInst, nativeEvent, nativeEventTarget, eventSystemFlags, targetContainer);
    // 处理分发队列
    processDispatchQueue(dispatchQueue, eventSystemFlags);
}

/**
 * 提取事件
 * @param {Array} dispatchQueue 分发队列
 * @param {string} domEventName DOM事件名称
 * @param {Fiber} targetInst - Fiber目标实例
 * @param {Event} nativeEvent 原生事件
 * @param {EventTarget} nativeEventTarget 原生事件目标
 * @param {number} eventSystemFlags 事件系统标记
 * @param {Element} targetContainer 目标容器元素
 */
function extractEvents(dispatchQueue, domEventName, targetInst, nativeEvent, nativeEventTarget, eventSystemFlags, targetContainer) {
    SimpleEventPlugin.extractEvents(dispatchQueue, domEventName, targetInst, nativeEvent, nativeEventTarget, eventSystemFlags, targetContainer);
}

/**
 * 处理分发队列
 * @param {Array} dispatchQueue 分发队列
 * @param {number} eventSystemFlags 事件系统标记
 */
function processDispatchQueue(dispatchQueue, eventSystemFlags) {
    const isCapturePhase = (eventSystemFlags & IS_CAPTURE_PHASE) !== 0;
    for(let i=0; i<dispatchQueue.length; i++) {
        const { event, listeners } = dispatchQueue[i];
        // 按顺序处理分发队列中的项目
        processDispatchQueueItemsInOrder(event, listeners, isCapturePhase);
    }
}

/**
 * 按顺序处理分发队列中的项目
 * @param {Event} event 事件
 * @param {Array} dispatchListeners 分发监听器列表
 * @param {boolean} isCapturePhase 是否在捕获阶段
 * @returns 
 */
function processDispatchQueueItemsInOrder(event, dispatchListeners, isCapturePhase) {
    if(isCapturePhase) {
        for(let i=dispatchListeners.length-1; i>=0; i--) {
            const { listener, currentTarget } = dispatchListeners[i];
            if(event.isPropagationStopped()) {
                return;
            }
            executeDispatch(event, listener, currentTarget);
        }
    } else {
        for(let i=0; i<dispatchListeners.length; i++) {
            const { listener, currentTarget } = dispatchListeners[i];
            if(event.isPropagationStopped()) {
                return;
            }
            executeDispatch(event, listener, currentTarget);
        }
    }
}

/**
 * 执行分发
 * @param {Event} event 事件
 * @param {Function} listener 监听器函数
 * @param {Element} currentTarget 当前目标元素
 */
function executeDispatch(event, listener, currentTarget) {
    event.currentTarget = currentTarget;
    listener(event);
}