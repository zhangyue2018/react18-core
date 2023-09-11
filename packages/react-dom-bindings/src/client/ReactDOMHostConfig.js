
/**
 * 判断是否需要设置文本内容
 * @param {string} type - DOM元素的类型
 * @param {Object} props - 元素属性对象
 * @returns {boolean} - 如果children属性是字符串或数字，返回true，否则返回false
 * shouldSetTextContent函数用于判断，基于给定的属性，是否应该设置DOM元素的文本内容
 */
export function shouldSetTextContent(type, props) {
    return typeof props.children === 'string' || typeof props.children === 'number';
}