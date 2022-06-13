import { readonly, isReadonly, isProxy } from '../reactivity';

describe('readonly', () => {
  it('happy path', () => {
    const original = { foo: 1, bar: { baz: 2 } };
    const wrapped = readonly(original);
    expect(wrapped).not.toBe(original);
    expect(isReadonly(wrapped)).toBe(true);
    expect(isReadonly(original)).toBe(false);
    expect(isReadonly(wrapped.bar)).toBe(true);
    expect(isReadonly(original.bar)).toBe(false);
    expect(isProxy(wrapped)).toBe(true);
    expect(wrapped.foo).toBe(1);
  });

  it('should call console.warn when set', () => {
    console.warn = jest.fn();
    const user = readonly({ time: 1 });
    user.time = 2;
    expect(console.warn).toBeCalled();
  });
});
