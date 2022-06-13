import { trackEffects, isTracking, triggerEffects } from './effect';
import { isObject, hasChanged } from '../shared/index';
import { reactive } from './reactivity';

class RefImpl {
  private __v__isRef: boolean;
  private _value: any;
  public dep: any;
  private _rawValue: any;

  constructor(value) {
    this.__v__isRef = true;
    this._rawValue = value;
    this._value = convert(value);
    this.dep = new Set();
  }

  get value() {
    trackRefValue(this);
    return this._value;
  }

  set value(newValue) {
    if (hasChanged(this._rawValue, newValue)) {
      this._rawValue = newValue;
      this._value = convert(newValue);
      triggerEffects(this.dep);
    }
  }
}

function convert(value) {
  return isObject(value) ? reactive(value) : value;
}

function trackRefValue(ref) {
  if (isTracking()) {
    trackEffects(ref.dep);
  }
}

export function ref(value) {
  return new RefImpl(value);
}

export function isRef(ref) {
  return !!ref.__v__isRef;
}

export function unRef(ref) {
  return ref.__v__isRef ? ref.value : ref;
}

export function proxyRefs(objectWidthRefs) {
  return new Proxy(objectWidthRefs, {
    get(target, key) {
      return unRef(Reflect.get(target, key));
    },
    set(target, key, value) {
      if (isRef(target[key]) && !isRef(value)) {
        return (target[key].value = value);
      } else {
        return Reflect.set(target, key, value);
      }
    },
  });
}
