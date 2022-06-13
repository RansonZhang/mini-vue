import { h, renderSlots } from '../../lib/guide-mini-vue-esm.js';

export const Foo = {
  setup() {},
  render() {
    const t = 6;
    const foo = h('p', {}, 'foo');
    return h('div', {}, [
      renderSlots(this.$slots, 'header', { t }),
      foo,
      renderSlots(this.$slots, 'footer'),
    ]);
  },
};
