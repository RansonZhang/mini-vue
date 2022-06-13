import { h } from '../../lib/guide-mini-vue-esm.js';
import { Foo } from './foo.js';

export const App = {
  setup() {
    return {
      msg: 'mini-vue',
    };
  },
  render() {
    return h('div', {}, [
      h('div', {}, 'This is ' + this.msg),
      h(Foo, {
        onCount(a, b) {
          console.log('onCount', a, b);
        },
        onCountTime() {
          console.log('onCountTime');
        },
      }),
    ]);
  },
};
