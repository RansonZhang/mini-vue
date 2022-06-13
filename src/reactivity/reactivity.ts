import {
  ReactiveFlags,
  mutableHandlers,
  readonlyHandlers,
  shallowReadonlyHandlers,
} from './baseHandlers';
import { isObject } from '../shared/index';

function createReactiveObject(target: any, baseHandlers) {
  if (!isObject(target)) {
    console.warn(`target ${target} must be a object`);
    return target;
  }
  return new Proxy(target, baseHandlers);
}

export function reactive(raw) {
  return createReactiveObject(raw, mutableHandlers);
}

export function readonly(raw) {
  return createReactiveObject(raw, readonlyHandlers);
}

export function shallowReadonly(raw) {
  return createReactiveObject(raw, shallowReadonlyHandlers);
}

export function isReactive(target) {
  return !!target[ReactiveFlags.IS_REACTIVE];
}

export function isReadonly(target) {
  return !!target[ReactiveFlags.IS_READONLY];
}

export function isProxy(target) {
  return isReactive(target) || isReadonly(target);
}
