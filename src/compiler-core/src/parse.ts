import { NodeTypes } from './ast';

const enum TagType {
  Start,
  End,
}

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
  const source = context.source;
  if (source.startsWith('{{')) {
    node = parseInterpolation(context);
  } else if (source[0] === '<') {
    if (/[a-z]/i.test(source[1])) {
      node = parseElement(context);
    }
  }

  if (!node) {
    node = parseText(context);
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
  const rawContent = parseTextData(context, rawContentLength);
  const content = rawContent.trim();

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

function parseTextData(context: any, length: number) {
  return context.source.slice(0, length);
}

function parseElement(context: any) {
  const element = parseTag(context, TagType.Start);
  parseTag(context, TagType.End);
  return element;
}

function parseTag(context: any, type: TagType) {
  const match: any = /^<\/?([a-z]*)/i.exec(context.source);
  const tag = match[1];
  advanceBy(context, match[0].length + 1);

  if (type === TagType.End) return;

  return {
    type: NodeTypes.ELEMENT,
    tag,
  };
}

function parseText(context: any) {
  const content = parseTextData(context, context.source.length);

  advanceBy(context, content.length);

  return {
    type: NodeTypes.TEXT,
    content,
  };
}
