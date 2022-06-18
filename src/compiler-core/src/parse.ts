import { NodeTypes } from './ast';

export function baseParse(content: string) {
  const context = createParserContext(content);

  return createRoot(parseChildren(context));
}

function createParserContext(content: string) {
  return {
    source: content,
  };
}

function createRoot(children) {
  return {
    children,
  };
}

function parseChildren(context: any) {
  const nodes: any[] = [];
  let node;
  if (context.source.startsWith('{{')) {
    node = parseInterpolation(context);
  }
  nodes.push(node);

  return nodes;
}

function parseInterpolation(context: any) {
  const openDelimiter = '{{';
  const closeDelimiter = '}}';
  const openLength = openDelimiter.length;

  const closeIndex = context.source.indexOf(closeDelimiter, openLength);
  advanceBy(context, openLength);
  const rawContentLength = closeIndex - openLength;
  const content = context.source.slice(0, rawContentLength).trim();

  advanceBy(context, rawContentLength + closeDelimiter.length);

  return {
    type: NodeTypes.INTERPOLATION,
    content: {
      type: NodeTypes.SIMPLE_EXPRESSION,
      content,
    },
  };
}

function advanceBy(context: any, length: number) {
  context.source = context.source.slice(length);
}
