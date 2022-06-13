import { computed } from '../computed';
import { reactive } from '../reactivity';

describe('computed', () => {
  it('happy path', () => {
    const test = reactive({ time: 1 });
    const time = computed(() => {
      return test.time;
    });
    expect(time.value).toBe(1);
  });

  it('should computed laziy', () => {
    const value = reactive({ time: 1 });
    const getter = jest.fn(() => {
      return value.time;
    });
    const cValue = computed(getter);

    expect(getter).not.toHaveBeenCalled();

    expect(cValue.value).toBe(1);
    expect(getter).toBeCalledTimes(1);

    // should not computed again
    cValue.value;
    expect(getter).toBeCalledTimes(1);

    // should not computed until needed
    value.time = 2;
    expect(getter).toBeCalledTimes(1);

    expect(cValue.value).toBe(2);
    expect(getter).toBeCalledTimes(2);

    // should not computed again
    cValue.value;
    expect(getter).toBeCalledTimes(2);
  });
});
