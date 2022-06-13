import { h, createTextVNode } from '../../lib/guide-mini-vue-esm.js';
import { Foo } from './foo.js';

export const App = {
  name: 'App',
  setup() {
    return {
      msg: 'mini-vue',
    };
  },
  render() {
    const app = h('div', {}, 'App');
    const foo = h(
      Foo,
      {},
      {
        header: ({ t }) => [h('p', {}, 'header' + t), createTextVNode('test')],
        footer: () => h('p', {}, 'footer'),
      },
    );
    // const foo = h(Foo, {}, [h('p', {}, '000'), h('p', {}, '666')]);
    return h('div', {}, [app, foo]);
  },
};
