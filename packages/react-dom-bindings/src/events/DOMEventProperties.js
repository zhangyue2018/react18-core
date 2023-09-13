import { registerTwoPhaseEvent } from './EventRegistry';

// 定义一个包含 'click' 的事件数组
const simpleEventPluginEvents = ['click'];

// 创建一个新的Map对象，用来存储顶层事件名到React事件名的映射
export const topLevelEventsToReactNames = new Map();

/**
 * 注册简单事件
 * @param {string} domEventName DOM事件名称 
 * @param {string} reactName React事件名称
 */
function registerSimpleEvent(domEventName, reactName) {
    topLevelEventsToReactNames.set(domEventName, reactName);
    // 调用registerTwoPhaseEvent函数，注册为两阶段事件
    registerTwoPhaseEvent(reactName, [domEventName]);
}

/**
 * 注册简单事件数组中的所有事件
 */
export function registerSimpleEvents() {
    for(let i=0; i<simpleEventPluginEvents.length; i++) {
        const eventName = simpleEventPluginEvents[i];
        const domEventName = eventName.toLowerCase();
        const capitalizeEvent = eventName[0].toUpperCase() + eventName.slice(1);
        registerSimpleEvent(domEventName, `on${capitalizeEvent}`);
    }
}