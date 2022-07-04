import { NodeTypes } from '../ast';
import { isText } from '../utils';

export function transformText(node) {
  if (node.type === NodeTypes.ELEMENT) {
    return () => {
      const { children } = node;
      let currentContainer;
      for (let i = 0; i < children.length; i++) {
        const child = children[i];
        if (isText(child)) {
          for (let j = i + 1; j < children.length; j++) {
            const next = children[j];
            if (isText(next)) {
              if (!currentContainer) {
                // 改为复合类型的节点
                currentContainer = children[i] = {
                  type: NodeTypes.COMPOUND_EXPRESSION,
                  children: [child],
                };
              }

              currentContainer.children.push(' + ');
              currentContainer.children.push(next);
              children.splice(j, 1);
              j--; // 保证数据的准确性，因为上一步已经删除了下一个子节点
            } else {
              currentContainer = undefined;
              break;
            }
          }
        }
      }
    };
  }
}
