import { h, getCurrentInstance } from '../../lib/guide-mini-vue-esm.js';
import { Foo } from './foo.js';

export const App = {
  name: 'App',
  setup() {
    const instance = getCurrentInstance();
    console.log('App:', instance);
  },
  render() {
    const app = h('p', {}, 'currentInstance test');
    const foo = h(Foo);
    return h('div', {}, [app, foo]);
  },
};
