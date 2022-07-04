import { PublicInstanceProxyHandlers } from './componentPublicInstance';
import { initProps } from './componentProps';
import { initSlots } from './componentSlots';
import { shallowReadonly } from '../reactivity/reactivity';
import { emit } from './componentEmit';
import { proxyRefs } from '../index';

export function createComponentInstance(vnode, parent) {
  const component = {
    vnode,
    type: vnode.type,
    setupState: {},
    props: {},
    slots: {},
    provides: parent ? parent.provides : {},
    parent,
    isMounted: false,
    subTree: {},
    emit: () => {},
  };

  component.emit = emit.bind(null, component) as any;

  return component;
}

let currentInstance = null;

export function setupComponent(instance) {
  initProps(instance, instance.vnode.props);
  initSlots(instance, instance.vnode.children);
  setupStatefulComponent(instance);
}

function setupStatefulComponent(instance) {
  const Component = instance.type;

  // proxy中传入的对象即ctx
  instance.proxy = new Proxy({ _: instance }, PublicInstanceProxyHandlers);

  const { setup } = Component;
  if (setup) {
    setInstance(instance);
    const setupResult = setup(shallowReadonly(instance.props), {
      emit: instance.emit,
    });
    setInstance(null);

    handleSetupResult(instance, setupResult);
  }
}

function handleSetupResult(instance, setupResult) {
  // function/object
  // TODO funciton
  if (typeof setupResult === 'object') {
    instance.setupState = proxyRefs(setupResult);
  }

  finishComponentSetup(instance);
}

function finishComponentSetup(instance) {
  const Component = instance.type;
  const { render, template } = Component;
  // 如果用户写了render，该优先级最高
  if (compiler && !render) {
    if (template) {
      Component.render = compiler(template);
    }
  }
  instance.render = Component.render;
}

function setInstance(instance: any) {
  currentInstance = instance;
}

export function getCurrentInstance() {
  return currentInstance;
}

let compiler;
export function registerRuntimeCompiler(_compiler: any) {
  compiler = _compiler;
}
