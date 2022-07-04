function toDisplayString(value) {
    return String(value);
}

const extend = Object.assign;
const EMPTY_OBJ = {};
const isObject = value => value !== null && typeof value === 'object';
const isString = value => typeof value === 'string';
const hasChanged = (val, newVal) => !Object.is(val, newVal);
const hasOwn = (val, key) => Object.prototype.hasOwnProperty.call(val, key);
const capitalize = (str) => {
    return str.charAt(0).toLocaleUpperCase() + str.slice(1);
};
const toHandlerKey = (str) => {
    return str ? 'on' + capitalize(str) : '';
};
const camelize = (str) => str.replace(/-(\w)/g, (_, c) => {
    return c ? c.toLocaleUpperCase() : '';
});

let activeEffect, shouldTrack;
class ReactiveEffect {
    constructor(fn, scheduler) {
        this.deps = [];
        this.active = true;
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
    effect.deps.forEach((dep) => {
        dep.delete(effect);
    });
    effect.deps.length = 0;
}
const targetMap = new WeakMap();
function track(target, key) {
    if (!isTracking())
        return;
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
function trackEffects(dep) {
    if (dep.has(activeEffect))
        return;
    dep.add(activeEffect);
    activeEffect.deps.push(dep);
}
function isTracking() {
    return shouldTrack && activeEffect !== undefined;
}
function trigger(taget, key) {
    const depsMap = targetMap.get(taget);
    const dep = depsMap.get(key);
    triggerEffects(dep);
}
function triggerEffects(dep) {
    for (const effect of dep) {
        if (effect.scheduler) {
            effect.scheduler();
        }
        else {
            effect.run();
        }
    }
}
function effect(fn, options = {}) {
    const _effect = new ReactiveEffect(fn, options.scheduler);
    extend(_effect, options);
    _effect.run();
    const runner = _effect.run.bind(_effect);
    runner.effect = _effect;
    return runner;
}

// 利用缓存，在初始化时创建完成，后续不再重复创建
const get = createGetter();
const set = createSetter();
const readonlyGet = createGetter(true);
const shallowReadonlyGet = createGetter(true, true);
function createGetter(isReadonly = false, shallow = false) {
    return function get(target, key) {
        if (key === "__v_isReactive" /* IS_REACTIVE */) {
            return !isReadonly;
        }
        else if (key === "__v_isReadonly" /* IS_READONLY */) {
            return isReadonly;
        }
        const res = Reflect.get(target, key);
        if (shallow) {
            return res;
        }
        if (isObject(res)) {
            return isReadonly ? readonly(res) : reactive(res);
        }
        if (!isReadonly) {
            track(target, key);
        }
        return res;
    };
}
function createSetter() {
    return function set(target, key, value) {
        const res = Reflect.set(target, key, value);
        trigger(target, key);
        return res;
    };
}
const mutableHandlers = {
    get,
    set,
};
const readonlyHandlers = {
    get: readonlyGet,
    set(target, key, value) {
        console.warn(`can't set key:${key} cause target:${target} is readonly `);
        return true;
    },
};
const shallowReadonlyHandlers = extend({}, readonlyHandlers, { get: shallowReadonlyGet });

function createReactiveObject(target, baseHandlers) {
    if (!isObject(target)) {
        console.warn(`target ${target} must be a object`);
        return target;
    }
    return new Proxy(target, baseHandlers);
}
function reactive(raw) {
    return createReactiveObject(raw, mutableHandlers);
}
function readonly(raw) {
    return createReactiveObject(raw, readonlyHandlers);
}
function shallowReadonly(raw) {
    return createReactiveObject(raw, shallowReadonlyHandlers);
}

class RefImpl {
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
function ref(value) {
    return new RefImpl(value);
}
function isRef(ref) {
    return !!ref.__v__isRef;
}
function unRef(ref) {
    return ref.__v__isRef ? ref.value : ref;
}
function proxyRefs(objectWidthRefs) {
    return new Proxy(objectWidthRefs, {
        get(target, key) {
            return unRef(Reflect.get(target, key));
        },
        set(target, key, value) {
            if (isRef(target[key]) && !isRef(value)) {
                return (target[key].value = value);
            }
            else {
                return Reflect.set(target, key, value);
            }
        },
    });
}

const Fragment = Symbol('Fragment');
const Text = Symbol('Text');
function createVNode(type, props, children) {
    const vnode = {
        type,
        props,
        next: null,
        children,
        component: null,
        key: props && props.key,
        shapeFlag: getShapeFlag(type),
        el: null,
    };
    if (typeof children === 'string') {
        vnode.shapeFlag |= 4 /* TEXT_CHILDREN */;
    }
    else if (Array.isArray(children)) {
        vnode.shapeFlag |= 8 /* ARRAY_CHILDREN */;
    }
    if (vnode.shapeFlag & 2 /* STATEFUL_COMPONENT */) {
        if (typeof children === 'object') {
            vnode.shapeFlag |= 16 /* SLOTS_CHILDREN */;
        }
    }
    return vnode;
}
function createTextVNode(text) {
    return createVNode(Text, {}, text);
}
function getShapeFlag(type) {
    return typeof type === 'string'
        ? 1 /* ELEMENT */
        : 2 /* STATEFUL_COMPONENT */;
}

function h(type, props, children) {
    return createVNode(type, props, children);
}

function renderSlots(slots, name, props) {
    const slot = slots[name];
    if (slot) {
        if (typeof slot === 'function') {
            return createVNode(Fragment, {}, slot(props));
        }
    }
}

const publicPropertiesMap = {
    $el: i => i.vnode.el,
    $slots: i => i.slots,
    $props: i => i.props,
};
const PublicInstanceProxyHandlers = {
    get({ _: instance }, key) {
        const { setupState, props } = instance;
        if (hasOwn(setupState, key)) {
            return setupState[key];
        }
        else if (hasOwn(props, key)) {
            return props[key];
        }
        const publicGetter = publicPropertiesMap[key];
        if (publicGetter) {
            return publicGetter(instance);
        }
    },
};

function initProps(instance, rawProps) {
    instance.props = rawProps || {};
}

function initSlots(instance, children) {
    const { vnode } = instance;
    if (vnode.shapeFlag & 16 /* SLOTS_CHILDREN */) {
        normalizeOjectSlots(children, instance.slots);
    }
}
function normalizeOjectSlots(children, slots) {
    for (const key in children) {
        const value = children[key];
        slots[key] = (props) => normalizeSlotValue(value(props));
    }
}
function normalizeSlotValue(value) {
    return Array.isArray(value) ? value : [value];
}

function emit(instance, event, ...args) {
    const { props } = instance;
    const handlerName = toHandlerKey(camelize(event));
    const handler = props[handlerName];
    handler && handler(...args);
}

function createComponentInstance(vnode, parent) {
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
        emit: () => { },
    };
    component.emit = emit.bind(null, component);
    return component;
}
let currentInstance = null;
function setupComponent(instance) {
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
function setInstance(instance) {
    currentInstance = instance;
}
function getCurrentInstance() {
    return currentInstance;
}
let compiler;
function registerRuntimeCompiler(_compiler) {
    compiler = _compiler;
}

function provide(key, value) {
    const currentInstance = getCurrentInstance();
    if (currentInstance) {
        let { provides } = currentInstance;
        const parentProvides = currentInstance.parent.provides;
        if (provides === parentProvides) {
            provides = currentInstance.provides = Object.create(parentProvides);
        }
        provides[key] = value;
    }
}
function inject(key, defaultValue) {
    const currentInstance = getCurrentInstance();
    if (currentInstance) {
        const parentProvides = currentInstance.parent.provides;
        if (key in parentProvides) {
            return parentProvides[key];
        }
        else {
            if (typeof defaultValue === 'function') {
                return defaultValue();
            }
            return defaultValue;
        }
    }
}

function createAppAPI(render) {
    return function createApp(rootComponent) {
        return {
            mount(rootContainer) {
                // 先编译成vnode，再渲染成DOM
                const vnode = createVNode(rootComponent);
                render(vnode, rootContainer);
            },
        };
    };
}

function shouldUpdateComponent(prevVNode, nextVNode) {
    const { props: prevProps } = prevVNode;
    const { props: nextProps } = nextVNode;
    for (const key in nextProps) {
        if (nextProps[key] !== prevProps[key]) {
            return true;
        }
    }
    return false;
}

const queue = [];
const promise = Promise.resolve();
let isFlushPending = false;
function nextTick(fn) {
    return fn ? promise.then(fn) : promise;
}
function queueJobs(job) {
    if (queue.includes(job))
        return;
    queue.push(job);
    queueFlush();
}
function queueFlush() {
    if (isFlushPending)
        return;
    isFlushPending = true;
    nextTick(flushJobs);
}
function flushJobs() {
    isFlushPending = false;
    let job;
    while ((job = queue.shift())) {
        job && job();
    }
}

function createRender(options) {
    const { createElement: hostCreateElement, patchProp: hostPatchProp, insert: hostInsert, remove: hostRemove, setElementText: hostSetElementText, } = options;
    function render(vnode, container) {
        patch(null, vnode, container, null, null);
    }
    function patch(n1, n2, container, parentComponent, anchor) {
        const { type, shapeFlag } = n2;
        switch (type) {
            case Fragment:
                processFragment(n1, n2, container, parentComponent, anchor);
                break;
            case Text:
                processText(n1, n2, container);
                break;
            default:
                if (shapeFlag & 1 /* ELEMENT */) {
                    processElement(n1, n2, container, parentComponent, anchor);
                }
                else if (shapeFlag & 2 /* STATEFUL_COMPONENT */) {
                    processComponent(n1, n2, container, parentComponent, anchor);
                }
                break;
        }
    }
    function processFragment(n1, n2, container, parentComponent, anchor) {
        mountChildren(n2.children, container, parentComponent, anchor);
    }
    function processText(n1, n2, container) {
        const { children } = n2;
        const textNode = (n2.el = document.createTextNode(children));
        container.append(textNode);
    }
    function processElement(n1, n2, container, parentComponent, anchor) {
        if (!n1) {
            mountElement(n2, container, parentComponent, anchor);
        }
        else {
            patchElement(n1, n2, container, parentComponent, anchor);
        }
    }
    function mountElement(vnode, container, parentComponent, anchor) {
        const { type, props, children, shapeFlag } = vnode;
        const el = (vnode.el = hostCreateElement(type));
        if (shapeFlag & 4 /* TEXT_CHILDREN */) {
            el.textContent = children;
        }
        else if (shapeFlag & 8 /* ARRAY_CHILDREN */) {
            mountChildren(vnode.children, el, parentComponent, anchor);
        }
        for (const key in props) {
            const val = props[key];
            hostPatchProp(el, key, null, val);
        }
        hostInsert(el, container, anchor);
    }
    function mountChildren(children, container, parentComponent, anchor) {
        children.forEach(child => patch(null, child, container, parentComponent, anchor));
    }
    function patchElement(n1, n2, container, parentComponent, anchor) {
        const oldProps = n1.props || EMPTY_OBJ;
        const newProps = n2.props || EMPTY_OBJ;
        const el = (n2.el = n1.el);
        patchChildren(n1, n2, el, parentComponent, anchor);
        patchProps(el, oldProps, newProps);
    }
    function patchChildren(n1, n2, container, parentComponent, anchor) {
        const { shapeFlag: prevShapeFlag, children: c1 } = n1;
        const { shapeFlag, children: c2 } = n2;
        if (shapeFlag & 4 /* TEXT_CHILDREN */) {
            if (prevShapeFlag & 8 /* ARRAY_CHILDREN */) {
                ummounteChildren(n1.children);
            }
            if (c1 !== c2) {
                hostSetElementText(container, c2);
            }
        }
        else {
            if (prevShapeFlag & 4 /* TEXT_CHILDREN */) {
                hostSetElementText(container, '');
                mountChildren(c2, container, parentComponent, anchor);
            }
            else {
                // diff both array
                patchKeyedChildren(c1, c2, container, parentComponent, anchor);
            }
        }
    }
    function patchKeyedChildren(c1, c2, container, parentComponent, parentAnchor) {
        const l2 = c2.length;
        let i = 0;
        let e1 = c1.length - 1;
        let e2 = l2 - 1;
        function isSomeVnodeType(n1, n2) {
            return n1.type === n2.type && n1.key === n2.key;
        }
        // 左起比对
        while (i <= e1 && i <= e2) {
            const n1 = c1[i];
            const n2 = c2[i];
            if (!isSomeVnodeType(n1, n2)) {
                break;
            }
            patch(n1, n2, container, parentComponent, parentAnchor);
            i++;
        }
        // 右起比对
        while (i <= e1 && i <= e2) {
            const n1 = c1[e1];
            const n2 = c2[e2];
            if (!isSomeVnodeType(n1, n2)) {
                break;
            }
            patch(n1, n2, container, parentComponent, parentAnchor);
            e1--;
            e2--;
        }
        // 新旧节点长度不同，且是新节点比旧节点数量多
        if (i > e1 && i <= e2) {
            // 创建新节点
            const nextPos = e2 + 1;
            // 新节点可能会加到末尾，也可能是头部，需要制定添加的位置
            // 添加的位置是当前位置(e2开始)+1
            const anchor = nextPos < l2 ? c2[nextPos].el : null;
            while (i <= e2) {
                patch(null, c2[i], container, parentComponent, anchor);
                i++;
            }
        }
        else if (i > e2 && i <= e1) {
            // 删除旧节点
            while (i <= e1) {
                hostRemove(c1[i].el);
                i++;
            }
        }
        else {
            // 对比中间部分
            let s1 = i;
            let s2 = i;
            const toBePatched = e2 - s2 + 1;
            let patched = 0;
            const keyToNewIndexMap = new Map();
            const newIndexToOldIndexMap = new Array(toBePatched);
            let moved = false; // 是否发生了旧节点移动
            let maxNewIndexSoFar = 0;
            for (let i = 0; i < toBePatched; i++)
                newIndexToOldIndexMap[i] = 0;
            for (let i = s2; i <= e2; i++) {
                const nextChild = c2[i];
                keyToNewIndexMap.set(nextChild.key, i);
            }
            for (let i = s1; i <= e1; i++) {
                const prevChild = c1[i];
                if (patched >= toBePatched) {
                    hostRemove(prevChild.el);
                    continue;
                }
                let newIndex;
                if (prevChild.key !== null) {
                    newIndex = keyToNewIndexMap.get(prevChild.key);
                }
                else {
                    for (let j = s2; j <= e2; j++) {
                        if (isSomeVnodeType(prevChild, c2[j])) {
                            newIndex = j;
                            break;
                        }
                    }
                }
                if (newIndex === undefined) {
                    hostRemove(prevChild.el);
                }
                else {
                    if (newIndex >= maxNewIndexSoFar) {
                        maxNewIndexSoFar = newIndex;
                    }
                    else {
                        moved = true;
                    }
                    newIndexToOldIndexMap[newIndex - s2] = i + 1;
                    patch(prevChild, c2[newIndex], container, parentComponent, null);
                    patched++;
                }
            }
            // 最长增长子序列
            const increasingNewIndexSequence = moved
                ? getSequence(newIndexToOldIndexMap)
                : [];
            let j = increasingNewIndexSequence.length - 1;
            for (let i = toBePatched - 1; i >= 0; i--) {
                const nextIndex = i + s2;
                const nextChild = c2[nextIndex];
                const anchor = nextIndex + 1 < l2 ? c2[nextIndex + 1].el : null;
                if (newIndexToOldIndexMap[i] === 0) {
                    // 旧节点中不存在新节点的序号，即需要创建
                    patch(null, nextChild, container, parentComponent, anchor);
                }
                else if (moved) {
                    if (j < 0 || i !== increasingNewIndexSequence[j]) {
                        // 移动旧节点
                        hostInsert(nextChild.el, container, anchor);
                    }
                    else {
                        j--;
                    }
                }
            }
        }
    }
    function ummounteChildren(children) {
        for (let i = 0; i < children.length; i++) {
            const el = children[i].el;
            hostRemove(el);
        }
    }
    function patchProps(el, oldProps, newProps) {
        if (oldProps !== newProps) {
            for (const key in newProps) {
                const prevProp = oldProps[key];
                const nextProp = newProps[key];
                hostPatchProp(el, key, prevProp, nextProp);
            }
            if (oldProps !== EMPTY_OBJ) {
                for (const key in oldProps) {
                    if (!(key in newProps)) {
                        hostPatchProp(el, key, oldProps[key], null);
                    }
                }
            }
        }
    }
    function processComponent(n1, n2, container, parentComponent, anchor) {
        if (!n1) {
            mountComponent(n2, container, parentComponent, anchor);
        }
        else {
            updateComponent(n1, n2);
        }
    }
    function mountComponent(initialVNode, container, parentComponent, anchor) {
        const instance = (initialVNode.component = createComponentInstance(initialVNode, parentComponent));
        setupComponent(instance);
        setupRenderEffect(instance, initialVNode, container, anchor);
    }
    function setupRenderEffect(instance, initialVNode, container, anchor) {
        instance.update = effect(() => {
            if (!instance.isMounted) {
                const { proxy } = instance;
                const subTree = (instance.subTree = instance.render.call(proxy, proxy));
                patch(null, subTree, container, instance, anchor);
                initialVNode.el = subTree.el;
                instance.isMounted = true;
            }
            else {
                const { next, vnode, proxy } = instance;
                if (next) {
                    next.el = vnode.el;
                    updateComponentPreRender(instance, next);
                }
                const subTree = instance.render.call(proxy, proxy);
                const prevSubTree = instance.subTree;
                instance.subTree = subTree;
                patch(prevSubTree, subTree, container, instance, anchor);
            }
        }, {
            scheduler: () => {
                queueJobs(instance.update);
            },
        });
    }
    function updateComponentPreRender(instance, nextVNode) {
        instance.vnode = nextVNode;
        instance.next = null;
        instance.props = nextVNode.props;
    }
    function updateComponent(n1, n2) {
        const instance = (n2.component = n1.component);
        if (shouldUpdateComponent(n1, n2)) {
            instance.next = n2;
            instance.update();
        }
        else {
            n2.el = n1.el;
            instance.vnode = n2;
        }
    }
    return {
        createApp: createAppAPI(render),
    };
}
function getSequence(arr) {
    const p = arr.slice();
    const result = [0];
    let i, j, u, v, c;
    const len = arr.length;
    for (i = 0; i < len; i++) {
        const arrI = arr[i];
        if (arrI !== 0) {
            j = result[result.length - 1];
            if (arr[j] < arrI) {
                p[i] = j;
                result.push(i);
                continue;
            }
            u = 0;
            v = result.length - 1;
            while (u < v) {
                c = (u + v) >> 1;
                if (arr[result[c]] < arrI) {
                    u = c + 1;
                }
                else {
                    v = c;
                }
            }
            if (arrI < arr[result[u]]) {
                if (u > 0) {
                    p[i] = result[u - 1];
                }
                result[u] = i;
            }
        }
    }
    u = result.length;
    v = result[u - 1];
    while (u-- > 0) {
        result[u] = v;
        v = p[v];
    }
    return result;
}

function createElement(type) {
    return document.createElement(type);
}
function patchProp(el, key, prevVal, nextVal) {
    const isOn = key => /^on[A-Z]/.test(key);
    if (isOn(key)) {
        const event = key.slice(2).toLocaleLowerCase();
        el.addEventListener(event, nextVal);
    }
    else {
        if (nextVal === undefined || nextVal === null) {
            el.removeAttribute(key);
        }
        else {
            el.setAttribute(key, nextVal);
        }
    }
}
function insert(child, parent, anchor) {
    parent.insertBefore(child, anchor || null);
}
function remove(child) {
    const parent = child.parentNode;
    if (parent) {
        parent.removeChild(child);
    }
}
function setElementText(el, text) {
    el.textContent = text;
}
const render = createRender({
    createElement,
    patchProp,
    insert,
    remove,
    setElementText,
});
function createApp(...args) {
    return render.createApp(...args);
}

var runtimeDom = /*#__PURE__*/Object.freeze({
    __proto__: null,
    createApp: createApp,
    h: h,
    renderSlots: renderSlots,
    createTextVNode: createTextVNode,
    createElementVNode: createVNode,
    getCurrentInstance: getCurrentInstance,
    registerRuntimeCompiler: registerRuntimeCompiler,
    provide: provide,
    inject: inject,
    createRender: createRender,
    nextTick: nextTick,
    toDisplayString: toDisplayString,
    ref: ref,
    proxyRefs: proxyRefs
});

const TO_DISPLAY_STRING = Symbol('toDisplayString');
const CREATE_ELEMENT_VNODE = Symbol('createElementVNode');
const helperMapName = {
    [TO_DISPLAY_STRING]: 'toDisplayString',
    [CREATE_ELEMENT_VNODE]: 'createElementVNode',
};

function generate(ast) {
    const context = createCodegenContext();
    const { push } = context;
    genFunctionPreamble(ast, context);
    const functionName = 'render';
    const args = ['_ctx', '_cache'];
    const signature = args.join(', ');
    push(`function ${functionName}(${signature}){`);
    push('return ');
    genNode(ast.codegenNode, context);
    push('}');
    return {
        code: context.code,
    };
}
function createCodegenContext() {
    const context = {
        code: '',
        push(source) {
            context.code += source;
        },
        helper(key) {
            return `_${helperMapName[key]}`;
        },
    };
    return context;
}
function genFunctionPreamble(ast, context) {
    const { push } = context;
    const VueBinging = 'Vue';
    const aliasHelper = s => `${helperMapName[s]}: _${helperMapName[s]}`;
    if (ast.helpers.length > 0) {
        push(`const { ${ast.helpers.map(aliasHelper).join(', ')} } = ${VueBinging}`);
    }
    push('\n');
    push('return ');
}
function genNode(node, context) {
    switch (node.type) {
        case 3 /* TEXT */:
            genText(node, context);
            break;
        case 0 /* INTERPOLATION */:
            genInterpolation(node, context);
            break;
        case 1 /* SIMPLE_EXPRESSION */:
            genExpression(node, context);
            break;
        case 2 /* ELEMENT */:
            genElement(node, context);
            break;
        case 5 /* COMPOUND_EXPRESSION */:
            genCompoundExpression(node, context);
    }
}
function genText(node, context) {
    context.push(`'${node.content}'`);
}
function genInterpolation(node, context) {
    const { push, helper } = context;
    push(`${helper(TO_DISPLAY_STRING)}(`);
    genNode(node.content, context);
    push(')');
}
function genExpression(node, context) {
    context.push(`${node.content}`);
}
function genElement(node, context) {
    const { push, helper } = context;
    const { tag, props, children } = node;
    push(`${helper(CREATE_ELEMENT_VNODE)}(`);
    genNodeList(genNullable([tag, props, children]), context);
    push(')');
}
function genNullable(args) {
    return args.map(arg => arg || 'null');
}
function genNodeList(nodes, context) {
    const { push } = context;
    for (let i = 0; i < nodes.length; i++) {
        const node = nodes[i];
        isString(node) ? push(node) : genNode(node, context);
        if (i < nodes.length - 1) {
            push(', ');
        }
    }
}
function genCompoundExpression(node, context) {
    const { push } = context;
    const { children } = node;
    for (let i = 0; i < children.length; i++) {
        const child = children[i];
        if (isString(child)) {
            push(child);
        }
        else {
            genNode(child, context);
        }
    }
}

function baseParse(content) {
    const context = createParserContext(content);
    return createRoot(parseChildren(context, []));
}
function createParserContext(content) {
    return {
        source: content,
    };
}
function createRoot(children) {
    return {
        children,
        type: 4 /* ROOT */,
    };
}
function parseChildren(context, ancestors) {
    const nodes = [];
    while (!isEnd(context, ancestors)) {
        let node;
        const source = context.source;
        if (source.startsWith('{{')) {
            node = parseInterpolation(context);
        }
        else if (source[0] === '<') {
            if (/[a-z]/i.test(source[1])) {
                node = parseElement(context, ancestors);
            }
        }
        if (!node) {
            node = parseText(context);
        }
        nodes.push(node);
    }
    return nodes;
}
function isEnd(context, ancestors) {
    const s = context.source;
    if (s.startsWith('</')) {
        for (let i = ancestors.length - 1; i >= 0; i--) {
            const tag = ancestors[i].tag;
            if (startsWithEndTagOpen(s, tag)) {
                return true;
            }
        }
    }
    return !s;
}
function startsWithEndTagOpen(source, tag) {
    return (source.startsWith('<') &&
        source.slice(2, 2 + tag.length).toLowerCase() === tag.toLowerCase());
}
function parseInterpolation(context) {
    const openDelimiter = '{{';
    const closeDelimiter = '}}';
    const openLength = openDelimiter.length;
    const closeIndex = context.source.indexOf(closeDelimiter, openLength);
    advanceBy(context, openLength);
    const rawContentLength = closeIndex - openLength;
    const rawContent = parseTextData(context, rawContentLength);
    const content = rawContent.trim();
    advanceBy(context, rawContentLength + closeDelimiter.length);
    return {
        type: 0 /* INTERPOLATION */,
        content: {
            type: 1 /* SIMPLE_EXPRESSION */,
            content,
        },
    };
}
function advanceBy(context, length) {
    context.source = context.source.slice(length);
}
function parseTextData(context, length) {
    return context.source.slice(0, length);
}
function parseElement(context, ancestors) {
    const element = parseTag(context, 0 /* Start */);
    ancestors.push(element);
    element.children = parseChildren(context, ancestors);
    // 此时已解析完所有的标签，从末尾开始弹出
    ancestors.pop();
    if (startsWithEndTagOpen(context.source, element.tag)) {
        parseTag(context, 1 /* End */);
    }
    else {
        throw new Error(`缺少结束标签：${element.tag}`);
    }
    return element;
}
function parseTag(context, type) {
    const match = /^<\/?([a-z]*)/i.exec(context.source);
    const tag = match[1];
    advanceBy(context, match[0].length + 1);
    if (type === 1 /* End */)
        return;
    return {
        type: 2 /* ELEMENT */,
        tag,
    };
}
function parseText(context) {
    let endIndex = context.source.length;
    // 遇到标签符/插值符时停止推进
    let endTokens = ['<', '{{'];
    for (let i = 0; i < endTokens.length; i++) {
        const index = context.source.indexOf(endTokens[i]);
        if (index !== -1 && index < endIndex) {
            endIndex = index;
        }
    }
    const content = parseTextData(context, endIndex);
    advanceBy(context, content.length);
    return {
        type: 3 /* TEXT */,
        content,
    };
}

function transform(root, options = {}) {
    const context = createTransformContext(root, options);
    // 遍历，深度优先搜索
    traverseNode(root, context);
    createRootCodegen(root);
    root.helpers = [...context.helpers.keys()];
}
function createTransformContext(root, options) {
    const context = {
        root,
        nodeTransforms: options.nodeTransforms || [],
        helpers: new Map(),
        helper(key) {
            context.helpers.set(key, 1);
        },
    };
    return context;
}
function traverseNode(node, context) {
    const { nodeTransforms } = context;
    const exitFns = [];
    for (let i = 0; i < nodeTransforms.length; i++) {
        const transform = nodeTransforms[i];
        const onExit = transform(node, context);
        onExit && exitFns.push(onExit);
    }
    switch (node.type) {
        case 0 /* INTERPOLATION */:
            context.helper(TO_DISPLAY_STRING);
            break;
        case 4 /* ROOT */:
        case 2 /* ELEMENT */:
            traverseChildren(node, context);
            break;
    }
    let i = exitFns.length;
    while (i--) {
        exitFns[i]();
    }
}
function traverseChildren(node, context) {
    const { children } = node;
    for (let i = 0; i < children.length; i++) {
        const node = children[i];
        traverseNode(node, context);
    }
}
function createRootCodegen(root) {
    const child = root.children[0];
    const { type, codegenNode } = child;
    root.codegenNode = type === 2 /* ELEMENT */ ? codegenNode : child;
}

function createVnodeCall(context, tag, props, children) {
    context.helper(CREATE_ELEMENT_VNODE);
    return {
        type: 2 /* ELEMENT */,
        tag,
        props,
        children,
    };
}

function transformElement(node, context) {
    if (node.type === 2 /* ELEMENT */) {
        return () => {
            // 中间处理层
            const { tag, children } = node;
            const vnodeTag = `'${tag}'`;
            let vnodeProps;
            const vnodeChildren = children[0];
            node.codegenNode = createVnodeCall(context, vnodeTag, vnodeProps, vnodeChildren);
        };
    }
}

function transformExpression(node) {
    if (node.type === 0 /* INTERPOLATION */) {
        node.content = processExpression(node.content);
    }
}
function processExpression(node) {
    node.content = `_ctx.${node.content}`;
    return node;
}

function isText(node) {
    return node.type === 3 /* TEXT */ || node.type === 0 /* INTERPOLATION */;
}

function transformText(node) {
    if (node.type === 2 /* ELEMENT */) {
        return () => {
            const { children } = node;
            let currentContainer;
            for (let i = 0; i < children.length; i++) {
                const child = children[i];
                if (isText(child)) {
                    for (let j = i + 1; j < children.length; j++) {
                        const next = children[j];
                        if (isText(next)) {
                            if (!currentContainer) {
                                // 改为复合类型的节点
                                currentContainer = children[i] = {
                                    type: 5 /* COMPOUND_EXPRESSION */,
                                    children: [child],
                                };
                            }
                            currentContainer.children.push(' + ');
                            currentContainer.children.push(next);
                            children.splice(j, 1);
                            j--; // 保证数据的准确性，因为上一步已经删除了下一个子节点
                        }
                        else {
                            currentContainer = undefined;
                            break;
                        }
                    }
                }
            }
        };
    }
}

function baseCompile(template) {
    const ast = baseParse(template);
    transform(ast, {
        nodeTransforms: [transformExpression, transformElement, transformText],
    });
    return generate(ast);
}

// mini-vue出口
function compileToFunction(template) {
    const { code } = baseCompile(template);
    const render = new Function('Vue', code)(runtimeDom);
    return render;
}
registerRuntimeCompiler(compileToFunction);

export { createApp, createVNode as createElementVNode, createRender, createTextVNode, getCurrentInstance, h, inject, nextTick, provide, proxyRefs, ref, registerRuntimeCompiler, renderSlots, toDisplayString };
