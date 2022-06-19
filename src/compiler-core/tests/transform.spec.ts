import { NodeTypes } from '../src/ast';
import { baseParse } from '../src/parse';
import { transform } from '../src/transform';

describe('transform', () => {
  it('happy path', () => {
    const ast = baseParse('<div>hi,{{message}}</div>');
    const plugin = (node: any) => {
      const { type, content } = node;
      if (type === NodeTypes.TEXT) {
        node.content = content + ' mini-vue';
      }
    };
    transform(ast, {
      nodeTransforms: [plugin],
    });
    const nodeText = ast.children[0].children[0];
    expect(nodeText.content).toBe('hi, mini-vue');
  });
});
