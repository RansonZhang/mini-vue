import { effect } from '../effect';
import { ref, isRef, unRef, proxyRefs } from '../ref';
import { reactive } from '../reactivity';

describe('ref', () => {
  it('happy path', () => {
    const a = ref(1);
    expect(a.value).toBe(1);
  });

  it('should be reactive', () => {
    const a = ref(1);
    let dummy;
    let calls = 0;
    effect(() => {
      calls++;
      dummy = a.value;
    });
    expect(calls).toBe(1);
    expect(dummy).toBe(1);
    a.value = 2;
    expect(calls).toBe(2);
    expect(dummy).toBe(2);
    a.value = 2;
    expect(calls).toBe(2);
    expect(dummy).toBe(2);
  });

  it('should make nested properties reactive', () => {
    const a = ref({ count: 1 });
    let dummy;
    effect(() => {
      dummy = a.value.count;
    });
    expect(dummy).toBe(1);
    a.value.count = 2;
    expect(dummy).toBe(2);
  });

  it('isRef', () => {
    const a = ref(1);
    const b = reactive({ c: 2 });
    expect(isRef(a)).toBe(true);
    expect(isRef(1)).toBe(false);
    expect(isRef(b)).toBe(false);
  });

  it('unRef', () => {
    const a = ref(1);
    expect(unRef(a)).toBe(1);
    expect(unRef(1)).toBe(1);
  });

  it('proxyRefs', () => {
    const test = {
      a: ref(10),
      b: 'key',
    };
    const proxyTest = proxyRefs(test);
    expect(test.a.value).toBe(10);
    expect(proxyTest.a).toBe(10);
    expect(proxyTest.b).toBe('key');

    proxyTest.a = 20;
    expect(proxyTest.a).toBe(20);
    expect(test.a.value).toBe(20);

    proxyTest.a = ref(30);
    expect(proxyTest.a).toBe(30);
    expect(test.a.value).toBe(30);
  });
});
