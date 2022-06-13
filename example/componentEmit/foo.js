import { h } from '../../lib/guide-mini-vue-esm.js';

export const Foo = {
  setup(props, { emit }) {
    const count = () => {
      emit('count', 2, 8);
      emit('count-time');
    };

    return {
      count,
    };
  },
  render() {
    const btn = h(
      'button',
      {
        onClick: this.count,
      },
      'emitBtn',
    );
    const p = h('p', {}, 'foo');
    return h('div', {}, [p, btn]);
  },
};
