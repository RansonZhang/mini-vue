export function generate(ast: any) {
  const context = createCodegenContext();
  const { code, push } = context;

  push('return ');

  const functionName = 'render';
  const args = ['_ctx', '_cache'];
  const signature = args.join(', ');

  push(`function ${functionName}(${signature}){`);
  push('return ');
  genNode(ast.codegenNode, context);
  push('}');

  return {
    code: context.code,
  };
}

function createCodegenContext() {
  const context = {
    code: '',
    push(source: string) {
      context.code += source;
    },
  };

  return context;
}

function genNode(node: any, context: any) {
  context.push(` '${node.content}'`);
}