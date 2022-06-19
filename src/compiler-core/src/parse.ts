import { NodeTypes } from './ast';

const enum TagType {
  Start,
  End,
}

export function baseParse(content: string) {
  const context = createParserContext(content);

  return createRoot(parseChildren(context, []));
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

function parseChildren(context: any, ancestors: any[]) {
  const nodes: any[] = [];

  while (!isEnd(context, ancestors)) {
    let node;
    const source = context.source;
    if (source.startsWith('{{')) {
      node = parseInterpolation(context);
    } else if (source[0] === '<') {
      if (/[a-z]/i.test(source[1])) {
        node = parseElement(context, ancestors);
      }
    }

    if (!node) {
      node = parseText(context);
    }
    nodes.push(node);
  }

  return nodes;
}

function isEnd(context: any, ancestors: any[]) {
  const s = context.source;
  if (s.startsWith('</')) {
    for (let i = ancestors.length - 1; i >= 0; i--) {
      const tag = ancestors[i].tag;
      if (startsWithEndTagOpen(s, tag)) {
        return true;
      }
    }
  }

  return !s;
}

function startsWithEndTagOpen(source: any, tag: string) {
  return (
    source.startsWith('<') &&
    source.slice(2, 2 + tag.length).toLowerCase() === tag.toLowerCase()
  );
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

function parseElement(context: any, ancestors: any[]) {
  const element: any = parseTag(context, TagType.Start);
  ancestors.push(element);
  element.children = parseChildren(context, ancestors);
  // 此时已解析完所有的标签，从末尾开始弹出
  ancestors.pop();

  if (startsWithEndTagOpen(context.source, element.tag)) {
    parseTag(context, TagType.End);
  } else {
    throw new Error(`缺少结束标签：${element.tag}`);
  }

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
  let endIndex = context.source.length;
  // 遇到标签符/插值符时停止推进
  let endTokens = ['<', '{{'];
  for (let i = 0; i < endTokens.length; i++) {
    const index = context.source.indexOf(endTokens[i]);
    if (index !== -1 && index < endIndex) {
      endIndex = index;
    }
  }

  const content = parseTextData(context, endIndex);

  advanceBy(context, content.length);

  return {
    type: NodeTypes.TEXT,
    content,
  };
}
