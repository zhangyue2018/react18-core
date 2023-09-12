
/**
 * 设置节点的属性
 * @param {HTMLElement} node - 目标节点
 * @param {string} name - 属性名
 * @param {*} value - 属性值
 */
export function setValueForProperty(node, name, value) {
    if(value === null) {
        node.removeAttribute(name);
    } else {
        node.setAttribute(name, value);
    }
}