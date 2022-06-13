import { h, ref } from '../../lib/guide-mini-vue-esm.js';

const nextChildren = [h('div', {}, 'a'), h('div', {}, 'b')];
const prevChildren = 'newChildren';

export default {
  name: 'TextToArray',
  setup() {
    const isChange = ref(false);
    window.isChange = isChange;

    return {
      isChange,
    };
  },
  render() {
    const self = this;
    return self.isChange
      ? h('div', {}, nextChildren)
      : h('div', {}, prevChildren);
  },
};
