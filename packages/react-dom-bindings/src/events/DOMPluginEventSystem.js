import { allNativeEvents } from './EventRegistry';
import * as SimpleEventPlugin from './plugins/SimpleEventPlugin';
import { IS_CAPTURE_PHASE } from './EventSystemFlags';
import { addEventCaptureListener, addEventBubbleListener } from './EventListener';
import { createEventListenerWrapperWithPriority } from './ReactDOMEventListener';
import getEventTarget from './getEventTarget';

SimpleEventPlugin.registerEvents();

const listeningMarker = `_reactListening${Math.random().toString(36).slice(2)}`;

/**
 * 监听所有支持的事件
 * @param {Element} rootContainerElement 根容器元素
 */
export function listenToAllSupportedEvents(rootContainerElement) {
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

export function dispatchEventForPluginEventSystem(domEventName, eventSystemFlags, nativeEvent, targetInst, targetContainer) {
    dispatchEventForPlugins(domEventName, eventSystemFlags, nativeEvent, targetInst, targetContainer);
}

export function accumulateSinglePhaseListener(targetFiber, reactName, nativeEventType, isCapturePhase) {

}

function dispatchEventForPlugins(domEventName, eventSystemFlags, nativeEvent, targetInst, targetContainer) {
    const nativeEventTarget = getEventTarget(nativeEvent);
    const dispatchQueue = [];
    extractEvents(dispatchQueue, domEventName, targetInst, nativeEvent, nativeEventTarget, eventSystemFlags, targetContainer);
    processDispatchQueue(dispatchQueue, eventSystemFlags);
}

function extractEvents(dispatchQueue, domEventName, targetInst, nativeEvent, nativeEventTarget, eventSystemFlags, targetContainer) {
    SimpleEventPlugin.extractEvents(dispatchQueue, domEventName, targetInst, nativeEvent, nativeEventTarget, eventSystemFlags, targetContainer);
}

function processDispatchQueue(dispatchQueue, eventSystemFlags) {

}