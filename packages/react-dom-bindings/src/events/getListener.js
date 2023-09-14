import { getFiberCurrentPropsFromNode } from '../client/ReactDOMComponentTree';

/**
 * 从给定的React实例中获取指定事件的监听函数
 * @param {object} instance - React实例
 * @param {string} registrationName - 注册的事件名(如'onClick')
 * @returns {Function|null} 返回该事件的监听函数，如果不存在则返回null
 */
export default function(instance, registrationName) {
    const { stateNode } = instance; // 从实例中取出状态节点
    if(stateNode === null) {
        return null;
    }
    // 获取状态节点当前的props
    const props = getFiberCurrentPropsFromNode(stateNode);
    if(props === null) {
        return null;
    }
    // 从props中获取对应事件名的监听函数
    const listener = props[registrationName];
    // 返回监听函数，如果不存在，此处将返回undefined
    return listener;
}