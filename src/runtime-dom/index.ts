import { createRender } from '../runtime-core';

function createElement(type: any) {
  return document.createElement(type);
}

function patchProp(el, key, prevVal, nextVal) {
  const isOn = key => /^on[A-Z]/.test(key);
  if (isOn(key)) {
    const event = key.slice(2).toLocaleLowerCase();
    el.addEventListener(event, nextVal);
  } else {
    if (nextVal === undefined || nextVal === null) {
      el.removeAttribute(key);
    } else {
      el.setAttribute(key, nextVal);
    }
  }
}

function insert(child: any, parent: any, anchor: any) {
  parent.insertBefore(child, anchor || null);
}

function remove(child: any) {
  const parent = child.parentNode;
  if (parent) {
    parent.removeChild(child);
  }
}

function setElementText(el: any, text: string) {
  el.textContent = text;
}

const render: any = createRender({
  createElement,
  patchProp,
  insert,
  remove,
  setElementText,
});

export function createApp(...args) {
  return render.createApp(...args);
}

export * from '../runtime-core';
