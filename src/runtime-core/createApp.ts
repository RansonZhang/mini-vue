import { createVNode } from './vnode';

export function createAppAPI(render) {
  return function createApp(rootComponent) {
    return {
      mount(rootContainer) {
        // 先编译成vnode，再渲染成DOM
        const vnode = createVNode(rootComponent);

        render(vnode, rootContainer);
      },
    };
  };
}
