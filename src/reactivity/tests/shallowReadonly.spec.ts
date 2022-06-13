import { isReadonly, shallowReadonly } from '../reactivity';

describe('shallowReadonly', () => {
  test('should not make non-reactive properties reactive', () => {
    const props = shallowReadonly({ n: { foo: 1 } });
    expect(isReadonly(props)).toBe(true);
    expect(isReadonly(props.n)).toBe(false);
  });

  it('should call console.warn when set', () => {
    console.warn = jest.fn();
    const user = shallowReadonly({ time: 1 });
    user.time = 2;
    expect(console.warn).toBeCalled();
  });
});
