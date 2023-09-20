import * as React from 'react';
// 从React库中获取内部模块，这个内部模块包含了React的一些内部实现，通常不应该在应用代码中使用
// 由于这是一个内部模块，所以它的名字包含了"__SECRET_INTERNALS_DO_NOT_USE_OR_YOU_WILL_BE_FIRED"这样的警告
// 这是为了提醒开发者不要在应用代码中使用这些内部模块，否则可能导致应用的不稳定设置崩溃
const ReactSharedInternals = React.__SECRET_INTERNALS_DO_NOT_USE_OR_YOU_WILL_BE_FIRED;
export default ReactSharedInternals;