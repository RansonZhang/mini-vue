import { createVnodeCall, NodeTypes } from '../ast';

export function transformElement(node, context) {
  if (node.type === NodeTypes.ELEMENT) {
    return () => {
      // 中间处理层
      const { tag, children } = node;
      const vnodeTag = `'${tag}'`;
      let vnodeProps;
      const vnodeChildren = children[0];

      node.codegenNode = createVnodeCall(
        context,
        vnodeTag,
        vnodeProps,
        vnodeChildren
      );
    };
  }
}
