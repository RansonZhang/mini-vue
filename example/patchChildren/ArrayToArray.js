import { h, ref } from '../../lib/guide-mini-vue-esm.js';

// 1.左侧对比
// (a b) c
// (a b) d e
// const prevChildren = [
//   h('p', { key: 'a' }, 'a'),
//   h('p', { key: 'b' }, 'b'),
//   h('p', { key: 'c' }, 'c'),
// ];
// const nextChildren = [
//   h('p', { key: 'a' }, 'a'),
//   h('p', { key: 'b' }, 'b'),
//   h('p', { key: 'd' }, 'd'),
//   h('p', { key: 'e' }, 'e'),
// ];

// 2.右侧对比
// a (b c)
// d e (b c)
// const prevChildren = [
//   h('p', { key: 'a' }, 'a'),
//   h('p', { key: 'b' }, 'b'),
//   h('p', { key: 'c' }, 'c'),
// ];
// const nextChildren = [
//   h('p', { key: 'd' }, 'd'),
//   h('p', { key: 'e' }, 'e'),
//   h('p', { key: 'b' }, 'b'),
//   h('p', { key: 'c' }, 'c'),
// ];

// 3.新的比旧的长，创建
// 左侧
// (a b)
// (a b) c
// const prevChildren = [h('p', { key: 'a' }, 'a'), h('p', { key: 'b' }, 'b')];
// const nextChildren = [
//   h('p', { key: 'a' }, 'a'),
//   h('p', { key: 'b' }, 'b'),
//   h('p', { key: 'c' }, 'c'),
// ];

// 右侧
// (a b)
// c (a b)
// const prevChildren = [h('p', { key: 'a' }, 'a'), h('p', { key: 'b' }, 'b')];
// const nextChildren = [
//   h('p', { key: 'c' }, 'c'),
//   h('p', { key: 'a' }, 'a'),
//   h('p', { key: 'b' }, 'b'),
// ];

// 4.旧的比新的长，删除
// 左侧
// (a b) c
// (a b)
// const prevChildren = [
//   h('p', { key: 'a' }, 'a'),
//   h('p', { key: 'b' }, 'b'),
//   h('p', { key: 'c' }, 'c'),
// ];
// const nextChildren = [h('p', { key: 'a' }, 'a'), h('p', { key: 'b' }, 'b')];

// 右侧
// a (b c)
// (b c)
// const prevChildren = [
//   h('p', { key: 'a' }, 'a'),
//   h('p', { key: 'b' }, 'b'),
//   h('p', { key: 'c' }, 'c'),
// ];
// const nextChildren = [h('p', { key: 'b' }, 'b'), h('p', { key: 'c' }, 'c')];

// 5.中间部分
// 5.1 创建新的。旧的不存在，新的存在
// 5.2 删除旧的。旧的存在，新的不存在
// 5.3 移动旧的。新旧都存在，位置改变了

// 5.1 删除旧的
// a b (c d) f g
// a b (e c) f g
// const prevChildren = [
//   h('p', { key: 'a' }, 'a'),
//   h('p', { key: 'b' }, 'b'),
//   h('p', { key: 'c', id: 'c-prev' }, 'c'),
//   h('p', { key: 'e' }, 'e'),
//   h('p', { key: 'd' }, 'd'),
//   h('p', { key: 'f' }, 'f'),
//   h('p', { key: 'g' }, 'g'),
// ];
// const nextChildren = [
//   h('p', { key: 'a' }, 'a'),
//   h('p', { key: 'b' }, 'b'),
//   h('p', { key: 'e' }, 'e'),
//   h('p', { key: 'c', id: 'c-next' }, 'c'),
//   h('p', { key: 'f' }, 'f'),
//   h('p', { key: 'g' }, 'g'),
// ];

// 5.2 移动旧节点
// a,b,(c,d,e),f,g
// a,b,(e,c,d),f,g
const prevChildren = [
  h('p', { key: 'A' }, 'A'),
  h('p', { key: 'B' }, 'B'),
  h('p', { key: 'C' }, 'C'),
  h('p', { key: 'D' }, 'D'),
  h('p', { key: 'E' }, 'E'),
  h('p', { key: 'F' }, 'F'),
  h('p', { key: 'G' }, 'G'),
];

const nextChildren = [
  h('p', { key: 'A' }, 'A'),
  h('p', { key: 'B' }, 'B'),
  h('p', { key: 'E' }, 'E'),
  h('p', { key: 'C' }, 'C'),
  h('p', { key: 'D' }, 'D'),
  h('p', { key: 'F' }, 'F'),
  h('p', { key: 'G' }, 'G'),
];

// 5.3. 创建新节点。旧节点中不存在
// a,b,(c,e),f,g
// a,b,(e,c,d),f,g
// const prevChildren = [
//   h("p", { key: "A" }, "A"),
//   h("p", { key: "B" }, "B"),
//   h("p", { key: "C" }, "C"),
//   h("p", { key: "E" }, "E"),
//   h("p", { key: "F" }, "F"),
//   h("p", { key: "G" }, "G"),
// ];

// const nextChildren = [
//   h("p", { key: "A" }, "A"),
//   h("p", { key: "B" }, "B"),
//   h("p", { key: "E" }, "E"),
//   h("p", { key: "C" }, "C"),
//   h("p", { key: "D" }, "D"),
//   h("p", { key: "F" }, "F"),
//   h("p", { key: "G" }, "G"),
// ];

export default {
  name: 'ArrayToArray',
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
