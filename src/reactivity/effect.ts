import { extend } from './../shared/index';

let activeEffect, shouldTrack;

export class ReactiveEffect {
  private _fn: any;
  deps = [];
  active = true;
  onStop?: () => void;
  public scheduler: Function | undefined;

  constructor(fn, scheduler?: Function) {
    this._fn = fn;
    this.scheduler = scheduler;
  }
  run() {
    if (!this.active) {
      return this._fn();
    }

    shouldTrack = true;
    // 执行时给全局的activeEffect赋值
    // 利用全局属性来获取当前的effect
    activeEffect = this;
    const result = this._fn();

    shouldTrack = false;

    return result;
  }
  stop() {
    if (this.active) {
      cleanupEffect(this);
      if (this.onStop) {
        this.onStop();
      }
      this.active = false;
    }
  }
}

function cleanupEffect(effect) {
  effect.deps.forEach((dep: any) => {
    dep.delete(effect);
  });
  effect.deps.length = 0;
}

const targetMap = new WeakMap();

export function track(target, key) {
  if (!isTracking()) return;

  // taget -> key -> dep
  let depsMap = targetMap.get(target);
  if (!depsMap) {
    depsMap = new Map();
    targetMap.set(target, depsMap);
  }

  let dep = depsMap.get(key);
  if (!dep) {
    dep = new Set();
    depsMap.set(key, dep);
  }

  trackEffects(dep);
}

export function trackEffects(dep) {
  if (dep.has(activeEffect)) return;
  dep.add(activeEffect);
  activeEffect.deps.push(dep);
}

export function isTracking() {
  return shouldTrack && activeEffect !== undefined;
}

export function trigger(taget, key) {
  const depsMap = targetMap.get(taget);
  const dep = depsMap.get(key);
  triggerEffects(dep);
}

export function triggerEffects(dep) {
  for (const effect of dep) {
    if (effect.scheduler) {
      effect.scheduler();
    } else {
      effect.run();
    }
  }
}

export function effect(fn, options: any = {}) {
  const _effect = new ReactiveEffect(fn, options.scheduler);
  extend(_effect, options);
  _effect.run();

  const runner: any = _effect.run.bind(_effect);
  runner.effect = _effect;

  return runner;
}

export function stop(runner) {
  runner.effect.stop();
}
