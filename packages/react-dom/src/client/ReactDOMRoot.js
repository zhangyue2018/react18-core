import { listenToAllSupportedEvents } from 'react-dom-bindings/src/events/DOMPluginEventSystem';
import { createContainer, updateContainer } from 'react-reconciler/src/ReactFiberReconciler';

function ReactDOMRoot(internalRoot) {
    this._internalRoot = internalRoot; // _internalRoot是FiberRoot
}

ReactDOMRoot.prototype.render = function(children) {
    const root = this._internalRoot;
    updateContainer(children, root);
}

export function createRoot(container) {
    const root = createContainer(container);
    listenToAllSupportedEvents(container);
    return new ReactDOMRoot(root);
}