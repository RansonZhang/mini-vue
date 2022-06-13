import { h, ref } from '../../lib/guide-mini-vue-esm.js';

const prevChildren = 'prevChild';
const nextChildren = 'nextChild';

export default {
  name: 'TextToText',
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
