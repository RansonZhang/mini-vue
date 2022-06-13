import { h, ref } from '../../lib/guide-mini-vue-esm.js';

export const App = {
  name: 'App',
  setup() {
    const count = ref(0);
    const onclick = () => {
      count.value++;
    };

    const props = ref({
      foo: 'foo',
      bar: 'bar',
    });

    const onChangePropsDemo1 = () => {
      props.value.foo = 'newFoo';
    };
    const onChangePropsDemo2 = () => {
      props.value.foo = undefined;
    };
    const onChangePropsDemo3 = () => {
      props.value = {
        foo: 'foo',
      };
    };

    return {
      count,
      onclick,
      props,
      onChangePropsDemo1,
      onChangePropsDemo2,
      onChangePropsDemo3,
    };
  },
  render() {
    return h('div', { id: 'root', ...this.props }, [
      h('div', {}, 'count:' + this.count), //依赖收集
      h('button', { onClick: this.onclick }, 'click'),
      h('button', { onClick: this.onChangePropsDemo1 }, '改值'),
      h('button', { onClick: this.onChangePropsDemo2 }, '改值为未定义'),
      h('button', { onClick: this.onChangePropsDemo3 }, '删值'),
    ]);
  },
};
