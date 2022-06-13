import { h } from '../../lib/guide-mini-vue-esm.js';
import { Foo } from './foo.js';

window.self = null;
export const App = {
  setup() {
    return {
      msg: 'mini-vue',
    };
  },
  render() {
    window.self = this;
    // return h('div', { id: 'root', class: ['test'] }, [
    //   h('p', { class: 'red' }, 'This is'),
    //   h('p', { class: 'blue' }, 'mini-vue'),
    // ]);
    // return h(
    //   'div',
    //   {
    //     id: 'test',
    //     onClick() {
    //       console.log('click');
    //     },
    //   },
    //   'This is ' + this.msg,
    // );

    return h(
      'div',
      {
        onClick() {
          console.log('click');
        },
      },
      [h('div', {}, 'This is ' + this.msg), h(Foo, { count: 1 })],
    );
  },
};
