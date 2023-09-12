
/**
 * 设置节点的样式
 * @param {HTMLElement} node - 目标节点 
 * @param {object} styles - 包含样式属性和值的对象
 */
export function setValueForStyle(node, styles) {
    const { style } = node;
    for(const styleName in styles) {
        if(styles.hasOwnProperty(styleName)) {
            style[styleName] = styles[styleName];
        }
    }
}