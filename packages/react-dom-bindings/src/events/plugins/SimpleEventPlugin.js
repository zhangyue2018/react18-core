import { registerSimpleEvents, topLevelEventsToReactNames } from "../DOMEventProperties";
import { IS_CAPTURE_PHASE } from "../EventSystemFlags";
import { SyntheticMouseEvent } from '../SyntheticEvent';
import { accumulateSinglePhaseListener } from '../DOMPluginEventSystem'; 

/**
 * 提取特定事件并将其加入调度队列
 * @param {Array} dispatchQueue 要处理的事件队列
 * @param {string} domEventName - DOM事件的名称，如'click'
 * @param {object} targetInst 目标实例，接收事件的react组件
 * @param {Event} nativeEvent 原生的浏览器事件对象
 * @param {EventTarget} nativeEventTarget 原生的浏览器事件目标
 * @param {number} eventSystemFlags 事件系统标识，表示特定的事件状态
 * @param {Element} targetContainer 事件发生的DOM容器
 */
function extractEvents(dispatchQueue, domEventName, targetInst, nativeEvent, nativeEventTarget, eventSystemFlags, targetContainer) {
    // 根据给定的DOM事件名，获取对应的React事件名
    const reactName = topLevelEventsToReactNames.get(domEventName);
    let SyntheticEventCtor;
    // 根据DOM事件名来确定要使用的合成事件构造函数
    switch(domEventName) {
        case 'click':
            SyntheticEventCtor = SyntheticMouseEvent
            break;
        default:
            break;
    }

    const isCapturePhase = (eventSystemFlags & IS_CAPTURE_PHASE) !== 0;
    // 获取当前阶段的所有事件监听器
    const listeners = accumulateSinglePhaseListener(
        targetInst,
        reactName,
        nativeEvent.type,
        isCapturePhase
    );
    if(listeners.length > 0) {
        // 创建新的合成事件
        const event = new SyntheticEventCtor(reactName, domEventName, null, nativeEvent, nativeEventTarget);
        // 将新的合成事件和相对应的监听器一起加入调度队列
        dispatchQueue.push({
            event,
            listeners
        });
    }
}

export { registerSimpleEvents as registerEvents, extractEvents };  