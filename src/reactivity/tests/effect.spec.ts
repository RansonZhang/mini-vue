import { reactive } from '../reactivity';
import { effect, stop } from '../effect';

describe('effect', () => {
  it('happy path', () => {
    const user = reactive({
      time: 1,
    });

    let newTime;
    effect(() => {
      newTime = user.time + 1;
    });

    expect(newTime).toBe(2);

    user.time++;
    expect(newTime).toBe(3);
  });

  it('should return runner when call effect ', () => {
    // effect(fn) -> function runner -> fn -> return value
    let foo = 10;
    const runner = effect(() => {
      foo++;
      return 'foo';
    });

    expect(foo).toBe(11);
    const r = runner();
    expect(foo).toBe(12);
    expect(r).toBe('foo');
  });

  it('scheduler', () => {
    let dummy;
    let run: any;
    const scheduler = jest.fn(() => {
      run = runner;
    });
    const obj = reactive({ foo: 1 });
    const runner = effect(
      () => {
        dummy = obj.foo;
      },
      { scheduler },
    );

    expect(scheduler).not.toHaveBeenCalled();
    expect(dummy).toBe(1);

    obj.foo++;
    expect(scheduler).toHaveBeenCalled();

    expect(dummy).toBe(1);

    run();
    expect(dummy).toBe(2);
  });

  it('stop', () => {
    let dummy;
    const obj = reactive({ prop: 1 });
    const runner = effect(() => {
      dummy = obj.prop;
    });
    obj.prop = 2;
    expect(dummy).toBe(2);
    stop(runner);
    // obj.prop = 3;
    obj.prop++;
    expect(dummy).toBe(2);

    runner();
    expect(dummy).toBe(3);
  });

  it('onStop', () => {
    // 当存在stop的回调函数时，执行它
    const obj = reactive({ foo: 1 });
    const onStop = jest.fn();
    let dummy;
    const runner = effect(
      () => {
        dummy = obj.foo;
      },
      { onStop },
    );

    stop(runner);
    expect(onStop).toBeCalledTimes(1);
  });
});
