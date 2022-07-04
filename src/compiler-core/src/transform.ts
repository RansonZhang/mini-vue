import { NodeTypes } from './ast';
import { TO_DISPLAY_STRING } from './runtimeHelpers';

export function transform(root: any, options: any = {}) {
  const context = createTransformContext(root, options);
  // 遍历，深度优先搜索
  traverseNode(root, context);
  createRootCodegen(root);
  root.helpers = [...context.helpers.keys()];
}

function createTransformContext(root: any, options: any) {
  const context = {
    root,
    nodeTransforms: options.nodeTransforms || [],
    helpers: new Map(),
    helper(key) {
      context.helpers.set(key, 1);
    },
  };
  return context;
}

function traverseNode(node: any, context: any) {
  const { nodeTransforms } = context;
  const exitFns: any = [];
  for (let i = 0; i < nodeTransforms.length; i++) {
    const transform = nodeTransforms[i];
    const onExit = transform(node, context);
    onExit && exitFns.push(onExit);
  }

  switch (node.type) {
    case NodeTypes.INTERPOLATION:
      context.helper(TO_DISPLAY_STRING);
      break;
    case NodeTypes.ROOT:
    case NodeTypes.ELEMENT:
      traverseChildren(node, context);
      break;
    default:
      break;
  }

  let i = exitFns.length;
  while (i--) {
    exitFns[i]();
  }
}

function traverseChildren(node: any, context: any) {
  const { children } = node;

  for (let i = 0; i < children.length; i++) {
    const node = children[i];
    traverseNode(node, context);
  }
}

function createRootCodegen(root: any) {
  const child = root.children[0];
  const { type, codegenNode } = child;
  root.codegenNode = type === NodeTypes.ELEMENT ? codegenNode : child;
}
