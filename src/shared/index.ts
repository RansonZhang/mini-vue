export * from './toDisplayString';

export const extend = Object.assign;

export const EMPTY_OBJ = {};

export const isObject = value => value !== null && typeof value === 'object';

export const isString = value => typeof value === 'string';

export const hasChanged = (val, newVal) => !Object.is(val, newVal);

export const hasOwn = (val, key) =>
  Object.prototype.hasOwnProperty.call(val, key);

export const capitalize = (str: string) => {
  return str.charAt(0).toLocaleUpperCase() + str.slice(1);
};

export const toHandlerKey = (str: string) => {
  return str ? 'on' + capitalize(str) : '';
};

export const camelize = (str: string) =>
  str.replace(/-(\w)/g, (_, c: string) => {
    return c ? c.toLocaleUpperCase() : '';
  });
