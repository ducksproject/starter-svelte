
(function(l, r) { if (!l || l.getElementById('livereloadscript')) return; r = l.createElement('script'); r.async = 1; r.src = '//' + (self.location.host || 'localhost').split(':')[0] + ':35729/livereload.js?snipver=1'; r.id = 'livereloadscript'; l.getElementsByTagName('head')[0].appendChild(r) })(self.document);
var app = (function () {
    'use strict';

    function noop() { }
    function assign(tar, src) {
        // @ts-ignore
        for (const k in src)
            tar[k] = src[k];
        return tar;
    }
    function add_location(element, file, line, column, char) {
        element.__svelte_meta = {
            loc: { file, line, column, char }
        };
    }
    function run(fn) {
        return fn();
    }
    function blank_object() {
        return Object.create(null);
    }
    function run_all(fns) {
        fns.forEach(run);
    }
    function is_function(thing) {
        return typeof thing === 'function';
    }
    function safe_not_equal(a, b) {
        return a != a ? b == b : a !== b || ((a && typeof a === 'object') || typeof a === 'function');
    }
    let src_url_equal_anchor;
    function src_url_equal(element_src, url) {
        if (!src_url_equal_anchor) {
            src_url_equal_anchor = document.createElement('a');
        }
        src_url_equal_anchor.href = url;
        return element_src === src_url_equal_anchor.href;
    }
    function is_empty(obj) {
        return Object.keys(obj).length === 0;
    }
    function create_slot(definition, ctx, $$scope, fn) {
        if (definition) {
            const slot_ctx = get_slot_context(definition, ctx, $$scope, fn);
            return definition[0](slot_ctx);
        }
    }
    function get_slot_context(definition, ctx, $$scope, fn) {
        return definition[1] && fn
            ? assign($$scope.ctx.slice(), definition[1](fn(ctx)))
            : $$scope.ctx;
    }
    function get_slot_changes(definition, $$scope, dirty, fn) {
        if (definition[2] && fn) {
            const lets = definition[2](fn(dirty));
            if ($$scope.dirty === undefined) {
                return lets;
            }
            if (typeof lets === 'object') {
                const merged = [];
                const len = Math.max($$scope.dirty.length, lets.length);
                for (let i = 0; i < len; i += 1) {
                    merged[i] = $$scope.dirty[i] | lets[i];
                }
                return merged;
            }
            return $$scope.dirty | lets;
        }
        return $$scope.dirty;
    }
    function update_slot_base(slot, slot_definition, ctx, $$scope, slot_changes, get_slot_context_fn) {
        if (slot_changes) {
            const slot_context = get_slot_context(slot_definition, ctx, $$scope, get_slot_context_fn);
            slot.p(slot_context, slot_changes);
        }
    }
    function get_all_dirty_from_scope($$scope) {
        if ($$scope.ctx.length > 32) {
            const dirty = [];
            const length = $$scope.ctx.length / 32;
            for (let i = 0; i < length; i++) {
                dirty[i] = -1;
            }
            return dirty;
        }
        return -1;
    }
    function append(target, node) {
        target.appendChild(node);
    }
    function insert(target, node, anchor) {
        target.insertBefore(node, anchor || null);
    }
    function detach(node) {
        node.parentNode.removeChild(node);
    }
    function element(name) {
        return document.createElement(name);
    }
    function svg_element(name) {
        return document.createElementNS('http://www.w3.org/2000/svg', name);
    }
    function text(data) {
        return document.createTextNode(data);
    }
    function space() {
        return text(' ');
    }
    function listen(node, event, handler, options) {
        node.addEventListener(event, handler, options);
        return () => node.removeEventListener(event, handler, options);
    }
    function attr(node, attribute, value) {
        if (value == null)
            node.removeAttribute(attribute);
        else if (node.getAttribute(attribute) !== value)
            node.setAttribute(attribute, value);
    }
    function children(element) {
        return Array.from(element.childNodes);
    }
    function set_style(node, key, value, important) {
        if (value === null) {
            node.style.removeProperty(key);
        }
        else {
            node.style.setProperty(key, value, important ? 'important' : '');
        }
    }
    function custom_event(type, detail, bubbles = false) {
        const e = document.createEvent('CustomEvent');
        e.initCustomEvent(type, bubbles, false, detail);
        return e;
    }

    let current_component;
    function set_current_component(component) {
        current_component = component;
    }

    const dirty_components = [];
    const binding_callbacks = [];
    const render_callbacks = [];
    const flush_callbacks = [];
    const resolved_promise = Promise.resolve();
    let update_scheduled = false;
    function schedule_update() {
        if (!update_scheduled) {
            update_scheduled = true;
            resolved_promise.then(flush);
        }
    }
    function add_render_callback(fn) {
        render_callbacks.push(fn);
    }
    // flush() calls callbacks in this order:
    // 1. All beforeUpdate callbacks, in order: parents before children
    // 2. All bind:this callbacks, in reverse order: children before parents.
    // 3. All afterUpdate callbacks, in order: parents before children. EXCEPT
    //    for afterUpdates called during the initial onMount, which are called in
    //    reverse order: children before parents.
    // Since callbacks might update component values, which could trigger another
    // call to flush(), the following steps guard against this:
    // 1. During beforeUpdate, any updated components will be added to the
    //    dirty_components array and will cause a reentrant call to flush(). Because
    //    the flush index is kept outside the function, the reentrant call will pick
    //    up where the earlier call left off and go through all dirty components. The
    //    current_component value is saved and restored so that the reentrant call will
    //    not interfere with the "parent" flush() call.
    // 2. bind:this callbacks cannot trigger new flush() calls.
    // 3. During afterUpdate, any updated components will NOT have their afterUpdate
    //    callback called a second time; the seen_callbacks set, outside the flush()
    //    function, guarantees this behavior.
    const seen_callbacks = new Set();
    let flushidx = 0; // Do *not* move this inside the flush() function
    function flush() {
        const saved_component = current_component;
        do {
            // first, call beforeUpdate functions
            // and update components
            while (flushidx < dirty_components.length) {
                const component = dirty_components[flushidx];
                flushidx++;
                set_current_component(component);
                update(component.$$);
            }
            set_current_component(null);
            dirty_components.length = 0;
            flushidx = 0;
            while (binding_callbacks.length)
                binding_callbacks.pop()();
            // then, once components are updated, call
            // afterUpdate functions. This may cause
            // subsequent updates...
            for (let i = 0; i < render_callbacks.length; i += 1) {
                const callback = render_callbacks[i];
                if (!seen_callbacks.has(callback)) {
                    // ...so guard against infinite loops
                    seen_callbacks.add(callback);
                    callback();
                }
            }
            render_callbacks.length = 0;
        } while (dirty_components.length);
        while (flush_callbacks.length) {
            flush_callbacks.pop()();
        }
        update_scheduled = false;
        seen_callbacks.clear();
        set_current_component(saved_component);
    }
    function update($$) {
        if ($$.fragment !== null) {
            $$.update();
            run_all($$.before_update);
            const dirty = $$.dirty;
            $$.dirty = [-1];
            $$.fragment && $$.fragment.p($$.ctx, dirty);
            $$.after_update.forEach(add_render_callback);
        }
    }
    const outroing = new Set();
    let outros;
    function transition_in(block, local) {
        if (block && block.i) {
            outroing.delete(block);
            block.i(local);
        }
    }
    function transition_out(block, local, detach, callback) {
        if (block && block.o) {
            if (outroing.has(block))
                return;
            outroing.add(block);
            outros.c.push(() => {
                outroing.delete(block);
                if (callback) {
                    if (detach)
                        block.d(1);
                    callback();
                }
            });
            block.o(local);
        }
    }
    function create_component(block) {
        block && block.c();
    }
    function mount_component(component, target, anchor, customElement) {
        const { fragment, on_mount, on_destroy, after_update } = component.$$;
        fragment && fragment.m(target, anchor);
        if (!customElement) {
            // onMount happens before the initial afterUpdate
            add_render_callback(() => {
                const new_on_destroy = on_mount.map(run).filter(is_function);
                if (on_destroy) {
                    on_destroy.push(...new_on_destroy);
                }
                else {
                    // Edge case - component was destroyed immediately,
                    // most likely as a result of a binding initialising
                    run_all(new_on_destroy);
                }
                component.$$.on_mount = [];
            });
        }
        after_update.forEach(add_render_callback);
    }
    function destroy_component(component, detaching) {
        const $$ = component.$$;
        if ($$.fragment !== null) {
            run_all($$.on_destroy);
            $$.fragment && $$.fragment.d(detaching);
            // TODO null out other refs, including component.$$ (but need to
            // preserve final state?)
            $$.on_destroy = $$.fragment = null;
            $$.ctx = [];
        }
    }
    function make_dirty(component, i) {
        if (component.$$.dirty[0] === -1) {
            dirty_components.push(component);
            schedule_update();
            component.$$.dirty.fill(0);
        }
        component.$$.dirty[(i / 31) | 0] |= (1 << (i % 31));
    }
    function init(component, options, instance, create_fragment, not_equal, props, append_styles, dirty = [-1]) {
        const parent_component = current_component;
        set_current_component(component);
        const $$ = component.$$ = {
            fragment: null,
            ctx: null,
            // state
            props,
            update: noop,
            not_equal,
            bound: blank_object(),
            // lifecycle
            on_mount: [],
            on_destroy: [],
            on_disconnect: [],
            before_update: [],
            after_update: [],
            context: new Map(options.context || (parent_component ? parent_component.$$.context : [])),
            // everything else
            callbacks: blank_object(),
            dirty,
            skip_bound: false,
            root: options.target || parent_component.$$.root
        };
        append_styles && append_styles($$.root);
        let ready = false;
        $$.ctx = instance
            ? instance(component, options.props || {}, (i, ret, ...rest) => {
                const value = rest.length ? rest[0] : ret;
                if ($$.ctx && not_equal($$.ctx[i], $$.ctx[i] = value)) {
                    if (!$$.skip_bound && $$.bound[i])
                        $$.bound[i](value);
                    if (ready)
                        make_dirty(component, i);
                }
                return ret;
            })
            : [];
        $$.update();
        ready = true;
        run_all($$.before_update);
        // `false` as a special case of no DOM component
        $$.fragment = create_fragment ? create_fragment($$.ctx) : false;
        if (options.target) {
            if (options.hydrate) {
                const nodes = children(options.target);
                // eslint-disable-next-line @typescript-eslint/no-non-null-assertion
                $$.fragment && $$.fragment.l(nodes);
                nodes.forEach(detach);
            }
            else {
                // eslint-disable-next-line @typescript-eslint/no-non-null-assertion
                $$.fragment && $$.fragment.c();
            }
            if (options.intro)
                transition_in(component.$$.fragment);
            mount_component(component, options.target, options.anchor, options.customElement);
            flush();
        }
        set_current_component(parent_component);
    }
    /**
     * Base class for Svelte components. Used when dev=false.
     */
    class SvelteComponent {
        $destroy() {
            destroy_component(this, 1);
            this.$destroy = noop;
        }
        $on(type, callback) {
            const callbacks = (this.$$.callbacks[type] || (this.$$.callbacks[type] = []));
            callbacks.push(callback);
            return () => {
                const index = callbacks.indexOf(callback);
                if (index !== -1)
                    callbacks.splice(index, 1);
            };
        }
        $set($$props) {
            if (this.$$set && !is_empty($$props)) {
                this.$$.skip_bound = true;
                this.$$set($$props);
                this.$$.skip_bound = false;
            }
        }
    }

    function dispatch_dev(type, detail) {
        document.dispatchEvent(custom_event(type, Object.assign({ version: '3.46.4' }, detail), true));
    }
    function append_dev(target, node) {
        dispatch_dev('SvelteDOMInsert', { target, node });
        append(target, node);
    }
    function insert_dev(target, node, anchor) {
        dispatch_dev('SvelteDOMInsert', { target, node, anchor });
        insert(target, node, anchor);
    }
    function detach_dev(node) {
        dispatch_dev('SvelteDOMRemove', { node });
        detach(node);
    }
    function listen_dev(node, event, handler, options, has_prevent_default, has_stop_propagation) {
        const modifiers = options === true ? ['capture'] : options ? Array.from(Object.keys(options)) : [];
        if (has_prevent_default)
            modifiers.push('preventDefault');
        if (has_stop_propagation)
            modifiers.push('stopPropagation');
        dispatch_dev('SvelteDOMAddEventListener', { node, event, handler, modifiers });
        const dispose = listen(node, event, handler, options);
        return () => {
            dispatch_dev('SvelteDOMRemoveEventListener', { node, event, handler, modifiers });
            dispose();
        };
    }
    function attr_dev(node, attribute, value) {
        attr(node, attribute, value);
        if (value == null)
            dispatch_dev('SvelteDOMRemoveAttribute', { node, attribute });
        else
            dispatch_dev('SvelteDOMSetAttribute', { node, attribute, value });
    }
    function set_data_dev(text, data) {
        data = '' + data;
        if (text.wholeText === data)
            return;
        dispatch_dev('SvelteDOMSetData', { node: text, data });
        text.data = data;
    }
    function validate_slots(name, slot, keys) {
        for (const slot_key of Object.keys(slot)) {
            if (!~keys.indexOf(slot_key)) {
                console.warn(`<${name}> received an unexpected slot "${slot_key}".`);
            }
        }
    }
    /**
     * Base class for Svelte components with some minor dev-enhancements. Used when dev=true.
     */
    class SvelteComponentDev extends SvelteComponent {
        constructor(options) {
            if (!options || (!options.target && !options.$$inline)) {
                throw new Error("'target' is a required option");
            }
            super();
        }
        $destroy() {
            super.$destroy();
            this.$destroy = () => {
                console.warn('Component was already destroyed'); // eslint-disable-line no-console
            };
        }
        $capture_state() { }
        $inject_state() { }
    }

    /* src/NavBar.svelte generated by Svelte v3.46.4 */
    const file$4 = "src/NavBar.svelte";

    function create_fragment$4(ctx) {
    	let meta;
    	let link0;
    	let link1;
    	let t0;
    	let nav;
    	let img;
    	let img_src_value;
    	let t1;
    	let a0;
    	let t3;
    	let button;
    	let svg;
    	let path;
    	let t4;
    	let div3;
    	let ul;
    	let div2;
    	let div0;
    	let div1;
    	let t5;
    	let li0;
    	let a1;
    	let i0;
    	let t6;
    	let t7;
    	let li1;
    	let a2;
    	let i1;
    	let t8;
    	let t9;
    	let li2;
    	let a3;
    	let i2;
    	let t10;
    	let t11;
    	let li3;
    	let a4;
    	let i3;
    	let t12;
    	let t13;
    	let li4;
    	let a5;
    	let i4;
    	let t14;
    	let t15;
    	let li5;
    	let a6;
    	let i5;
    	let t16;

    	const block = {
    		c: function create() {
    			meta = element("meta");
    			link0 = element("link");
    			link1 = element("link");
    			t0 = space();
    			nav = element("nav");
    			img = element("img");
    			t1 = space();
    			a0 = element("a");
    			a0.textContent = "Ducks mafia DApp";
    			t3 = space();
    			button = element("button");
    			svg = svg_element("svg");
    			path = svg_element("path");
    			t4 = space();
    			div3 = element("div");
    			ul = element("ul");
    			div2 = element("div");
    			div0 = element("div");
    			div1 = element("div");
    			t5 = space();
    			li0 = element("li");
    			a1 = element("a");
    			i0 = element("i");
    			t6 = text("Dashboard");
    			t7 = space();
    			li1 = element("li");
    			a2 = element("a");
    			i1 = element("i");
    			t8 = text("Robberies and attacks");
    			t9 = space();
    			li2 = element("li");
    			a3 = element("a");
    			i2 = element("i");
    			t10 = text("Nursery");
    			t11 = space();
    			li3 = element("li");
    			a4 = element("a");
    			i3 = element("i");
    			t12 = text("Leaderboard");
    			t13 = space();
    			li4 = element("li");
    			a5 = element("a");
    			i4 = element("i");
    			t14 = text("Passive staking");
    			t15 = space();
    			li5 = element("li");
    			a6 = element("a");
    			i5 = element("i");
    			t16 = text("Docs & Links");
    			attr_dev(meta, "name", "viewport");
    			attr_dev(meta, "content", "width=device-width, user-scalable=no, initial-scale=1.0, maximum-scale=1.0, minimum-scale=1.0");
    			add_location(meta, file$4, 5, 1, 71);
    			attr_dev(link0, "rel", "stylesheet");
    			attr_dev(link0, "href", "bootstrap.min.css");
    			add_location(link0, file$4, 6, 1, 199);
    			attr_dev(link1, "rel", "stylesheet");
    			attr_dev(link1, "href", "./navbarstyle.css");
    			add_location(link1, file$4, 7, 1, 249);
    			attr_dev(img, "class", "ducktLogo svelte-p88dtj");
    			set_style(img, "margin-right", "25px");
    			set_style(img, "margin-left", "25px");
    			if (!src_url_equal(img.src, img_src_value = "logo.gif")) attr_dev(img, "src", img_src_value);
    			attr_dev(img, "alt", "logo");
    			add_location(img, file$4, 11, 4, 374);
    			attr_dev(a0, "class", "navbar-brand navbar-logo");
    			attr_dev(a0, "href", "#");
    			set_style(a0, "text-decoration", "none");
    			set_style(a0, "color", "white");
    			set_style(a0, "font-weight", "700");
    			add_location(a0, file$4, 13, 4, 475);
    			attr_dev(path, "d", "M0 96C0 78.3 14.3 64 32 64H416c17.7 0 32 14.3 32 32s-14.3 32-32 32H32C14.3 128 0 113.7 0 96zM0 256c0-17.7 14.3-32 32-32H416c17.7 0 32 14.3 32 32s-14.3 32-32 32H32c-17.7 0-32-14.3-32-32zM448 416c0 17.7-14.3 32-32 32H32c-17.7 0-32-14.3-32-32s14.3-32 32-32H416c17.7 0 32 14.3 32 32z");
    			add_location(path, file$4, 15, 257, 1001);
    			attr_dev(svg, "xmlns", "http://www.w3.org/2000/svg");
    			attr_dev(svg, "width", "40");
    			attr_dev(svg, "height", "40");
    			attr_dev(svg, "viewBox", "0 0 448 512");
    			add_location(svg, file$4, 15, 4, 748);
    			attr_dev(button, "class", "navbar-toggler");
    			attr_dev(button, "type", "button");
    			attr_dev(button, "aria-controls", "navbarSupportedContent");
    			attr_dev(button, "aria-expanded", "false");
    			attr_dev(button, "aria-label", "Toggle navigation");
    			add_location(button, file$4, 14, 4, 606);
    			attr_dev(div0, "class", "left");
    			add_location(div0, file$4, 19, 39, 1477);
    			attr_dev(div1, "class", "right");
    			add_location(div1, file$4, 19, 63, 1501);
    			attr_dev(div2, "class", "hori-selector");
    			add_location(div2, file$4, 19, 12, 1450);
    			attr_dev(i0, "class", "fas fa-tachometer-alt");
    			add_location(i0, file$4, 22, 63, 1664);
    			attr_dev(a1, "class", "nav-link");
    			attr_dev(a1, "href", "javascript:void(0);");
    			add_location(a1, file$4, 22, 16, 1617);
    			attr_dev(li0, "class", "nav-item active dashboardItem");
    			add_location(li0, file$4, 21, 12, 1558);
    			attr_dev(i1, "class", "fas fa-tachometer-alt");
    			add_location(i1, file$4, 25, 63, 1830);
    			attr_dev(a2, "class", "nav-link");
    			attr_dev(a2, "href", "javascript:void(0);");
    			add_location(a2, file$4, 25, 16, 1783);
    			attr_dev(li1, "class", "nav-item");
    			add_location(li1, file$4, 24, 12, 1745);
    			attr_dev(i2, "class", "fas fa-tachometer-alt");
    			add_location(i2, file$4, 28, 63, 2008);
    			attr_dev(a3, "class", "nav-link");
    			attr_dev(a3, "href", "javascript:void(0);");
    			add_location(a3, file$4, 28, 16, 1961);
    			attr_dev(li2, "class", "nav-item");
    			add_location(li2, file$4, 27, 12, 1923);
    			attr_dev(i3, "class", "fas fa-tachometer-alt");
    			add_location(i3, file$4, 31, 63, 2172);
    			attr_dev(a4, "class", "nav-link");
    			attr_dev(a4, "href", "javascript:void(0);");
    			add_location(a4, file$4, 31, 16, 2125);
    			attr_dev(li3, "class", "nav-item");
    			add_location(li3, file$4, 30, 12, 2087);
    			attr_dev(i4, "class", "far fa-image");
    			add_location(i4, file$4, 34, 63, 2340);
    			attr_dev(a5, "class", "nav-link");
    			attr_dev(a5, "href", "javascript:void(0);");
    			add_location(a5, file$4, 34, 16, 2293);
    			attr_dev(li4, "class", "nav-item");
    			add_location(li4, file$4, 33, 12, 2255);
    			attr_dev(i5, "class", "fa fa-link");
    			add_location(i5, file$4, 38, 63, 2516);
    			attr_dev(a6, "class", "nav-link");
    			attr_dev(a6, "href", "javascript:void(0);");
    			add_location(a6, file$4, 38, 16, 2469);
    			attr_dev(li5, "class", "nav-item");
    			add_location(li5, file$4, 37, 12, 2431);
    			attr_dev(ul, "class", "navbar-nav ml-auto");
    			add_location(ul, file$4, 18, 8, 1406);
    			attr_dev(div3, "class", "collapsingBar collapse navbar-collapse svelte-p88dtj");
    			attr_dev(div3, "id", "navbarSupportedContent");
    			add_location(div3, file$4, 17, 4, 1317);
    			attr_dev(nav, "class", "navbar navbar-expand-custom navbar-mainbg svelte-p88dtj");
    			add_location(nav, file$4, 10, 0, 314);
    		},
    		l: function claim(nodes) {
    			throw new Error("options.hydrate only works if the component was compiled with the `hydratable: true` option");
    		},
    		m: function mount(target, anchor) {
    			append_dev(document.head, meta);
    			append_dev(document.head, link0);
    			append_dev(document.head, link1);
    			insert_dev(target, t0, anchor);
    			insert_dev(target, nav, anchor);
    			append_dev(nav, img);
    			append_dev(nav, t1);
    			append_dev(nav, a0);
    			append_dev(nav, t3);
    			append_dev(nav, button);
    			append_dev(button, svg);
    			append_dev(svg, path);
    			append_dev(nav, t4);
    			append_dev(nav, div3);
    			append_dev(div3, ul);
    			append_dev(ul, div2);
    			append_dev(div2, div0);
    			append_dev(div2, div1);
    			append_dev(ul, t5);
    			append_dev(ul, li0);
    			append_dev(li0, a1);
    			append_dev(a1, i0);
    			append_dev(a1, t6);
    			append_dev(ul, t7);
    			append_dev(ul, li1);
    			append_dev(li1, a2);
    			append_dev(a2, i1);
    			append_dev(a2, t8);
    			append_dev(ul, t9);
    			append_dev(ul, li2);
    			append_dev(li2, a3);
    			append_dev(a3, i2);
    			append_dev(a3, t10);
    			append_dev(ul, t11);
    			append_dev(ul, li3);
    			append_dev(li3, a4);
    			append_dev(a4, i3);
    			append_dev(a4, t12);
    			append_dev(ul, t13);
    			append_dev(ul, li4);
    			append_dev(li4, a5);
    			append_dev(a5, i4);
    			append_dev(a5, t14);
    			append_dev(ul, t15);
    			append_dev(ul, li5);
    			append_dev(li5, a6);
    			append_dev(a6, i5);
    			append_dev(a6, t16);
    		},
    		p: noop,
    		i: noop,
    		o: noop,
    		d: function destroy(detaching) {
    			detach_dev(meta);
    			detach_dev(link0);
    			detach_dev(link1);
    			if (detaching) detach_dev(t0);
    			if (detaching) detach_dev(nav);
    		}
    	};

    	dispatch_dev("SvelteRegisterBlock", {
    		block,
    		id: create_fragment$4.name,
    		type: "component",
    		source: "",
    		ctx
    	});

    	return block;
    }

    function instance$4($$self, $$props, $$invalidate) {
    	let { $$slots: slots = {}, $$scope } = $$props;
    	validate_slots('NavBar', slots, []);
    	const writable_props = [];

    	Object.keys($$props).forEach(key => {
    		if (!~writable_props.indexOf(key) && key.slice(0, 2) !== '$$' && key !== 'slot') console.warn(`<NavBar> was created with unknown prop '${key}'`);
    	});

    	$$self.$capture_state = () => ({ App });
    	return [];
    }

    class NavBar extends SvelteComponentDev {
    	constructor(options) {
    		super(options);
    		init(this, options, instance$4, create_fragment$4, safe_not_equal, {});

    		dispatch_dev("SvelteRegisterComponent", {
    			component: this,
    			tagName: "NavBar",
    			options,
    			id: create_fragment$4.name
    		});
    	}
    }

    /* src/NightModeButton.svelte generated by Svelte v3.46.4 */
    const file$3 = "src/NightModeButton.svelte";

    function create_fragment$3(ctx) {
    	let button;
    	let div;
    	let h1;
    	let t0;
    	let t1;
    	let current;
    	let mounted;
    	let dispose;
    	const default_slot_template = /*#slots*/ ctx[3].default;
    	const default_slot = create_slot(default_slot_template, ctx, /*$$scope*/ ctx[2], null);

    	const block = {
    		c: function create() {
    			button = element("button");
    			div = element("div");
    			h1 = element("h1");
    			t0 = text(/*symbole*/ ctx[0]);
    			t1 = space();
    			if (default_slot) default_slot.c();
    			add_location(h1, file$3, 15, 12, 385);
    			set_style(div, "margin-top", "-3px");
    			set_style(div, "margin-left", "-4px");
    			add_location(div, file$3, 14, 8, 322);
    			attr_dev(button, "class", "svelte-qxunf3");
    			add_location(button, file$3, 13, 4, 287);
    		},
    		l: function claim(nodes) {
    			throw new Error("options.hydrate only works if the component was compiled with the `hydratable: true` option");
    		},
    		m: function mount(target, anchor) {
    			insert_dev(target, button, anchor);
    			append_dev(button, div);
    			append_dev(div, h1);
    			append_dev(h1, t0);
    			append_dev(div, t1);

    			if (default_slot) {
    				default_slot.m(div, null);
    			}

    			current = true;

    			if (!mounted) {
    				dispose = listen_dev(button, "click", /*toggle*/ ctx[1], false, false, false);
    				mounted = true;
    			}
    		},
    		p: function update(ctx, [dirty]) {
    			if (!current || dirty & /*symbole*/ 1) set_data_dev(t0, /*symbole*/ ctx[0]);

    			if (default_slot) {
    				if (default_slot.p && (!current || dirty & /*$$scope*/ 4)) {
    					update_slot_base(
    						default_slot,
    						default_slot_template,
    						ctx,
    						/*$$scope*/ ctx[2],
    						!current
    						? get_all_dirty_from_scope(/*$$scope*/ ctx[2])
    						: get_slot_changes(default_slot_template, /*$$scope*/ ctx[2], dirty, null),
    						null
    					);
    				}
    			}
    		},
    		i: function intro(local) {
    			if (current) return;
    			transition_in(default_slot, local);
    			current = true;
    		},
    		o: function outro(local) {
    			transition_out(default_slot, local);
    			current = false;
    		},
    		d: function destroy(detaching) {
    			if (detaching) detach_dev(button);
    			if (default_slot) default_slot.d(detaching);
    			mounted = false;
    			dispose();
    		}
    	};

    	dispatch_dev("SvelteRegisterBlock", {
    		block,
    		id: create_fragment$3.name,
    		type: "component",
    		source: "",
    		ctx
    	});

    	return block;
    }

    function instance$3($$self, $$props, $$invalidate) {
    	let { $$slots: slots = {}, $$scope } = $$props;
    	validate_slots('NightModeButton', slots, ['default']);
    	let symbole = "🌞";

    	function toggle() {
    		window.document.body.classList.toggle('dark-mode');

    		if (symbole == "🌕") {
    			$$invalidate(0, symbole = "🌞");
    		} else {
    			$$invalidate(0, symbole = "🌕");
    		}
    	}

    	const writable_props = [];

    	Object.keys($$props).forEach(key => {
    		if (!~writable_props.indexOf(key) && key.slice(0, 2) !== '$$' && key !== 'slot') console.warn(`<NightModeButton> was created with unknown prop '${key}'`);
    	});

    	$$self.$$set = $$props => {
    		if ('$$scope' in $$props) $$invalidate(2, $$scope = $$props.$$scope);
    	};

    	$$self.$capture_state = () => ({ App, symbole, toggle });

    	$$self.$inject_state = $$props => {
    		if ('symbole' in $$props) $$invalidate(0, symbole = $$props.symbole);
    	};

    	if ($$props && "$$inject" in $$props) {
    		$$self.$inject_state($$props.$$inject);
    	}

    	return [symbole, toggle, $$scope, slots];
    }

    class NightModeButton extends SvelteComponentDev {
    	constructor(options) {
    		super(options);
    		init(this, options, instance$3, create_fragment$3, safe_not_equal, {});

    		dispatch_dev("SvelteRegisterComponent", {
    			component: this,
    			tagName: "NightModeButton",
    			options,
    			id: create_fragment$3.name
    		});
    	}
    }

    /* src/Content.svelte generated by Svelte v3.46.4 */
    const file$2 = "src/Content.svelte";

    function create_fragment$2(ctx) {
    	let div39;
    	let div38;
    	let section;
    	let div8;
    	let div3;
    	let svg0;
    	let t0;
    	let div0;
    	let div2;
    	let div1;
    	let h30;
    	let t2;
    	let div7;
    	let svg1;
    	let t3;
    	let div4;
    	let div6;
    	let div5;
    	let h31;
    	let t5;
    	let div12;
    	let svg2;
    	let t6;
    	let div9;
    	let div11;
    	let div10;
    	let h32;
    	let t8;
    	let div16;
    	let svg3;
    	let t9;
    	let div13;
    	let div15;
    	let div14;
    	let h33;
    	let t11;
    	let div20;
    	let svg4;
    	let t12;
    	let div17;
    	let div19;
    	let div18;
    	let h34;
    	let t14;
    	let div24;
    	let svg5;
    	let t15;
    	let div21;
    	let div23;
    	let div22;
    	let h35;
    	let t17;
    	let div28;
    	let svg6;
    	let t18;
    	let div25;
    	let div27;
    	let div26;
    	let h36;
    	let t20;
    	let div37;
    	let div32;
    	let svg7;
    	let t21;
    	let div29;
    	let div31;
    	let div30;
    	let h37;
    	let t23;
    	let div36;
    	let svg8;
    	let t24;
    	let div33;
    	let div35;
    	let div34;
    	let h38;

    	const block = {
    		c: function create() {
    			div39 = element("div");
    			div38 = element("div");
    			section = element("section");
    			div8 = element("div");
    			div3 = element("div");
    			svg0 = svg_element("svg");
    			t0 = space();
    			div0 = element("div");
    			div2 = element("div");
    			div1 = element("div");
    			h30 = element("h3");
    			h30.textContent = "The ducks mafia Play-to-Earn Arcade is Soon Open!";
    			t2 = space();
    			div7 = element("div");
    			svg1 = svg_element("svg");
    			t3 = space();
    			div4 = element("div");
    			div6 = element("div");
    			div5 = element("div");
    			h31 = element("h3");
    			h31.textContent = "Perfect s";
    			t5 = space();
    			div12 = element("div");
    			svg2 = svg_element("svg");
    			t6 = space();
    			div9 = element("div");
    			div11 = element("div");
    			div10 = element("div");
    			h32 = element("h3");
    			h32.textContent = "Perfect s";
    			t8 = space();
    			div16 = element("div");
    			svg3 = svg_element("svg");
    			t9 = space();
    			div13 = element("div");
    			div15 = element("div");
    			div14 = element("div");
    			h33 = element("h3");
    			h33.textContent = "Perfect s";
    			t11 = space();
    			div20 = element("div");
    			svg4 = svg_element("svg");
    			t12 = space();
    			div17 = element("div");
    			div19 = element("div");
    			div18 = element("div");
    			h34 = element("h3");
    			h34.textContent = "Perfect s";
    			t14 = space();
    			div24 = element("div");
    			svg5 = svg_element("svg");
    			t15 = space();
    			div21 = element("div");
    			div23 = element("div");
    			div22 = element("div");
    			h35 = element("h3");
    			h35.textContent = "Perfect s";
    			t17 = space();
    			div28 = element("div");
    			svg6 = svg_element("svg");
    			t18 = space();
    			div25 = element("div");
    			div27 = element("div");
    			div26 = element("div");
    			h36 = element("h3");
    			h36.textContent = "Perfect s";
    			t20 = space();
    			div37 = element("div");
    			div32 = element("div");
    			svg7 = svg_element("svg");
    			t21 = space();
    			div29 = element("div");
    			div31 = element("div");
    			div30 = element("div");
    			h37 = element("h3");
    			h37.textContent = "Perfect s";
    			t23 = space();
    			div36 = element("div");
    			svg8 = svg_element("svg");
    			t24 = space();
    			div33 = element("div");
    			div35 = element("div");
    			div34 = element("div");
    			h38 = element("h3");
    			h38.textContent = "Perfect s";
    			attr_dev(svg0, "xmlns", "http://www.w3.org/2000/svg");
    			attr_dev(svg0, "viewBox", "0 0 2 1");
    			attr_dev(svg0, "class", "svelte-v1ad9j");
    			add_location(svg0, file$2, 8, 14, 214);
    			attr_dev(div0, "class", "mask svelte-v1ad9j");
    			add_location(div0, file$2, 9, 14, 288);
    			attr_dev(h30, "class", "title1 svelte-v1ad9j");
    			add_location(h30, file$2, 12, 20, 406);
    			attr_dev(div1, "class", "intInbox svelte-v1ad9j");
    			add_location(div1, file$2, 11, 16, 363);
    			attr_dev(div2, "class", "inbox svelte-v1ad9j");
    			add_location(div2, file$2, 10, 20, 327);
    			attr_dev(div3, "class", "square col-100 svelte-v1ad9j");
    			add_location(div3, file$2, 7, 32, 171);
    			attr_dev(svg1, "xmlns", "http://www.w3.org/2000/svg");
    			attr_dev(svg1, "viewBox", "0 0 2 1");
    			attr_dev(svg1, "class", "svelte-v1ad9j");
    			add_location(svg1, file$2, 16, 14, 585);
    			attr_dev(div4, "class", "mask svelte-v1ad9j");
    			add_location(div4, file$2, 17, 14, 659);
    			attr_dev(h31, "class", "svelte-v1ad9j");
    			add_location(h31, file$2, 20, 20, 777);
    			attr_dev(div5, "class", "intInbox svelte-v1ad9j");
    			add_location(div5, file$2, 19, 16, 734);
    			attr_dev(div6, "class", "inbox svelte-v1ad9j");
    			add_location(div6, file$2, 18, 20, 698);
    			attr_dev(div7, "class", "square col-100 svelte-v1ad9j");
    			add_location(div7, file$2, 15, 18, 542);
    			attr_dev(div8, "class", "col-66 svelte-v1ad9j");
    			add_location(div8, file$2, 7, 12, 151);
    			attr_dev(svg2, "xmlns", "http://www.w3.org/2000/svg");
    			attr_dev(svg2, "viewBox", "0 0 1 2");
    			attr_dev(svg2, "class", "svelte-v1ad9j");
    			add_location(svg2, file$2, 24, 14, 906);
    			attr_dev(div9, "class", "mask svelte-v1ad9j");
    			add_location(div9, file$2, 25, 14, 980);
    			attr_dev(h32, "class", "svelte-v1ad9j");
    			add_location(h32, file$2, 28, 20, 1098);
    			attr_dev(div10, "class", "intInbox svelte-v1ad9j");
    			add_location(div10, file$2, 27, 16, 1055);
    			attr_dev(div11, "class", "inbox svelte-v1ad9j");
    			add_location(div11, file$2, 26, 20, 1019);
    			attr_dev(div12, "class", "square col-33 svelte-v1ad9j");
    			add_location(div12, file$2, 23, 24, 864);
    			attr_dev(svg3, "xmlns", "http://www.w3.org/2000/svg");
    			attr_dev(svg3, "viewBox", "0 0 1 1");
    			attr_dev(svg3, "class", "svelte-v1ad9j");
    			add_location(svg3, file$2, 34, 14, 1247);
    			attr_dev(div13, "class", "mask svelte-v1ad9j");
    			add_location(div13, file$2, 35, 14, 1321);
    			attr_dev(h33, "class", "svelte-v1ad9j");
    			add_location(h33, file$2, 38, 20, 1439);
    			attr_dev(div14, "class", "intInbox svelte-v1ad9j");
    			add_location(div14, file$2, 37, 16, 1396);
    			attr_dev(div15, "class", "inbox svelte-v1ad9j");
    			add_location(div15, file$2, 36, 20, 1360);
    			attr_dev(div16, "class", "square col-33 svelte-v1ad9j");
    			add_location(div16, file$2, 33, 12, 1205);
    			attr_dev(svg4, "xmlns", "http://www.w3.org/2000/svg");
    			attr_dev(svg4, "viewBox", "0 0 1 1");
    			attr_dev(svg4, "class", "svelte-v1ad9j");
    			add_location(svg4, file$2, 42, 14, 1562);
    			attr_dev(div17, "class", "mask svelte-v1ad9j");
    			add_location(div17, file$2, 43, 14, 1636);
    			attr_dev(h34, "class", "svelte-v1ad9j");
    			add_location(h34, file$2, 46, 20, 1754);
    			attr_dev(div18, "class", "intInbox svelte-v1ad9j");
    			add_location(div18, file$2, 45, 16, 1711);
    			attr_dev(div19, "class", "inbox svelte-v1ad9j");
    			add_location(div19, file$2, 44, 20, 1675);
    			attr_dev(div20, "class", "square col-33 svelte-v1ad9j");
    			add_location(div20, file$2, 41, 18, 1520);
    			attr_dev(svg5, "xmlns", "http://www.w3.org/2000/svg");
    			attr_dev(svg5, "viewBox", "0 0 1 1");
    			attr_dev(svg5, "class", "svelte-v1ad9j");
    			add_location(svg5, file$2, 50, 14, 1877);
    			attr_dev(div21, "class", "mask svelte-v1ad9j");
    			add_location(div21, file$2, 51, 14, 1951);
    			attr_dev(h35, "class", "svelte-v1ad9j");
    			add_location(h35, file$2, 54, 20, 2069);
    			attr_dev(div22, "class", "intInbox svelte-v1ad9j");
    			add_location(div22, file$2, 53, 16, 2026);
    			attr_dev(div23, "class", "inbox svelte-v1ad9j");
    			add_location(div23, file$2, 52, 20, 1990);
    			attr_dev(div24, "class", "square col-33 svelte-v1ad9j");
    			add_location(div24, file$2, 49, 18, 1835);
    			attr_dev(svg6, "xmlns", "http://www.w3.org/2000/svg");
    			attr_dev(svg6, "viewBox", "0 0 1 1");
    			attr_dev(svg6, "class", "svelte-v1ad9j");
    			add_location(svg6, file$2, 60, 14, 2206);
    			attr_dev(div25, "class", "mask svelte-v1ad9j");
    			add_location(div25, file$2, 61, 14, 2280);
    			attr_dev(h36, "class", "svelte-v1ad9j");
    			add_location(h36, file$2, 64, 20, 2398);
    			attr_dev(div26, "class", "intInbox svelte-v1ad9j");
    			add_location(div26, file$2, 63, 16, 2355);
    			attr_dev(div27, "class", "inbox svelte-v1ad9j");
    			add_location(div27, file$2, 62, 20, 2319);
    			attr_dev(div28, "class", "square col-50 svelte-v1ad9j");
    			add_location(div28, file$2, 59, 12, 2164);
    			attr_dev(svg7, "xmlns", "http://www.w3.org/2000/svg");
    			attr_dev(svg7, "viewBox", "0 0 2 1");
    			attr_dev(svg7, "class", "svelte-v1ad9j");
    			add_location(svg7, file$2, 68, 14, 2542);
    			attr_dev(div29, "class", "mask svelte-v1ad9j");
    			add_location(div29, file$2, 69, 14, 2616);
    			attr_dev(h37, "class", "svelte-v1ad9j");
    			add_location(h37, file$2, 72, 20, 2734);
    			attr_dev(div30, "class", "intInbox svelte-v1ad9j");
    			add_location(div30, file$2, 71, 16, 2691);
    			attr_dev(div31, "class", "inbox svelte-v1ad9j");
    			add_location(div31, file$2, 70, 20, 2655);
    			attr_dev(div32, "class", "square col-100 svelte-v1ad9j");
    			add_location(div32, file$2, 67, 38, 2499);
    			attr_dev(svg8, "xmlns", "http://www.w3.org/2000/svg");
    			attr_dev(svg8, "viewBox", "0 0 2 1");
    			attr_dev(svg8, "class", "svelte-v1ad9j");
    			add_location(svg8, file$2, 76, 14, 2858);
    			attr_dev(div33, "class", "mask svelte-v1ad9j");
    			add_location(div33, file$2, 77, 14, 2932);
    			attr_dev(h38, "class", "svelte-v1ad9j");
    			add_location(h38, file$2, 80, 20, 3050);
    			attr_dev(div34, "class", "intInbox svelte-v1ad9j");
    			add_location(div34, file$2, 79, 16, 3007);
    			attr_dev(div35, "class", "inbox svelte-v1ad9j");
    			add_location(div35, file$2, 78, 20, 2971);
    			attr_dev(div36, "class", "square col-100 svelte-v1ad9j");
    			add_location(div36, file$2, 75, 18, 2815);
    			attr_dev(div37, "class", "col-50 svelte-v1ad9j");
    			add_location(div37, file$2, 67, 18, 2479);
    			attr_dev(section, "class", "svelte-v1ad9j");
    			add_location(section, file$2, 6, 8, 129);
    			attr_dev(div38, "class", "content svelte-v1ad9j");
    			add_location(div38, file$2, 5, 4, 99);
    			set_style(div39, "background-color", "white");
    			add_location(div39, file$2, 4, 0, 56);
    		},
    		l: function claim(nodes) {
    			throw new Error("options.hydrate only works if the component was compiled with the `hydratable: true` option");
    		},
    		m: function mount(target, anchor) {
    			insert_dev(target, div39, anchor);
    			append_dev(div39, div38);
    			append_dev(div38, section);
    			append_dev(section, div8);
    			append_dev(div8, div3);
    			append_dev(div3, svg0);
    			append_dev(div3, t0);
    			append_dev(div3, div0);
    			append_dev(div3, div2);
    			append_dev(div2, div1);
    			append_dev(div1, h30);
    			append_dev(div3, t2);
    			append_dev(div8, div7);
    			append_dev(div7, svg1);
    			append_dev(div7, t3);
    			append_dev(div7, div4);
    			append_dev(div7, div6);
    			append_dev(div6, div5);
    			append_dev(div5, h31);
    			append_dev(div7, t5);
    			append_dev(section, div12);
    			append_dev(div12, svg2);
    			append_dev(div12, t6);
    			append_dev(div12, div9);
    			append_dev(div12, div11);
    			append_dev(div11, div10);
    			append_dev(div10, h32);
    			append_dev(section, t8);
    			append_dev(section, div16);
    			append_dev(div16, svg3);
    			append_dev(div16, t9);
    			append_dev(div16, div13);
    			append_dev(div16, div15);
    			append_dev(div15, div14);
    			append_dev(div14, h33);
    			append_dev(div16, t11);
    			append_dev(section, div20);
    			append_dev(div20, svg4);
    			append_dev(div20, t12);
    			append_dev(div20, div17);
    			append_dev(div20, div19);
    			append_dev(div19, div18);
    			append_dev(div18, h34);
    			append_dev(div20, t14);
    			append_dev(section, div24);
    			append_dev(div24, svg5);
    			append_dev(div24, t15);
    			append_dev(div24, div21);
    			append_dev(div24, div23);
    			append_dev(div23, div22);
    			append_dev(div22, h35);
    			append_dev(section, t17);
    			append_dev(section, div28);
    			append_dev(div28, svg6);
    			append_dev(div28, t18);
    			append_dev(div28, div25);
    			append_dev(div28, div27);
    			append_dev(div27, div26);
    			append_dev(div26, h36);
    			append_dev(div28, t20);
    			append_dev(section, div37);
    			append_dev(div37, div32);
    			append_dev(div32, svg7);
    			append_dev(div32, t21);
    			append_dev(div32, div29);
    			append_dev(div32, div31);
    			append_dev(div31, div30);
    			append_dev(div30, h37);
    			append_dev(div32, t23);
    			append_dev(div37, div36);
    			append_dev(div36, svg8);
    			append_dev(div36, t24);
    			append_dev(div36, div33);
    			append_dev(div36, div35);
    			append_dev(div35, div34);
    			append_dev(div34, h38);
    		},
    		p: noop,
    		i: noop,
    		o: noop,
    		d: function destroy(detaching) {
    			if (detaching) detach_dev(div39);
    		}
    	};

    	dispatch_dev("SvelteRegisterBlock", {
    		block,
    		id: create_fragment$2.name,
    		type: "component",
    		source: "",
    		ctx
    	});

    	return block;
    }

    function instance$2($$self, $$props, $$invalidate) {
    	let { $$slots: slots = {}, $$scope } = $$props;
    	validate_slots('Content', slots, []);
    	const writable_props = [];

    	Object.keys($$props).forEach(key => {
    		if (!~writable_props.indexOf(key) && key.slice(0, 2) !== '$$' && key !== 'slot') console.warn(`<Content> was created with unknown prop '${key}'`);
    	});

    	$$self.$capture_state = () => ({ App });
    	return [];
    }

    class Content extends SvelteComponentDev {
    	constructor(options) {
    		super(options);
    		init(this, options, instance$2, create_fragment$2, safe_not_equal, {});

    		dispatch_dev("SvelteRegisterComponent", {
    			component: this,
    			tagName: "Content",
    			options,
    			id: create_fragment$2.name
    		});
    	}
    }

    /* src/Footer.svelte generated by Svelte v3.46.4 */
    const file$1 = "src/Footer.svelte";

    function create_fragment$1(ctx) {
    	let footer;
    	let div4;
    	let div3;
    	let div0;
    	let h60;
    	let t1;
    	let p0;
    	let b;
    	let t3;
    	let a0;
    	let t5;
    	let a1;
    	let t7;
    	let u;
    	let t9;
    	let t10;
    	let div1;
    	let h61;
    	let t12;
    	let ul0;
    	let li0;
    	let a2;
    	let t14;
    	let li1;
    	let a3;
    	let t16;
    	let li2;
    	let a4;
    	let t18;
    	let li3;
    	let a5;
    	let t20;
    	let li4;
    	let a6;
    	let t22;
    	let li5;
    	let a7;
    	let t24;
    	let div2;
    	let h62;
    	let t26;
    	let ul1;
    	let li6;
    	let a8;
    	let t28;
    	let li7;
    	let a9;
    	let t30;
    	let li8;
    	let a10;
    	let t32;
    	let li9;
    	let a11;
    	let t34;
    	let hr;
    	let t35;
    	let div8;
    	let div7;
    	let div5;
    	let p1;
    	let t36;
    	let a12;
    	let t38;
    	let t39;
    	let div6;
    	let ul2;
    	let li10;
    	let a13;
    	let svg0;
    	let path0;
    	let t40;
    	let li11;
    	let a14;
    	let svg1;
    	let path1;
    	let t41;
    	let li12;
    	let a15;
    	let svg2;
    	let path2;

    	const block = {
    		c: function create() {
    			footer = element("footer");
    			div4 = element("div");
    			div3 = element("div");
    			div0 = element("div");
    			h60 = element("h6");
    			h60.textContent = "About";
    			t1 = space();
    			p0 = element("p");
    			b = element("b");
    			b.textContent = "The Ducks Mafia";
    			t3 = text(" is a project on the decentralized network ");
    			a0 = element("a");
    			a0.textContent = "Radix";
    			t5 = text(". Created in December 2021, it is the result of a voluntary association between cryptocurrency enthusiasts. Discover ");
    			a1 = element("a");
    			a1.textContent = "#Radix";
    			t7 = text(" and use of a fun and interesting application mixing ");
    			u = element("u");
    			u.textContent = "game and investment";
    			t9 = text(" 🦆.");
    			t10 = space();
    			div1 = element("div");
    			h61 = element("h6");
    			h61.textContent = "Categories";
    			t12 = space();
    			ul0 = element("ul");
    			li0 = element("li");
    			a2 = element("a");
    			a2.textContent = "Dashboard";
    			t14 = space();
    			li1 = element("li");
    			a3 = element("a");
    			a3.textContent = "Robberies and attacks";
    			t16 = space();
    			li2 = element("li");
    			a4 = element("a");
    			a4.textContent = "Nursery";
    			t18 = space();
    			li3 = element("li");
    			a5 = element("a");
    			a5.textContent = "Leaderboard";
    			t20 = space();
    			li4 = element("li");
    			a6 = element("a");
    			a6.textContent = "Passive staking";
    			t22 = space();
    			li5 = element("li");
    			a7 = element("a");
    			a7.textContent = "Docs & Links";
    			t24 = space();
    			div2 = element("div");
    			h62 = element("h6");
    			h62.textContent = "Quick Links";
    			t26 = space();
    			ul1 = element("ul");
    			li6 = element("li");
    			a8 = element("a");
    			a8.textContent = "DogecubeX";
    			t28 = space();
    			li7 = element("li");
    			a9 = element("a");
    			a9.textContent = "Ociswap";
    			t30 = space();
    			li8 = element("li");
    			a10 = element("a");
    			a10.textContent = "CaviarSwap";
    			t32 = space();
    			li9 = element("li");
    			a11 = element("a");
    			a11.textContent = "Dsor";
    			t34 = space();
    			hr = element("hr");
    			t35 = space();
    			div8 = element("div");
    			div7 = element("div");
    			div5 = element("div");
    			p1 = element("p");
    			t36 = text("Copyright © 2021-2023 All Rights Reserved by \n       ");
    			a12 = element("a");
    			a12.textContent = "the Ducks Mafia";
    			t38 = text(".");
    			t39 = space();
    			div6 = element("div");
    			ul2 = element("ul");
    			li10 = element("li");
    			a13 = element("a");
    			svg0 = svg_element("svg");
    			path0 = svg_element("path");
    			t40 = space();
    			li11 = element("li");
    			a14 = element("a");
    			svg1 = svg_element("svg");
    			path1 = svg_element("path");
    			t41 = space();
    			li12 = element("li");
    			a15 = element("a");
    			svg2 = svg_element("svg");
    			path2 = svg_element("path");
    			attr_dev(h60, "class", "svelte-15zczb9");
    			add_location(h60, file$1, 9, 10, 213);
    			add_location(b, file$1, 10, 34, 262);
    			set_style(a0, "color", "white");
    			attr_dev(a0, "href", "https://twitter.com/radixdlt");
    			attr_dev(a0, "class", "svelte-15zczb9");
    			add_location(a0, file$1, 10, 99, 327);
    			set_style(a1, "color", "white");
    			attr_dev(a1, "href", "https://twitter.com/search?q=%23radix");
    			attr_dev(a1, "class", "svelte-15zczb9");
    			add_location(a1, file$1, 10, 286, 514);
    			add_location(u, file$1, 10, 419, 647);
    			attr_dev(p0, "class", "text-justify");
    			add_location(p0, file$1, 10, 10, 238);
    			attr_dev(div0, "class", "col-sm-12 col-md-6 svelte-15zczb9");
    			add_location(div0, file$1, 8, 8, 170);
    			attr_dev(h61, "class", "svelte-15zczb9");
    			add_location(h61, file$1, 14, 10, 748);
    			attr_dev(a2, "href", "#");
    			attr_dev(a2, "class", "svelte-15zczb9");
    			add_location(a2, file$1, 16, 16, 820);
    			attr_dev(li0, "class", "svelte-15zczb9");
    			add_location(li0, file$1, 16, 12, 816);
    			attr_dev(a3, "href", "#");
    			attr_dev(a3, "class", "svelte-15zczb9");
    			add_location(a3, file$1, 17, 16, 867);
    			attr_dev(li1, "class", "svelte-15zczb9");
    			add_location(li1, file$1, 17, 12, 863);
    			attr_dev(a4, "href", "#");
    			attr_dev(a4, "class", "svelte-15zczb9");
    			add_location(a4, file$1, 18, 16, 926);
    			attr_dev(li2, "class", "svelte-15zczb9");
    			add_location(li2, file$1, 18, 12, 922);
    			attr_dev(a5, "href", "#");
    			attr_dev(a5, "class", "svelte-15zczb9");
    			add_location(a5, file$1, 19, 16, 971);
    			attr_dev(li3, "class", "svelte-15zczb9");
    			add_location(li3, file$1, 19, 12, 967);
    			attr_dev(a6, "href", "#");
    			attr_dev(a6, "class", "svelte-15zczb9");
    			add_location(a6, file$1, 20, 16, 1020);
    			attr_dev(li4, "class", "svelte-15zczb9");
    			add_location(li4, file$1, 20, 12, 1016);
    			attr_dev(a7, "href", "#");
    			attr_dev(a7, "class", "svelte-15zczb9");
    			add_location(a7, file$1, 21, 16, 1073);
    			attr_dev(li5, "class", "svelte-15zczb9");
    			add_location(li5, file$1, 21, 12, 1069);
    			attr_dev(ul0, "class", "footer-links svelte-15zczb9");
    			add_location(ul0, file$1, 15, 10, 778);
    			attr_dev(div1, "class", "col-xs-6 col-md-3 svelte-15zczb9");
    			add_location(div1, file$1, 13, 8, 706);
    			attr_dev(h62, "class", "svelte-15zczb9");
    			add_location(h62, file$1, 26, 10, 1189);
    			attr_dev(a8, "href", "https://dogecubex.live/");
    			attr_dev(a8, "class", "svelte-15zczb9");
    			add_location(a8, file$1, 28, 16, 1262);
    			attr_dev(li6, "class", "svelte-15zczb9");
    			add_location(li6, file$1, 28, 12, 1258);
    			attr_dev(a9, "href", "https://ociswap.com/");
    			attr_dev(a9, "class", "svelte-15zczb9");
    			add_location(a9, file$1, 29, 16, 1331);
    			attr_dev(li7, "class", "svelte-15zczb9");
    			add_location(li7, file$1, 29, 12, 1327);
    			attr_dev(a10, "href", "https://caviarswap.io/");
    			attr_dev(a10, "class", "svelte-15zczb9");
    			add_location(a10, file$1, 30, 16, 1395);
    			attr_dev(li8, "class", "svelte-15zczb9");
    			add_location(li8, file$1, 30, 12, 1391);
    			attr_dev(a11, "href", "https://dsor.io/");
    			attr_dev(a11, "class", "svelte-15zczb9");
    			add_location(a11, file$1, 31, 16, 1464);
    			attr_dev(li9, "class", "svelte-15zczb9");
    			add_location(li9, file$1, 31, 12, 1460);
    			attr_dev(ul1, "class", "footer-links svelte-15zczb9");
    			add_location(ul1, file$1, 27, 10, 1220);
    			attr_dev(div2, "class", "col-xs-6 col-md-3 svelte-15zczb9");
    			add_location(div2, file$1, 25, 8, 1147);
    			attr_dev(div3, "class", "row");
    			add_location(div3, file$1, 7, 6, 144);
    			attr_dev(hr, "class", "svelte-15zczb9");
    			add_location(hr, file$1, 35, 6, 1555);
    			attr_dev(div4, "class", "container");
    			add_location(div4, file$1, 6, 4, 114);
    			attr_dev(a12, "href", "https://mobile.twitter.com/ducksmafiaxrd");
    			attr_dev(a12, "class", "svelte-15zczb9");
    			add_location(a12, file$1, 41, 7, 1767);
    			attr_dev(p1, "class", "copyright-text svelte-15zczb9");
    			add_location(p1, file$1, 40, 10, 1683);
    			attr_dev(div5, "class", "col-md-8 col-sm-6 col-xs-12 svelte-15zczb9");
    			add_location(div5, file$1, 39, 8, 1631);
    			attr_dev(path0, "d", "M459.37 151.716c.325 4.548.325 9.097.325 13.645 0 138.72-105.583 298.558-298.558 298.558-59.452 0-114.68-17.219-161.137-47.106 8.447.974 16.568 1.299 25.34 1.299 49.055 0 94.213-16.568 130.274-44.832-46.132-.975-84.792-31.188-98.112-72.772 6.498.974 12.995 1.624 19.818 1.624 9.421 0 18.843-1.3 27.614-3.573-48.081-9.747-84.143-51.98-84.143-102.985v-1.299c13.969 7.797 30.214 12.67 47.431 13.319-28.264-18.843-46.781-51.005-46.781-87.391 0-19.492 5.197-37.36 14.294-52.954 51.655 63.675 129.3 105.258 216.365 109.807-1.624-7.797-2.599-15.918-2.599-24.04 0-57.828 46.782-104.934 104.934-104.934 30.213 0 57.502 12.67 76.67 33.137 23.715-4.548 46.456-13.32 66.599-25.34-7.798 24.366-24.366 44.833-46.132 57.827 21.117-2.273 41.584-8.122 60.426-16.243-14.292 20.791-32.161 39.308-52.628 54.253z");
    			add_location(path0, file$1, 47, 307, 2263);
    			attr_dev(svg0, "xmlns", "http://www.w3.org/2000/svg");
    			attr_dev(svg0, "viewBox", "0 0 512 512");
    			add_location(svg0, file$1, 47, 77, 2033);
    			attr_dev(a13, "class", "twitter svelte-15zczb9");
    			attr_dev(a13, "href", "https://twitter.com/ducksMafiaXRD/");
    			add_location(a13, file$1, 47, 16, 1972);
    			attr_dev(li10, "class", "svelte-15zczb9");
    			add_location(li10, file$1, 47, 12, 1968);
    			attr_dev(path1, "d", "M248,8C111.033,8,0,119.033,0,256S111.033,504,248,504,496,392.967,496,256,384.967,8,248,8ZM362.952,176.66c-3.732,39.215-19.881,134.378-28.1,178.3-3.476,18.584-10.322,24.816-16.948,25.425-14.4,1.326-25.338-9.517-39.287-18.661-21.827-14.308-34.158-23.215-55.346-37.177-24.485-16.135-8.612-25,5.342-39.5,3.652-3.793,67.107-61.51,68.335-66.746.153-.655.3-3.1-1.154-4.384s-3.59-.849-5.135-.5q-3.283.746-104.608,69.142-14.845,10.194-26.894,9.934c-8.855-.191-25.888-5.006-38.551-9.123-15.531-5.048-27.875-7.717-26.8-16.291q.84-6.7,18.45-13.7,108.446-47.248,144.628-62.3c68.872-28.647,83.183-33.623,92.511-33.789,2.052-.034,6.639.474,9.61,2.885a10.452,10.452,0,0,1,3.53,6.716A43.765,43.765,0,0,1,362.952,176.66Z");
    			add_location(path1, file$1, 48, 300, 3382);
    			attr_dev(svg1, "xmlns", "http://www.w3.org/2000/svg");
    			attr_dev(svg1, "viewBox", "0 0 496 512");
    			add_location(svg1, file$1, 48, 70, 3152);
    			attr_dev(a14, "class", "telegram svelte-15zczb9");
    			attr_dev(a14, "href", "https://t.me/xrdDucksMafia");
    			add_location(a14, file$1, 48, 16, 3098);
    			attr_dev(li11, "class", "svelte-15zczb9");
    			add_location(li11, file$1, 48, 12, 3094);
    			attr_dev(path2, "d", "M579.8 267.7c56.5-56.5 56.5-148 0-204.5c-50-50-128.8-56.5-186.3-15.4l-1.6 1.1c-14.4 10.3-17.7 30.3-7.4 44.6s30.3 17.7 44.6 7.4l1.6-1.1c32.1-22.9 76-19.3 103.8 8.6c31.5 31.5 31.5 82.5 0 114L422.3 334.8c-31.5 31.5-82.5 31.5-114 0c-27.9-27.9-31.5-71.8-8.6-103.8l1.1-1.6c10.3-14.4 6.9-34.4-7.4-44.6s-34.4-6.9-44.6 7.4l-1.1 1.6C206.5 251.2 213 330 263 380c56.5 56.5 148 56.5 204.5 0L579.8 267.7zM60.2 244.3c-56.5 56.5-56.5 148 0 204.5c50 50 128.8 56.5 186.3 15.4l1.6-1.1c14.4-10.3 17.7-30.3 7.4-44.6s-30.3-17.7-44.6-7.4l-1.6 1.1c-32.1 22.9-76 19.3-103.8-8.6C74 372 74 321 105.5 289.5L217.7 177.2c31.5-31.5 82.5-31.5 114 0c27.9 27.9 31.5 71.8 8.6 103.9l-1.1 1.6c-10.3 14.4-6.9 34.4 7.4 44.6s34.4 6.9 44.6-7.4l1.1-1.6C433.5 260.8 427 182 377 132c-56.5-56.5-148-56.5-204.5 0L60.2 244.3z");
    			add_location(path2, file$1, 49, 300, 4412);
    			attr_dev(svg2, "xmlns", "http://www.w3.org/2000/svg");
    			attr_dev(svg2, "viewBox", "0 0 640 512");
    			add_location(svg2, file$1, 49, 70, 4182);
    			attr_dev(a15, "class", "linkTree svelte-15zczb9");
    			attr_dev(a15, "href", "https://linktr.ee/XRDDUCKM");
    			add_location(a15, file$1, 49, 16, 4128);
    			attr_dev(li12, "class", "svelte-15zczb9");
    			add_location(li12, file$1, 49, 12, 4124);
    			attr_dev(ul2, "class", "social-icons svelte-15zczb9");
    			add_location(ul2, file$1, 46, 10, 1930);
    			attr_dev(div6, "class", "col-md-4 col-sm-6 col-xs-12 svelte-15zczb9");
    			add_location(div6, file$1, 45, 8, 1878);
    			attr_dev(div7, "class", "row");
    			add_location(div7, file$1, 38, 6, 1605);
    			attr_dev(div8, "class", "container");
    			add_location(div8, file$1, 37, 4, 1575);
    			attr_dev(footer, "class", "site-footer svelte-15zczb9");
    			add_location(footer, file$1, 5, 2, 81);
    		},
    		l: function claim(nodes) {
    			throw new Error("options.hydrate only works if the component was compiled with the `hydratable: true` option");
    		},
    		m: function mount(target, anchor) {
    			insert_dev(target, footer, anchor);
    			append_dev(footer, div4);
    			append_dev(div4, div3);
    			append_dev(div3, div0);
    			append_dev(div0, h60);
    			append_dev(div0, t1);
    			append_dev(div0, p0);
    			append_dev(p0, b);
    			append_dev(p0, t3);
    			append_dev(p0, a0);
    			append_dev(p0, t5);
    			append_dev(p0, a1);
    			append_dev(p0, t7);
    			append_dev(p0, u);
    			append_dev(p0, t9);
    			append_dev(div3, t10);
    			append_dev(div3, div1);
    			append_dev(div1, h61);
    			append_dev(div1, t12);
    			append_dev(div1, ul0);
    			append_dev(ul0, li0);
    			append_dev(li0, a2);
    			append_dev(ul0, t14);
    			append_dev(ul0, li1);
    			append_dev(li1, a3);
    			append_dev(ul0, t16);
    			append_dev(ul0, li2);
    			append_dev(li2, a4);
    			append_dev(ul0, t18);
    			append_dev(ul0, li3);
    			append_dev(li3, a5);
    			append_dev(ul0, t20);
    			append_dev(ul0, li4);
    			append_dev(li4, a6);
    			append_dev(ul0, t22);
    			append_dev(ul0, li5);
    			append_dev(li5, a7);
    			append_dev(div3, t24);
    			append_dev(div3, div2);
    			append_dev(div2, h62);
    			append_dev(div2, t26);
    			append_dev(div2, ul1);
    			append_dev(ul1, li6);
    			append_dev(li6, a8);
    			append_dev(ul1, t28);
    			append_dev(ul1, li7);
    			append_dev(li7, a9);
    			append_dev(ul1, t30);
    			append_dev(ul1, li8);
    			append_dev(li8, a10);
    			append_dev(ul1, t32);
    			append_dev(ul1, li9);
    			append_dev(li9, a11);
    			append_dev(div4, t34);
    			append_dev(div4, hr);
    			append_dev(footer, t35);
    			append_dev(footer, div8);
    			append_dev(div8, div7);
    			append_dev(div7, div5);
    			append_dev(div5, p1);
    			append_dev(p1, t36);
    			append_dev(p1, a12);
    			append_dev(p1, t38);
    			append_dev(div7, t39);
    			append_dev(div7, div6);
    			append_dev(div6, ul2);
    			append_dev(ul2, li10);
    			append_dev(li10, a13);
    			append_dev(a13, svg0);
    			append_dev(svg0, path0);
    			append_dev(ul2, t40);
    			append_dev(ul2, li11);
    			append_dev(li11, a14);
    			append_dev(a14, svg1);
    			append_dev(svg1, path1);
    			append_dev(ul2, t41);
    			append_dev(ul2, li12);
    			append_dev(li12, a15);
    			append_dev(a15, svg2);
    			append_dev(svg2, path2);
    		},
    		p: noop,
    		i: noop,
    		o: noop,
    		d: function destroy(detaching) {
    			if (detaching) detach_dev(footer);
    		}
    	};

    	dispatch_dev("SvelteRegisterBlock", {
    		block,
    		id: create_fragment$1.name,
    		type: "component",
    		source: "",
    		ctx
    	});

    	return block;
    }

    function instance$1($$self, $$props, $$invalidate) {
    	let { $$slots: slots = {}, $$scope } = $$props;
    	validate_slots('Footer', slots, []);
    	const writable_props = [];

    	Object.keys($$props).forEach(key => {
    		if (!~writable_props.indexOf(key) && key.slice(0, 2) !== '$$' && key !== 'slot') console.warn(`<Footer> was created with unknown prop '${key}'`);
    	});

    	$$self.$capture_state = () => ({ App });
    	return [];
    }

    class Footer extends SvelteComponentDev {
    	constructor(options) {
    		super(options);
    		init(this, options, instance$1, create_fragment$1, safe_not_equal, {});

    		dispatch_dev("SvelteRegisterComponent", {
    			component: this,
    			tagName: "Footer",
    			options,
    			id: create_fragment$1.name
    		});
    	}
    }

    /* src/App.svelte generated by Svelte v3.46.4 */
    const file = "src/App.svelte";

    function create_fragment(ctx) {
    	let script0;
    	let script0_src_value;
    	let meta;
    	let link;
    	let t0;
    	let main;
    	let div3;
    	let div0;
    	let h6;
    	let a0;
    	let t2;
    	let a1;
    	let t4;
    	let div1;
    	let nightmodebutton;
    	let t5;
    	let div2;
    	let radix_connect_button;
    	let t6;
    	let navbar;
    	let t7;
    	let content;
    	let t8;
    	let footer;
    	let t9;
    	let script1;
    	let script1_src_value;
    	let current;
    	nightmodebutton = new NightModeButton({ $$inline: true });
    	navbar = new NavBar({ $$inline: true });
    	content = new Content({ $$inline: true });
    	footer = new Footer({ $$inline: true });

    	const block = {
    		c: function create() {
    			script0 = element("script");
    			meta = element("meta");
    			link = element("link");
    			t0 = space();
    			main = element("main");
    			div3 = element("div");
    			div0 = element("div");
    			h6 = element("h6");
    			a0 = element("a");
    			a0.textContent = "The Duck Mafia";
    			t2 = text(" invites you to join its web3 community P2E game hosted on ");
    			a1 = element("a");
    			a1.textContent = "RadixDLT, a place where DeFi can thrive.";
    			t4 = space();
    			div1 = element("div");
    			create_component(nightmodebutton.$$.fragment);
    			t5 = space();
    			div2 = element("div");
    			radix_connect_button = element("radix-connect-button");
    			t6 = space();
    			create_component(navbar.$$.fragment);
    			t7 = space();
    			create_component(content.$$.fragment);
    			t8 = space();
    			create_component(footer.$$.fragment);
    			t9 = space();
    			script1 = element("script");
    			if (!src_url_equal(script0.src, script0_src_value = "https://code.jquery.com/jquery-3.6.0.min.js")) attr_dev(script0, "src", script0_src_value);
    			add_location(script0, file, 13, 1, 344);
    			attr_dev(meta, "name", "viewport");
    			attr_dev(meta, "content", "width=device-width, initial-scale=1.0, maximum-scale=1.0, user-scalable=no");
    			add_location(meta, file, 15, 1, 414);
    			document.title = "Radix web App - Ducks Mafia";
    			attr_dev(link, "href", "Gamepixies-8MO6n.ttf");
    			attr_dev(link, "rel", "stylesheet");
    			attr_dev(link, "type", "text/css");
    			add_location(link, file, 18, 1, 568);
    			attr_dev(a0, "href", "https://twitter.com/ducksmafiaxrd");
    			attr_dev(a0, "target", "_blank");
    			add_location(a0, file, 25, 57, 854);
    			attr_dev(a1, "href", "https://www.radixdlt.com/");
    			attr_dev(a1, "target", "_blank");
    			add_location(a1, file, 25, 194, 991);
    			set_style(h6, "margin", "15px 5% 5px 5%");
    			set_style(h6, "font-weight", "700");
    			add_location(h6, file, 25, 3, 800);
    			attr_dev(div0, "class", "Uppopup svelte-elqnxo");
    			set_style(div0, "width", "75%");
    			set_style(div0, "background-color", "lightblue");
    			set_style(div0, "border-radius", "25px 25px 0px 0px");
    			add_location(div0, file, 24, 2, 692);
    			set_style(div1, "width", "5%");
    			set_style(div1, "margin", "5px");
    			add_location(div1, file, 27, 2, 1104);
    			add_location(radix_connect_button, file, 31, 3, 1264);
    			set_style(div2, "width", "20%");
    			set_style(div2, "margin", "0.1em");
    			set_style(div2, "width", "172px");
    			set_style(div2, "margin-left", "50px");
    			add_location(div2, file, 30, 2, 1190);
    			set_style(div3, "display", "flex");
    			add_location(div3, file, 23, 1, 661);
    			if (!src_url_equal(script1.src, script1_src_value = "./script.js")) attr_dev(script1, "src", script1_src_value);
    			add_location(script1, file, 40, 1, 1369);
    			add_location(main, file, 22, 0, 653);
    		},
    		l: function claim(nodes) {
    			throw new Error("options.hydrate only works if the component was compiled with the `hydratable: true` option");
    		},
    		m: function mount(target, anchor) {
    			append_dev(document.head, script0);
    			append_dev(document.head, meta);
    			append_dev(document.head, link);
    			insert_dev(target, t0, anchor);
    			insert_dev(target, main, anchor);
    			append_dev(main, div3);
    			append_dev(div3, div0);
    			append_dev(div0, h6);
    			append_dev(h6, a0);
    			append_dev(h6, t2);
    			append_dev(h6, a1);
    			append_dev(div3, t4);
    			append_dev(div3, div1);
    			mount_component(nightmodebutton, div1, null);
    			append_dev(div3, t5);
    			append_dev(div3, div2);
    			append_dev(div2, radix_connect_button);
    			append_dev(main, t6);
    			mount_component(navbar, main, null);
    			append_dev(main, t7);
    			mount_component(content, main, null);
    			append_dev(main, t8);
    			mount_component(footer, main, null);
    			append_dev(main, t9);
    			append_dev(main, script1);
    			current = true;
    		},
    		p: noop,
    		i: function intro(local) {
    			if (current) return;
    			transition_in(nightmodebutton.$$.fragment, local);
    			transition_in(navbar.$$.fragment, local);
    			transition_in(content.$$.fragment, local);
    			transition_in(footer.$$.fragment, local);
    			current = true;
    		},
    		o: function outro(local) {
    			transition_out(nightmodebutton.$$.fragment, local);
    			transition_out(navbar.$$.fragment, local);
    			transition_out(content.$$.fragment, local);
    			transition_out(footer.$$.fragment, local);
    			current = false;
    		},
    		d: function destroy(detaching) {
    			detach_dev(script0);
    			detach_dev(meta);
    			detach_dev(link);
    			if (detaching) detach_dev(t0);
    			if (detaching) detach_dev(main);
    			destroy_component(nightmodebutton);
    			destroy_component(navbar);
    			destroy_component(content);
    			destroy_component(footer);
    		}
    	};

    	dispatch_dev("SvelteRegisterBlock", {
    		block,
    		id: create_fragment.name,
    		type: "component",
    		source: "",
    		ctx
    	});

    	return block;
    }

    function instance($$self, $$props, $$invalidate) {
    	let { $$slots: slots = {}, $$scope } = $$props;
    	validate_slots('App', slots, []);
    	let { name } = $$props;

    	window.addEventListener("resize", function () {
    		window.resizeTo(window.innerWidth, window.innerHeight);
    	});

    	const writable_props = ['name'];

    	Object.keys($$props).forEach(key => {
    		if (!~writable_props.indexOf(key) && key.slice(0, 2) !== '$$' && key !== 'slot') console.warn(`<App> was created with unknown prop '${key}'`);
    	});

    	$$self.$$set = $$props => {
    		if ('name' in $$props) $$invalidate(0, name = $$props.name);
    	};

    	$$self.$capture_state = () => ({
    		NavBar,
    		NightModeButton,
    		Content,
    		Footer,
    		name
    	});

    	$$self.$inject_state = $$props => {
    		if ('name' in $$props) $$invalidate(0, name = $$props.name);
    	};

    	if ($$props && "$$inject" in $$props) {
    		$$self.$inject_state($$props.$$inject);
    	}

    	return [name];
    }

    class App extends SvelteComponentDev {
    	constructor(options) {
    		super(options);
    		init(this, options, instance, create_fragment, safe_not_equal, { name: 0 });

    		dispatch_dev("SvelteRegisterComponent", {
    			component: this,
    			tagName: "App",
    			options,
    			id: create_fragment.name
    		});

    		const { ctx } = this.$$;
    		const props = options.props || {};

    		if (/*name*/ ctx[0] === undefined && !('name' in props)) {
    			console.warn("<App> was created without expected prop 'name'");
    		}
    	}

    	get name() {
    		throw new Error("<App>: Props cannot be read directly from the component instance unless compiling with 'accessors: true' or '<svelte:options accessors/>'");
    	}

    	set name(value) {
    		throw new Error("<App>: Props cannot be set directly on the component instance unless compiling with 'accessors: true' or '<svelte:options accessors/>'");
    	}
    }

    var ot$1 = function(t, e) {
      return ot$1 = Object.setPrototypeOf || { __proto__: [] } instanceof Array && function(n, r) {
        n.__proto__ = r;
      } || function(n, r) {
        for (var s in r)
          Object.prototype.hasOwnProperty.call(r, s) && (n[s] = r[s]);
      }, ot$1(t, e);
    };
    function ie$1(t, e) {
      if (typeof e != "function" && e !== null)
        throw new TypeError("Class extends value " + String(e) + " is not a constructor or null");
      ot$1(t, e);
      function n() {
        this.constructor = t;
      }
      t.prototype = e === null ? Object.create(e) : (n.prototype = e.prototype, new n());
    }
    function Bn$1(t, e, n, r) {
      function s(i) {
        return i instanceof n ? i : new n(function(o) {
          o(i);
        });
      }
      return new (n || (n = Promise))(function(i, o) {
        function a(l) {
          try {
            u(r.next(l));
          } catch (_) {
            o(_);
          }
        }
        function c(l) {
          try {
            u(r.throw(l));
          } catch (_) {
            o(_);
          }
        }
        function u(l) {
          l.done ? i(l.value) : s(l.value).then(a, c);
        }
        u((r = r.apply(t, e || [])).next());
      });
    }
    function tn$1(t, e) {
      var n = { label: 0, sent: function() {
        if (i[0] & 1)
          throw i[1];
        return i[1];
      }, trys: [], ops: [] }, r, s, i, o;
      return o = { next: a(0), throw: a(1), return: a(2) }, typeof Symbol == "function" && (o[Symbol.iterator] = function() {
        return this;
      }), o;
      function a(u) {
        return function(l) {
          return c([u, l]);
        };
      }
      function c(u) {
        if (r)
          throw new TypeError("Generator is already executing.");
        for (; n; )
          try {
            if (r = 1, s && (i = u[0] & 2 ? s.return : u[0] ? s.throw || ((i = s.return) && i.call(s), 0) : s.next) && !(i = i.call(s, u[1])).done)
              return i;
            switch (s = 0, i && (u = [u[0] & 2, i.value]), u[0]) {
              case 0:
              case 1:
                i = u;
                break;
              case 4:
                return n.label++, { value: u[1], done: !1 };
              case 5:
                n.label++, s = u[1], u = [0];
                continue;
              case 7:
                u = n.ops.pop(), n.trys.pop();
                continue;
              default:
                if (i = n.trys, !(i = i.length > 0 && i[i.length - 1]) && (u[0] === 6 || u[0] === 2)) {
                  n = 0;
                  continue;
                }
                if (u[0] === 3 && (!i || u[1] > i[0] && u[1] < i[3])) {
                  n.label = u[1];
                  break;
                }
                if (u[0] === 6 && n.label < i[1]) {
                  n.label = i[1], i = u;
                  break;
                }
                if (i && n.label < i[2]) {
                  n.label = i[2], n.ops.push(u);
                  break;
                }
                i[2] && n.ops.pop(), n.trys.pop();
                continue;
            }
            u = e.call(t, n);
          } catch (l) {
            u = [6, l], s = 0;
          } finally {
            r = i = 0;
          }
        if (u[0] & 5)
          throw u[1];
        return { value: u[0] ? u[1] : void 0, done: !0 };
      }
    }
    function Ee$1(t) {
      var e = typeof Symbol == "function" && Symbol.iterator, n = e && t[e], r = 0;
      if (n)
        return n.call(t);
      if (t && typeof t.length == "number")
        return {
          next: function() {
            return t && r >= t.length && (t = void 0), { value: t && t[r++], done: !t };
          }
        };
      throw new TypeError(e ? "Object is not iterable." : "Symbol.iterator is not defined.");
    }
    function me$1(t, e) {
      var n = typeof Symbol == "function" && t[Symbol.iterator];
      if (!n)
        return t;
      var r = n.call(t), s, i = [], o;
      try {
        for (; (e === void 0 || e-- > 0) && !(s = r.next()).done; )
          i.push(s.value);
      } catch (a) {
        o = { error: a };
      } finally {
        try {
          s && !s.done && (n = r.return) && n.call(r);
        } finally {
          if (o)
            throw o.error;
        }
      }
      return i;
    }
    function ye$1(t, e, n) {
      if (n || arguments.length === 2)
        for (var r = 0, s = e.length, i; r < s; r++)
          (i || !(r in e)) && (i || (i = Array.prototype.slice.call(e, 0, r)), i[r] = e[r]);
      return t.concat(i || Array.prototype.slice.call(e));
    }
    function xe(t) {
      return this instanceof xe ? (this.v = t, this) : new xe(t);
    }
    function Vn$1(t, e, n) {
      if (!Symbol.asyncIterator)
        throw new TypeError("Symbol.asyncIterator is not defined.");
      var r = n.apply(t, e || []), s, i = [];
      return s = {}, o("next"), o("throw"), o("return"), s[Symbol.asyncIterator] = function() {
        return this;
      }, s;
      function o(m) {
        r[m] && (s[m] = function(b) {
          return new Promise(function($, p) {
            i.push([m, b, $, p]) > 1 || a(m, b);
          });
        });
      }
      function a(m, b) {
        try {
          c(r[m](b));
        } catch ($) {
          _(i[0][3], $);
        }
      }
      function c(m) {
        m.value instanceof xe ? Promise.resolve(m.value.v).then(u, l) : _(i[0][2], m);
      }
      function u(m) {
        a("next", m);
      }
      function l(m) {
        a("throw", m);
      }
      function _(m, b) {
        m(b), i.shift(), i.length && a(i[0][0], i[0][1]);
      }
    }
    function Fn$1(t) {
      if (!Symbol.asyncIterator)
        throw new TypeError("Symbol.asyncIterator is not defined.");
      var e = t[Symbol.asyncIterator], n;
      return e ? e.call(t) : (t = typeof Ee$1 == "function" ? Ee$1(t) : t[Symbol.iterator](), n = {}, r("next"), r("throw"), r("return"), n[Symbol.asyncIterator] = function() {
        return this;
      }, n);
      function r(i) {
        n[i] = t[i] && function(o) {
          return new Promise(function(a, c) {
            o = t[i](o), s(a, c, o.done, o.value);
          });
        };
      }
      function s(i, o, a, c) {
        Promise.resolve(c).then(function(u) {
          i({ value: u, done: a });
        }, o);
      }
    }
    function C$2(t) {
      return typeof t == "function";
    }
    function At$1(t) {
      var e = function(r) {
        Error.call(r), r.stack = new Error().stack;
      }, n = t(e);
      return n.prototype = Object.create(Error.prototype), n.prototype.constructor = n, n;
    }
    var et = At$1(function(t) {
      return function(n) {
        t(this), this.message = n ? n.length + ` errors occurred during unsubscription:
` + n.map(function(r, s) {
          return s + 1 + ") " + r.toString();
        }).join(`
  `) : "", this.name = "UnsubscriptionError", this.errors = n;
      };
    });
    function Ve$1(t, e) {
      if (t) {
        var n = t.indexOf(e);
        0 <= n && t.splice(n, 1);
      }
    }
    var Ie$1 = function() {
      function t(e) {
        this.initialTeardown = e, this.closed = !1, this._parentage = null, this._finalizers = null;
      }
      return t.prototype.unsubscribe = function() {
        var e, n, r, s, i;
        if (!this.closed) {
          this.closed = !0;
          var o = this._parentage;
          if (o)
            if (this._parentage = null, Array.isArray(o))
              try {
                for (var a = Ee$1(o), c = a.next(); !c.done; c = a.next()) {
                  var u = c.value;
                  u.remove(this);
                }
              } catch (p) {
                e = { error: p };
              } finally {
                try {
                  c && !c.done && (n = a.return) && n.call(a);
                } finally {
                  if (e)
                    throw e.error;
                }
              }
            else
              o.remove(this);
          var l = this.initialTeardown;
          if (C$2(l))
            try {
              l();
            } catch (p) {
              i = p instanceof et ? p.errors : [p];
            }
          var _ = this._finalizers;
          if (_) {
            this._finalizers = null;
            try {
              for (var m = Ee$1(_), b = m.next(); !b.done; b = m.next()) {
                var $ = b.value;
                try {
                  Mt$1($);
                } catch (p) {
                  i = i ?? [], p instanceof et ? i = ye$1(ye$1([], me$1(i)), me$1(p.errors)) : i.push(p);
                }
              }
            } catch (p) {
              r = { error: p };
            } finally {
              try {
                b && !b.done && (s = m.return) && s.call(m);
              } finally {
                if (r)
                  throw r.error;
              }
            }
          }
          if (i)
            throw new et(i);
        }
      }, t.prototype.add = function(e) {
        var n;
        if (e && e !== this)
          if (this.closed)
            Mt$1(e);
          else {
            if (e instanceof t) {
              if (e.closed || e._hasParent(this))
                return;
              e._addParent(this);
            }
            (this._finalizers = (n = this._finalizers) !== null && n !== void 0 ? n : []).push(e);
          }
      }, t.prototype._hasParent = function(e) {
        var n = this._parentage;
        return n === e || Array.isArray(n) && n.includes(e);
      }, t.prototype._addParent = function(e) {
        var n = this._parentage;
        this._parentage = Array.isArray(n) ? (n.push(e), n) : n ? [n, e] : e;
      }, t.prototype._removeParent = function(e) {
        var n = this._parentage;
        n === e ? this._parentage = null : Array.isArray(n) && Ve$1(n, e);
      }, t.prototype.remove = function(e) {
        var n = this._finalizers;
        n && Ve$1(n, e), e instanceof t && e._removeParent(this);
      }, t.EMPTY = function() {
        var e = new t();
        return e.closed = !0, e;
      }(), t;
    }(), nn$1 = Ie$1.EMPTY;
    function rn$1(t) {
      return t instanceof Ie$1 || t && "closed" in t && C$2(t.remove) && C$2(t.add) && C$2(t.unsubscribe);
    }
    function Mt$1(t) {
      C$2(t) ? t() : t.unsubscribe();
    }
    var kt$1 = {
      onUnhandledError: null,
      onStoppedNotification: null,
      Promise: void 0,
      useDeprecatedSynchronousErrorHandling: !1,
      useDeprecatedNextContext: !1
    }, at$1 = {
      setTimeout: function(t, e) {
        for (var n = [], r = 2; r < arguments.length; r++)
          n[r - 2] = arguments[r];
        var s = at$1.delegate;
        return s != null && s.setTimeout ? s.setTimeout.apply(s, ye$1([t, e], me$1(n))) : setTimeout.apply(void 0, ye$1([t, e], me$1(n)));
      },
      clearTimeout: function(t) {
        return (clearTimeout)(t);
      },
      delegate: void 0
    };
    function sn$1(t) {
      at$1.setTimeout(function() {
        throw t;
      });
    }
    function ut$1() {
    }
    function Be$1(t) {
      t();
    }
    var Pt = function(t) {
      ie$1(e, t);
      function e(n) {
        var r = t.call(this) || this;
        return r.isStopped = !1, n ? (r.destination = n, rn$1(n) && n.add(r)) : r.destination = Yn$1, r;
      }
      return e.create = function(n, r, s) {
        return new Ae$1(n, r, s);
      }, e.prototype.next = function(n) {
        this.isStopped || this._next(n);
      }, e.prototype.error = function(n) {
        this.isStopped || (this.isStopped = !0, this._error(n));
      }, e.prototype.complete = function() {
        this.isStopped || (this.isStopped = !0, this._complete());
      }, e.prototype.unsubscribe = function() {
        this.closed || (this.isStopped = !0, t.prototype.unsubscribe.call(this), this.destination = null);
      }, e.prototype._next = function(n) {
        this.destination.next(n);
      }, e.prototype._error = function(n) {
        try {
          this.destination.error(n);
        } finally {
          this.unsubscribe();
        }
      }, e.prototype._complete = function() {
        try {
          this.destination.complete();
        } finally {
          this.unsubscribe();
        }
      }, e;
    }(Ie$1), zn$1 = Function.prototype.bind;
    function tt$1(t, e) {
      return zn$1.call(t, e);
    }
    var Hn$1 = function() {
      function t(e) {
        this.partialObserver = e;
      }
      return t.prototype.next = function(e) {
        var n = this.partialObserver;
        if (n.next)
          try {
            n.next(e);
          } catch (r) {
            qe$1(r);
          }
      }, t.prototype.error = function(e) {
        var n = this.partialObserver;
        if (n.error)
          try {
            n.error(e);
          } catch (r) {
            qe$1(r);
          }
        else
          qe$1(e);
      }, t.prototype.complete = function() {
        var e = this.partialObserver;
        if (e.complete)
          try {
            e.complete();
          } catch (n) {
            qe$1(n);
          }
      }, t;
    }(), Ae$1 = function(t) {
      ie$1(e, t);
      function e(n, r, s) {
        var i = t.call(this) || this, o;
        if (C$2(n) || !n)
          o = {
            next: n ?? void 0,
            error: r ?? void 0,
            complete: s ?? void 0
          };
        else {
          var a;
          i && kt$1.useDeprecatedNextContext ? (a = Object.create(n), a.unsubscribe = function() {
            return i.unsubscribe();
          }, o = {
            next: n.next && tt$1(n.next, a),
            error: n.error && tt$1(n.error, a),
            complete: n.complete && tt$1(n.complete, a)
          }) : o = n;
        }
        return i.destination = new Hn$1(o), i;
      }
      return e;
    }(Pt);
    function qe$1(t) {
      sn$1(t);
    }
    function Kn$1(t) {
      throw t;
    }
    var Yn$1 = {
      closed: !0,
      next: ut$1,
      error: Kn$1,
      complete: ut$1
    }, Rt$1 = function() {
      return typeof Symbol == "function" && Symbol.observable || "@@observable";
    }();
    function Xe$1(t) {
      return t;
    }
    function Gn$1(t) {
      return t.length === 0 ? Xe$1 : t.length === 1 ? t[0] : function(n) {
        return t.reduce(function(r, s) {
          return s(r);
        }, n);
      };
    }
    var D$1 = function() {
      function t(e) {
        e && (this._subscribe = e);
      }
      return t.prototype.lift = function(e) {
        var n = new t();
        return n.source = this, n.operator = e, n;
      }, t.prototype.subscribe = function(e, n, r) {
        var s = this, i = Xn$1(e) ? e : new Ae$1(e, n, r);
        return Be$1(function() {
          var o = s, a = o.operator, c = o.source;
          i.add(a ? a.call(i, c) : c ? s._subscribe(i) : s._trySubscribe(i));
        }), i;
      }, t.prototype._trySubscribe = function(e) {
        try {
          return this._subscribe(e);
        } catch (n) {
          e.error(n);
        }
      }, t.prototype.forEach = function(e, n) {
        var r = this;
        return n = Lt$1(n), new n(function(s, i) {
          var o = new Ae$1({
            next: function(a) {
              try {
                e(a);
              } catch (c) {
                i(c), o.unsubscribe();
              }
            },
            error: i,
            complete: s
          });
          r.subscribe(o);
        });
      }, t.prototype._subscribe = function(e) {
        var n;
        return (n = this.source) === null || n === void 0 ? void 0 : n.subscribe(e);
      }, t.prototype[Rt$1] = function() {
        return this;
      }, t.prototype.pipe = function() {
        for (var e = [], n = 0; n < arguments.length; n++)
          e[n] = arguments[n];
        return Gn$1(e)(this);
      }, t.prototype.toPromise = function(e) {
        var n = this;
        return e = Lt$1(e), new e(function(r, s) {
          var i;
          n.subscribe(function(o) {
            return i = o;
          }, function(o) {
            return s(o);
          }, function() {
            return r(i);
          });
        });
      }, t.create = function(e) {
        return new t(e);
      }, t;
    }();
    function Lt$1(t) {
      var e;
      return (e = t ?? kt$1.Promise) !== null && e !== void 0 ? e : Promise;
    }
    function Jn$1(t) {
      return t && C$2(t.next) && C$2(t.error) && C$2(t.complete);
    }
    function Xn$1(t) {
      return t && t instanceof Pt || Jn$1(t) && rn$1(t);
    }
    function Qn$1(t) {
      return C$2(t == null ? void 0 : t.lift);
    }
    function W(t) {
      return function(e) {
        if (Qn$1(e))
          return e.lift(function(n) {
            try {
              return t(n, this);
            } catch (r) {
              this.error(r);
            }
          });
        throw new TypeError("Unable to lift unknown Observable type");
      };
    }
    function V$2(t, e, n, r, s) {
      return new er$1(t, e, n, r, s);
    }
    var er$1 = function(t) {
      ie$1(e, t);
      function e(n, r, s, i, o, a) {
        var c = t.call(this, n) || this;
        return c.onFinalize = o, c.shouldUnsubscribe = a, c._next = r ? function(u) {
          try {
            r(u);
          } catch (l) {
            n.error(l);
          }
        } : t.prototype._next, c._error = i ? function(u) {
          try {
            i(u);
          } catch (l) {
            n.error(l);
          } finally {
            this.unsubscribe();
          }
        } : t.prototype._error, c._complete = s ? function() {
          try {
            s();
          } catch (u) {
            n.error(u);
          } finally {
            this.unsubscribe();
          }
        } : t.prototype._complete, c;
      }
      return e.prototype.unsubscribe = function() {
        var n;
        if (!this.shouldUnsubscribe || this.shouldUnsubscribe()) {
          var r = this.closed;
          t.prototype.unsubscribe.call(this), !r && ((n = this.onFinalize) === null || n === void 0 || n.call(this));
        }
      }, e;
    }(Pt), tr$1 = At$1(function(t) {
      return function() {
        t(this), this.name = "ObjectUnsubscribedError", this.message = "object unsubscribed";
      };
    }), ee$1 = function(t) {
      ie$1(e, t);
      function e() {
        var n = t.call(this) || this;
        return n.closed = !1, n.currentObservers = null, n.observers = [], n.isStopped = !1, n.hasError = !1, n.thrownError = null, n;
      }
      return e.prototype.lift = function(n) {
        var r = new Zt$1(this, this);
        return r.operator = n, r;
      }, e.prototype._throwIfClosed = function() {
        if (this.closed)
          throw new tr$1();
      }, e.prototype.next = function(n) {
        var r = this;
        Be$1(function() {
          var s, i;
          if (r._throwIfClosed(), !r.isStopped) {
            r.currentObservers || (r.currentObservers = Array.from(r.observers));
            try {
              for (var o = Ee$1(r.currentObservers), a = o.next(); !a.done; a = o.next()) {
                var c = a.value;
                c.next(n);
              }
            } catch (u) {
              s = { error: u };
            } finally {
              try {
                a && !a.done && (i = o.return) && i.call(o);
              } finally {
                if (s)
                  throw s.error;
              }
            }
          }
        });
      }, e.prototype.error = function(n) {
        var r = this;
        Be$1(function() {
          if (r._throwIfClosed(), !r.isStopped) {
            r.hasError = r.isStopped = !0, r.thrownError = n;
            for (var s = r.observers; s.length; )
              s.shift().error(n);
          }
        });
      }, e.prototype.complete = function() {
        var n = this;
        Be$1(function() {
          if (n._throwIfClosed(), !n.isStopped) {
            n.isStopped = !0;
            for (var r = n.observers; r.length; )
              r.shift().complete();
          }
        });
      }, e.prototype.unsubscribe = function() {
        this.isStopped = this.closed = !0, this.observers = this.currentObservers = null;
      }, Object.defineProperty(e.prototype, "observed", {
        get: function() {
          var n;
          return ((n = this.observers) === null || n === void 0 ? void 0 : n.length) > 0;
        },
        enumerable: !1,
        configurable: !0
      }), e.prototype._trySubscribe = function(n) {
        return this._throwIfClosed(), t.prototype._trySubscribe.call(this, n);
      }, e.prototype._subscribe = function(n) {
        return this._throwIfClosed(), this._checkFinalizedStatuses(n), this._innerSubscribe(n);
      }, e.prototype._innerSubscribe = function(n) {
        var r = this, s = this, i = s.hasError, o = s.isStopped, a = s.observers;
        return i || o ? nn$1 : (this.currentObservers = null, a.push(n), new Ie$1(function() {
          r.currentObservers = null, Ve$1(a, n);
        }));
      }, e.prototype._checkFinalizedStatuses = function(n) {
        var r = this, s = r.hasError, i = r.thrownError, o = r.isStopped;
        s ? n.error(i) : o && n.complete();
      }, e.prototype.asObservable = function() {
        var n = new D$1();
        return n.source = this, n;
      }, e.create = function(n, r) {
        return new Zt$1(n, r);
      }, e;
    }(D$1), Zt$1 = function(t) {
      ie$1(e, t);
      function e(n, r) {
        var s = t.call(this) || this;
        return s.destination = n, s.source = r, s;
      }
      return e.prototype.next = function(n) {
        var r, s;
        (s = (r = this.destination) === null || r === void 0 ? void 0 : r.next) === null || s === void 0 || s.call(r, n);
      }, e.prototype.error = function(n) {
        var r, s;
        (s = (r = this.destination) === null || r === void 0 ? void 0 : r.error) === null || s === void 0 || s.call(r, n);
      }, e.prototype.complete = function() {
        var n, r;
        (r = (n = this.destination) === null || n === void 0 ? void 0 : n.complete) === null || r === void 0 || r.call(n);
      }, e.prototype._subscribe = function(n) {
        var r, s;
        return (s = (r = this.source) === null || r === void 0 ? void 0 : r.subscribe(n)) !== null && s !== void 0 ? s : nn$1;
      }, e;
    }(ee$1), on = {
      now: function() {
        return (Date).now();
      },
      delegate: void 0
    }, nr$1 = function(t) {
      ie$1(e, t);
      function e(n, r) {
        return t.call(this) || this;
      }
      return e.prototype.schedule = function(n, r) {
        return this;
      }, e;
    }(Ie$1), Fe$1 = {
      setInterval: function(t, e) {
        for (var n = [], r = 2; r < arguments.length; r++)
          n[r - 2] = arguments[r];
        var s = Fe$1.delegate;
        return s != null && s.setInterval ? s.setInterval.apply(s, ye$1([t, e], me$1(n))) : setInterval.apply(void 0, ye$1([t, e], me$1(n)));
      },
      clearInterval: function(t) {
        return (clearInterval)(t);
      },
      delegate: void 0
    }, rr$1 = function(t) {
      ie$1(e, t);
      function e(n, r) {
        var s = t.call(this, n, r) || this;
        return s.scheduler = n, s.work = r, s.pending = !1, s;
      }
      return e.prototype.schedule = function(n, r) {
        var s;
        if (r === void 0 && (r = 0), this.closed)
          return this;
        this.state = n;
        var i = this.id, o = this.scheduler;
        return i != null && (this.id = this.recycleAsyncId(o, i, r)), this.pending = !0, this.delay = r, this.id = (s = this.id) !== null && s !== void 0 ? s : this.requestAsyncId(o, this.id, r), this;
      }, e.prototype.requestAsyncId = function(n, r, s) {
        return s === void 0 && (s = 0), Fe$1.setInterval(n.flush.bind(n, this), s);
      }, e.prototype.recycleAsyncId = function(n, r, s) {
        if (s === void 0 && (s = 0), s != null && this.delay === s && this.pending === !1)
          return r;
        r != null && Fe$1.clearInterval(r);
      }, e.prototype.execute = function(n, r) {
        if (this.closed)
          return new Error("executing a cancelled action");
        this.pending = !1;
        var s = this._execute(n, r);
        if (s)
          return s;
        this.pending === !1 && this.id != null && (this.id = this.recycleAsyncId(this.scheduler, this.id, null));
      }, e.prototype._execute = function(n, r) {
        var s = !1, i;
        try {
          this.work(n);
        } catch (o) {
          s = !0, i = o || new Error("Scheduled action threw falsy error");
        }
        if (s)
          return this.unsubscribe(), i;
      }, e.prototype.unsubscribe = function() {
        if (!this.closed) {
          var n = this, r = n.id, s = n.scheduler, i = s.actions;
          this.work = this.state = this.scheduler = null, this.pending = !1, Ve$1(i, this), r != null && (this.id = this.recycleAsyncId(s, r, null)), this.delay = null, t.prototype.unsubscribe.call(this);
        }
      }, e;
    }(nr$1), Ut$1 = function() {
      function t(e, n) {
        n === void 0 && (n = t.now), this.schedulerActionCtor = e, this.now = n;
      }
      return t.prototype.schedule = function(e, n, r) {
        return n === void 0 && (n = 0), new this.schedulerActionCtor(this, e).schedule(r, n);
      }, t.now = on.now, t;
    }(), sr$1 = function(t) {
      ie$1(e, t);
      function e(n, r) {
        r === void 0 && (r = Ut$1.now);
        var s = t.call(this, n, r) || this;
        return s.actions = [], s._active = !1, s;
      }
      return e.prototype.flush = function(n) {
        var r = this.actions;
        if (this._active) {
          r.push(n);
          return;
        }
        var s;
        this._active = !0;
        do
          if (s = n.execute(n.state, n.delay))
            break;
        while (n = r.shift());
        if (this._active = !1, s) {
          for (; n = r.shift(); )
            n.unsubscribe();
          throw s;
        }
      }, e;
    }(Ut$1), ir$1 = new sr$1(rr$1), or$1 = ir$1, an$1 = new D$1(function(t) {
      return t.complete();
    });
    function un$1(t) {
      return t && C$2(t.schedule);
    }
    function cn$1(t) {
      return t[t.length - 1];
    }
    function ln$1(t) {
      return un$1(cn$1(t)) ? t.pop() : void 0;
    }
    function ar$1(t, e) {
      return typeof cn$1(t) == "number" ? t.pop() : e;
    }
    var dn$1 = function(t) {
      return t && typeof t.length == "number" && typeof t != "function";
    };
    function fn$1(t) {
      return C$2(t == null ? void 0 : t.then);
    }
    function hn$1(t) {
      return C$2(t[Rt$1]);
    }
    function pn$1(t) {
      return Symbol.asyncIterator && C$2(t == null ? void 0 : t[Symbol.asyncIterator]);
    }
    function mn$1(t) {
      return new TypeError("You provided " + (t !== null && typeof t == "object" ? "an invalid object" : "'" + t + "'") + " where a stream was expected. You can provide an Observable, Promise, ReadableStream, Array, AsyncIterable, or Iterable.");
    }
    function ur$1() {
      return typeof Symbol != "function" || !Symbol.iterator ? "@@iterator" : Symbol.iterator;
    }
    var yn$1 = ur$1();
    function vn$1(t) {
      return C$2(t == null ? void 0 : t[yn$1]);
    }
    function gn$1(t) {
      return Vn$1(this, arguments, function() {
        var n, r, s, i;
        return tn$1(this, function(o) {
          switch (o.label) {
            case 0:
              n = t.getReader(), o.label = 1;
            case 1:
              o.trys.push([1, , 9, 10]), o.label = 2;
            case 2:
              return [4, xe(n.read())];
            case 3:
              return r = o.sent(), s = r.value, i = r.done, i ? [4, xe(void 0)] : [3, 5];
            case 4:
              return [2, o.sent()];
            case 5:
              return [4, xe(s)];
            case 6:
              return [4, o.sent()];
            case 7:
              return o.sent(), [3, 2];
            case 8:
              return [3, 10];
            case 9:
              return n.releaseLock(), [7];
            case 10:
              return [2];
          }
        });
      });
    }
    function _n$1(t) {
      return C$2(t == null ? void 0 : t.getReader);
    }
    function oe$1(t) {
      if (t instanceof D$1)
        return t;
      if (t != null) {
        if (hn$1(t))
          return cr$1(t);
        if (dn$1(t))
          return lr$1(t);
        if (fn$1(t))
          return dr$1(t);
        if (pn$1(t))
          return wn$1(t);
        if (vn$1(t))
          return fr$1(t);
        if (_n$1(t))
          return hr$1(t);
      }
      throw mn$1(t);
    }
    function cr$1(t) {
      return new D$1(function(e) {
        var n = t[Rt$1]();
        if (C$2(n.subscribe))
          return n.subscribe(e);
        throw new TypeError("Provided object does not correctly implement Symbol.observable");
      });
    }
    function lr$1(t) {
      return new D$1(function(e) {
        for (var n = 0; n < t.length && !e.closed; n++)
          e.next(t[n]);
        e.complete();
      });
    }
    function dr$1(t) {
      return new D$1(function(e) {
        t.then(function(n) {
          e.closed || (e.next(n), e.complete());
        }, function(n) {
          return e.error(n);
        }).then(null, sn$1);
      });
    }
    function fr$1(t) {
      return new D$1(function(e) {
        var n, r;
        try {
          for (var s = Ee$1(t), i = s.next(); !i.done; i = s.next()) {
            var o = i.value;
            if (e.next(o), e.closed)
              return;
          }
        } catch (a) {
          n = { error: a };
        } finally {
          try {
            i && !i.done && (r = s.return) && r.call(s);
          } finally {
            if (n)
              throw n.error;
          }
        }
        e.complete();
      });
    }
    function wn$1(t) {
      return new D$1(function(e) {
        pr$1(t, e).catch(function(n) {
          return e.error(n);
        });
      });
    }
    function hr$1(t) {
      return wn$1(gn$1(t));
    }
    function pr$1(t, e) {
      var n, r, s, i;
      return Bn$1(this, void 0, void 0, function() {
        var o, a;
        return tn$1(this, function(c) {
          switch (c.label) {
            case 0:
              c.trys.push([0, 5, 6, 11]), n = Fn$1(t), c.label = 1;
            case 1:
              return [4, n.next()];
            case 2:
              if (r = c.sent(), !!r.done)
                return [3, 4];
              if (o = r.value, e.next(o), e.closed)
                return [2];
              c.label = 3;
            case 3:
              return [3, 1];
            case 4:
              return [3, 11];
            case 5:
              return a = c.sent(), s = { error: a }, [3, 11];
            case 6:
              return c.trys.push([6, , 9, 10]), r && !r.done && (i = n.return) ? [4, i.call(n)] : [3, 8];
            case 7:
              c.sent(), c.label = 8;
            case 8:
              return [3, 10];
            case 9:
              if (s)
                throw s.error;
              return [7];
            case 10:
              return [7];
            case 11:
              return e.complete(), [2];
          }
        });
      });
    }
    function te$1(t, e, n, r, s) {
      r === void 0 && (r = 0), s === void 0 && (s = !1);
      var i = e.schedule(function() {
        n(), s ? t.add(this.schedule(null, r)) : this.unsubscribe();
      }, r);
      if (t.add(i), !s)
        return i;
    }
    function bn$1(t, e) {
      return e === void 0 && (e = 0), W(function(n, r) {
        n.subscribe(V$2(r, function(s) {
          return te$1(r, t, function() {
            return r.next(s);
          }, e);
        }, function() {
          return te$1(r, t, function() {
            return r.complete();
          }, e);
        }, function(s) {
          return te$1(r, t, function() {
            return r.error(s);
          }, e);
        }));
      });
    }
    function Tn$1(t, e) {
      return e === void 0 && (e = 0), W(function(n, r) {
        r.add(t.schedule(function() {
          return n.subscribe(r);
        }, e));
      });
    }
    function mr$1(t, e) {
      return oe$1(t).pipe(Tn$1(e), bn$1(e));
    }
    function yr$1(t, e) {
      return oe$1(t).pipe(Tn$1(e), bn$1(e));
    }
    function vr$1(t, e) {
      return new D$1(function(n) {
        var r = 0;
        return e.schedule(function() {
          r === t.length ? n.complete() : (n.next(t[r++]), n.closed || this.schedule());
        });
      });
    }
    function gr$1(t, e) {
      return new D$1(function(n) {
        var r;
        return te$1(n, e, function() {
          r = t[yn$1](), te$1(n, e, function() {
            var s, i, o;
            try {
              s = r.next(), i = s.value, o = s.done;
            } catch (a) {
              n.error(a);
              return;
            }
            o ? n.complete() : n.next(i);
          }, 0, !0);
        }), function() {
          return C$2(r == null ? void 0 : r.return) && r.return();
        };
      });
    }
    function xn$1(t, e) {
      if (!t)
        throw new Error("Iterable cannot be null");
      return new D$1(function(n) {
        te$1(n, e, function() {
          var r = t[Symbol.asyncIterator]();
          te$1(n, e, function() {
            r.next().then(function(s) {
              s.done ? n.complete() : n.next(s.value);
            });
          }, 0, !0);
        });
      });
    }
    function _r$1(t, e) {
      return xn$1(gn$1(t), e);
    }
    function wr$1(t, e) {
      if (t != null) {
        if (hn$1(t))
          return mr$1(t, e);
        if (dn$1(t))
          return vr$1(t, e);
        if (fn$1(t))
          return yr$1(t, e);
        if (pn$1(t))
          return xn$1(t, e);
        if (vn$1(t))
          return gr$1(t, e);
        if (_n$1(t))
          return _r$1(t, e);
      }
      throw mn$1(t);
    }
    function Sn$1(t, e) {
      return e ? wr$1(t, e) : oe$1(t);
    }
    function br$1() {
      for (var t = [], e = 0; e < arguments.length; e++)
        t[e] = arguments[e];
      var n = ln$1(t);
      return Sn$1(t, n);
    }
    var It$1 = At$1(function(t) {
      return function() {
        t(this), this.name = "EmptyError", this.message = "no elements in sequence";
      };
    });
    function Tr$1(t, e) {
      var n = typeof e == "object";
      return new Promise(function(r, s) {
        var i = new Ae$1({
          next: function(o) {
            r(o), i.unsubscribe();
          },
          error: s,
          complete: function() {
            n ? r(e.defaultValue) : s(new It$1());
          }
        });
        t.subscribe(i);
      });
    }
    function xr$1(t) {
      return t instanceof Date && !isNaN(t);
    }
    function Ne$1(t, e) {
      return W(function(n, r) {
        var s = 0;
        n.subscribe(V$2(r, function(i) {
          r.next(t.call(e, i, s++));
        }));
      });
    }
    function Sr$1(t, e, n, r, s, i, o, a) {
      var c = [], u = 0, l = 0, _ = !1, m = function() {
        _ && !c.length && !u && e.complete();
      }, b = function(p) {
        return u < r ? $(p) : c.push(p);
      }, $ = function(p) {
        i && e.next(p), u++;
        var A = !1;
        oe$1(n(p, l++)).subscribe(V$2(e, function(k) {
          s == null || s(k), i ? b(k) : e.next(k);
        }, function() {
          A = !0;
        }, void 0, function() {
          if (A)
            try {
              u--;
              for (var k = function() {
                var T = c.shift();
                o ? te$1(e, o, function() {
                  return $(T);
                }) : $(T);
              }; c.length && u < r; )
                k();
              m();
            } catch (T) {
              e.error(T);
            }
        }));
      };
      return t.subscribe(V$2(e, b, function() {
        _ = !0, m();
      })), function() {
        a == null || a();
      };
    }
    function On$1(t, e, n) {
      return n === void 0 && (n = 1 / 0), C$2(e) ? On$1(function(r, s) {
        return Ne$1(function(i, o) {
          return e(r, i, s, o);
        })(oe$1(t(r, s)));
      }, n) : (typeof e == "number" && (n = e), W(function(r, s) {
        return Sr$1(r, s, t, n);
      }));
    }
    function Or$1(t) {
      return t === void 0 && (t = 1 / 0), On$1(Xe$1, t);
    }
    function Er$1(t, e, n) {
      t === void 0 && (t = 0), n === void 0 && (n = or$1);
      var r = -1;
      return e != null && (un$1(e) ? n = e : r = e), new D$1(function(s) {
        var i = xr$1(t) ? +t - n.now() : t;
        i < 0 && (i = 0);
        var o = 0;
        return n.schedule(function() {
          s.closed || (s.next(o++), 0 <= r ? this.schedule(void 0, r) : s.complete());
        }, i);
      });
    }
    function nt$1() {
      for (var t = [], e = 0; e < arguments.length; e++)
        t[e] = arguments[e];
      var n = ln$1(t), r = ar$1(t, 1 / 0), s = t;
      return s.length ? s.length === 1 ? oe$1(s[0]) : Or$1(r)(Sn$1(s, n)) : an$1;
    }
    function je$1(t, e) {
      return W(function(n, r) {
        var s = 0;
        n.subscribe(V$2(r, function(i) {
          return t.call(e, i, s++) && r.next(i);
        }));
      });
    }
    function Ar$1(t) {
      return W(function(e, n) {
        var r = !1;
        e.subscribe(V$2(n, function(s) {
          r = !0, n.next(s);
        }, function() {
          r || n.next(t), n.complete();
        }));
      });
    }
    function kr$1(t) {
      return t <= 0 ? function() {
        return an$1;
      } : W(function(e, n) {
        var r = 0;
        e.subscribe(V$2(n, function(s) {
          ++r <= t && (n.next(s), t <= r && n.complete());
        }));
      });
    }
    function Pr$1(t) {
      return t === void 0 && (t = Rr), W(function(e, n) {
        var r = !1;
        e.subscribe(V$2(n, function(s) {
          r = !0, n.next(s);
        }, function() {
          return r ? n.complete() : n.error(t());
        }));
      });
    }
    function Rr() {
      return new It$1();
    }
    function Dt$1(t, e) {
      var n = arguments.length >= 2;
      return function(r) {
        return r.pipe(t ? je$1(function(s, i) {
          return t(s, i, r);
        }) : Xe$1, kr$1(1), n ? Ar$1(e) : Pr$1(function() {
          return new It$1();
        }));
      };
    }
    function En$1(t) {
      t === void 0 && (t = {});
      var e = t.connector, n = e === void 0 ? function() {
        return new ee$1();
      } : e, r = t.resetOnError, s = r === void 0 ? !0 : r, i = t.resetOnComplete, o = i === void 0 ? !0 : i, a = t.resetOnRefCountZero, c = a === void 0 ? !0 : a;
      return function(u) {
        var l, _, m, b = 0, $ = !1, p = !1, A = function() {
          _ == null || _.unsubscribe(), _ = void 0;
        }, k = function() {
          A(), l = m = void 0, $ = p = !1;
        }, T = function() {
          var X = l;
          k(), X == null || X.unsubscribe();
        };
        return W(function(X, j) {
          b++, !p && !$ && A();
          var ge = m = m ?? n();
          j.add(function() {
            b--, b === 0 && !p && !$ && (_ = rt$1(T, c));
          }), ge.subscribe(j), !l && b > 0 && (l = new Ae$1({
            next: function(ae) {
              return ge.next(ae);
            },
            error: function(ae) {
              p = !0, A(), _ = rt$1(k, s, ae), ge.error(ae);
            },
            complete: function() {
              $ = !0, A(), _ = rt$1(k, o), ge.complete();
            }
          }), oe$1(X).subscribe(l));
        })(u);
      };
    }
    function rt$1(t, e) {
      for (var n = [], r = 2; r < arguments.length; r++)
        n[r - 2] = arguments[r];
      if (e === !0) {
        t();
        return;
      }
      if (e !== !1) {
        var s = new Ae$1({
          next: function() {
            s.unsubscribe(), t();
          }
        });
        return e.apply(void 0, ye$1([], me$1(n))).subscribe(s);
      }
    }
    function Ir$1(t) {
      return W(function(e, n) {
        oe$1(t).subscribe(V$2(n, function() {
          return n.complete();
        }, ut$1)), !n.closed && e.subscribe(n);
      });
    }
    function Se$1(t, e, n) {
      var r = C$2(t) || e || n ? { next: t, error: e, complete: n } : t;
      return r ? W(function(s, i) {
        var o;
        (o = r.subscribe) === null || o === void 0 || o.call(r);
        var a = !0;
        s.subscribe(V$2(i, function(c) {
          var u;
          (u = r.next) === null || u === void 0 || u.call(r, c), i.next(c);
        }, function() {
          var c;
          a = !1, (c = r.complete) === null || c === void 0 || c.call(r), i.complete();
        }, function(c) {
          var u;
          a = !1, (u = r.error) === null || u === void 0 || u.call(r, c), i.error(c);
        }, function() {
          var c, u;
          a && ((c = r.unsubscribe) === null || c === void 0 || c.call(r)), (u = r.finalize) === null || u === void 0 || u.call(r);
        }));
      }) : Xe$1;
    }
    const Cr$1 = () => ({
      outgoingMessageSubject: new ee$1(),
      incomingMessageSubject: new ee$1(),
      responseSubject: new ee$1(),
      messageLifeCycleEventSubject: new ee$1(),
      dispatchEventSubject: new ee$1()
    }), ct$1 = {
      outgoingMessage: "radix#chromeExtension#send",
      incomingMessage: "radix#chromeExtension#receive"
    }, $r$1 = (t) => t.outgoingMessageSubject.pipe(
      Ne$1((e) => ({
        event: ct$1.outgoingMessage,
        payload: e
      })),
      Se$1((e) => {
        t.dispatchEventSubject.next(e);
      }),
      En$1()
    );
    var $e$1 = typeof globalThis < "u" ? globalThis : typeof window < "u" ? window : typeof global < "u" ? global : typeof self < "u" ? self : {}, An$1 = { exports: {} };
    (function(t) {
      (function(e, n) {
        t.exports ? t.exports = n() : e.log = n();
      })($e$1, function() {
        var e = function() {
        }, n = "undefined", r = typeof window !== n && typeof window.navigator !== n && /Trident\/|MSIE /.test(window.navigator.userAgent), s = [
          "trace",
          "debug",
          "info",
          "warn",
          "error"
        ];
        function i(p, A) {
          var k = p[A];
          if (typeof k.bind == "function")
            return k.bind(p);
          try {
            return Function.prototype.bind.call(k, p);
          } catch {
            return function() {
              return Function.prototype.apply.apply(k, [p, arguments]);
            };
          }
        }
        function o() {
          console.log && (console.log.apply ? console.log.apply(console, arguments) : Function.prototype.apply.apply(console.log, [console, arguments])), console.trace && console.trace();
        }
        function a(p) {
          return p === "debug" && (p = "log"), typeof console === n ? !1 : p === "trace" && r ? o : console[p] !== void 0 ? i(console, p) : console.log !== void 0 ? i(console, "log") : e;
        }
        function c(p, A) {
          for (var k = 0; k < s.length; k++) {
            var T = s[k];
            this[T] = k < p ? e : this.methodFactory(T, p, A);
          }
          this.log = this.debug;
        }
        function u(p, A, k) {
          return function() {
            typeof console !== n && (c.call(this, A, k), this[p].apply(this, arguments));
          };
        }
        function l(p, A, k) {
          return a(p) || u.apply(this, arguments);
        }
        function _(p, A, k) {
          var T = this, X;
          A = A ?? "WARN";
          var j = "loglevel";
          typeof p == "string" ? j += ":" + p : typeof p == "symbol" && (j = void 0);
          function ge(O) {
            var ue = (s[O] || "silent").toUpperCase();
            if (!(typeof window === n || !j)) {
              try {
                window.localStorage[j] = ue;
                return;
              } catch {
              }
              try {
                window.document.cookie = encodeURIComponent(j) + "=" + ue + ";";
              } catch {
              }
            }
          }
          function ae() {
            var O;
            if (!(typeof window === n || !j)) {
              try {
                O = window.localStorage[j];
              } catch {
              }
              if (typeof O === n)
                try {
                  var ue = window.document.cookie, De = ue.indexOf(
                    encodeURIComponent(j) + "="
                  );
                  De !== -1 && (O = /^([^;]+)/.exec(ue.slice(De))[1]);
                } catch {
                }
              return T.levels[O] === void 0 && (O = void 0), O;
            }
          }
          function Un() {
            if (!(typeof window === n || !j)) {
              try {
                window.localStorage.removeItem(j);
                return;
              } catch {
              }
              try {
                window.document.cookie = encodeURIComponent(j) + "=; expires=Thu, 01 Jan 1970 00:00:00 UTC";
              } catch {
              }
            }
          }
          T.name = p, T.levels = {
            TRACE: 0,
            DEBUG: 1,
            INFO: 2,
            WARN: 3,
            ERROR: 4,
            SILENT: 5
          }, T.methodFactory = k || l, T.getLevel = function() {
            return X;
          }, T.setLevel = function(O, ue) {
            if (typeof O == "string" && T.levels[O.toUpperCase()] !== void 0 && (O = T.levels[O.toUpperCase()]), typeof O == "number" && O >= 0 && O <= T.levels.SILENT) {
              if (X = O, ue !== !1 && ge(O), c.call(T, O, p), typeof console === n && O < T.levels.SILENT)
                return "No console available for logging";
            } else
              throw "log.setLevel() called with invalid level: " + O;
          }, T.setDefaultLevel = function(O) {
            A = O, ae() || T.setLevel(O, !1);
          }, T.resetLevel = function() {
            T.setLevel(A, !1), Un();
          }, T.enableAll = function(O) {
            T.setLevel(T.levels.TRACE, O);
          }, T.disableAll = function(O) {
            T.setLevel(T.levels.SILENT, O);
          };
          var Qe = ae();
          Qe == null && (Qe = A), T.setLevel(Qe, !1);
        }
        var m = new _(), b = {};
        m.getLogger = function(A) {
          if (typeof A != "symbol" && typeof A != "string" || A === "")
            throw new TypeError("You must supply a name when creating a logger.");
          var k = b[A];
          return k || (k = b[A] = new _(
            A,
            m.getLevel(),
            m.methodFactory
          )), k;
        };
        var $ = typeof window !== n ? window.log : void 0;
        return m.noConflict = function() {
          return typeof window !== n && window.log === m && (window.log = $), m;
        }, m.getLoggers = function() {
          return b;
        }, m.default = m, m;
      });
    })(An$1);
    const H$2 = An$1.exports, Nr$1 = (t) => t.incomingMessageSubject.pipe(
      Se$1((e) => {
        "eventType" in e ? (H$2.debug(
          `🔵💬⬇️ message lifecycle event
${JSON.stringify(e, null, 2)}`
        ), t.messageLifeCycleEventSubject.next(e)) : (H$2.debug(`🔵⬇️ wallet response
${JSON.stringify(e, null, 2)}`), t.responseSubject.next(e));
      })
    ), jr$1 = (t) => t.dispatchEventSubject.pipe(
      Se$1(({ event: e, payload: n }) => {
        H$2.debug(`🔵⬆️ wallet request
${JSON.stringify(n, null, 2)}`), window.dispatchEvent(
          new CustomEvent(e, {
            detail: n
          })
        );
      })
    ), Mr$1 = (t) => {
      const e = new Ie$1();
      return e.add(jr$1(t).subscribe()), e.add($r$1(t).subscribe()), e.add(Nr$1(t).subscribe()), e;
    }, Lr$1 = (t) => {
      const e = (r) => {
        const s = r.detail;
        t.incomingMessageSubject.next(s);
      };
      return addEventListener(ct$1.incomingMessage, e), { destroy: () => {
        removeEventListener(ct$1.incomingMessage, e);
      } };
    }, Zr$1 = (t = Cr$1()) => {
      const e = Mr$1(t), n = Lr$1(t);
      return { destroy: () => {
        n.destroy(), e.unsubscribe();
      }, subjects: t };
    };
    function st$1(t, e, n, r) {
      function s(i) {
        return i instanceof n ? i : new n(function(o) {
          o(i);
        });
      }
      return new (n || (n = Promise))(function(i, o) {
        function a(l) {
          try {
            u(r.next(l));
          } catch (_) {
            o(_);
          }
        }
        function c(l) {
          try {
            u(r.throw(l));
          } catch (_) {
            o(_);
          }
        }
        function u(l) {
          l.done ? i(l.value) : s(l.value).then(a, c);
        }
        u((r = r.apply(t, e || [])).next());
      });
    }
    function it$1(t, e) {
      var n = { label: 0, sent: function() {
        if (i[0] & 1)
          throw i[1];
        return i[1];
      }, trys: [], ops: [] }, r, s, i, o;
      return o = { next: a(0), throw: a(1), return: a(2) }, typeof Symbol == "function" && (o[Symbol.iterator] = function() {
        return this;
      }), o;
      function a(u) {
        return function(l) {
          return c([u, l]);
        };
      }
      function c(u) {
        if (r)
          throw new TypeError("Generator is already executing.");
        for (; n; )
          try {
            if (r = 1, s && (i = u[0] & 2 ? s.return : u[0] ? s.throw || ((i = s.return) && i.call(s), 0) : s.next) && !(i = i.call(s, u[1])).done)
              return i;
            switch (s = 0, i && (u = [u[0] & 2, i.value]), u[0]) {
              case 0:
              case 1:
                i = u;
                break;
              case 4:
                return n.label++, { value: u[1], done: !1 };
              case 5:
                n.label++, s = u[1], u = [0];
                continue;
              case 7:
                u = n.ops.pop(), n.trys.pop();
                continue;
              default:
                if (i = n.trys, !(i = i.length > 0 && i[i.length - 1]) && (u[0] === 6 || u[0] === 2)) {
                  n = 0;
                  continue;
                }
                if (u[0] === 3 && (!i || u[1] > i[0] && u[1] < i[3])) {
                  n.label = u[1];
                  break;
                }
                if (u[0] === 6 && n.label < i[1]) {
                  n.label = i[1], i = u;
                  break;
                }
                if (i && n.label < i[2]) {
                  n.label = i[2], n.ops.push(u);
                  break;
                }
                i[2] && n.ops.pop(), n.trys.pop();
                continue;
            }
            u = e.call(t, n);
          } catch (l) {
            u = [6, l], s = 0;
          } finally {
            r = i = 0;
          }
        if (u[0] & 5)
          throw u[1];
        return { value: u[0] ? u[1] : void 0, done: !0 };
      }
    }
    function ze$1(t, e) {
      var n = typeof Symbol == "function" && t[Symbol.iterator];
      if (!n)
        return t;
      var r = n.call(t), s, i = [], o;
      try {
        for (; (e === void 0 || e-- > 0) && !(s = r.next()).done; )
          i.push(s.value);
      } catch (a) {
        o = { error: a };
      } finally {
        try {
          s && !s.done && (n = r.return) && n.call(r);
        } finally {
          if (o)
            throw o.error;
        }
      }
      return i;
    }
    function he$1(t, e, n) {
      if (n || arguments.length === 2)
        for (var r = 0, s = e.length, i; r < s; r++)
          (i || !(r in e)) && (i || (i = Array.prototype.slice.call(e, 0, r)), i[r] = e[r]);
      return t.concat(i || Array.prototype.slice.call(e));
    }
    var Ur = {
      withStackTrace: !1
    }, kn$1 = function(t, e, n) {
      n === void 0 && (n = Ur);
      var r = e.isOk() ? { type: "Ok", value: e.value } : { type: "Err", value: e.error }, s = n.withStackTrace ? new Error().stack : void 0;
      return {
        data: r,
        message: t,
        stack: s
      };
    }, J$1 = function() {
      function t(e) {
        this._promise = e;
      }
      return t.fromSafePromise = function(e) {
        var n = e.then(function(r) {
          return new le(r);
        });
        return new t(n);
      }, t.fromPromise = function(e, n) {
        var r = e.then(function(s) {
          return new le(s);
        }).catch(function(s) {
          return new de(n(s));
        });
        return new t(r);
      }, t.combine = function(e) {
        return Wr$1(e);
      }, t.combineWithAllErrors = function(e) {
        return qr$1(e);
      }, t.prototype.map = function(e) {
        var n = this;
        return new t(this._promise.then(function(r) {
          return st$1(n, void 0, void 0, function() {
            var s;
            return it$1(this, function(i) {
              switch (i.label) {
                case 0:
                  return r.isErr() ? [2, new de(r.error)] : (s = le.bind, [4, e(r.value)]);
                case 1:
                  return [2, new (s.apply(le, [void 0, i.sent()]))()];
              }
            });
          });
        }));
      }, t.prototype.mapErr = function(e) {
        var n = this;
        return new t(this._promise.then(function(r) {
          return st$1(n, void 0, void 0, function() {
            var s;
            return it$1(this, function(i) {
              switch (i.label) {
                case 0:
                  return r.isOk() ? [2, new le(r.value)] : (s = de.bind, [4, e(r.error)]);
                case 1:
                  return [2, new (s.apply(de, [void 0, i.sent()]))()];
              }
            });
          });
        }));
      }, t.prototype.andThen = function(e) {
        return new t(this._promise.then(function(n) {
          if (n.isErr())
            return new de(n.error);
          var r = e(n.value);
          return r instanceof t ? r._promise : r;
        }));
      }, t.prototype.orElse = function(e) {
        var n = this;
        return new t(this._promise.then(function(r) {
          return st$1(n, void 0, void 0, function() {
            return it$1(this, function(s) {
              return r.isErr() ? [2, e(r.error)] : [2, new le(r.value)];
            });
          });
        }));
      }, t.prototype.match = function(e, n) {
        return this._promise.then(function(r) {
          return r.match(e, n);
        });
      }, t.prototype.unwrapOr = function(e) {
        return this._promise.then(function(n) {
          return n.unwrapOr(e);
        });
      }, t.prototype.then = function(e, n) {
        return this._promise.then(e, n);
      }, t;
    }(), Wt$1 = function(t) {
      return new J$1(Promise.resolve(new de(t)));
    };
    var Dr$1 = function(t) {
      return function(e) {
        return he$1(he$1([], ze$1(e), !1), [t], !1);
      };
    }, Pn$1 = function(t) {
      return t.reduce(function(e, n) {
        return e.isOk() ? n.isErr() ? B$1(n.error) : e.map(Dr$1(n.value)) : e;
      }, q$1([]));
    }, Wr$1 = function(t) {
      return J$1.fromSafePromise(Promise.all(t)).andThen(Pn$1);
    }, Rn$1 = function(t) {
      return t.reduce(function(e, n) {
        return n.isErr() ? e.isErr() ? B$1(he$1(he$1([], ze$1(e.error), !1), [n.error], !1)) : B$1([n.error]) : e.isErr() ? e : q$1(he$1(he$1([], ze$1(e.value), !1), [n.value], !1));
      }, q$1([]));
    }, qr$1 = function(t) {
      return J$1.fromSafePromise(Promise.all(t)).andThen(Rn$1);
    }, lt$1;
    (function(t) {
      function e(s, i) {
        return function() {
          for (var o = [], a = 0; a < arguments.length; a++)
            o[a] = arguments[a];
          try {
            var c = s.apply(void 0, he$1([], ze$1(o), !1));
            return q$1(c);
          } catch (u) {
            return B$1(i ? i(u) : u);
          }
        };
      }
      t.fromThrowable = e;
      function n(s) {
        return Pn$1(s);
      }
      t.combine = n;
      function r(s) {
        return Rn$1(s);
      }
      t.combineWithAllErrors = r;
    })(lt$1 || (lt$1 = {}));
    var q$1 = function(t) {
      return new le(t);
    }, B$1 = function(t) {
      return new de(t);
    }, le = function() {
      function t(e) {
        this.value = e;
      }
      return t.prototype.isOk = function() {
        return !0;
      }, t.prototype.isErr = function() {
        return !this.isOk();
      }, t.prototype.map = function(e) {
        return q$1(e(this.value));
      }, t.prototype.mapErr = function(e) {
        return q$1(this.value);
      }, t.prototype.andThen = function(e) {
        return e(this.value);
      }, t.prototype.orElse = function(e) {
        return q$1(this.value);
      }, t.prototype.asyncAndThen = function(e) {
        return e(this.value);
      }, t.prototype.asyncMap = function(e) {
        return J$1.fromSafePromise(e(this.value));
      }, t.prototype.unwrapOr = function(e) {
        return this.value;
      }, t.prototype.match = function(e, n) {
        return e(this.value);
      }, t.prototype._unsafeUnwrap = function(e) {
        return this.value;
      }, t.prototype._unsafeUnwrapErr = function(e) {
        throw kn$1("Called `_unsafeUnwrapErr` on an Ok", this, e);
      }, t;
    }(), de = function() {
      function t(e) {
        this.error = e;
      }
      return t.prototype.isOk = function() {
        return !1;
      }, t.prototype.isErr = function() {
        return !this.isOk();
      }, t.prototype.map = function(e) {
        return B$1(this.error);
      }, t.prototype.mapErr = function(e) {
        return B$1(e(this.error));
      }, t.prototype.andThen = function(e) {
        return B$1(this.error);
      }, t.prototype.orElse = function(e) {
        return e(this.error);
      }, t.prototype.asyncAndThen = function(e) {
        return Wt$1(this.error);
      }, t.prototype.asyncMap = function(e) {
        return Wt$1(this.error);
      }, t.prototype.unwrapOr = function(e) {
        return e;
      }, t.prototype.match = function(e, n) {
        return n(this.error);
      }, t.prototype._unsafeUnwrap = function(e) {
        throw kn$1("Called `_unsafeUnwrap` on an Err", this, e);
      }, t.prototype._unsafeUnwrapErr = function(e) {
        return this.error;
      }, t;
    }();
    lt$1.fromThrowable;
    const In$1 = {
      extensionDetectionTime: 100,
      logLevel: "info"
    }, Br$1 = (t) => t, pe$1 = {
      rejectedByUser: "rejectedByUser",
      missingExtension: "missingExtension",
      canceledByUser: "canceledByUser",
      walletRequestValidation: "walletRequestValidation",
      walletResponseValidation: "walletResponseValidation",
      wrongNetwork: "wrongNetwork",
      failedToPrepareTransaction: "failedToPrepareTransaction",
      failedToCompileTransaction: "failedToCompileTransaction",
      failedToSignTransaction: "failedToSignTransaction",
      failedToSubmitTransaction: "failedToSubmitTransaction",
      failedToPollSubmittedTransaction: "failedToPollSubmittedTransaction",
      submittedTransactionWasDuplicate: "submittedTransactionWasDuplicate",
      submittedTransactionHasFailedTransactionStatus: "submittedTransactionHasFailedTransactionStatus",
      submittedTransactionHasRejectedTransactionStatus: "submittedTransactionHasRejectedTransactionStatus"
    }, Vr$1 = (/* @__PURE__ */ new Map()).set(pe$1.missingExtension, "extension could not be found").set(pe$1.rejectedByUser, "user rejected request").set(pe$1.canceledByUser, "user has canceled the request"), He$1 = (t, e, n) => ({
      error: t,
      requestId: e,
      message: n || Vr$1.get(t) || ""
    }), Fr$1 = (t) => J$1.fromPromise(Tr$1(t), Br$1).andThen(
      (e) => e
    ), zr$1 = (t, e) => t.messageLifeCycleEventSubject.pipe(
      je$1((n) => n.requestId === e)
    ), Hr$1 = (t) => (e) => (n) => {
      const r = new ee$1();
      e.requestControl && e.requestControl({
        cancelRequest: () => (H$2.debug(
          `🔵⬆️❌ wallet request canceled
${JSON.stringify(
        n,
        null,
        2
      )}`
        ), r.next())
      });
      const s = r.asObservable().pipe(
        Ne$1(
          () => B$1(He$1(pe$1.canceledByUser, n.requestId))
        )
      ), i = t.responseSubject.pipe(
        je$1((b) => b.requestId === n.requestId),
        Ne$1(
          (b) => "items" in b ? q$1(b) : B$1(b)
        )
      ), o = nt$1(
        i,
        s
      ).pipe(Dt$1()), a = zr$1(t, n.requestId).pipe(
        Se$1((b) => {
          e.eventCallback && e.eventCallback(b.eventType);
        }),
        Ir$1(i),
        En$1()
      ), c = a.subscribe(), u = Er$1(In$1.extensionDetectionTime).pipe(
        Ne$1(
          () => B$1(He$1(pe$1.missingExtension, n.requestId))
        )
      ), l = nt$1(
        u,
        a
      ).pipe(
        Dt$1(),
        je$1((b) => !("eventType" in b))
      ), _ = br$1(!0).pipe(
        Se$1(() => {
          t.outgoingMessageSubject.next(n);
        }),
        je$1(() => !1)
      ), m = nt$1(
        o,
        l,
        _
      ).pipe(
        Se$1(() => {
          c.unsubscribe();
        })
      );
      return Fr$1(m);
    };
    var E$2;
    (function(t) {
      t.assertEqual = (s) => s;
      function e(s) {
      }
      t.assertIs = e;
      function n(s) {
        throw new Error();
      }
      t.assertNever = n, t.arrayToEnum = (s) => {
        const i = {};
        for (const o of s)
          i[o] = o;
        return i;
      }, t.getValidEnumValues = (s) => {
        const i = t.objectKeys(s).filter((a) => typeof s[s[a]] != "number"), o = {};
        for (const a of i)
          o[a] = s[a];
        return t.objectValues(o);
      }, t.objectValues = (s) => t.objectKeys(s).map(function(i) {
        return s[i];
      }), t.objectKeys = typeof Object.keys == "function" ? (s) => Object.keys(s) : (s) => {
        const i = [];
        for (const o in s)
          Object.prototype.hasOwnProperty.call(s, o) && i.push(o);
        return i;
      }, t.find = (s, i) => {
        for (const o of s)
          if (i(o))
            return o;
      }, t.isInteger = typeof Number.isInteger == "function" ? (s) => Number.isInteger(s) : (s) => typeof s == "number" && isFinite(s) && Math.floor(s) === s;
      function r(s, i = " | ") {
        return s.map((o) => typeof o == "string" ? `'${o}'` : o).join(i);
      }
      t.joinValues = r, t.jsonStringifyReplacer = (s, i) => typeof i == "bigint" ? i.toString() : i;
    })(E$2 || (E$2 = {}));
    const f$1 = E$2.arrayToEnum([
      "string",
      "nan",
      "number",
      "integer",
      "float",
      "boolean",
      "date",
      "bigint",
      "symbol",
      "function",
      "undefined",
      "null",
      "array",
      "object",
      "unknown",
      "promise",
      "void",
      "never",
      "map",
      "set"
    ]), fe = (t) => {
      switch (typeof t) {
        case "undefined":
          return f$1.undefined;
        case "string":
          return f$1.string;
        case "number":
          return isNaN(t) ? f$1.nan : f$1.number;
        case "boolean":
          return f$1.boolean;
        case "function":
          return f$1.function;
        case "bigint":
          return f$1.bigint;
        case "object":
          return Array.isArray(t) ? f$1.array : t === null ? f$1.null : t.then && typeof t.then == "function" && t.catch && typeof t.catch == "function" ? f$1.promise : typeof Map < "u" && t instanceof Map ? f$1.map : typeof Set < "u" && t instanceof Set ? f$1.set : typeof Date < "u" && t instanceof Date ? f$1.date : f$1.object;
        default:
          return f$1.unknown;
      }
    }, d$2 = E$2.arrayToEnum([
      "invalid_type",
      "invalid_literal",
      "custom",
      "invalid_union",
      "invalid_union_discriminator",
      "invalid_enum_value",
      "unrecognized_keys",
      "invalid_arguments",
      "invalid_return_type",
      "invalid_date",
      "invalid_string",
      "too_small",
      "too_big",
      "invalid_intersection_types",
      "not_multiple_of"
    ]);
    class ne$1 extends Error {
      constructor(e) {
        super(), this.issues = [], this.addIssue = (r) => {
          this.issues = [...this.issues, r];
        }, this.addIssues = (r = []) => {
          this.issues = [...this.issues, ...r];
        };
        const n = new.target.prototype;
        Object.setPrototypeOf ? Object.setPrototypeOf(this, n) : this.__proto__ = n, this.name = "ZodError", this.issues = e;
      }
      get errors() {
        return this.issues;
      }
      format(e) {
        const n = e || function(i) {
          return i.message;
        }, r = { _errors: [] }, s = (i) => {
          for (const o of i.issues)
            if (o.code === "invalid_union")
              o.unionErrors.map(s);
            else if (o.code === "invalid_return_type")
              s(o.returnTypeError);
            else if (o.code === "invalid_arguments")
              s(o.argumentsError);
            else if (o.path.length === 0)
              r._errors.push(n(o));
            else {
              let a = r, c = 0;
              for (; c < o.path.length; ) {
                const u = o.path[c];
                c === o.path.length - 1 ? (a[u] = a[u] || { _errors: [] }, a[u]._errors.push(n(o))) : a[u] = a[u] || { _errors: [] }, a = a[u], c++;
              }
            }
        };
        return s(this), r;
      }
      toString() {
        return this.message;
      }
      get message() {
        return JSON.stringify(this.issues, E$2.jsonStringifyReplacer, 2);
      }
      get isEmpty() {
        return this.issues.length === 0;
      }
      flatten(e = (n) => n.message) {
        const n = {}, r = [];
        for (const s of this.issues)
          s.path.length > 0 ? (n[s.path[0]] = n[s.path[0]] || [], n[s.path[0]].push(e(s))) : r.push(e(s));
        return { formErrors: r, fieldErrors: n };
      }
      get formErrors() {
        return this.flatten();
      }
    }
    ne$1.create = (t) => new ne$1(t);
    const Ke$1 = (t, e) => {
      let n;
      switch (t.code) {
        case d$2.invalid_type:
          t.received === f$1.undefined ? n = "Required" : n = `Expected ${t.expected}, received ${t.received}`;
          break;
        case d$2.invalid_literal:
          n = `Invalid literal value, expected ${JSON.stringify(t.expected, E$2.jsonStringifyReplacer)}`;
          break;
        case d$2.unrecognized_keys:
          n = `Unrecognized key(s) in object: ${E$2.joinValues(t.keys, ", ")}`;
          break;
        case d$2.invalid_union:
          n = "Invalid input";
          break;
        case d$2.invalid_union_discriminator:
          n = `Invalid discriminator value. Expected ${E$2.joinValues(t.options)}`;
          break;
        case d$2.invalid_enum_value:
          n = `Invalid enum value. Expected ${E$2.joinValues(t.options)}, received '${t.received}'`;
          break;
        case d$2.invalid_arguments:
          n = "Invalid function arguments";
          break;
        case d$2.invalid_return_type:
          n = "Invalid function return type";
          break;
        case d$2.invalid_date:
          n = "Invalid date";
          break;
        case d$2.invalid_string:
          typeof t.validation == "object" ? "startsWith" in t.validation ? n = `Invalid input: must start with "${t.validation.startsWith}"` : "endsWith" in t.validation ? n = `Invalid input: must end with "${t.validation.endsWith}"` : E$2.assertNever(t.validation) : t.validation !== "regex" ? n = `Invalid ${t.validation}` : n = "Invalid";
          break;
        case d$2.too_small:
          t.type === "array" ? n = `Array must contain ${t.inclusive ? "at least" : "more than"} ${t.minimum} element(s)` : t.type === "string" ? n = `String must contain ${t.inclusive ? "at least" : "over"} ${t.minimum} character(s)` : t.type === "number" ? n = `Number must be greater than ${t.inclusive ? "or equal to " : ""}${t.minimum}` : t.type === "date" ? n = `Date must be greater than ${t.inclusive ? "or equal to " : ""}${new Date(t.minimum)}` : n = "Invalid input";
          break;
        case d$2.too_big:
          t.type === "array" ? n = `Array must contain ${t.inclusive ? "at most" : "less than"} ${t.maximum} element(s)` : t.type === "string" ? n = `String must contain ${t.inclusive ? "at most" : "under"} ${t.maximum} character(s)` : t.type === "number" ? n = `Number must be less than ${t.inclusive ? "or equal to " : ""}${t.maximum}` : t.type === "date" ? n = `Date must be smaller than ${t.inclusive ? "or equal to " : ""}${new Date(t.maximum)}` : n = "Invalid input";
          break;
        case d$2.custom:
          n = "Invalid input";
          break;
        case d$2.invalid_intersection_types:
          n = "Intersection results could not be merged";
          break;
        case d$2.not_multiple_of:
          n = `Number must be a multiple of ${t.multipleOf}`;
          break;
        default:
          n = e.defaultError, E$2.assertNever(t);
      }
      return { message: n };
    };
    let Kr$1 = Ke$1;
    function dt$1() {
      return Kr$1;
    }
    const ft = (t) => {
      const { data: e, path: n, errorMaps: r, issueData: s } = t, i = [...n, ...s.path || []], o = {
        ...s,
        path: i
      };
      let a = "";
      const c = r.filter((u) => !!u).slice().reverse();
      for (const u of c)
        a = u(o, { data: e, defaultError: a }).message;
      return {
        ...s,
        path: i,
        message: s.message || a
      };
    };
    function h$3(t, e) {
      const n = ft({
        issueData: e,
        data: t.data,
        path: t.path,
        errorMaps: [
          t.common.contextualErrorMap,
          t.schemaErrorMap,
          dt$1(),
          Ke$1
        ].filter((r) => !!r)
      });
      t.common.issues.push(n);
    }
    class L {
      constructor() {
        this.value = "valid";
      }
      dirty() {
        this.value === "valid" && (this.value = "dirty");
      }
      abort() {
        this.value !== "aborted" && (this.value = "aborted");
      }
      static mergeArray(e, n) {
        const r = [];
        for (const s of n) {
          if (s.status === "aborted")
            return v$1;
          s.status === "dirty" && e.dirty(), r.push(s.value);
        }
        return { status: e.value, value: r };
      }
      static async mergeObjectAsync(e, n) {
        const r = [];
        for (const s of n)
          r.push({
            key: await s.key,
            value: await s.value
          });
        return L.mergeObjectSync(e, r);
      }
      static mergeObjectSync(e, n) {
        const r = {};
        for (const s of n) {
          const { key: i, value: o } = s;
          if (i.status === "aborted" || o.status === "aborted")
            return v$1;
          i.status === "dirty" && e.dirty(), o.status === "dirty" && e.dirty(), (typeof o.value < "u" || s.alwaysSet) && (r[i.value] = o.value);
        }
        return { status: e.value, value: r };
      }
    }
    const v$1 = Object.freeze({
      status: "aborted"
    }), Z$2 = (t) => ({ status: "valid", value: t }), qt$1 = (t) => t.status === "aborted", Bt$1 = (t) => t.status === "dirty", ht = (t) => t.status === "valid", Vt$1 = (t) => typeof Promise !== void 0 && t instanceof Promise;
    var S$3;
    (function(t) {
      t.errToObj = (e) => typeof e == "string" ? { message: e } : e || {}, t.toString = (e) => typeof e == "string" ? e : e == null ? void 0 : e.message;
    })(S$3 || (S$3 = {}));
    class F {
      constructor(e, n, r, s) {
        this.parent = e, this.data = n, this._path = r, this._key = s;
      }
      get path() {
        return this._path.concat(this._key);
      }
    }
    const Ft$1 = (t, e) => {
      if (ht(e))
        return { success: !0, data: e.value };
      if (!t.common.issues.length)
        throw new Error("Validation failed but no issues detected.");
      return { success: !1, error: new ne$1(t.common.issues) };
    };
    function w(t) {
      if (!t)
        return {};
      const { errorMap: e, invalid_type_error: n, required_error: r, description: s } = t;
      if (e && (n || r))
        throw new Error(`Can't use "invalid_type_error" or "required_error" in conjunction with custom error map.`);
      return e ? { errorMap: e, description: s } : { errorMap: (o, a) => o.code !== "invalid_type" ? { message: a.defaultError } : typeof a.data > "u" ? { message: r ?? a.defaultError } : { message: n ?? a.defaultError }, description: s };
    }
    class x$2 {
      constructor(e) {
        this.spa = this.safeParseAsync, this.superRefine = this._refinement, this._def = e, this.parse = this.parse.bind(this), this.safeParse = this.safeParse.bind(this), this.parseAsync = this.parseAsync.bind(this), this.safeParseAsync = this.safeParseAsync.bind(this), this.spa = this.spa.bind(this), this.refine = this.refine.bind(this), this.refinement = this.refinement.bind(this), this.superRefine = this.superRefine.bind(this), this.optional = this.optional.bind(this), this.nullable = this.nullable.bind(this), this.nullish = this.nullish.bind(this), this.array = this.array.bind(this), this.promise = this.promise.bind(this), this.or = this.or.bind(this), this.and = this.and.bind(this), this.transform = this.transform.bind(this), this.default = this.default.bind(this), this.describe = this.describe.bind(this), this.isNullable = this.isNullable.bind(this), this.isOptional = this.isOptional.bind(this);
      }
      get description() {
        return this._def.description;
      }
      _getType(e) {
        return fe(e.data);
      }
      _getOrReturnCtx(e, n) {
        return n || {
          common: e.parent.common,
          data: e.data,
          parsedType: fe(e.data),
          schemaErrorMap: this._def.errorMap,
          path: e.path,
          parent: e.parent
        };
      }
      _processInputParams(e) {
        return {
          status: new L(),
          ctx: {
            common: e.parent.common,
            data: e.data,
            parsedType: fe(e.data),
            schemaErrorMap: this._def.errorMap,
            path: e.path,
            parent: e.parent
          }
        };
      }
      _parseSync(e) {
        const n = this._parse(e);
        if (Vt$1(n))
          throw new Error("Synchronous parse encountered promise.");
        return n;
      }
      _parseAsync(e) {
        const n = this._parse(e);
        return Promise.resolve(n);
      }
      parse(e, n) {
        const r = this.safeParse(e, n);
        if (r.success)
          return r.data;
        throw r.error;
      }
      safeParse(e, n) {
        var r;
        const s = {
          common: {
            issues: [],
            async: (r = n == null ? void 0 : n.async) !== null && r !== void 0 ? r : !1,
            contextualErrorMap: n == null ? void 0 : n.errorMap
          },
          path: (n == null ? void 0 : n.path) || [],
          schemaErrorMap: this._def.errorMap,
          parent: null,
          data: e,
          parsedType: fe(e)
        }, i = this._parseSync({ data: e, path: s.path, parent: s });
        return Ft$1(s, i);
      }
      async parseAsync(e, n) {
        const r = await this.safeParseAsync(e, n);
        if (r.success)
          return r.data;
        throw r.error;
      }
      async safeParseAsync(e, n) {
        const r = {
          common: {
            issues: [],
            contextualErrorMap: n == null ? void 0 : n.errorMap,
            async: !0
          },
          path: (n == null ? void 0 : n.path) || [],
          schemaErrorMap: this._def.errorMap,
          parent: null,
          data: e,
          parsedType: fe(e)
        }, s = this._parse({ data: e, path: [], parent: r }), i = await (Vt$1(s) ? s : Promise.resolve(s));
        return Ft$1(r, i);
      }
      refine(e, n) {
        const r = (s) => typeof n == "string" || typeof n > "u" ? { message: n } : typeof n == "function" ? n(s) : n;
        return this._refinement((s, i) => {
          const o = e(s), a = () => i.addIssue({
            code: d$2.custom,
            ...r(s)
          });
          return typeof Promise < "u" && o instanceof Promise ? o.then((c) => c ? !0 : (a(), !1)) : o ? !0 : (a(), !1);
        });
      }
      refinement(e, n) {
        return this._refinement((r, s) => e(r) ? !0 : (s.addIssue(typeof n == "function" ? n(r, s) : n), !1));
      }
      _refinement(e) {
        return new se$1({
          schema: this,
          typeName: y$2.ZodEffects,
          effect: { type: "refinement", refinement: e }
        });
      }
      optional() {
        return K$1.create(this);
      }
      nullable() {
        return Re.create(this);
      }
      nullish() {
        return this.optional().nullable();
      }
      array() {
        return Y$1.create(this);
      }
      promise() {
        return Ze$1.create(this);
      }
      or(e) {
        return Ye$1.create([this, e]);
      }
      and(e) {
        return Ge$1.create(this, e);
      }
      transform(e) {
        return new se$1({
          schema: this,
          typeName: y$2.ZodEffects,
          effect: { type: "transform", transform: e }
        });
      }
      default(e) {
        const n = typeof e == "function" ? e : () => e;
        return new $n$1({
          innerType: this,
          defaultValue: n,
          typeName: y$2.ZodDefault
        });
      }
      brand() {
        return new Qr$1({
          typeName: y$2.ZodBranded,
          type: this,
          ...w(void 0)
        });
      }
      describe(e) {
        const n = this.constructor;
        return new n({
          ...this._def,
          description: e
        });
      }
      isOptional() {
        return this.safeParse(void 0).success;
      }
      isNullable() {
        return this.safeParse(null).success;
      }
    }
    const Yr$1 = /^c[^\s-]{8,}$/i, Gr$1 = /^([a-f0-9]{8}-[a-f0-9]{4}-[1-5][a-f0-9]{3}-[a-f0-9]{4}-[a-f0-9]{12}|00000000-0000-0000-0000-000000000000)$/i, Jr$1 = /^(([^<>()[\]\.,;:\s@\"]+(\.[^<>()[\]\.,;:\s@\"]+)*)|(\".+\"))@(([^<>()[\]\.,;:\s@\"]+\.)+[^<>()[\]\.,;:\s@\"]{2,})$/i;
    class ve$1 extends x$2 {
      constructor() {
        super(...arguments), this._regex = (e, n, r) => this.refinement((s) => e.test(s), {
          validation: n,
          code: d$2.invalid_string,
          ...S$3.errToObj(r)
        }), this.nonempty = (e) => this.min(1, S$3.errToObj(e)), this.trim = () => new ve$1({
          ...this._def,
          checks: [...this._def.checks, { kind: "trim" }]
        });
      }
      _parse(e) {
        if (this._getType(e) !== f$1.string) {
          const i = this._getOrReturnCtx(e);
          return h$3(
            i,
            {
              code: d$2.invalid_type,
              expected: f$1.string,
              received: i.parsedType
            }
          ), v$1;
        }
        const r = new L();
        let s;
        for (const i of this._def.checks)
          if (i.kind === "min")
            e.data.length < i.value && (s = this._getOrReturnCtx(e, s), h$3(s, {
              code: d$2.too_small,
              minimum: i.value,
              type: "string",
              inclusive: !0,
              message: i.message
            }), r.dirty());
          else if (i.kind === "max")
            e.data.length > i.value && (s = this._getOrReturnCtx(e, s), h$3(s, {
              code: d$2.too_big,
              maximum: i.value,
              type: "string",
              inclusive: !0,
              message: i.message
            }), r.dirty());
          else if (i.kind === "email")
            Jr$1.test(e.data) || (s = this._getOrReturnCtx(e, s), h$3(s, {
              validation: "email",
              code: d$2.invalid_string,
              message: i.message
            }), r.dirty());
          else if (i.kind === "uuid")
            Gr$1.test(e.data) || (s = this._getOrReturnCtx(e, s), h$3(s, {
              validation: "uuid",
              code: d$2.invalid_string,
              message: i.message
            }), r.dirty());
          else if (i.kind === "cuid")
            Yr$1.test(e.data) || (s = this._getOrReturnCtx(e, s), h$3(s, {
              validation: "cuid",
              code: d$2.invalid_string,
              message: i.message
            }), r.dirty());
          else if (i.kind === "url")
            try {
              new URL(e.data);
            } catch {
              s = this._getOrReturnCtx(e, s), h$3(s, {
                validation: "url",
                code: d$2.invalid_string,
                message: i.message
              }), r.dirty();
            }
          else
            i.kind === "regex" ? (i.regex.lastIndex = 0, i.regex.test(e.data) || (s = this._getOrReturnCtx(e, s), h$3(s, {
              validation: "regex",
              code: d$2.invalid_string,
              message: i.message
            }), r.dirty())) : i.kind === "trim" ? e.data = e.data.trim() : i.kind === "startsWith" ? e.data.startsWith(i.value) || (s = this._getOrReturnCtx(e, s), h$3(s, {
              code: d$2.invalid_string,
              validation: { startsWith: i.value },
              message: i.message
            }), r.dirty()) : i.kind === "endsWith" ? e.data.endsWith(i.value) || (s = this._getOrReturnCtx(e, s), h$3(s, {
              code: d$2.invalid_string,
              validation: { endsWith: i.value },
              message: i.message
            }), r.dirty()) : E$2.assertNever(i);
        return { status: r.value, value: e.data };
      }
      _addCheck(e) {
        return new ve$1({
          ...this._def,
          checks: [...this._def.checks, e]
        });
      }
      email(e) {
        return this._addCheck({ kind: "email", ...S$3.errToObj(e) });
      }
      url(e) {
        return this._addCheck({ kind: "url", ...S$3.errToObj(e) });
      }
      uuid(e) {
        return this._addCheck({ kind: "uuid", ...S$3.errToObj(e) });
      }
      cuid(e) {
        return this._addCheck({ kind: "cuid", ...S$3.errToObj(e) });
      }
      regex(e, n) {
        return this._addCheck({
          kind: "regex",
          regex: e,
          ...S$3.errToObj(n)
        });
      }
      startsWith(e, n) {
        return this._addCheck({
          kind: "startsWith",
          value: e,
          ...S$3.errToObj(n)
        });
      }
      endsWith(e, n) {
        return this._addCheck({
          kind: "endsWith",
          value: e,
          ...S$3.errToObj(n)
        });
      }
      min(e, n) {
        return this._addCheck({
          kind: "min",
          value: e,
          ...S$3.errToObj(n)
        });
      }
      max(e, n) {
        return this._addCheck({
          kind: "max",
          value: e,
          ...S$3.errToObj(n)
        });
      }
      length(e, n) {
        return this.min(e, n).max(e, n);
      }
      get isEmail() {
        return !!this._def.checks.find((e) => e.kind === "email");
      }
      get isURL() {
        return !!this._def.checks.find((e) => e.kind === "url");
      }
      get isUUID() {
        return !!this._def.checks.find((e) => e.kind === "uuid");
      }
      get isCUID() {
        return !!this._def.checks.find((e) => e.kind === "cuid");
      }
      get minLength() {
        let e = null;
        for (const n of this._def.checks)
          n.kind === "min" && (e === null || n.value > e) && (e = n.value);
        return e;
      }
      get maxLength() {
        let e = null;
        for (const n of this._def.checks)
          n.kind === "max" && (e === null || n.value < e) && (e = n.value);
        return e;
      }
    }
    ve$1.create = (t) => new ve$1({
      checks: [],
      typeName: y$2.ZodString,
      ...w(t)
    });
    function Xr(t, e) {
      const n = (t.toString().split(".")[1] || "").length, r = (e.toString().split(".")[1] || "").length, s = n > r ? n : r, i = parseInt(t.toFixed(s).replace(".", "")), o = parseInt(e.toFixed(s).replace(".", ""));
      return i % o / Math.pow(10, s);
    }
    class ke$1 extends x$2 {
      constructor() {
        super(...arguments), this.min = this.gte, this.max = this.lte, this.step = this.multipleOf;
      }
      _parse(e) {
        if (this._getType(e) !== f$1.number) {
          const i = this._getOrReturnCtx(e);
          return h$3(i, {
            code: d$2.invalid_type,
            expected: f$1.number,
            received: i.parsedType
          }), v$1;
        }
        let r;
        const s = new L();
        for (const i of this._def.checks)
          i.kind === "int" ? E$2.isInteger(e.data) || (r = this._getOrReturnCtx(e, r), h$3(r, {
            code: d$2.invalid_type,
            expected: "integer",
            received: "float",
            message: i.message
          }), s.dirty()) : i.kind === "min" ? (i.inclusive ? e.data < i.value : e.data <= i.value) && (r = this._getOrReturnCtx(e, r), h$3(r, {
            code: d$2.too_small,
            minimum: i.value,
            type: "number",
            inclusive: i.inclusive,
            message: i.message
          }), s.dirty()) : i.kind === "max" ? (i.inclusive ? e.data > i.value : e.data >= i.value) && (r = this._getOrReturnCtx(e, r), h$3(r, {
            code: d$2.too_big,
            maximum: i.value,
            type: "number",
            inclusive: i.inclusive,
            message: i.message
          }), s.dirty()) : i.kind === "multipleOf" ? Xr(e.data, i.value) !== 0 && (r = this._getOrReturnCtx(e, r), h$3(r, {
            code: d$2.not_multiple_of,
            multipleOf: i.value,
            message: i.message
          }), s.dirty()) : E$2.assertNever(i);
        return { status: s.value, value: e.data };
      }
      gte(e, n) {
        return this.setLimit("min", e, !0, S$3.toString(n));
      }
      gt(e, n) {
        return this.setLimit("min", e, !1, S$3.toString(n));
      }
      lte(e, n) {
        return this.setLimit("max", e, !0, S$3.toString(n));
      }
      lt(e, n) {
        return this.setLimit("max", e, !1, S$3.toString(n));
      }
      setLimit(e, n, r, s) {
        return new ke$1({
          ...this._def,
          checks: [
            ...this._def.checks,
            {
              kind: e,
              value: n,
              inclusive: r,
              message: S$3.toString(s)
            }
          ]
        });
      }
      _addCheck(e) {
        return new ke$1({
          ...this._def,
          checks: [...this._def.checks, e]
        });
      }
      int(e) {
        return this._addCheck({
          kind: "int",
          message: S$3.toString(e)
        });
      }
      positive(e) {
        return this._addCheck({
          kind: "min",
          value: 0,
          inclusive: !1,
          message: S$3.toString(e)
        });
      }
      negative(e) {
        return this._addCheck({
          kind: "max",
          value: 0,
          inclusive: !1,
          message: S$3.toString(e)
        });
      }
      nonpositive(e) {
        return this._addCheck({
          kind: "max",
          value: 0,
          inclusive: !0,
          message: S$3.toString(e)
        });
      }
      nonnegative(e) {
        return this._addCheck({
          kind: "min",
          value: 0,
          inclusive: !0,
          message: S$3.toString(e)
        });
      }
      multipleOf(e, n) {
        return this._addCheck({
          kind: "multipleOf",
          value: e,
          message: S$3.toString(n)
        });
      }
      get minValue() {
        let e = null;
        for (const n of this._def.checks)
          n.kind === "min" && (e === null || n.value > e) && (e = n.value);
        return e;
      }
      get maxValue() {
        let e = null;
        for (const n of this._def.checks)
          n.kind === "max" && (e === null || n.value < e) && (e = n.value);
        return e;
      }
      get isInt() {
        return !!this._def.checks.find((e) => e.kind === "int");
      }
    }
    ke$1.create = (t) => new ke$1({
      checks: [],
      typeName: y$2.ZodNumber,
      ...w(t)
    });
    class pt extends x$2 {
      _parse(e) {
        if (this._getType(e) !== f$1.bigint) {
          const r = this._getOrReturnCtx(e);
          return h$3(r, {
            code: d$2.invalid_type,
            expected: f$1.bigint,
            received: r.parsedType
          }), v$1;
        }
        return Z$2(e.data);
      }
    }
    pt.create = (t) => new pt({
      typeName: y$2.ZodBigInt,
      ...w(t)
    });
    class mt$1 extends x$2 {
      _parse(e) {
        if (this._getType(e) !== f$1.boolean) {
          const r = this._getOrReturnCtx(e);
          return h$3(r, {
            code: d$2.invalid_type,
            expected: f$1.boolean,
            received: r.parsedType
          }), v$1;
        }
        return Z$2(e.data);
      }
    }
    mt$1.create = (t) => new mt$1({
      typeName: y$2.ZodBoolean,
      ...w(t)
    });
    class Le$1 extends x$2 {
      _parse(e) {
        if (this._getType(e) !== f$1.date) {
          const i = this._getOrReturnCtx(e);
          return h$3(i, {
            code: d$2.invalid_type,
            expected: f$1.date,
            received: i.parsedType
          }), v$1;
        }
        if (isNaN(e.data.getTime())) {
          const i = this._getOrReturnCtx(e);
          return h$3(i, {
            code: d$2.invalid_date
          }), v$1;
        }
        const r = new L();
        let s;
        for (const i of this._def.checks)
          i.kind === "min" ? e.data.getTime() < i.value && (s = this._getOrReturnCtx(e, s), h$3(s, {
            code: d$2.too_small,
            message: i.message,
            inclusive: !0,
            minimum: i.value,
            type: "date"
          }), r.dirty()) : i.kind === "max" ? e.data.getTime() > i.value && (s = this._getOrReturnCtx(e, s), h$3(s, {
            code: d$2.too_big,
            message: i.message,
            inclusive: !0,
            maximum: i.value,
            type: "date"
          }), r.dirty()) : E$2.assertNever(i);
        return {
          status: r.value,
          value: new Date(e.data.getTime())
        };
      }
      _addCheck(e) {
        return new Le$1({
          ...this._def,
          checks: [...this._def.checks, e]
        });
      }
      min(e, n) {
        return this._addCheck({
          kind: "min",
          value: e.getTime(),
          message: S$3.toString(n)
        });
      }
      max(e, n) {
        return this._addCheck({
          kind: "max",
          value: e.getTime(),
          message: S$3.toString(n)
        });
      }
      get minDate() {
        let e = null;
        for (const n of this._def.checks)
          n.kind === "min" && (e === null || n.value > e) && (e = n.value);
        return e != null ? new Date(e) : null;
      }
      get maxDate() {
        let e = null;
        for (const n of this._def.checks)
          n.kind === "max" && (e === null || n.value < e) && (e = n.value);
        return e != null ? new Date(e) : null;
      }
    }
    Le$1.create = (t) => new Le$1({
      checks: [],
      typeName: y$2.ZodDate,
      ...w(t)
    });
    class yt$1 extends x$2 {
      _parse(e) {
        if (this._getType(e) !== f$1.undefined) {
          const r = this._getOrReturnCtx(e);
          return h$3(r, {
            code: d$2.invalid_type,
            expected: f$1.undefined,
            received: r.parsedType
          }), v$1;
        }
        return Z$2(e.data);
      }
    }
    yt$1.create = (t) => new yt$1({
      typeName: y$2.ZodUndefined,
      ...w(t)
    });
    class vt$1 extends x$2 {
      _parse(e) {
        if (this._getType(e) !== f$1.null) {
          const r = this._getOrReturnCtx(e);
          return h$3(r, {
            code: d$2.invalid_type,
            expected: f$1.null,
            received: r.parsedType
          }), v$1;
        }
        return Z$2(e.data);
      }
    }
    vt$1.create = (t) => new vt$1({
      typeName: y$2.ZodNull,
      ...w(t)
    });
    class gt extends x$2 {
      constructor() {
        super(...arguments), this._any = !0;
      }
      _parse(e) {
        return Z$2(e.data);
      }
    }
    gt.create = (t) => new gt({
      typeName: y$2.ZodAny,
      ...w(t)
    });
    class Oe$1 extends x$2 {
      constructor() {
        super(...arguments), this._unknown = !0;
      }
      _parse(e) {
        return Z$2(e.data);
      }
    }
    Oe$1.create = (t) => new Oe$1({
      typeName: y$2.ZodUnknown,
      ...w(t)
    });
    class re extends x$2 {
      _parse(e) {
        const n = this._getOrReturnCtx(e);
        return h$3(n, {
          code: d$2.invalid_type,
          expected: f$1.never,
          received: n.parsedType
        }), v$1;
      }
    }
    re.create = (t) => new re({
      typeName: y$2.ZodNever,
      ...w(t)
    });
    class _t$1 extends x$2 {
      _parse(e) {
        if (this._getType(e) !== f$1.undefined) {
          const r = this._getOrReturnCtx(e);
          return h$3(r, {
            code: d$2.invalid_type,
            expected: f$1.void,
            received: r.parsedType
          }), v$1;
        }
        return Z$2(e.data);
      }
    }
    _t$1.create = (t) => new _t$1({
      typeName: y$2.ZodVoid,
      ...w(t)
    });
    class Y$1 extends x$2 {
      _parse(e) {
        const { ctx: n, status: r } = this._processInputParams(e), s = this._def;
        if (n.parsedType !== f$1.array)
          return h$3(n, {
            code: d$2.invalid_type,
            expected: f$1.array,
            received: n.parsedType
          }), v$1;
        if (s.minLength !== null && n.data.length < s.minLength.value && (h$3(n, {
          code: d$2.too_small,
          minimum: s.minLength.value,
          type: "array",
          inclusive: !0,
          message: s.minLength.message
        }), r.dirty()), s.maxLength !== null && n.data.length > s.maxLength.value && (h$3(n, {
          code: d$2.too_big,
          maximum: s.maxLength.value,
          type: "array",
          inclusive: !0,
          message: s.maxLength.message
        }), r.dirty()), n.common.async)
          return Promise.all(n.data.map((o, a) => s.type._parseAsync(new F(n, o, n.path, a)))).then((o) => L.mergeArray(r, o));
        const i = n.data.map((o, a) => s.type._parseSync(new F(n, o, n.path, a)));
        return L.mergeArray(r, i);
      }
      get element() {
        return this._def.type;
      }
      min(e, n) {
        return new Y$1({
          ...this._def,
          minLength: { value: e, message: S$3.toString(n) }
        });
      }
      max(e, n) {
        return new Y$1({
          ...this._def,
          maxLength: { value: e, message: S$3.toString(n) }
        });
      }
      length(e, n) {
        return this.min(e, n).max(e, n);
      }
      nonempty(e) {
        return this.min(1, e);
      }
    }
    Y$1.create = (t, e) => new Y$1({
      type: t,
      minLength: null,
      maxLength: null,
      typeName: y$2.ZodArray,
      ...w(e)
    });
    var wt$1;
    (function(t) {
      t.mergeShapes = (e, n) => ({
        ...e,
        ...n
      });
    })(wt$1 || (wt$1 = {}));
    const zt$1 = (t) => (e) => new I$1({
      ...t,
      shape: () => ({
        ...t.shape(),
        ...e
      })
    });
    function Te$1(t) {
      if (t instanceof I$1) {
        const e = {};
        for (const n in t.shape) {
          const r = t.shape[n];
          e[n] = K$1.create(Te$1(r));
        }
        return new I$1({
          ...t._def,
          shape: () => e
        });
      } else
        return t instanceof Y$1 ? Y$1.create(Te$1(t.element)) : t instanceof K$1 ? K$1.create(Te$1(t.unwrap())) : t instanceof Re ? Re.create(Te$1(t.unwrap())) : t instanceof G ? G.create(t.items.map((e) => Te$1(e))) : t;
    }
    class I$1 extends x$2 {
      constructor() {
        super(...arguments), this._cached = null, this.nonstrict = this.passthrough, this.augment = zt$1(this._def), this.extend = zt$1(this._def);
      }
      _getCached() {
        if (this._cached !== null)
          return this._cached;
        const e = this._def.shape(), n = E$2.objectKeys(e);
        return this._cached = { shape: e, keys: n };
      }
      _parse(e) {
        if (this._getType(e) !== f$1.object) {
          const u = this._getOrReturnCtx(e);
          return h$3(u, {
            code: d$2.invalid_type,
            expected: f$1.object,
            received: u.parsedType
          }), v$1;
        }
        const { status: r, ctx: s } = this._processInputParams(e), { shape: i, keys: o } = this._getCached(), a = [];
        if (!(this._def.catchall instanceof re && this._def.unknownKeys === "strip"))
          for (const u in s.data)
            o.includes(u) || a.push(u);
        const c = [];
        for (const u of o) {
          const l = i[u], _ = s.data[u];
          c.push({
            key: { status: "valid", value: u },
            value: l._parse(new F(s, _, s.path, u)),
            alwaysSet: u in s.data
          });
        }
        if (this._def.catchall instanceof re) {
          const u = this._def.unknownKeys;
          if (u === "passthrough")
            for (const l of a)
              c.push({
                key: { status: "valid", value: l },
                value: { status: "valid", value: s.data[l] }
              });
          else if (u === "strict")
            a.length > 0 && (h$3(s, {
              code: d$2.unrecognized_keys,
              keys: a
            }), r.dirty());
          else if (u !== "strip")
            throw new Error("Internal ZodObject error: invalid unknownKeys value.");
        } else {
          const u = this._def.catchall;
          for (const l of a) {
            const _ = s.data[l];
            c.push({
              key: { status: "valid", value: l },
              value: u._parse(
                new F(s, _, s.path, l)
              ),
              alwaysSet: l in s.data
            });
          }
        }
        return s.common.async ? Promise.resolve().then(async () => {
          const u = [];
          for (const l of c) {
            const _ = await l.key;
            u.push({
              key: _,
              value: await l.value,
              alwaysSet: l.alwaysSet
            });
          }
          return u;
        }).then((u) => L.mergeObjectSync(r, u)) : L.mergeObjectSync(r, c);
      }
      get shape() {
        return this._def.shape();
      }
      strict(e) {
        return S$3.errToObj, new I$1({
          ...this._def,
          unknownKeys: "strict",
          ...e !== void 0 ? {
            errorMap: (n, r) => {
              var s, i, o, a;
              const c = (o = (i = (s = this._def).errorMap) === null || i === void 0 ? void 0 : i.call(s, n, r).message) !== null && o !== void 0 ? o : r.defaultError;
              return n.code === "unrecognized_keys" ? {
                message: (a = S$3.errToObj(e).message) !== null && a !== void 0 ? a : c
              } : {
                message: c
              };
            }
          } : {}
        });
      }
      strip() {
        return new I$1({
          ...this._def,
          unknownKeys: "strip"
        });
      }
      passthrough() {
        return new I$1({
          ...this._def,
          unknownKeys: "passthrough"
        });
      }
      setKey(e, n) {
        return this.augment({ [e]: n });
      }
      merge(e) {
        return new I$1({
          unknownKeys: e._def.unknownKeys,
          catchall: e._def.catchall,
          shape: () => wt$1.mergeShapes(this._def.shape(), e._def.shape()),
          typeName: y$2.ZodObject
        });
      }
      catchall(e) {
        return new I$1({
          ...this._def,
          catchall: e
        });
      }
      pick(e) {
        const n = {};
        return E$2.objectKeys(e).map((r) => {
          this.shape[r] && (n[r] = this.shape[r]);
        }), new I$1({
          ...this._def,
          shape: () => n
        });
      }
      omit(e) {
        const n = {};
        return E$2.objectKeys(this.shape).map((r) => {
          E$2.objectKeys(e).indexOf(r) === -1 && (n[r] = this.shape[r]);
        }), new I$1({
          ...this._def,
          shape: () => n
        });
      }
      deepPartial() {
        return Te$1(this);
      }
      partial(e) {
        const n = {};
        if (e)
          return E$2.objectKeys(this.shape).map((r) => {
            E$2.objectKeys(e).indexOf(r) === -1 ? n[r] = this.shape[r] : n[r] = this.shape[r].optional();
          }), new I$1({
            ...this._def,
            shape: () => n
          });
        for (const r in this.shape) {
          const s = this.shape[r];
          n[r] = s.optional();
        }
        return new I$1({
          ...this._def,
          shape: () => n
        });
      }
      required() {
        const e = {};
        for (const n in this.shape) {
          let s = this.shape[n];
          for (; s instanceof K$1; )
            s = s._def.innerType;
          e[n] = s;
        }
        return new I$1({
          ...this._def,
          shape: () => e
        });
      }
      keyof() {
        return Cn$1(E$2.objectKeys(this.shape));
      }
    }
    I$1.create = (t, e) => new I$1({
      shape: () => t,
      unknownKeys: "strip",
      catchall: re.create(),
      typeName: y$2.ZodObject,
      ...w(e)
    });
    I$1.strictCreate = (t, e) => new I$1({
      shape: () => t,
      unknownKeys: "strict",
      catchall: re.create(),
      typeName: y$2.ZodObject,
      ...w(e)
    });
    I$1.lazycreate = (t, e) => new I$1({
      shape: t,
      unknownKeys: "strip",
      catchall: re.create(),
      typeName: y$2.ZodObject,
      ...w(e)
    });
    class Ye$1 extends x$2 {
      _parse(e) {
        const { ctx: n } = this._processInputParams(e), r = this._def.options;
        function s(i) {
          for (const a of i)
            if (a.result.status === "valid")
              return a.result;
          for (const a of i)
            if (a.result.status === "dirty")
              return n.common.issues.push(...a.ctx.common.issues), a.result;
          const o = i.map((a) => new ne$1(a.ctx.common.issues));
          return h$3(n, {
            code: d$2.invalid_union,
            unionErrors: o
          }), v$1;
        }
        if (n.common.async)
          return Promise.all(r.map(async (i) => {
            const o = {
              ...n,
              common: {
                ...n.common,
                issues: []
              },
              parent: null
            };
            return {
              result: await i._parseAsync({
                data: n.data,
                path: n.path,
                parent: o
              }),
              ctx: o
            };
          })).then(s);
        {
          let i;
          const o = [];
          for (const c of r) {
            const u = {
              ...n,
              common: {
                ...n.common,
                issues: []
              },
              parent: null
            }, l = c._parseSync({
              data: n.data,
              path: n.path,
              parent: u
            });
            if (l.status === "valid")
              return l;
            l.status === "dirty" && !i && (i = { result: l, ctx: u }), u.common.issues.length && o.push(u.common.issues);
          }
          if (i)
            return n.common.issues.push(...i.ctx.common.issues), i.result;
          const a = o.map((c) => new ne$1(c));
          return h$3(n, {
            code: d$2.invalid_union,
            unionErrors: a
          }), v$1;
        }
      }
      get options() {
        return this._def.options;
      }
    }
    Ye$1.create = (t, e) => new Ye$1({
      options: t,
      typeName: y$2.ZodUnion,
      ...w(e)
    });
    function bt$1(t, e) {
      const n = fe(t), r = fe(e);
      if (t === e)
        return { valid: !0, data: t };
      if (n === f$1.object && r === f$1.object) {
        const s = E$2.objectKeys(e), i = E$2.objectKeys(t).filter((a) => s.indexOf(a) !== -1), o = { ...t, ...e };
        for (const a of i) {
          const c = bt$1(t[a], e[a]);
          if (!c.valid)
            return { valid: !1 };
          o[a] = c.data;
        }
        return { valid: !0, data: o };
      } else if (n === f$1.array && r === f$1.array) {
        if (t.length !== e.length)
          return { valid: !1 };
        const s = [];
        for (let i = 0; i < t.length; i++) {
          const o = t[i], a = e[i], c = bt$1(o, a);
          if (!c.valid)
            return { valid: !1 };
          s.push(c.data);
        }
        return { valid: !0, data: s };
      } else
        return n === f$1.date && r === f$1.date && +t == +e ? { valid: !0, data: t } : { valid: !1 };
    }
    class Ge$1 extends x$2 {
      _parse(e) {
        const { status: n, ctx: r } = this._processInputParams(e), s = (i, o) => {
          if (qt$1(i) || qt$1(o))
            return v$1;
          const a = bt$1(i.value, o.value);
          return a.valid ? ((Bt$1(i) || Bt$1(o)) && n.dirty(), { status: n.value, value: a.data }) : (h$3(r, {
            code: d$2.invalid_intersection_types
          }), v$1);
        };
        return r.common.async ? Promise.all([
          this._def.left._parseAsync({
            data: r.data,
            path: r.path,
            parent: r
          }),
          this._def.right._parseAsync({
            data: r.data,
            path: r.path,
            parent: r
          })
        ]).then(([i, o]) => s(i, o)) : s(this._def.left._parseSync({
          data: r.data,
          path: r.path,
          parent: r
        }), this._def.right._parseSync({
          data: r.data,
          path: r.path,
          parent: r
        }));
      }
    }
    Ge$1.create = (t, e, n) => new Ge$1({
      left: t,
      right: e,
      typeName: y$2.ZodIntersection,
      ...w(n)
    });
    class G extends x$2 {
      _parse(e) {
        const { status: n, ctx: r } = this._processInputParams(e);
        if (r.parsedType !== f$1.array)
          return h$3(r, {
            code: d$2.invalid_type,
            expected: f$1.array,
            received: r.parsedType
          }), v$1;
        if (r.data.length < this._def.items.length)
          return h$3(r, {
            code: d$2.too_small,
            minimum: this._def.items.length,
            inclusive: !0,
            type: "array"
          }), v$1;
        !this._def.rest && r.data.length > this._def.items.length && (h$3(r, {
          code: d$2.too_big,
          maximum: this._def.items.length,
          inclusive: !0,
          type: "array"
        }), n.dirty());
        const i = r.data.map((o, a) => {
          const c = this._def.items[a] || this._def.rest;
          return c ? c._parse(new F(r, o, r.path, a)) : null;
        }).filter((o) => !!o);
        return r.common.async ? Promise.all(i).then((o) => L.mergeArray(n, o)) : L.mergeArray(n, i);
      }
      get items() {
        return this._def.items;
      }
      rest(e) {
        return new G({
          ...this._def,
          rest: e
        });
      }
    }
    G.create = (t, e) => {
      if (!Array.isArray(t))
        throw new Error("You must pass an array of schemas to z.tuple([ ... ])");
      return new G({
        items: t,
        typeName: y$2.ZodTuple,
        rest: null,
        ...w(e)
      });
    };
    class Tt$1 extends x$2 {
      _parse(e) {
        const { status: n, ctx: r } = this._processInputParams(e);
        if (r.parsedType !== f$1.map)
          return h$3(r, {
            code: d$2.invalid_type,
            expected: f$1.map,
            received: r.parsedType
          }), v$1;
        const s = this._def.keyType, i = this._def.valueType, o = [...r.data.entries()].map(([a, c], u) => ({
          key: s._parse(new F(r, a, r.path, [u, "key"])),
          value: i._parse(new F(r, c, r.path, [u, "value"]))
        }));
        if (r.common.async) {
          const a = /* @__PURE__ */ new Map();
          return Promise.resolve().then(async () => {
            for (const c of o) {
              const u = await c.key, l = await c.value;
              if (u.status === "aborted" || l.status === "aborted")
                return v$1;
              (u.status === "dirty" || l.status === "dirty") && n.dirty(), a.set(u.value, l.value);
            }
            return { status: n.value, value: a };
          });
        } else {
          const a = /* @__PURE__ */ new Map();
          for (const c of o) {
            const u = c.key, l = c.value;
            if (u.status === "aborted" || l.status === "aborted")
              return v$1;
            (u.status === "dirty" || l.status === "dirty") && n.dirty(), a.set(u.value, l.value);
          }
          return { status: n.value, value: a };
        }
      }
    }
    Tt$1.create = (t, e, n) => new Tt$1({
      valueType: e,
      keyType: t,
      typeName: y$2.ZodMap,
      ...w(n)
    });
    class Pe$1 extends x$2 {
      _parse(e) {
        const { status: n, ctx: r } = this._processInputParams(e);
        if (r.parsedType !== f$1.set)
          return h$3(r, {
            code: d$2.invalid_type,
            expected: f$1.set,
            received: r.parsedType
          }), v$1;
        const s = this._def;
        s.minSize !== null && r.data.size < s.minSize.value && (h$3(r, {
          code: d$2.too_small,
          minimum: s.minSize.value,
          type: "set",
          inclusive: !0,
          message: s.minSize.message
        }), n.dirty()), s.maxSize !== null && r.data.size > s.maxSize.value && (h$3(r, {
          code: d$2.too_big,
          maximum: s.maxSize.value,
          type: "set",
          inclusive: !0,
          message: s.maxSize.message
        }), n.dirty());
        const i = this._def.valueType;
        function o(c) {
          const u = /* @__PURE__ */ new Set();
          for (const l of c) {
            if (l.status === "aborted")
              return v$1;
            l.status === "dirty" && n.dirty(), u.add(l.value);
          }
          return { status: n.value, value: u };
        }
        const a = [...r.data.values()].map((c, u) => i._parse(new F(r, c, r.path, u)));
        return r.common.async ? Promise.all(a).then((c) => o(c)) : o(a);
      }
      min(e, n) {
        return new Pe$1({
          ...this._def,
          minSize: { value: e, message: S$3.toString(n) }
        });
      }
      max(e, n) {
        return new Pe$1({
          ...this._def,
          maxSize: { value: e, message: S$3.toString(n) }
        });
      }
      size(e, n) {
        return this.min(e, n).max(e, n);
      }
      nonempty(e) {
        return this.min(1, e);
      }
    }
    Pe$1.create = (t, e) => new Pe$1({
      valueType: t,
      minSize: null,
      maxSize: null,
      typeName: y$2.ZodSet,
      ...w(e)
    });
    class xt$1 extends x$2 {
      get schema() {
        return this._def.getter();
      }
      _parse(e) {
        const { ctx: n } = this._processInputParams(e);
        return this._def.getter()._parse({ data: n.data, path: n.path, parent: n });
      }
    }
    xt$1.create = (t, e) => new xt$1({
      getter: t,
      typeName: y$2.ZodLazy,
      ...w(e)
    });
    class St$1 extends x$2 {
      _parse(e) {
        if (e.data !== this._def.value) {
          const n = this._getOrReturnCtx(e);
          return h$3(n, {
            code: d$2.invalid_literal,
            expected: this._def.value
          }), v$1;
        }
        return { status: "valid", value: e.data };
      }
      get value() {
        return this._def.value;
      }
    }
    St$1.create = (t, e) => new St$1({
      value: t,
      typeName: y$2.ZodLiteral,
      ...w(e)
    });
    function Cn$1(t, e) {
      return new $t$1({
        values: t,
        typeName: y$2.ZodEnum,
        ...w(e)
      });
    }
    class $t$1 extends x$2 {
      _parse(e) {
        if (typeof e.data != "string") {
          const n = this._getOrReturnCtx(e), r = this._def.values;
          return h$3(n, {
            expected: E$2.joinValues(r),
            received: n.parsedType,
            code: d$2.invalid_type
          }), v$1;
        }
        if (this._def.values.indexOf(e.data) === -1) {
          const n = this._getOrReturnCtx(e), r = this._def.values;
          return h$3(n, {
            received: n.data,
            code: d$2.invalid_enum_value,
            options: r
          }), v$1;
        }
        return Z$2(e.data);
      }
      get options() {
        return this._def.values;
      }
      get enum() {
        const e = {};
        for (const n of this._def.values)
          e[n] = n;
        return e;
      }
      get Values() {
        const e = {};
        for (const n of this._def.values)
          e[n] = n;
        return e;
      }
      get Enum() {
        const e = {};
        for (const n of this._def.values)
          e[n] = n;
        return e;
      }
    }
    $t$1.create = Cn$1;
    class Ot$1 extends x$2 {
      _parse(e) {
        const n = E$2.getValidEnumValues(this._def.values), r = this._getOrReturnCtx(e);
        if (r.parsedType !== f$1.string && r.parsedType !== f$1.number) {
          const s = E$2.objectValues(n);
          return h$3(r, {
            expected: E$2.joinValues(s),
            received: r.parsedType,
            code: d$2.invalid_type
          }), v$1;
        }
        if (n.indexOf(e.data) === -1) {
          const s = E$2.objectValues(n);
          return h$3(r, {
            received: r.data,
            code: d$2.invalid_enum_value,
            options: s
          }), v$1;
        }
        return Z$2(e.data);
      }
      get enum() {
        return this._def.values;
      }
    }
    Ot$1.create = (t, e) => new Ot$1({
      values: t,
      typeName: y$2.ZodNativeEnum,
      ...w(e)
    });
    class Ze$1 extends x$2 {
      _parse(e) {
        const { ctx: n } = this._processInputParams(e);
        if (n.parsedType !== f$1.promise && n.common.async === !1)
          return h$3(n, {
            code: d$2.invalid_type,
            expected: f$1.promise,
            received: n.parsedType
          }), v$1;
        const r = n.parsedType === f$1.promise ? n.data : Promise.resolve(n.data);
        return Z$2(r.then((s) => this._def.type.parseAsync(s, {
          path: n.path,
          errorMap: n.common.contextualErrorMap
        })));
      }
    }
    Ze$1.create = (t, e) => new Ze$1({
      type: t,
      typeName: y$2.ZodPromise,
      ...w(e)
    });
    class se$1 extends x$2 {
      innerType() {
        return this._def.schema;
      }
      _parse(e) {
        const { status: n, ctx: r } = this._processInputParams(e), s = this._def.effect || null;
        if (s.type === "preprocess") {
          const o = s.transform(r.data);
          return r.common.async ? Promise.resolve(o).then((a) => this._def.schema._parseAsync({
            data: a,
            path: r.path,
            parent: r
          })) : this._def.schema._parseSync({
            data: o,
            path: r.path,
            parent: r
          });
        }
        const i = {
          addIssue: (o) => {
            h$3(r, o), o.fatal ? n.abort() : n.dirty();
          },
          get path() {
            return r.path;
          }
        };
        if (i.addIssue = i.addIssue.bind(i), s.type === "refinement") {
          const o = (a) => {
            const c = s.refinement(a, i);
            if (r.common.async)
              return Promise.resolve(c);
            if (c instanceof Promise)
              throw new Error("Async refinement encountered during synchronous parse operation. Use .parseAsync instead.");
            return a;
          };
          if (r.common.async === !1) {
            const a = this._def.schema._parseSync({
              data: r.data,
              path: r.path,
              parent: r
            });
            return a.status === "aborted" ? v$1 : (a.status === "dirty" && n.dirty(), o(a.value), { status: n.value, value: a.value });
          } else
            return this._def.schema._parseAsync({ data: r.data, path: r.path, parent: r }).then((a) => a.status === "aborted" ? v$1 : (a.status === "dirty" && n.dirty(), o(a.value).then(() => ({ status: n.value, value: a.value }))));
        }
        if (s.type === "transform")
          if (r.common.async === !1) {
            const o = this._def.schema._parseSync({
              data: r.data,
              path: r.path,
              parent: r
            });
            if (!ht(o))
              return o;
            const a = s.transform(o.value, i);
            if (a instanceof Promise)
              throw new Error("Asynchronous transform encountered during synchronous parse operation. Use .parseAsync instead.");
            return { status: n.value, value: a };
          } else
            return this._def.schema._parseAsync({ data: r.data, path: r.path, parent: r }).then((o) => ht(o) ? Promise.resolve(s.transform(o.value, i)).then((a) => ({ status: n.value, value: a })) : o);
        E$2.assertNever(s);
      }
    }
    se$1.create = (t, e, n) => new se$1({
      schema: t,
      typeName: y$2.ZodEffects,
      effect: e,
      ...w(n)
    });
    se$1.createWithPreprocess = (t, e, n) => new se$1({
      schema: e,
      effect: { type: "preprocess", transform: t },
      typeName: y$2.ZodEffects,
      ...w(n)
    });
    class K$1 extends x$2 {
      _parse(e) {
        return this._getType(e) === f$1.undefined ? Z$2(void 0) : this._def.innerType._parse(e);
      }
      unwrap() {
        return this._def.innerType;
      }
    }
    K$1.create = (t, e) => new K$1({
      innerType: t,
      typeName: y$2.ZodOptional,
      ...w(e)
    });
    class Re extends x$2 {
      _parse(e) {
        return this._getType(e) === f$1.null ? Z$2(null) : this._def.innerType._parse(e);
      }
      unwrap() {
        return this._def.innerType;
      }
    }
    Re.create = (t, e) => new Re({
      innerType: t,
      typeName: y$2.ZodNullable,
      ...w(e)
    });
    class $n$1 extends x$2 {
      _parse(e) {
        const { ctx: n } = this._processInputParams(e);
        let r = n.data;
        return n.parsedType === f$1.undefined && (r = this._def.defaultValue()), this._def.innerType._parse({
          data: r,
          path: n.path,
          parent: n
        });
      }
      removeDefault() {
        return this._def.innerType;
      }
    }
    $n$1.create = (t, e) => new K$1({
      innerType: t,
      typeName: y$2.ZodOptional,
      ...w(e)
    });
    class Et$1 extends x$2 {
      _parse(e) {
        if (this._getType(e) !== f$1.nan) {
          const r = this._getOrReturnCtx(e);
          return h$3(r, {
            code: d$2.invalid_type,
            expected: f$1.nan,
            received: r.parsedType
          }), v$1;
        }
        return { status: "valid", value: e.data };
      }
    }
    Et$1.create = (t) => new Et$1({
      typeName: y$2.ZodNaN,
      ...w(t)
    });
    class Qr$1 extends x$2 {
      _parse(e) {
        const { ctx: n } = this._processInputParams(e), r = n.data;
        return this._def.type._parse({
          data: r,
          path: n.path,
          parent: n
        });
      }
      unwrap() {
        return this._def.type;
      }
    }
    var y$2;
    (function(t) {
      t.ZodString = "ZodString", t.ZodNumber = "ZodNumber", t.ZodNaN = "ZodNaN", t.ZodBigInt = "ZodBigInt", t.ZodBoolean = "ZodBoolean", t.ZodDate = "ZodDate", t.ZodUndefined = "ZodUndefined", t.ZodNull = "ZodNull", t.ZodAny = "ZodAny", t.ZodUnknown = "ZodUnknown", t.ZodNever = "ZodNever", t.ZodVoid = "ZodVoid", t.ZodArray = "ZodArray", t.ZodObject = "ZodObject", t.ZodUnion = "ZodUnion", t.ZodDiscriminatedUnion = "ZodDiscriminatedUnion", t.ZodIntersection = "ZodIntersection", t.ZodTuple = "ZodTuple", t.ZodRecord = "ZodRecord", t.ZodMap = "ZodMap", t.ZodSet = "ZodSet", t.ZodFunction = "ZodFunction", t.ZodLazy = "ZodLazy", t.ZodLiteral = "ZodLiteral", t.ZodEnum = "ZodEnum", t.ZodEffects = "ZodEffects", t.ZodNativeEnum = "ZodNativeEnum", t.ZodOptional = "ZodOptional", t.ZodNullable = "ZodNullable", t.ZodDefault = "ZodDefault", t.ZodPromise = "ZodPromise", t.ZodBranded = "ZodBranded";
    })(y$2 || (y$2 = {}));
    const P$1 = ve$1.create, Ue$1 = ke$1.create;
    const Nn$1 = mt$1.create;
    re.create;
    Y$1.create;
    const R$2 = I$1.create;
    const Ce$1 = Ye$1.create;
    Ge$1.create;
    G.create;
    const Q$1 = St$1.create;
    Ze$1.create;
    K$1.create;
    Re.create;
    const g$2 = {
      oneTimeAccountsRead: Q$1("oneTimeAccountsRead"),
      ongoingAccountsRead: Q$1("ongoingAccountsRead"),
      oneTimePersonaDataRead: Q$1("oneTimePersonaDataRead"),
      ongoingPersonaDataRead: Q$1("ongoingPersonaDataRead"),
      usePersonaRead: Q$1("usePersonaRead"),
      loginRead: Q$1("loginRead"),
      sendTransactionWrite: Q$1("sendTransactionWrite")
    }, es$1 = Q$1("rejectedByUser"), Nt$1 = R$2({
      address: P$1(),
      label: P$1(),
      appearanceId: Ue$1()
    }), jn$1 = R$2({
      account: Nt$1,
      challenge: P$1(),
      signature: P$1()
    }), Mn$1 = R$2({
      field: P$1(),
      value: P$1()
    }), ts$1 = R$2({
      networkId: Ue$1(),
      dAppId: P$1()
    }), ns$1 = R$2({
      requestType: g$2.oneTimeAccountsRead,
      requiresProofOfOwnership: Nn$1(),
      numberOfAccounts: Ue$1().optional()
    }), rs$1 = R$2({
      requestType: g$2.oneTimeAccountsRead,
      accounts: jn$1.array()
    }), ss = R$2({
      requestType: g$2.oneTimeAccountsRead,
      accounts: Nt$1.array()
    }), is$1 = Ce$1([
      rs$1,
      ss
    ]);
    R$2({
      requestType: g$2.ongoingAccountsRead,
      requiresProofOfOwnership: Nn$1(),
      numberOfAccounts: Ue$1().optional()
    });
    const os$1 = R$2({
      requestType: g$2.ongoingAccountsRead,
      accounts: jn$1.array()
    }), as = R$2({
      requestType: g$2.ongoingAccountsRead,
      accounts: Nt$1.array()
    }), us = Ce$1([
      os$1,
      as
    ]);
    R$2({
      requestType: g$2.oneTimePersonaDataRead,
      fields: P$1().array()
    });
    const cs = R$2({
      requestType: g$2.oneTimePersonaDataRead,
      fields: Mn$1.array()
    });
    R$2({
      requestType: g$2.ongoingPersonaDataRead,
      fields: P$1().array()
    });
    const ls = R$2({
      requestType: g$2.ongoingPersonaDataRead,
      fields: Mn$1.array()
    });
    R$2({
      requestType: g$2.usePersonaRead,
      id: P$1()
    });
    const ds = R$2({
      requestType: g$2.usePersonaRead,
      id: P$1()
    });
    R$2({
      requestType: g$2.loginRead,
      challenge: P$1().optional()
    });
    const fs = R$2({
      requestType: g$2.loginRead,
      personaId: P$1()
    }), hs$1 = R$2({
      requestType: g$2.loginRead,
      personaId: P$1(),
      challenge: P$1(),
      publicKey: P$1(),
      signature: P$1(),
      identityComponentAddress: P$1()
    }), ps = Ce$1([
      fs,
      hs$1
    ]), ms$1 = R$2({
      requestType: g$2.sendTransactionWrite,
      transactionManifest: P$1(),
      version: Ue$1(),
      blobs: P$1().array().optional(),
      message: P$1().optional()
    }), ys$1 = R$2({
      requestType: g$2.sendTransactionWrite,
      transactionIntentHash: P$1()
    }), vs$1 = Ce$1([
      ns$1,
      ms$1
    ]), gs$1 = Ce$1([
      is$1,
      us,
      cs,
      ls,
      ds,
      ps,
      ys$1
    ]), _s$1 = R$2({
      requestId: P$1(),
      items: vs$1.array(),
      metadata: ts$1
    }), ws$1 = R$2({
      requestId: P$1(),
      items: gs$1.array()
    }), bs$1 = R$2({
      requestId: P$1(),
      error: es$1,
      message: P$1().optional()
    }), Ts$1 = Ce$1([
      ws$1,
      bs$1
    ]), Ht$1 = (t) => J$1.fromPromise(
      _s$1.parseAsync(t),
      (e) => e.issues
    ).map(() => t).mapErr(() => (H$2.error("🔵💥 invalid wallet request"), He$1(
      pe$1.walletRequestValidation,
      t.requestId
    ))), Kt$1 = (t) => J$1.fromPromise(
      Ts$1.parseAsync(t),
      (e) => e.issues
    ).map(() => t).mapErr(() => (H$2.error("🔵💥 invalid wallet response"), He$1(
      pe$1.walletRequestValidation,
      t.requestId
    ))), Yt$1 = (t) => t.reduce((e, n) => {
      switch (n.requestType) {
        case g$2.usePersonaRead.value: {
          const { requestType: r, ...s } = n;
          return { ...e, persona: s };
        }
        case g$2.loginRead.value: {
          const { requestType: r, ...s } = n;
          return { ...e, login: s };
        }
        case g$2.oneTimeAccountsRead.value: {
          const { requestType: r, ...s } = n;
          return { ...e, oneTimeAccounts: s.accounts };
        }
        case g$2.ongoingAccountsRead.value: {
          const { requestType: r, ...s } = n;
          return { ...e, ongoingAccounts: s.accounts };
        }
        case g$2.oneTimePersonaDataRead.value: {
          const { requestType: r, ...s } = n;
          return { ...e, oneTimePersonaData: s.fields };
        }
        case g$2.ongoingPersonaDataRead.value: {
          const { requestType: r, ...s } = n;
          return { ...e, ongoingPersonaData: s.fields };
        }
        case g$2.sendTransactionWrite.value: {
          const { requestType: r, ...s } = n;
          return { ...e, ...s };
        }
        default:
          return e;
      }
    }, {}), M$1 = {
      oneTimeAccountsWithoutProofOfOwnership: "oneTimeAccountsWithoutProofOfOwnership",
      oneTimeAccountsWithProofOfOwnership: "oneTimeAccountsWithProofOfOwnership",
      ongoingAccountsWithoutProofOfOwnership: "ongoingAccountsWithoutProofOfOwnership",
      ongoingAccountsWithProofOfOwnership: "ongoingAccountsWithProofOfOwnership",
      usePersona: "usePersona",
      loginWithoutChallenge: "loginWithoutChallenge",
      loginWithChallenge: "loginWithChallenge",
      oneTimePersonaData: "oneTimePersonaData",
      ongoingPersonaData: "ongoingPersonaData"
    }, xs$1 = (/* @__PURE__ */ new Map()).set(
      M$1.oneTimeAccountsWithoutProofOfOwnership,
      g$2.oneTimeAccountsRead.value
    ).set(
      M$1.oneTimeAccountsWithProofOfOwnership,
      g$2.oneTimeAccountsRead.value
    ).set(
      M$1.ongoingAccountsWithProofOfOwnership,
      g$2.ongoingAccountsRead.value
    ).set(
      M$1.ongoingAccountsWithoutProofOfOwnership,
      g$2.ongoingAccountsRead.value
    ).set(
      M$1.loginWithChallenge,
      g$2.loginRead.value
    ).set(
      M$1.loginWithoutChallenge,
      g$2.loginRead.value
    ).set(
      M$1.usePersona,
      g$2.usePersonaRead.value
    ).set(
      M$1.oneTimePersonaData,
      g$2.oneTimePersonaDataRead.value
    ).set(
      M$1.ongoingPersonaData,
      g$2.ongoingPersonaDataRead.value
    ).set("sendTransaction", g$2.sendTransactionWrite.value), Gt$1 = (t) => q$1(
      Object.entries(t).reduce(
        (e, [n, r]) => {
          switch (n) {
            case M$1.oneTimeAccountsWithoutProofOfOwnership:
              return [
                ...e,
                {
                  requestType: g$2.oneTimeAccountsRead.value,
                  ...r,
                  requiresProofOfOwnership: !1
                }
              ];
            case M$1.oneTimeAccountsWithProofOfOwnership:
              return [
                ...e,
                {
                  requestType: g$2.oneTimeAccountsRead.value,
                  ...r,
                  requiresProofOfOwnership: !0
                }
              ];
            case M$1.ongoingAccountsWithProofOfOwnership:
              return [
                ...e,
                {
                  requestType: g$2.ongoingAccountsRead.value,
                  ...r,
                  requiresProofOfOwnership: !0
                }
              ];
            case M$1.ongoingAccountsWithoutProofOfOwnership:
              return [
                ...e,
                {
                  requestType: g$2.ongoingAccountsRead.value,
                  ...r,
                  requiresProofOfOwnership: !1
                }
              ];
            default:
              return [
                ...e,
                { requestType: xs$1.get(n), ...r }
              ];
          }
        },
        []
      )
    ), Jt$1 = (t) => (e, n = crypto.randomUUID()) => q$1({
      items: e,
      requestId: n,
      metadata: t
    }), Ss$1 = {
      sendTransaction: "sendTransaction"
    }, Os$1 = {
      ...M$1,
      ...Ss$1
    }, Es$1 = (t, e) => ({
      request: (s, i = {}) => Gt$1(s).andThen(Jt$1(t)).asyncAndThen(Ht$1).andThen(e(i)).andThen(Kt$1).map((o) => o.items).map(Yt$1),
      sendTransaction: (s, i = {}) => Gt$1({ [Os$1.sendTransaction]: s }).andThen(Jt$1(t)).asyncAndThen(Ht$1).andThen(e(i)).andThen(Kt$1).map((o) => o.items).map(Yt$1)
    });
    var Is$1 = "Expected a function", Cs$1 = 9007199254740991, $s$1 = "[object Arguments]", Ns$1 = "[object Function]", js$1 = "[object GeneratorFunction]", Ms$1 = typeof $e$1 == "object" && $e$1 && $e$1.Object === Object && $e$1, Ls$1 = typeof self == "object" && self && self.Object === Object && self, Zs$1 = Ms$1 || Ls$1 || Function("return this")();
    function Us$1(t, e, n) {
      switch (n.length) {
        case 0:
          return t.call(e);
        case 1:
          return t.call(e, n[0]);
        case 2:
          return t.call(e, n[0], n[1]);
        case 3:
          return t.call(e, n[0], n[1], n[2]);
      }
      return t.apply(e, n);
    }
    function Ds$1(t, e) {
      for (var n = -1, r = e.length, s = t.length; ++n < r; )
        t[s + n] = e[n];
      return t;
    }
    var jt$1 = Object.prototype, Ws$1 = jt$1.hasOwnProperty, Ln$1 = jt$1.toString, Xt$1 = Zs$1.Symbol, qs$1 = jt$1.propertyIsEnumerable, Qt$1 = Xt$1 ? Xt$1.isConcatSpreadable : void 0, en$1 = Math.max;
    function Zn$1(t, e, n, r, s) {
      var i = -1, o = t.length;
      for (n || (n = Fs$1), s || (s = []); ++i < o; ) {
        var a = t[i];
        e > 0 && n(a) ? e > 1 ? Zn$1(a, e - 1, n, r, s) : Ds$1(s, a) : r || (s[s.length] = a);
      }
      return s;
    }
    function Bs$1(t, e) {
      return e = en$1(e === void 0 ? t.length - 1 : e, 0), function() {
        for (var n = arguments, r = -1, s = en$1(n.length - e, 0), i = Array(s); ++r < s; )
          i[r] = n[e + r];
        r = -1;
        for (var o = Array(e + 1); ++r < e; )
          o[r] = n[r];
        return o[e] = i, Us$1(t, this, o);
      };
    }
    function Vs$1(t) {
      return Bs$1(function(e) {
        e = Zn$1(e, 1);
        var n = e.length, r = n;
        for (t && e.reverse(); r--; )
          if (typeof e[r] != "function")
            throw new TypeError(Is$1);
        return function() {
          for (var s = 0, i = n ? e[s].apply(this, arguments) : arguments[0]; ++s < n; )
            i = e[s].call(this, i);
          return i;
        };
      });
    }
    function Fs$1(t) {
      return Hs$1(t) || zs$1(t) || !!(Qt$1 && t && t[Qt$1]);
    }
    function zs$1(t) {
      return Ys$1(t) && Ws$1.call(t, "callee") && (!qs$1.call(t, "callee") || Ln$1.call(t) == $s$1);
    }
    var Hs$1 = Array.isArray;
    function Ks$1(t) {
      return t != null && Js$1(t.length) && !Gs$1(t);
    }
    function Ys$1(t) {
      return Qs$1(t) && Ks$1(t);
    }
    function Gs$1(t) {
      var e = Xs$1(t) ? Ln$1.call(t) : "";
      return e == Ns$1 || e == js$1;
    }
    function Js$1(t) {
      return typeof t == "number" && t > -1 && t % 1 == 0 && t <= Cs$1;
    }
    function Xs$1(t) {
      var e = typeof t;
      return !!t && (e == "object" || e == "function");
    }
    function Qs$1(t) {
      return !!t && typeof t == "object";
    }
    Vs$1();
    const ui$1 = {
      Mainnet: 1,
      Stokenet: 2,
      Adapanet: 10,
      Nebunet: 11,
      Gilganet: 32,
      Enkinet: 33,
      Hammunet: 34
    }, Di$1 = ({
      networkId: t = ui$1.Mainnet,
      dAppId: e,
      logLevel: n = In$1.logLevel
    }) => {
      H$2.setLevel(n), H$2.debug("🔵 wallet sdk instantiated");
      const r = Zr$1(), s = () => {
        H$2.debug("🔵🧹 destroying wallet sdk instance"), r.destroy();
      };
      return {
        ...Es$1(
          { networkId: t, dAppId: e },
          Hr$1(r.subjects)
        ),
        destroy: s,
        __subjects: r.subjects
      };
    };

    /**
     * @license
     * Copyright 2019 Google LLC
     * SPDX-License-Identifier: BSD-3-Clause
     */
    const t$1=window,e$4=t$1.ShadowRoot&&(void 0===t$1.ShadyCSS||t$1.ShadyCSS.nativeShadow)&&"adoptedStyleSheets"in Document.prototype&&"replace"in CSSStyleSheet.prototype,s$3=Symbol(),n$4=new WeakMap;class o$3{constructor(t,e,n){if(this._$cssResult$=!0,n!==s$3)throw Error("CSSResult is not constructable. Use `unsafeCSS` or `css` instead.");this.cssText=t,this.t=e;}get styleSheet(){let t=this.o;const s=this.t;if(e$4&&void 0===t){const e=void 0!==s&&1===s.length;e&&(t=n$4.get(s)),void 0===t&&((this.o=t=new CSSStyleSheet).replaceSync(this.cssText),e&&n$4.set(s,t));}return t}toString(){return this.cssText}}const r$2=t=>new o$3("string"==typeof t?t:t+"",void 0,s$3),i$2=(t,...e)=>{const n=1===t.length?t[0]:e.reduce(((e,s,n)=>e+(t=>{if(!0===t._$cssResult$)return t.cssText;if("number"==typeof t)return t;throw Error("Value passed to 'css' function must be a 'css' function result: "+t+". Use 'unsafeCSS' to pass non-literal values, but take care to ensure page security.")})(s)+t[n+1]),t[0]);return new o$3(n,t,s$3)},S$2=(s,n)=>{e$4?s.adoptedStyleSheets=n.map((t=>t instanceof CSSStyleSheet?t:t.styleSheet)):n.forEach((e=>{const n=document.createElement("style"),o=t$1.litNonce;void 0!==o&&n.setAttribute("nonce",o),n.textContent=e.cssText,s.appendChild(n);}));},c$1=e$4?t=>t:t=>t instanceof CSSStyleSheet?(t=>{let e="";for(const s of t.cssRules)e+=s.cssText;return r$2(e)})(t):t;

    /**
     * @license
     * Copyright 2017 Google LLC
     * SPDX-License-Identifier: BSD-3-Clause
     */var s$2;const e$3=window,r$1=e$3.trustedTypes,h$2=r$1?r$1.emptyScript:"",o$2=e$3.reactiveElementPolyfillSupport,n$3={toAttribute(t,i){switch(i){case Boolean:t=t?h$2:null;break;case Object:case Array:t=null==t?t:JSON.stringify(t);}return t},fromAttribute(t,i){let s=t;switch(i){case Boolean:s=null!==t;break;case Number:s=null===t?null:Number(t);break;case Object:case Array:try{s=JSON.parse(t);}catch(t){s=null;}}return s}},a$1=(t,i)=>i!==t&&(i==i||t==t),l$2={attribute:!0,type:String,converter:n$3,reflect:!1,hasChanged:a$1};class d$1 extends HTMLElement{constructor(){super(),this._$Ei=new Map,this.isUpdatePending=!1,this.hasUpdated=!1,this._$El=null,this.u();}static addInitializer(t){var i;this.finalize(),(null!==(i=this.h)&&void 0!==i?i:this.h=[]).push(t);}static get observedAttributes(){this.finalize();const t=[];return this.elementProperties.forEach(((i,s)=>{const e=this._$Ep(s,i);void 0!==e&&(this._$Ev.set(e,s),t.push(e));})),t}static createProperty(t,i=l$2){if(i.state&&(i.attribute=!1),this.finalize(),this.elementProperties.set(t,i),!i.noAccessor&&!this.prototype.hasOwnProperty(t)){const s="symbol"==typeof t?Symbol():"__"+t,e=this.getPropertyDescriptor(t,s,i);void 0!==e&&Object.defineProperty(this.prototype,t,e);}}static getPropertyDescriptor(t,i,s){return {get(){return this[i]},set(e){const r=this[t];this[i]=e,this.requestUpdate(t,r,s);},configurable:!0,enumerable:!0}}static getPropertyOptions(t){return this.elementProperties.get(t)||l$2}static finalize(){if(this.hasOwnProperty("finalized"))return !1;this.finalized=!0;const t=Object.getPrototypeOf(this);if(t.finalize(),void 0!==t.h&&(this.h=[...t.h]),this.elementProperties=new Map(t.elementProperties),this._$Ev=new Map,this.hasOwnProperty("properties")){const t=this.properties,i=[...Object.getOwnPropertyNames(t),...Object.getOwnPropertySymbols(t)];for(const s of i)this.createProperty(s,t[s]);}return this.elementStyles=this.finalizeStyles(this.styles),!0}static finalizeStyles(i){const s=[];if(Array.isArray(i)){const e=new Set(i.flat(1/0).reverse());for(const i of e)s.unshift(c$1(i));}else void 0!==i&&s.push(c$1(i));return s}static _$Ep(t,i){const s=i.attribute;return !1===s?void 0:"string"==typeof s?s:"string"==typeof t?t.toLowerCase():void 0}u(){var t;this._$E_=new Promise((t=>this.enableUpdating=t)),this._$AL=new Map,this._$Eg(),this.requestUpdate(),null===(t=this.constructor.h)||void 0===t||t.forEach((t=>t(this)));}addController(t){var i,s;(null!==(i=this._$ES)&&void 0!==i?i:this._$ES=[]).push(t),void 0!==this.renderRoot&&this.isConnected&&(null===(s=t.hostConnected)||void 0===s||s.call(t));}removeController(t){var i;null===(i=this._$ES)||void 0===i||i.splice(this._$ES.indexOf(t)>>>0,1);}_$Eg(){this.constructor.elementProperties.forEach(((t,i)=>{this.hasOwnProperty(i)&&(this._$Ei.set(i,this[i]),delete this[i]);}));}createRenderRoot(){var t;const s=null!==(t=this.shadowRoot)&&void 0!==t?t:this.attachShadow(this.constructor.shadowRootOptions);return S$2(s,this.constructor.elementStyles),s}connectedCallback(){var t;void 0===this.renderRoot&&(this.renderRoot=this.createRenderRoot()),this.enableUpdating(!0),null===(t=this._$ES)||void 0===t||t.forEach((t=>{var i;return null===(i=t.hostConnected)||void 0===i?void 0:i.call(t)}));}enableUpdating(t){}disconnectedCallback(){var t;null===(t=this._$ES)||void 0===t||t.forEach((t=>{var i;return null===(i=t.hostDisconnected)||void 0===i?void 0:i.call(t)}));}attributeChangedCallback(t,i,s){this._$AK(t,s);}_$EO(t,i,s=l$2){var e;const r=this.constructor._$Ep(t,s);if(void 0!==r&&!0===s.reflect){const h=(void 0!==(null===(e=s.converter)||void 0===e?void 0:e.toAttribute)?s.converter:n$3).toAttribute(i,s.type);this._$El=t,null==h?this.removeAttribute(r):this.setAttribute(r,h),this._$El=null;}}_$AK(t,i){var s;const e=this.constructor,r=e._$Ev.get(t);if(void 0!==r&&this._$El!==r){const t=e.getPropertyOptions(r),h="function"==typeof t.converter?{fromAttribute:t.converter}:void 0!==(null===(s=t.converter)||void 0===s?void 0:s.fromAttribute)?t.converter:n$3;this._$El=r,this[r]=h.fromAttribute(i,t.type),this._$El=null;}}requestUpdate(t,i,s){let e=!0;void 0!==t&&(((s=s||this.constructor.getPropertyOptions(t)).hasChanged||a$1)(this[t],i)?(this._$AL.has(t)||this._$AL.set(t,i),!0===s.reflect&&this._$El!==t&&(void 0===this._$EC&&(this._$EC=new Map),this._$EC.set(t,s))):e=!1),!this.isUpdatePending&&e&&(this._$E_=this._$Ej());}async _$Ej(){this.isUpdatePending=!0;try{await this._$E_;}catch(t){Promise.reject(t);}const t=this.scheduleUpdate();return null!=t&&await t,!this.isUpdatePending}scheduleUpdate(){return this.performUpdate()}performUpdate(){var t;if(!this.isUpdatePending)return;this.hasUpdated,this._$Ei&&(this._$Ei.forEach(((t,i)=>this[i]=t)),this._$Ei=void 0);let i=!1;const s=this._$AL;try{i=this.shouldUpdate(s),i?(this.willUpdate(s),null===(t=this._$ES)||void 0===t||t.forEach((t=>{var i;return null===(i=t.hostUpdate)||void 0===i?void 0:i.call(t)})),this.update(s)):this._$Ek();}catch(t){throw i=!1,this._$Ek(),t}i&&this._$AE(s);}willUpdate(t){}_$AE(t){var i;null===(i=this._$ES)||void 0===i||i.forEach((t=>{var i;return null===(i=t.hostUpdated)||void 0===i?void 0:i.call(t)})),this.hasUpdated||(this.hasUpdated=!0,this.firstUpdated(t)),this.updated(t);}_$Ek(){this._$AL=new Map,this.isUpdatePending=!1;}get updateComplete(){return this.getUpdateComplete()}getUpdateComplete(){return this._$E_}shouldUpdate(t){return !0}update(t){void 0!==this._$EC&&(this._$EC.forEach(((t,i)=>this._$EO(i,this[i],t))),this._$EC=void 0),this._$Ek();}updated(t){}firstUpdated(t){}}d$1.finalized=!0,d$1.elementProperties=new Map,d$1.elementStyles=[],d$1.shadowRootOptions={mode:"open"},null==o$2||o$2({ReactiveElement:d$1}),(null!==(s$2=e$3.reactiveElementVersions)&&void 0!==s$2?s$2:e$3.reactiveElementVersions=[]).push("1.6.1");

    /**
     * @license
     * Copyright 2017 Google LLC
     * SPDX-License-Identifier: BSD-3-Clause
     */
    var t;const i$1=window,s$1=i$1.trustedTypes,e$2=s$1?s$1.createPolicy("lit-html",{createHTML:t=>t}):void 0,o$1=`lit$${(Math.random()+"").slice(9)}$`,n$2="?"+o$1,l$1=`<${n$2}>`,h$1=document,r=(t="")=>h$1.createComment(t),d=t=>null===t||"object"!=typeof t&&"function"!=typeof t,u=Array.isArray,c=t=>u(t)||"function"==typeof(null==t?void 0:t[Symbol.iterator]),v=/<(?:(!--|\/[^a-zA-Z])|(\/?[a-zA-Z][^>\s]*)|(\/?$))/g,a=/-->/g,f=/>/g,_$1=RegExp(">|[ \t\n\f\r](?:([^\\s\"'>=/]+)([ \t\n\f\r]*=[ \t\n\f\r]*(?:[^ \t\n\f\r\"'`<>=]|(\"|')|))|$)","g"),m=/'/g,p$1=/"/g,$$1=/^(?:script|style|textarea|title)$/i,g$1=t=>(i,...s)=>({_$litType$:t,strings:i,values:s}),y$1=g$1(1),x$1=Symbol.for("lit-noChange"),b$1=Symbol.for("lit-nothing"),T$1=new WeakMap,A$1=h$1.createTreeWalker(h$1,129,null,!1),E$1=(t,i)=>{const s=t.length-1,n=[];let h,r=2===i?"<svg>":"",d=v;for(let i=0;i<s;i++){const s=t[i];let e,u,c=-1,g=0;for(;g<s.length&&(d.lastIndex=g,u=d.exec(s),null!==u);)g=d.lastIndex,d===v?"!--"===u[1]?d=a:void 0!==u[1]?d=f:void 0!==u[2]?($$1.test(u[2])&&(h=RegExp("</"+u[2],"g")),d=_$1):void 0!==u[3]&&(d=_$1):d===_$1?">"===u[0]?(d=null!=h?h:v,c=-1):void 0===u[1]?c=-2:(c=d.lastIndex-u[2].length,e=u[1],d=void 0===u[3]?_$1:'"'===u[3]?p$1:m):d===p$1||d===m?d=_$1:d===a||d===f?d=v:(d=_$1,h=void 0);const y=d===_$1&&t[i+1].startsWith("/>")?" ":"";r+=d===v?s+l$1:c>=0?(n.push(e),s.slice(0,c)+"$lit$"+s.slice(c)+o$1+y):s+o$1+(-2===c?(n.push(void 0),i):y);}const u=r+(t[s]||"<?>")+(2===i?"</svg>":"");if(!Array.isArray(t)||!t.hasOwnProperty("raw"))throw Error("invalid template strings array");return [void 0!==e$2?e$2.createHTML(u):u,n]};class C$1{constructor({strings:t,_$litType$:i},e){let l;this.parts=[];let h=0,d=0;const u=t.length-1,c=this.parts,[v,a]=E$1(t,i);if(this.el=C$1.createElement(v,e),A$1.currentNode=this.el.content,2===i){const t=this.el.content,i=t.firstChild;i.remove(),t.append(...i.childNodes);}for(;null!==(l=A$1.nextNode())&&c.length<u;){if(1===l.nodeType){if(l.hasAttributes()){const t=[];for(const i of l.getAttributeNames())if(i.endsWith("$lit$")||i.startsWith(o$1)){const s=a[d++];if(t.push(i),void 0!==s){const t=l.getAttribute(s.toLowerCase()+"$lit$").split(o$1),i=/([.?@])?(.*)/.exec(s);c.push({type:1,index:h,name:i[2],strings:t,ctor:"."===i[1]?M:"?"===i[1]?k:"@"===i[1]?H$1:S$1});}else c.push({type:6,index:h});}for(const i of t)l.removeAttribute(i);}if($$1.test(l.tagName)){const t=l.textContent.split(o$1),i=t.length-1;if(i>0){l.textContent=s$1?s$1.emptyScript:"";for(let s=0;s<i;s++)l.append(t[s],r()),A$1.nextNode(),c.push({type:2,index:++h});l.append(t[i],r());}}}else if(8===l.nodeType)if(l.data===n$2)c.push({type:2,index:h});else {let t=-1;for(;-1!==(t=l.data.indexOf(o$1,t+1));)c.push({type:7,index:h}),t+=o$1.length-1;}h++;}}static createElement(t,i){const s=h$1.createElement("template");return s.innerHTML=t,s}}function P(t,i,s=t,e){var o,n,l,h;if(i===x$1)return i;let r=void 0!==e?null===(o=s._$Co)||void 0===o?void 0:o[e]:s._$Cl;const u=d(i)?void 0:i._$litDirective$;return (null==r?void 0:r.constructor)!==u&&(null===(n=null==r?void 0:r._$AO)||void 0===n||n.call(r,!1),void 0===u?r=void 0:(r=new u(t),r._$AT(t,s,e)),void 0!==e?(null!==(l=(h=s)._$Co)&&void 0!==l?l:h._$Co=[])[e]=r:s._$Cl=r),void 0!==r&&(i=P(t,r._$AS(t,i.values),r,e)),i}class V$1{constructor(t,i){this.u=[],this._$AN=void 0,this._$AD=t,this._$AM=i;}get parentNode(){return this._$AM.parentNode}get _$AU(){return this._$AM._$AU}v(t){var i;const{el:{content:s},parts:e}=this._$AD,o=(null!==(i=null==t?void 0:t.creationScope)&&void 0!==i?i:h$1).importNode(s,!0);A$1.currentNode=o;let n=A$1.nextNode(),l=0,r=0,d=e[0];for(;void 0!==d;){if(l===d.index){let i;2===d.type?i=new N(n,n.nextSibling,this,t):1===d.type?i=new d.ctor(n,d.name,d.strings,this,t):6===d.type&&(i=new I(n,this,t)),this.u.push(i),d=e[++r];}l!==(null==d?void 0:d.index)&&(n=A$1.nextNode(),l++);}return o}p(t){let i=0;for(const s of this.u)void 0!==s&&(void 0!==s.strings?(s._$AI(t,s,i),i+=s.strings.length-2):s._$AI(t[i])),i++;}}class N{constructor(t,i,s,e){var o;this.type=2,this._$AH=b$1,this._$AN=void 0,this._$AA=t,this._$AB=i,this._$AM=s,this.options=e,this._$Cm=null===(o=null==e?void 0:e.isConnected)||void 0===o||o;}get _$AU(){var t,i;return null!==(i=null===(t=this._$AM)||void 0===t?void 0:t._$AU)&&void 0!==i?i:this._$Cm}get parentNode(){let t=this._$AA.parentNode;const i=this._$AM;return void 0!==i&&11===t.nodeType&&(t=i.parentNode),t}get startNode(){return this._$AA}get endNode(){return this._$AB}_$AI(t,i=this){t=P(this,t,i),d(t)?t===b$1||null==t||""===t?(this._$AH!==b$1&&this._$AR(),this._$AH=b$1):t!==this._$AH&&t!==x$1&&this.g(t):void 0!==t._$litType$?this.$(t):void 0!==t.nodeType?this.T(t):c(t)?this.k(t):this.g(t);}O(t,i=this._$AB){return this._$AA.parentNode.insertBefore(t,i)}T(t){this._$AH!==t&&(this._$AR(),this._$AH=this.O(t));}g(t){this._$AH!==b$1&&d(this._$AH)?this._$AA.nextSibling.data=t:this.T(h$1.createTextNode(t)),this._$AH=t;}$(t){var i;const{values:s,_$litType$:e}=t,o="number"==typeof e?this._$AC(t):(void 0===e.el&&(e.el=C$1.createElement(e.h,this.options)),e);if((null===(i=this._$AH)||void 0===i?void 0:i._$AD)===o)this._$AH.p(s);else {const t=new V$1(o,this),i=t.v(this.options);t.p(s),this.T(i),this._$AH=t;}}_$AC(t){let i=T$1.get(t.strings);return void 0===i&&T$1.set(t.strings,i=new C$1(t)),i}k(t){u(this._$AH)||(this._$AH=[],this._$AR());const i=this._$AH;let s,e=0;for(const o of t)e===i.length?i.push(s=new N(this.O(r()),this.O(r()),this,this.options)):s=i[e],s._$AI(o),e++;e<i.length&&(this._$AR(s&&s._$AB.nextSibling,e),i.length=e);}_$AR(t=this._$AA.nextSibling,i){var s;for(null===(s=this._$AP)||void 0===s||s.call(this,!1,!0,i);t&&t!==this._$AB;){const i=t.nextSibling;t.remove(),t=i;}}setConnected(t){var i;void 0===this._$AM&&(this._$Cm=t,null===(i=this._$AP)||void 0===i||i.call(this,t));}}class S$1{constructor(t,i,s,e,o){this.type=1,this._$AH=b$1,this._$AN=void 0,this.element=t,this.name=i,this._$AM=e,this.options=o,s.length>2||""!==s[0]||""!==s[1]?(this._$AH=Array(s.length-1).fill(new String),this.strings=s):this._$AH=b$1;}get tagName(){return this.element.tagName}get _$AU(){return this._$AM._$AU}_$AI(t,i=this,s,e){const o=this.strings;let n=!1;if(void 0===o)t=P(this,t,i,0),n=!d(t)||t!==this._$AH&&t!==x$1,n&&(this._$AH=t);else {const e=t;let l,h;for(t=o[0],l=0;l<o.length-1;l++)h=P(this,e[s+l],i,l),h===x$1&&(h=this._$AH[l]),n||(n=!d(h)||h!==this._$AH[l]),h===b$1?t=b$1:t!==b$1&&(t+=(null!=h?h:"")+o[l+1]),this._$AH[l]=h;}n&&!e&&this.j(t);}j(t){t===b$1?this.element.removeAttribute(this.name):this.element.setAttribute(this.name,null!=t?t:"");}}class M extends S$1{constructor(){super(...arguments),this.type=3;}j(t){this.element[this.name]=t===b$1?void 0:t;}}const R$1=s$1?s$1.emptyScript:"";class k extends S$1{constructor(){super(...arguments),this.type=4;}j(t){t&&t!==b$1?this.element.setAttribute(this.name,R$1):this.element.removeAttribute(this.name);}}class H$1 extends S$1{constructor(t,i,s,e,o){super(t,i,s,e,o),this.type=5;}_$AI(t,i=this){var s;if((t=null!==(s=P(this,t,i,0))&&void 0!==s?s:b$1)===x$1)return;const e=this._$AH,o=t===b$1&&e!==b$1||t.capture!==e.capture||t.once!==e.once||t.passive!==e.passive,n=t!==b$1&&(e===b$1||o);o&&this.element.removeEventListener(this.name,this,e),n&&this.element.addEventListener(this.name,this,t),this._$AH=t;}handleEvent(t){var i,s;"function"==typeof this._$AH?this._$AH.call(null!==(s=null===(i=this.options)||void 0===i?void 0:i.host)&&void 0!==s?s:this.element,t):this._$AH.handleEvent(t);}}class I{constructor(t,i,s){this.element=t,this.type=6,this._$AN=void 0,this._$AM=i,this.options=s;}get _$AU(){return this._$AM._$AU}_$AI(t){P(this,t);}}const z$1=i$1.litHtmlPolyfillSupport;null==z$1||z$1(C$1,N),(null!==(t=i$1.litHtmlVersions)&&void 0!==t?t:i$1.litHtmlVersions=[]).push("2.6.1");const Z$1=(t,i,s)=>{var e,o;const n=null!==(e=null==s?void 0:s.renderBefore)&&void 0!==e?e:i;let l=n._$litPart$;if(void 0===l){const t=null!==(o=null==s?void 0:s.renderBefore)&&void 0!==o?o:null;n._$litPart$=l=new N(i.insertBefore(r(),t),t,void 0,null!=s?s:{});}return l._$AI(t),l};

    /**
     * @license
     * Copyright 2017 Google LLC
     * SPDX-License-Identifier: BSD-3-Clause
     */var l,o;class s extends d$1{constructor(){super(...arguments),this.renderOptions={host:this},this._$Do=void 0;}createRenderRoot(){var t,e;const i=super.createRenderRoot();return null!==(t=(e=this.renderOptions).renderBefore)&&void 0!==t||(e.renderBefore=i.firstChild),i}update(t){const i=this.render();this.hasUpdated||(this.renderOptions.isConnected=this.isConnected),super.update(t),this._$Do=Z$1(i,this.renderRoot,this.renderOptions);}connectedCallback(){var t;super.connectedCallback(),null===(t=this._$Do)||void 0===t||t.setConnected(!0);}disconnectedCallback(){var t;super.disconnectedCallback(),null===(t=this._$Do)||void 0===t||t.setConnected(!1);}render(){return x$1}}s.finalized=!0,s._$litElement$=!0,null===(l=globalThis.litElementHydrateSupport)||void 0===l||l.call(globalThis,{LitElement:s});const n$1=globalThis.litElementPolyfillSupport;null==n$1||n$1({LitElement:s});(null!==(o=globalThis.litElementVersions)&&void 0!==o?o:globalThis.litElementVersions=[]).push("3.2.2");

    /**
     * @license
     * Copyright 2017 Google LLC
     * SPDX-License-Identifier: BSD-3-Clause
     */
    const e$1=e=>n=>"function"==typeof n?((e,n)=>(customElements.define(e,n),n))(e,n):((e,n)=>{const{kind:t,elements:s}=n;return {kind:t,elements:s,finisher(n){customElements.define(e,n);}}})(e,n);

    /**
     * @license
     * Copyright 2017 Google LLC
     * SPDX-License-Identifier: BSD-3-Clause
     */
    const i=(i,e)=>"method"===e.kind&&e.descriptor&&!("value"in e.descriptor)?{...e,finisher(n){n.createProperty(e.key,i);}}:{kind:"field",key:Symbol(),placement:"own",descriptor:{},originalKey:e.key,initializer(){"function"==typeof e.initializer&&(this[e.key]=e.initializer.call(this));},finisher(n){n.createProperty(e.key,i);}};function e(e){return (n,t)=>void 0!==t?((i,e,n)=>{e.constructor.createProperty(n,i);})(e,n,t):i(e,n)}

    /**
     * @license
     * Copyright 2021 Google LLC
     * SPDX-License-Identifier: BSD-3-Clause
     */var n;null!=(null===(n=window.HTMLSlotElement)||void 0===n?void 0:n.prototype.assignedElements)?(o,n)=>o.assignedElements(n):(o,n)=>o.assignedNodes(n).filter((o=>o.nodeType===Node.ELEMENT_NODE));

    var Nt = function(t, e) {
      return Nt = Object.setPrototypeOf || { __proto__: [] } instanceof Array && function(n, r) {
        n.__proto__ = r;
      } || function(n, r) {
        for (var i in r)
          Object.prototype.hasOwnProperty.call(r, i) && (n[i] = r[i]);
      }, Nt(t, e);
    };
    function ae(t, e) {
      if (typeof e != "function" && e !== null)
        throw new TypeError("Class extends value " + String(e) + " is not a constructor or null");
      Nt(t, e);
      function n() {
        this.constructor = t;
      }
      t.prototype = e === null ? Object.create(e) : (n.prototype = e.prototype, new n());
    }
    function Vr(t, e, n, r) {
      function i(o) {
        return o instanceof n ? o : new n(function(s) {
          s(o);
        });
      }
      return new (n || (n = Promise))(function(o, s) {
        function a(l) {
          try {
            u(r.next(l));
          } catch (m) {
            s(m);
          }
        }
        function c(l) {
          try {
            u(r.throw(l));
          } catch (m) {
            s(m);
          }
        }
        function u(l) {
          l.done ? o(l.value) : i(l.value).then(a, c);
        }
        u((r = r.apply(t, e || [])).next());
      });
    }
    function Rn(t, e) {
      var n = { label: 0, sent: function() {
        if (o[0] & 1)
          throw o[1];
        return o[1];
      }, trys: [], ops: [] }, r, i, o, s;
      return s = { next: a(0), throw: a(1), return: a(2) }, typeof Symbol == "function" && (s[Symbol.iterator] = function() {
        return this;
      }), s;
      function a(u) {
        return function(l) {
          return c([u, l]);
        };
      }
      function c(u) {
        if (r)
          throw new TypeError("Generator is already executing.");
        for (; n; )
          try {
            if (r = 1, i && (o = u[0] & 2 ? i.return : u[0] ? i.throw || ((o = i.return) && o.call(i), 0) : i.next) && !(o = o.call(i, u[1])).done)
              return o;
            switch (i = 0, o && (u = [u[0] & 2, o.value]), u[0]) {
              case 0:
              case 1:
                o = u;
                break;
              case 4:
                return n.label++, { value: u[1], done: !1 };
              case 5:
                n.label++, i = u[1], u = [0];
                continue;
              case 7:
                u = n.ops.pop(), n.trys.pop();
                continue;
              default:
                if (o = n.trys, !(o = o.length > 0 && o[o.length - 1]) && (u[0] === 6 || u[0] === 2)) {
                  n = 0;
                  continue;
                }
                if (u[0] === 3 && (!o || u[1] > o[0] && u[1] < o[3])) {
                  n.label = u[1];
                  break;
                }
                if (u[0] === 6 && n.label < o[1]) {
                  n.label = o[1], o = u;
                  break;
                }
                if (o && n.label < o[2]) {
                  n.label = o[2], n.ops.push(u);
                  break;
                }
                o[2] && n.ops.pop(), n.trys.pop();
                continue;
            }
            u = e.call(t, n);
          } catch (l) {
            u = [6, l], i = 0;
          } finally {
            r = o = 0;
          }
        if (u[0] & 5)
          throw u[1];
        return { value: u[0] ? u[1] : void 0, done: !0 };
      }
    }
    function Se(t) {
      var e = typeof Symbol == "function" && Symbol.iterator, n = e && t[e], r = 0;
      if (n)
        return n.call(t);
      if (t && typeof t.length == "number")
        return {
          next: function() {
            return t && r >= t.length && (t = void 0), { value: t && t[r++], done: !t };
          }
        };
      throw new TypeError(e ? "Object is not iterable." : "Symbol.iterator is not defined.");
    }
    function Pe(t, e) {
      var n = typeof Symbol == "function" && t[Symbol.iterator];
      if (!n)
        return t;
      var r = n.call(t), i, o = [], s;
      try {
        for (; (e === void 0 || e-- > 0) && !(i = r.next()).done; )
          o.push(i.value);
      } catch (a) {
        s = { error: a };
      } finally {
        try {
          i && !i.done && (n = r.return) && n.call(r);
        } finally {
          if (s)
            throw s.error;
        }
      }
      return o;
    }
    function Ne(t, e, n) {
      if (n || arguments.length === 2)
        for (var r = 0, i = e.length, o; r < i; r++)
          (o || !(r in e)) && (o || (o = Array.prototype.slice.call(e, 0, r)), o[r] = e[r]);
      return t.concat(o || Array.prototype.slice.call(e));
    }
    function Me(t) {
      return this instanceof Me ? (this.v = t, this) : new Me(t);
    }
    function Yr(t, e, n) {
      if (!Symbol.asyncIterator)
        throw new TypeError("Symbol.asyncIterator is not defined.");
      var r = n.apply(t, e || []), i, o = [];
      return i = {}, s("next"), s("throw"), s("return"), i[Symbol.asyncIterator] = function() {
        return this;
      }, i;
      function s(f) {
        r[f] && (i[f] = function(v) {
          return new Promise(function(N, d) {
            o.push([f, v, N, d]) > 1 || a(f, v);
          });
        });
      }
      function a(f, v) {
        try {
          c(r[f](v));
        } catch (N) {
          m(o[0][3], N);
        }
      }
      function c(f) {
        f.value instanceof Me ? Promise.resolve(f.value.v).then(u, l) : m(o[0][2], f);
      }
      function u(f) {
        a("next", f);
      }
      function l(f) {
        a("throw", f);
      }
      function m(f, v) {
        f(v), o.shift(), o.length && a(o[0][0], o[0][1]);
      }
    }
    function Hr(t) {
      if (!Symbol.asyncIterator)
        throw new TypeError("Symbol.asyncIterator is not defined.");
      var e = t[Symbol.asyncIterator], n;
      return e ? e.call(t) : (t = typeof Se == "function" ? Se(t) : t[Symbol.iterator](), n = {}, r("next"), r("throw"), r("return"), n[Symbol.asyncIterator] = function() {
        return this;
      }, n);
      function r(o) {
        n[o] = t[o] && function(s) {
          return new Promise(function(a, c) {
            s = t[o](s), i(a, c, s.done, s.value);
          });
        };
      }
      function i(o, s, a, c) {
        Promise.resolve(c).then(function(u) {
          o({ value: u, done: a });
        }, s);
      }
    }
    function E(t) {
      return typeof t == "function";
    }
    function Ft(t) {
      var e = function(r) {
        Error.call(r), r.stack = new Error().stack;
      }, n = t(e);
      return n.prototype = Object.create(Error.prototype), n.prototype.constructor = n, n;
    }
    var bt = Ft(function(t) {
      return function(e) {
        t(this), this.message = e ? e.length + ` errors occurred during unsubscription:
` + e.map(function(n, r) {
          return r + 1 + ") " + n.toString();
        }).join(`
  `) : "", this.name = "UnsubscriptionError", this.errors = e;
      };
    });
    function it(t, e) {
      if (t) {
        var n = t.indexOf(e);
        0 <= n && t.splice(n, 1);
      }
    }
    var We = function() {
      function t(e) {
        this.initialTeardown = e, this.closed = !1, this._parentage = null, this._finalizers = null;
      }
      return t.prototype.unsubscribe = function() {
        var e, n, r, i, o;
        if (!this.closed) {
          this.closed = !0;
          var s = this._parentage;
          if (s)
            if (this._parentage = null, Array.isArray(s))
              try {
                for (var a = Se(s), c = a.next(); !c.done; c = a.next()) {
                  var u = c.value;
                  u.remove(this);
                }
              } catch (d) {
                e = { error: d };
              } finally {
                try {
                  c && !c.done && (n = a.return) && n.call(a);
                } finally {
                  if (e)
                    throw e.error;
                }
              }
            else
              s.remove(this);
          var l = this.initialTeardown;
          if (E(l))
            try {
              l();
            } catch (d) {
              o = d instanceof bt ? d.errors : [d];
            }
          var m = this._finalizers;
          if (m) {
            this._finalizers = null;
            try {
              for (var f = Se(m), v = f.next(); !v.done; v = f.next()) {
                var N = v.value;
                try {
                  sn(N);
                } catch (d) {
                  o = o != null ? o : [], d instanceof bt ? o = Ne(Ne([], Pe(o)), Pe(d.errors)) : o.push(d);
                }
              }
            } catch (d) {
              r = { error: d };
            } finally {
              try {
                v && !v.done && (i = f.return) && i.call(f);
              } finally {
                if (r)
                  throw r.error;
              }
            }
          }
          if (o)
            throw new bt(o);
        }
      }, t.prototype.add = function(e) {
        var n;
        if (e && e !== this)
          if (this.closed)
            sn(e);
          else {
            if (e instanceof t) {
              if (e.closed || e._hasParent(this))
                return;
              e._addParent(this);
            }
            (this._finalizers = (n = this._finalizers) !== null && n !== void 0 ? n : []).push(e);
          }
      }, t.prototype._hasParent = function(e) {
        var n = this._parentage;
        return n === e || Array.isArray(n) && n.includes(e);
      }, t.prototype._addParent = function(e) {
        var n = this._parentage;
        this._parentage = Array.isArray(n) ? (n.push(e), n) : n ? [n, e] : e;
      }, t.prototype._removeParent = function(e) {
        var n = this._parentage;
        n === e ? this._parentage = null : Array.isArray(n) && it(n, e);
      }, t.prototype.remove = function(e) {
        var n = this._finalizers;
        n && it(n, e), e instanceof t && e._removeParent(this);
      }, t.EMPTY = function() {
        var e = new t();
        return e.closed = !0, e;
      }(), t;
    }(), Xn = We.EMPTY;
    function Un(t) {
      return t instanceof We || t && "closed" in t && E(t.remove) && E(t.add) && E(t.unsubscribe);
    }
    function sn(t) {
      E(t) ? t() : t.unsubscribe();
    }
    var Vn = {
      onUnhandledError: null,
      onStoppedNotification: null,
      Promise: void 0,
      useDeprecatedSynchronousErrorHandling: !1,
      useDeprecatedNextContext: !1
    }, Fr = {
      setTimeout: function(t, e) {
        for (var n = [], r = 2; r < arguments.length; r++)
          n[r - 2] = arguments[r];
        return setTimeout.apply(void 0, Ne([t, e], Pe(n)));
      },
      clearTimeout: function(t) {
        return clearTimeout(t);
      },
      delegate: void 0
    };
    function Yn(t) {
      Fr.setTimeout(function() {
        throw t;
      });
    }
    function jt() {
    }
    function nt(t) {
      t();
    }
    var qt = function(t) {
      ae(e, t);
      function e(n) {
        var r = t.call(this) || this;
        return r.isStopped = !1, n ? (r.destination = n, Un(n) && n.add(r)) : r.destination = Kr, r;
      }
      return e.create = function(n, r, i) {
        return new je(n, r, i);
      }, e.prototype.next = function(n) {
        this.isStopped || this._next(n);
      }, e.prototype.error = function(n) {
        this.isStopped || (this.isStopped = !0, this._error(n));
      }, e.prototype.complete = function() {
        this.isStopped || (this.isStopped = !0, this._complete());
      }, e.prototype.unsubscribe = function() {
        this.closed || (this.isStopped = !0, t.prototype.unsubscribe.call(this), this.destination = null);
      }, e.prototype._next = function(n) {
        this.destination.next(n);
      }, e.prototype._error = function(n) {
        try {
          this.destination.error(n);
        } finally {
          this.unsubscribe();
        }
      }, e.prototype._complete = function() {
        try {
          this.destination.complete();
        } finally {
          this.unsubscribe();
        }
      }, e;
    }(We), qr = Function.prototype.bind;
    function wt(t, e) {
      return qr.call(t, e);
    }
    var Qr = function() {
      function t(e) {
        this.partialObserver = e;
      }
      return t.prototype.next = function(e) {
        var n = this.partialObserver;
        if (n.next)
          try {
            n.next(e);
          } catch (r) {
            $e(r);
          }
      }, t.prototype.error = function(e) {
        var n = this.partialObserver;
        if (n.error)
          try {
            n.error(e);
          } catch (r) {
            $e(r);
          }
        else
          $e(e);
      }, t.prototype.complete = function() {
        var e = this.partialObserver;
        if (e.complete)
          try {
            e.complete();
          } catch (n) {
            $e(n);
          }
      }, t;
    }(), je = function(t) {
      ae(e, t);
      function e(n, r, i) {
        var o = t.call(this) || this, s;
        if (E(n) || !n)
          s = {
            next: n != null ? n : void 0,
            error: r != null ? r : void 0,
            complete: i != null ? i : void 0
          };
        else {
          var a;
          o && Vn.useDeprecatedNextContext ? (a = Object.create(n), a.unsubscribe = function() {
            return o.unsubscribe();
          }, s = {
            next: n.next && wt(n.next, a),
            error: n.error && wt(n.error, a),
            complete: n.complete && wt(n.complete, a)
          }) : s = n;
        }
        return o.destination = new Qr(s), o;
      }
      return e;
    }(qt);
    function $e(t) {
      Yn(t);
    }
    function Jr(t) {
      throw t;
    }
    var Kr = {
      closed: !0,
      next: jt,
      error: Jr,
      complete: jt
    }, Qt = function() {
      return typeof Symbol == "function" && Symbol.observable || "@@observable";
    }();
    function vt(t) {
      return t;
    }
    function _r(t) {
      return t.length === 0 ? vt : t.length === 1 ? t[0] : function(e) {
        return t.reduce(function(n, r) {
          return r(n);
        }, e);
      };
    }
    var B = function() {
      function t(e) {
        e && (this._subscribe = e);
      }
      return t.prototype.lift = function(e) {
        var n = new t();
        return n.source = this, n.operator = e, n;
      }, t.prototype.subscribe = function(e, n, r) {
        var i = this, o = ei(e) ? e : new je(e, n, r);
        return nt(function() {
          var s = i, a = s.operator, c = s.source;
          o.add(a ? a.call(o, c) : c ? i._subscribe(o) : i._trySubscribe(o));
        }), o;
      }, t.prototype._trySubscribe = function(e) {
        try {
          return this._subscribe(e);
        } catch (n) {
          e.error(n);
        }
      }, t.prototype.forEach = function(e, n) {
        var r = this;
        return n = an(n), new n(function(i, o) {
          var s = new je({
            next: function(a) {
              try {
                e(a);
              } catch (c) {
                o(c), s.unsubscribe();
              }
            },
            error: o,
            complete: i
          });
          r.subscribe(s);
        });
      }, t.prototype._subscribe = function(e) {
        var n;
        return (n = this.source) === null || n === void 0 ? void 0 : n.subscribe(e);
      }, t.prototype[Qt] = function() {
        return this;
      }, t.prototype.pipe = function() {
        for (var e = [], n = 0; n < arguments.length; n++)
          e[n] = arguments[n];
        return _r(e)(this);
      }, t.prototype.toPromise = function(e) {
        var n = this;
        return e = an(e), new e(function(r, i) {
          var o;
          n.subscribe(function(s) {
            return o = s;
          }, function(s) {
            return i(s);
          }, function() {
            return r(o);
          });
        });
      }, t.create = function(e) {
        return new t(e);
      }, t;
    }();
    function an(t) {
      var e;
      return (e = t != null ? t : Vn.Promise) !== null && e !== void 0 ? e : Promise;
    }
    function $r(t) {
      return t && E(t.next) && E(t.error) && E(t.complete);
    }
    function ei(t) {
      return t && t instanceof qt || $r(t) && Un(t);
    }
    function ti(t) {
      return E(t == null ? void 0 : t.lift);
    }
    function U(t) {
      return function(e) {
        if (ti(e))
          return e.lift(function(n) {
            try {
              return t(n, this);
            } catch (r) {
              this.error(r);
            }
          });
        throw new TypeError("Unable to lift unknown Observable type");
      };
    }
    function H(t, e, n, r, i) {
      return new ni(t, e, n, r, i);
    }
    var ni = function(t) {
      ae(e, t);
      function e(n, r, i, o, s, a) {
        var c = t.call(this, n) || this;
        return c.onFinalize = s, c.shouldUnsubscribe = a, c._next = r ? function(u) {
          try {
            r(u);
          } catch (l) {
            n.error(l);
          }
        } : t.prototype._next, c._error = o ? function(u) {
          try {
            o(u);
          } catch (l) {
            n.error(l);
          } finally {
            this.unsubscribe();
          }
        } : t.prototype._error, c._complete = i ? function() {
          try {
            i();
          } catch (u) {
            n.error(u);
          } finally {
            this.unsubscribe();
          }
        } : t.prototype._complete, c;
      }
      return e.prototype.unsubscribe = function() {
        var n;
        if (!this.shouldUnsubscribe || this.shouldUnsubscribe()) {
          var r = this.closed;
          t.prototype.unsubscribe.call(this), !r && ((n = this.onFinalize) === null || n === void 0 || n.call(this));
        }
      }, e;
    }(qt), ri = Ft(function(t) {
      return function() {
        t(this), this.name = "ObjectUnsubscribedError", this.message = "object unsubscribed";
      };
    }), ne = function(t) {
      ae(e, t);
      function e() {
        var n = t.call(this) || this;
        return n.closed = !1, n.currentObservers = null, n.observers = [], n.isStopped = !1, n.hasError = !1, n.thrownError = null, n;
      }
      return e.prototype.lift = function(n) {
        var r = new un(this, this);
        return r.operator = n, r;
      }, e.prototype._throwIfClosed = function() {
        if (this.closed)
          throw new ri();
      }, e.prototype.next = function(n) {
        var r = this;
        nt(function() {
          var i, o;
          if (r._throwIfClosed(), !r.isStopped) {
            r.currentObservers || (r.currentObservers = Array.from(r.observers));
            try {
              for (var s = Se(r.currentObservers), a = s.next(); !a.done; a = s.next()) {
                var c = a.value;
                c.next(n);
              }
            } catch (u) {
              i = { error: u };
            } finally {
              try {
                a && !a.done && (o = s.return) && o.call(s);
              } finally {
                if (i)
                  throw i.error;
              }
            }
          }
        });
      }, e.prototype.error = function(n) {
        var r = this;
        nt(function() {
          if (r._throwIfClosed(), !r.isStopped) {
            r.hasError = r.isStopped = !0, r.thrownError = n;
            for (var i = r.observers; i.length; )
              i.shift().error(n);
          }
        });
      }, e.prototype.complete = function() {
        var n = this;
        nt(function() {
          if (n._throwIfClosed(), !n.isStopped) {
            n.isStopped = !0;
            for (var r = n.observers; r.length; )
              r.shift().complete();
          }
        });
      }, e.prototype.unsubscribe = function() {
        this.isStopped = this.closed = !0, this.observers = this.currentObservers = null;
      }, Object.defineProperty(e.prototype, "observed", {
        get: function() {
          var n;
          return ((n = this.observers) === null || n === void 0 ? void 0 : n.length) > 0;
        },
        enumerable: !1,
        configurable: !0
      }), e.prototype._trySubscribe = function(n) {
        return this._throwIfClosed(), t.prototype._trySubscribe.call(this, n);
      }, e.prototype._subscribe = function(n) {
        return this._throwIfClosed(), this._checkFinalizedStatuses(n), this._innerSubscribe(n);
      }, e.prototype._innerSubscribe = function(n) {
        var r = this, i = this, o = i.hasError, s = i.isStopped, a = i.observers;
        return o || s ? Xn : (this.currentObservers = null, a.push(n), new We(function() {
          r.currentObservers = null, it(a, n);
        }));
      }, e.prototype._checkFinalizedStatuses = function(n) {
        var r = this, i = r.hasError, o = r.thrownError, s = r.isStopped;
        i ? n.error(o) : s && n.complete();
      }, e.prototype.asObservable = function() {
        var n = new B();
        return n.source = this, n;
      }, e.create = function(n, r) {
        return new un(n, r);
      }, e;
    }(B), un = function(t) {
      ae(e, t);
      function e(n, r) {
        var i = t.call(this) || this;
        return i.destination = n, i.source = r, i;
      }
      return e.prototype.next = function(n) {
        var r, i;
        (i = (r = this.destination) === null || r === void 0 ? void 0 : r.next) === null || i === void 0 || i.call(r, n);
      }, e.prototype.error = function(n) {
        var r, i;
        (i = (r = this.destination) === null || r === void 0 ? void 0 : r.error) === null || i === void 0 || i.call(r, n);
      }, e.prototype.complete = function() {
        var n, r;
        (r = (n = this.destination) === null || n === void 0 ? void 0 : n.complete) === null || r === void 0 || r.call(n);
      }, e.prototype._subscribe = function(n) {
        var r, i;
        return (i = (r = this.source) === null || r === void 0 ? void 0 : r.subscribe(n)) !== null && i !== void 0 ? i : Xn;
      }, e;
    }(ne), ii = {
      now: function() {
        return Date.now();
      },
      delegate: void 0
    }, oi = function(t) {
      ae(e, t);
      function e(n, r) {
        return t.call(this) || this;
      }
      return e.prototype.schedule = function(n, r) {
        return this;
      }, e;
    }(We), Zt = {
      setInterval: function(t, e) {
        for (var n = [], r = 2; r < arguments.length; r++)
          n[r - 2] = arguments[r];
        var i = Zt.delegate;
        return i != null && i.setInterval ? i.setInterval.apply(i, Ne([t, e], Pe(n))) : setInterval.apply(void 0, Ne([t, e], Pe(n)));
      },
      clearInterval: function(t) {
        return clearInterval(t);
      },
      delegate: void 0
    }, si = function(t) {
      ae(e, t);
      function e(n, r) {
        var i = t.call(this, n, r) || this;
        return i.scheduler = n, i.work = r, i.pending = !1, i;
      }
      return e.prototype.schedule = function(n, r) {
        var i;
        if (r === void 0 && (r = 0), this.closed)
          return this;
        this.state = n;
        var o = this.id, s = this.scheduler;
        return o != null && (this.id = this.recycleAsyncId(s, o, r)), this.pending = !0, this.delay = r, this.id = (i = this.id) !== null && i !== void 0 ? i : this.requestAsyncId(s, this.id, r), this;
      }, e.prototype.requestAsyncId = function(n, r, i) {
        return i === void 0 && (i = 0), Zt.setInterval(n.flush.bind(n, this), i);
      }, e.prototype.recycleAsyncId = function(n, r, i) {
        if (i === void 0 && (i = 0), i != null && this.delay === i && this.pending === !1)
          return r;
        r != null && Zt.clearInterval(r);
      }, e.prototype.execute = function(n, r) {
        if (this.closed)
          return new Error("executing a cancelled action");
        this.pending = !1;
        var i = this._execute(n, r);
        if (i)
          return i;
        this.pending === !1 && this.id != null && (this.id = this.recycleAsyncId(this.scheduler, this.id, null));
      }, e.prototype._execute = function(n, r) {
        var i = !1, o;
        try {
          this.work(n);
        } catch (s) {
          i = !0, o = s || new Error("Scheduled action threw falsy error");
        }
        if (i)
          return this.unsubscribe(), o;
      }, e.prototype.unsubscribe = function() {
        if (!this.closed) {
          var n = this, r = n.id, i = n.scheduler, o = i.actions;
          this.work = this.state = this.scheduler = null, this.pending = !1, it(o, this), r != null && (this.id = this.recycleAsyncId(i, r, null)), this.delay = null, t.prototype.unsubscribe.call(this);
        }
      }, e;
    }(oi), cn = function() {
      function t(e, n) {
        n === void 0 && (n = t.now), this.schedulerActionCtor = e, this.now = n;
      }
      return t.prototype.schedule = function(e, n, r) {
        return n === void 0 && (n = 0), new this.schedulerActionCtor(this, e).schedule(r, n);
      }, t.now = ii.now, t;
    }(), ai = function(t) {
      ae(e, t);
      function e(n, r) {
        r === void 0 && (r = cn.now);
        var i = t.call(this, n, r) || this;
        return i.actions = [], i._active = !1, i;
      }
      return e.prototype.flush = function(n) {
        var r = this.actions;
        if (this._active) {
          r.push(n);
          return;
        }
        var i;
        this._active = !0;
        do
          if (i = n.execute(n.state, n.delay))
            break;
        while (n = r.shift());
        if (this._active = !1, i) {
          for (; n = r.shift(); )
            n.unsubscribe();
          throw i;
        }
      }, e;
    }(cn), ui = new ai(si), ci = ui, Hn = new B(function(t) {
      return t.complete();
    });
    function Fn(t) {
      return t && E(t.schedule);
    }
    function qn(t) {
      return t[t.length - 1];
    }
    function Qn(t) {
      return Fn(qn(t)) ? t.pop() : void 0;
    }
    function li(t, e) {
      return typeof qn(t) == "number" ? t.pop() : e;
    }
    var Jn = function(t) {
      return t && typeof t.length == "number" && typeof t != "function";
    };
    function Kn(t) {
      return E(t == null ? void 0 : t.then);
    }
    function _n(t) {
      return E(t[Qt]);
    }
    function $n(t) {
      return Symbol.asyncIterator && E(t == null ? void 0 : t[Symbol.asyncIterator]);
    }
    function er(t) {
      return new TypeError("You provided " + (t !== null && typeof t == "object" ? "an invalid object" : "'" + t + "'") + " where a stream was expected. You can provide an Observable, Promise, ReadableStream, Array, AsyncIterable, or Iterable.");
    }
    function di() {
      return typeof Symbol != "function" || !Symbol.iterator ? "@@iterator" : Symbol.iterator;
    }
    var tr = di();
    function nr(t) {
      return E(t == null ? void 0 : t[tr]);
    }
    function rr(t) {
      return Yr(this, arguments, function() {
        var e, n, r, i;
        return Rn(this, function(o) {
          switch (o.label) {
            case 0:
              e = t.getReader(), o.label = 1;
            case 1:
              o.trys.push([1, , 9, 10]), o.label = 2;
            case 2:
              return [4, Me(e.read())];
            case 3:
              return n = o.sent(), r = n.value, i = n.done, i ? [4, Me(void 0)] : [3, 5];
            case 4:
              return [2, o.sent()];
            case 5:
              return [4, Me(r)];
            case 6:
              return [4, o.sent()];
            case 7:
              return o.sent(), [3, 2];
            case 8:
              return [3, 10];
            case 9:
              return e.releaseLock(), [7];
            case 10:
              return [2];
          }
        });
      });
    }
    function ir(t) {
      return E(t == null ? void 0 : t.getReader);
    }
    function ue(t) {
      if (t instanceof B)
        return t;
      if (t != null) {
        if (_n(t))
          return fi(t);
        if (Jn(t))
          return pi(t);
        if (Kn(t))
          return hi(t);
        if ($n(t))
          return or(t);
        if (nr(t))
          return vi(t);
        if (ir(t))
          return yi(t);
      }
      throw er(t);
    }
    function fi(t) {
      return new B(function(e) {
        var n = t[Qt]();
        if (E(n.subscribe))
          return n.subscribe(e);
        throw new TypeError("Provided object does not correctly implement Symbol.observable");
      });
    }
    function pi(t) {
      return new B(function(e) {
        for (var n = 0; n < t.length && !e.closed; n++)
          e.next(t[n]);
        e.complete();
      });
    }
    function hi(t) {
      return new B(function(e) {
        t.then(function(n) {
          e.closed || (e.next(n), e.complete());
        }, function(n) {
          return e.error(n);
        }).then(null, Yn);
      });
    }
    function vi(t) {
      return new B(function(e) {
        var n, r;
        try {
          for (var i = Se(t), o = i.next(); !o.done; o = i.next()) {
            var s = o.value;
            if (e.next(s), e.closed)
              return;
          }
        } catch (a) {
          n = { error: a };
        } finally {
          try {
            o && !o.done && (r = i.return) && r.call(i);
          } finally {
            if (n)
              throw n.error;
          }
        }
        e.complete();
      });
    }
    function or(t) {
      return new B(function(e) {
        mi(t, e).catch(function(n) {
          return e.error(n);
        });
      });
    }
    function yi(t) {
      return or(rr(t));
    }
    function mi(t, e) {
      var n, r, i, o;
      return Vr(this, void 0, void 0, function() {
        var s, a;
        return Rn(this, function(c) {
          switch (c.label) {
            case 0:
              c.trys.push([0, 5, 6, 11]), n = Hr(t), c.label = 1;
            case 1:
              return [4, n.next()];
            case 2:
              if (r = c.sent(), !!r.done)
                return [3, 4];
              if (s = r.value, e.next(s), e.closed)
                return [2];
              c.label = 3;
            case 3:
              return [3, 1];
            case 4:
              return [3, 11];
            case 5:
              return a = c.sent(), i = { error: a }, [3, 11];
            case 6:
              return c.trys.push([6, , 9, 10]), r && !r.done && (o = n.return) ? [4, o.call(n)] : [3, 8];
            case 7:
              c.sent(), c.label = 8;
            case 8:
              return [3, 10];
            case 9:
              if (i)
                throw i.error;
              return [7];
            case 10:
              return [7];
            case 11:
              return e.complete(), [2];
          }
        });
      });
    }
    function ie(t, e, n, r, i) {
      r === void 0 && (r = 0), i === void 0 && (i = !1);
      var o = e.schedule(function() {
        n(), i ? t.add(this.schedule(null, r)) : this.unsubscribe();
      }, r);
      if (t.add(o), !i)
        return o;
    }
    function sr(t, e) {
      return e === void 0 && (e = 0), U(function(n, r) {
        n.subscribe(H(r, function(i) {
          return ie(r, t, function() {
            return r.next(i);
          }, e);
        }, function() {
          return ie(r, t, function() {
            return r.complete();
          }, e);
        }, function(i) {
          return ie(r, t, function() {
            return r.error(i);
          }, e);
        }));
      });
    }
    function ar(t, e) {
      return e === void 0 && (e = 0), U(function(n, r) {
        r.add(t.schedule(function() {
          return n.subscribe(r);
        }, e));
      });
    }
    function gi(t, e) {
      return ue(t).pipe(ar(e), sr(e));
    }
    function bi(t, e) {
      return ue(t).pipe(ar(e), sr(e));
    }
    function wi(t, e) {
      return new B(function(n) {
        var r = 0;
        return e.schedule(function() {
          r === t.length ? n.complete() : (n.next(t[r++]), n.closed || this.schedule());
        });
      });
    }
    function xi(t, e) {
      return new B(function(n) {
        var r;
        return ie(n, e, function() {
          r = t[tr](), ie(n, e, function() {
            var i, o, s;
            try {
              i = r.next(), o = i.value, s = i.done;
            } catch (a) {
              n.error(a);
              return;
            }
            s ? n.complete() : n.next(o);
          }, 0, !0);
        }), function() {
          return E(r == null ? void 0 : r.return) && r.return();
        };
      });
    }
    function ur(t, e) {
      if (!t)
        throw new Error("Iterable cannot be null");
      return new B(function(n) {
        ie(n, e, function() {
          var r = t[Symbol.asyncIterator]();
          ie(n, e, function() {
            r.next().then(function(i) {
              i.done ? n.complete() : n.next(i.value);
            });
          }, 0, !0);
        });
      });
    }
    function Ai(t, e) {
      return ur(rr(t), e);
    }
    function Ti(t, e) {
      if (t != null) {
        if (_n(t))
          return gi(t, e);
        if (Jn(t))
          return wi(t, e);
        if (Kn(t))
          return bi(t, e);
        if ($n(t))
          return ur(t, e);
        if (nr(t))
          return xi(t, e);
        if (ir(t))
          return Ai(t, e);
      }
      throw er(t);
    }
    function cr(t, e) {
      return e ? Ti(t, e) : ue(t);
    }
    function Mi() {
      for (var t = [], e = 0; e < arguments.length; e++)
        t[e] = arguments[e];
      var n = Qn(t);
      return cr(t, n);
    }
    var Jt = Ft(function(t) {
      return function() {
        t(this), this.name = "EmptyError", this.message = "no elements in sequence";
      };
    });
    function Oi(t, e) {
      var n = typeof e == "object";
      return new Promise(function(r, i) {
        var o = new je({
          next: function(s) {
            r(s), o.unsubscribe();
          },
          error: i,
          complete: function() {
            n ? r(e.defaultValue) : i(new Jt());
          }
        });
        t.subscribe(o);
      });
    }
    function Ii(t) {
      return t instanceof Date && !isNaN(t);
    }
    function Ve(t, e) {
      return U(function(n, r) {
        var i = 0;
        n.subscribe(H(r, function(o) {
          r.next(t.call(e, o, i++));
        }));
      });
    }
    function Si(t, e, n, r, i, o, s, a) {
      var c = [], u = 0, l = 0, m = !1, f = function() {
        m && !c.length && !u && e.complete();
      }, v = function(d) {
        return u < r ? N(d) : c.push(d);
      }, N = function(d) {
        o && e.next(d), u++;
        var I = !1;
        ue(n(d, l++)).subscribe(H(e, function(M) {
          i == null || i(M), o ? v(M) : e.next(M);
        }, function() {
          I = !0;
        }, void 0, function() {
          if (I)
            try {
              u--;
              for (var M = function() {
                var w = c.shift();
                s ? ie(e, s, function() {
                  return N(w);
                }) : N(w);
              }; c.length && u < r; )
                M();
              f();
            } catch (w) {
              e.error(w);
            }
        }));
      };
      return t.subscribe(H(e, v, function() {
        m = !0, f();
      })), function() {
        a == null || a();
      };
    }
    function lr(t, e, n) {
      return n === void 0 && (n = 1 / 0), E(e) ? lr(function(r, i) {
        return Ve(function(o, s) {
          return e(r, o, i, s);
        })(ue(t(r, i)));
      }, n) : (typeof e == "number" && (n = e), U(function(r, i) {
        return Si(r, i, t, n);
      }));
    }
    function Pi(t) {
      return t === void 0 && (t = 1 / 0), lr(vt, t);
    }
    function Ni(t, e, n) {
      t === void 0 && (t = 0), n === void 0 && (n = ci);
      var r = -1;
      return e != null && (Fn(e) ? n = e : r = e), new B(function(i) {
        var o = Ii(t) ? +t - n.now() : t;
        o < 0 && (o = 0);
        var s = 0;
        return n.schedule(function() {
          i.closed || (i.next(s++), 0 <= r ? this.schedule(void 0, r) : i.complete());
        }, o);
      });
    }
    function xt() {
      for (var t = [], e = 0; e < arguments.length; e++)
        t[e] = arguments[e];
      var n = Qn(t), r = li(t, 1 / 0), i = t;
      return i.length ? i.length === 1 ? ue(i[0]) : Pi(r)(cr(i, n)) : Hn;
    }
    function Ye(t, e) {
      return U(function(n, r) {
        var i = 0;
        n.subscribe(H(r, function(o) {
          return t.call(e, o, i++) && r.next(o);
        }));
      });
    }
    function ji(t) {
      return U(function(e, n) {
        var r = !1;
        e.subscribe(H(n, function(i) {
          r = !0, n.next(i);
        }, function() {
          r || n.next(t), n.complete();
        }));
      });
    }
    function Zi(t) {
      return t <= 0 ? function() {
        return Hn;
      } : U(function(e, n) {
        var r = 0;
        e.subscribe(H(n, function(i) {
          ++r <= t && (n.next(i), t <= r && n.complete());
        }));
      });
    }
    function zi(t) {
      return t === void 0 && (t = Di), U(function(e, n) {
        var r = !1;
        e.subscribe(H(n, function(i) {
          r = !0, n.next(i);
        }, function() {
          return r ? n.complete() : n.error(t());
        }));
      });
    }
    function Di() {
      return new Jt();
    }
    function ln(t, e) {
      var n = arguments.length >= 2;
      return function(r) {
        return r.pipe(t ? Ye(function(i, o) {
          return t(i, o, r);
        }) : vt, Zi(1), n ? ji(e) : zi(function() {
          return new Jt();
        }));
      };
    }
    function dr(t) {
      t === void 0 && (t = {});
      var e = t.connector, n = e === void 0 ? function() {
        return new ne();
      } : e, r = t.resetOnError, i = r === void 0 ? !0 : r, o = t.resetOnComplete, s = o === void 0 ? !0 : o, a = t.resetOnRefCountZero, c = a === void 0 ? !0 : a;
      return function(u) {
        var l, m, f, v = 0, N = !1, d = !1, I = function() {
          m == null || m.unsubscribe(), m = void 0;
        }, M = function() {
          I(), l = f = void 0, N = d = !1;
        }, w = function() {
          var ce = l;
          M(), ce == null || ce.unsubscribe();
        };
        return U(function(ce, L) {
          v++, !d && !N && I();
          var be = f = f != null ? f : n();
          L.add(function() {
            v--, v === 0 && !d && !N && (m = At(w, c));
          }), be.subscribe(L), !l && v > 0 && (l = new je({
            next: function(le) {
              return be.next(le);
            },
            error: function(le) {
              d = !0, I(), m = At(M, i, le), be.error(le);
            },
            complete: function() {
              N = !0, I(), m = At(M, s), be.complete();
            }
          }), ue(ce).subscribe(l));
        })(u);
      };
    }
    function At(t, e) {
      for (var n = [], r = 2; r < arguments.length; r++)
        n[r - 2] = arguments[r];
      if (e === !0) {
        t();
        return;
      }
      if (e !== !1) {
        var i = new je({
          next: function() {
            i.unsubscribe(), t();
          }
        });
        return e.apply(void 0, Ne([], Pe(n))).subscribe(i);
      }
    }
    function Ei(t) {
      return U(function(e, n) {
        ue(t).subscribe(H(n, function() {
          return n.complete();
        }, jt)), !n.closed && e.subscribe(n);
      });
    }
    function Oe(t, e, n) {
      var r = E(t) || e || n ? { next: t, error: e, complete: n } : t;
      return r ? U(function(i, o) {
        var s;
        (s = r.subscribe) === null || s === void 0 || s.call(r);
        var a = !0;
        i.subscribe(H(o, function(c) {
          var u;
          (u = r.next) === null || u === void 0 || u.call(r, c), o.next(c);
        }, function() {
          var c;
          a = !1, (c = r.complete) === null || c === void 0 || c.call(r), o.complete();
        }, function(c) {
          var u;
          a = !1, (u = r.error) === null || u === void 0 || u.call(r, c), o.error(c);
        }, function() {
          var c, u;
          a && ((c = r.unsubscribe) === null || c === void 0 || c.call(r)), (u = r.finalize) === null || u === void 0 || u.call(r);
        }));
      }) : vt;
    }
    const ki = () => ({
      outgoingMessageSubject: new ne(),
      incomingMessageSubject: new ne(),
      responseSubject: new ne(),
      messageLifeCycleEventSubject: new ne(),
      dispatchEventSubject: new ne()
    }), zt = {
      outgoingMessage: "radix#chromeExtension#send",
      incomingMessage: "radix#chromeExtension#receive"
    }, Li = (t) => t.outgoingMessageSubject.pipe(
      Ve((e) => ({
        event: zt.outgoingMessage,
        payload: e
      })),
      Oe((e) => {
        t.dispatchEventSubject.next(e);
      }),
      dr()
    );
    var Xe = typeof globalThis < "u" ? globalThis : typeof window < "u" ? window : typeof global < "u" ? global : typeof self < "u" ? self : {}, fr = { exports: {} };
    (function(t) {
      (function(e, n) {
        t.exports ? t.exports = n() : e.log = n();
      })(Xe, function() {
        var e = function() {
        }, n = "undefined", r = typeof window !== n && typeof window.navigator !== n && /Trident\/|MSIE /.test(window.navigator.userAgent), i = [
          "trace",
          "debug",
          "info",
          "warn",
          "error"
        ];
        function o(d, I) {
          var M = d[I];
          if (typeof M.bind == "function")
            return M.bind(d);
          try {
            return Function.prototype.bind.call(M, d);
          } catch {
            return function() {
              return Function.prototype.apply.apply(M, [d, arguments]);
            };
          }
        }
        function s() {
          console.log && (console.log.apply ? console.log.apply(console, arguments) : Function.prototype.apply.apply(console.log, [console, arguments])), console.trace && console.trace();
        }
        function a(d) {
          return d === "debug" && (d = "log"), typeof console === n ? !1 : d === "trace" && r ? s : console[d] !== void 0 ? o(console, d) : console.log !== void 0 ? o(console, "log") : e;
        }
        function c(d, I) {
          for (var M = 0; M < i.length; M++) {
            var w = i[M];
            this[w] = M < d ? e : this.methodFactory(w, d, I);
          }
          this.log = this.debug;
        }
        function u(d, I, M) {
          return function() {
            typeof console !== n && (c.call(this, I, M), this[d].apply(this, arguments));
          };
        }
        function l(d, I, M) {
          return a(d) || u.apply(this, arguments);
        }
        function m(d, I, M) {
          var w = this, ce;
          I = I != null ? I : "WARN";
          var L = "loglevel";
          typeof d == "string" ? L += ":" + d : typeof d == "symbol" && (L = void 0);
          function be(P) {
            var de = (i[P] || "silent").toUpperCase();
            if (!(typeof window === n || !L)) {
              try {
                window.localStorage[L] = de;
                return;
              } catch {
              }
              try {
                window.document.cookie = encodeURIComponent(L) + "=" + de + ";";
              } catch {
              }
            }
          }
          function le() {
            var P;
            if (!(typeof window === n || !L)) {
              try {
                P = window.localStorage[L];
              } catch {
              }
              if (typeof P === n)
                try {
                  var de = window.document.cookie, on = de.indexOf(
                    encodeURIComponent(L) + "="
                  );
                  on !== -1 && (P = /^([^;]+)/.exec(de.slice(on))[1]);
                } catch {
                }
              return w.levels[P] === void 0 && (P = void 0), P;
            }
          }
          function Rr() {
            if (!(typeof window === n || !L)) {
              try {
                window.localStorage.removeItem(L);
                return;
              } catch {
              }
              try {
                window.document.cookie = encodeURIComponent(L) + "=; expires=Thu, 01 Jan 1970 00:00:00 UTC";
              } catch {
              }
            }
          }
          w.name = d, w.levels = {
            TRACE: 0,
            DEBUG: 1,
            INFO: 2,
            WARN: 3,
            ERROR: 4,
            SILENT: 5
          }, w.methodFactory = M || l, w.getLevel = function() {
            return ce;
          }, w.setLevel = function(P, de) {
            if (typeof P == "string" && w.levels[P.toUpperCase()] !== void 0 && (P = w.levels[P.toUpperCase()]), typeof P == "number" && P >= 0 && P <= w.levels.SILENT) {
              if (ce = P, de !== !1 && be(P), c.call(w, P, d), typeof console === n && P < w.levels.SILENT)
                return "No console available for logging";
            } else
              throw "log.setLevel() called with invalid level: " + P;
          }, w.setDefaultLevel = function(P) {
            I = P, le() || w.setLevel(P, !1);
          }, w.resetLevel = function() {
            w.setLevel(I, !1), Rr();
          }, w.enableAll = function(P) {
            w.setLevel(w.levels.TRACE, P);
          }, w.disableAll = function(P) {
            w.setLevel(w.levels.SILENT, P);
          };
          var gt = le();
          gt == null && (gt = I), w.setLevel(gt, !1);
        }
        var f = new m(), v = {};
        f.getLogger = function(d) {
          if (typeof d != "symbol" && typeof d != "string" || d === "")
            throw new TypeError("You must supply a name when creating a logger.");
          var I = v[d];
          return I || (I = v[d] = new m(
            d,
            f.getLevel(),
            f.methodFactory
          )), I;
        };
        var N = typeof window !== n ? window.log : void 0;
        return f.noConflict = function() {
          return typeof window !== n && window.log === f && (window.log = N), f;
        }, f.getLoggers = function() {
          return v;
        }, f.default = f, f;
      });
    })(fr);
    const J = fr.exports, Ci = (t) => t.incomingMessageSubject.pipe(
      Oe((e) => {
        "eventType" in e ? (J.debug(
          `\u{1F535}\u{1F4AC}\u2B07\uFE0F message lifecycle event
${JSON.stringify(e, null, 2)}`
        ), t.messageLifeCycleEventSubject.next(e)) : (J.debug(`\u{1F535}\u2B07\uFE0F wallet response
${JSON.stringify(e, null, 2)}`), t.responseSubject.next(e));
      })
    ), Wi = (t) => t.dispatchEventSubject.pipe(
      Oe(({ event: e, payload: n }) => {
        J.debug(`\u{1F535}\u2B06\uFE0F wallet request
${JSON.stringify(n, null, 2)}`), window.dispatchEvent(
          new CustomEvent(e, {
            detail: n
          })
        );
      })
    ), Gi = (t) => {
      const e = new We();
      return e.add(Wi(t).subscribe()), e.add(Li(t).subscribe()), e.add(Ci(t).subscribe()), e;
    }, Bi = (t) => {
      const e = (n) => {
        const r = n.detail;
        t.incomingMessageSubject.next(r);
      };
      return addEventListener(zt.incomingMessage, e), { destroy: () => {
        removeEventListener(zt.incomingMessage, e);
      } };
    }, Ri = (t = ki()) => {
      const e = Gi(t), n = Bi(t);
      return { destroy: () => {
        n.destroy(), e.unsubscribe();
      }, subjects: t };
    };
    function Tt(t, e, n, r) {
      function i(o) {
        return o instanceof n ? o : new n(function(s) {
          s(o);
        });
      }
      return new (n || (n = Promise))(function(o, s) {
        function a(l) {
          try {
            u(r.next(l));
          } catch (m) {
            s(m);
          }
        }
        function c(l) {
          try {
            u(r.throw(l));
          } catch (m) {
            s(m);
          }
        }
        function u(l) {
          l.done ? o(l.value) : i(l.value).then(a, c);
        }
        u((r = r.apply(t, e || [])).next());
      });
    }
    function Mt(t, e) {
      var n = { label: 0, sent: function() {
        if (o[0] & 1)
          throw o[1];
        return o[1];
      }, trys: [], ops: [] }, r, i, o, s;
      return s = { next: a(0), throw: a(1), return: a(2) }, typeof Symbol == "function" && (s[Symbol.iterator] = function() {
        return this;
      }), s;
      function a(u) {
        return function(l) {
          return c([u, l]);
        };
      }
      function c(u) {
        if (r)
          throw new TypeError("Generator is already executing.");
        for (; n; )
          try {
            if (r = 1, i && (o = u[0] & 2 ? i.return : u[0] ? i.throw || ((o = i.return) && o.call(i), 0) : i.next) && !(o = o.call(i, u[1])).done)
              return o;
            switch (i = 0, o && (u = [u[0] & 2, o.value]), u[0]) {
              case 0:
              case 1:
                o = u;
                break;
              case 4:
                return n.label++, { value: u[1], done: !1 };
              case 5:
                n.label++, i = u[1], u = [0];
                continue;
              case 7:
                u = n.ops.pop(), n.trys.pop();
                continue;
              default:
                if (o = n.trys, !(o = o.length > 0 && o[o.length - 1]) && (u[0] === 6 || u[0] === 2)) {
                  n = 0;
                  continue;
                }
                if (u[0] === 3 && (!o || u[1] > o[0] && u[1] < o[3])) {
                  n.label = u[1];
                  break;
                }
                if (u[0] === 6 && n.label < o[1]) {
                  n.label = o[1], o = u;
                  break;
                }
                if (o && n.label < o[2]) {
                  n.label = o[2], n.ops.push(u);
                  break;
                }
                o[2] && n.ops.pop(), n.trys.pop();
                continue;
            }
            u = e.call(t, n);
          } catch (l) {
            u = [6, l], i = 0;
          } finally {
            r = o = 0;
          }
        if (u[0] & 5)
          throw u[1];
        return { value: u[0] ? u[1] : void 0, done: !0 };
      }
    }
    function ot(t, e) {
      var n = typeof Symbol == "function" && t[Symbol.iterator];
      if (!n)
        return t;
      var r = n.call(t), i, o = [], s;
      try {
        for (; (e === void 0 || e-- > 0) && !(i = r.next()).done; )
          o.push(i.value);
      } catch (a) {
        s = { error: a };
      } finally {
        try {
          i && !i.done && (n = r.return) && n.call(r);
        } finally {
          if (s)
            throw s.error;
        }
      }
      return o;
    }
    function ye(t, e, n) {
      if (n || arguments.length === 2)
        for (var r = 0, i = e.length, o; r < i; r++)
          (o || !(r in e)) && (o || (o = Array.prototype.slice.call(e, 0, r)), o[r] = e[r]);
      return t.concat(o || Array.prototype.slice.call(e));
    }
    var Xi = {
      withStackTrace: !1
    }, pr = function(t, e, n) {
      n === void 0 && (n = Xi);
      var r = e.isOk() ? { type: "Ok", value: e.value } : { type: "Err", value: e.error }, i = n.withStackTrace ? new Error().stack : void 0;
      return {
        data: r,
        message: t,
        stack: i
      };
    }, ee = function() {
      function t(e) {
        this._promise = e;
      }
      return t.fromSafePromise = function(e) {
        var n = e.then(function(r) {
          return new pe(r);
        });
        return new t(n);
      }, t.fromPromise = function(e, n) {
        var r = e.then(function(i) {
          return new pe(i);
        }).catch(function(i) {
          return new he(n(i));
        });
        return new t(r);
      }, t.combine = function(e) {
        return Vi(e);
      }, t.combineWithAllErrors = function(e) {
        return Yi(e);
      }, t.prototype.map = function(e) {
        var n = this;
        return new t(this._promise.then(function(r) {
          return Tt(n, void 0, void 0, function() {
            var i;
            return Mt(this, function(o) {
              switch (o.label) {
                case 0:
                  return r.isErr() ? [2, new he(r.error)] : (i = pe.bind, [4, e(r.value)]);
                case 1:
                  return [2, new (i.apply(pe, [void 0, o.sent()]))()];
              }
            });
          });
        }));
      }, t.prototype.mapErr = function(e) {
        var n = this;
        return new t(this._promise.then(function(r) {
          return Tt(n, void 0, void 0, function() {
            var i;
            return Mt(this, function(o) {
              switch (o.label) {
                case 0:
                  return r.isOk() ? [2, new pe(r.value)] : (i = he.bind, [4, e(r.error)]);
                case 1:
                  return [2, new (i.apply(he, [void 0, o.sent()]))()];
              }
            });
          });
        }));
      }, t.prototype.andThen = function(e) {
        return new t(this._promise.then(function(n) {
          if (n.isErr())
            return new he(n.error);
          var r = e(n.value);
          return r instanceof t ? r._promise : r;
        }));
      }, t.prototype.orElse = function(e) {
        var n = this;
        return new t(this._promise.then(function(r) {
          return Tt(n, void 0, void 0, function() {
            return Mt(this, function(i) {
              return r.isErr() ? [2, e(r.error)] : [2, new pe(r.value)];
            });
          });
        }));
      }, t.prototype.match = function(e, n) {
        return this._promise.then(function(r) {
          return r.match(e, n);
        });
      }, t.prototype.unwrapOr = function(e) {
        return this._promise.then(function(n) {
          return n.unwrapOr(e);
        });
      }, t.prototype.then = function(e, n) {
        return this._promise.then(e, n);
      }, t;
    }(), dn = function(t) {
      return new ee(Promise.resolve(new he(t)));
    };
    var Ui = function(t) {
      return function(e) {
        return ye(ye([], ot(e), !1), [t], !1);
      };
    }, hr = function(t) {
      return t.reduce(function(e, n) {
        return e.isOk() ? n.isErr() ? Y(n.error) : e.map(Ui(n.value)) : e;
      }, V([]));
    }, Vi = function(t) {
      return ee.fromSafePromise(Promise.all(t)).andThen(hr);
    }, vr = function(t) {
      return t.reduce(function(e, n) {
        return n.isErr() ? e.isErr() ? Y(ye(ye([], ot(e.error), !1), [n.error], !1)) : Y([n.error]) : e.isErr() ? e : V(ye(ye([], ot(e.value), !1), [n.value], !1));
      }, V([]));
    }, Yi = function(t) {
      return ee.fromSafePromise(Promise.all(t)).andThen(vr);
    }, Dt;
    (function(t) {
      function e(i, o) {
        return function() {
          for (var s = [], a = 0; a < arguments.length; a++)
            s[a] = arguments[a];
          try {
            var c = i.apply(void 0, ye([], ot(s), !1));
            return V(c);
          } catch (u) {
            return Y(o ? o(u) : u);
          }
        };
      }
      t.fromThrowable = e;
      function n(i) {
        return hr(i);
      }
      t.combine = n;
      function r(i) {
        return vr(i);
      }
      t.combineWithAllErrors = r;
    })(Dt || (Dt = {}));
    var V = function(t) {
      return new pe(t);
    }, Y = function(t) {
      return new he(t);
    }, pe = function() {
      function t(e) {
        this.value = e;
      }
      return t.prototype.isOk = function() {
        return !0;
      }, t.prototype.isErr = function() {
        return !this.isOk();
      }, t.prototype.map = function(e) {
        return V(e(this.value));
      }, t.prototype.mapErr = function(e) {
        return V(this.value);
      }, t.prototype.andThen = function(e) {
        return e(this.value);
      }, t.prototype.orElse = function(e) {
        return V(this.value);
      }, t.prototype.asyncAndThen = function(e) {
        return e(this.value);
      }, t.prototype.asyncMap = function(e) {
        return ee.fromSafePromise(e(this.value));
      }, t.prototype.unwrapOr = function(e) {
        return this.value;
      }, t.prototype.match = function(e, n) {
        return e(this.value);
      }, t.prototype._unsafeUnwrap = function(e) {
        return this.value;
      }, t.prototype._unsafeUnwrapErr = function(e) {
        throw pr("Called `_unsafeUnwrapErr` on an Ok", this, e);
      }, t;
    }(), he = function() {
      function t(e) {
        this.error = e;
      }
      return t.prototype.isOk = function() {
        return !1;
      }, t.prototype.isErr = function() {
        return !this.isOk();
      }, t.prototype.map = function(e) {
        return Y(this.error);
      }, t.prototype.mapErr = function(e) {
        return Y(e(this.error));
      }, t.prototype.andThen = function(e) {
        return Y(this.error);
      }, t.prototype.orElse = function(e) {
        return e(this.error);
      }, t.prototype.asyncAndThen = function(e) {
        return dn(this.error);
      }, t.prototype.asyncMap = function(e) {
        return dn(this.error);
      }, t.prototype.unwrapOr = function(e) {
        return e;
      }, t.prototype.match = function(e, n) {
        return n(this.error);
      }, t.prototype._unsafeUnwrap = function(e) {
        throw pr("Called `_unsafeUnwrap` on an Err", this, e);
      }, t.prototype._unsafeUnwrapErr = function(e) {
        return this.error;
      }, t;
    }();
    Dt.fromThrowable;
    const yr = {
      extensionDetectionTime: 100,
      logLevel: "info"
    }, Hi = (t) => t, me = {
      rejectedByUser: "rejectedByUser",
      missingExtension: "missingExtension",
      canceledByUser: "canceledByUser",
      walletRequestValidation: "walletRequestValidation",
      walletResponseValidation: "walletResponseValidation",
      wrongNetwork: "wrongNetwork",
      failedToPrepareTransaction: "failedToPrepareTransaction",
      failedToCompileTransaction: "failedToCompileTransaction",
      failedToSignTransaction: "failedToSignTransaction",
      failedToSubmitTransaction: "failedToSubmitTransaction",
      failedToPollSubmittedTransaction: "failedToPollSubmittedTransaction",
      submittedTransactionWasDuplicate: "submittedTransactionWasDuplicate",
      submittedTransactionHasFailedTransactionStatus: "submittedTransactionHasFailedTransactionStatus",
      submittedTransactionHasRejectedTransactionStatus: "submittedTransactionHasRejectedTransactionStatus"
    }, Fi = (/* @__PURE__ */ new Map()).set(me.missingExtension, "extension could not be found").set(me.rejectedByUser, "user rejected request").set(me.canceledByUser, "user has canceled the request"), st = (t, e, n) => ({
      error: t,
      requestId: e,
      message: n || Fi.get(t) || ""
    }), qi = (t) => ee.fromPromise(Oi(t), Hi).andThen(
      (e) => e
    ), Qi = (t, e) => t.messageLifeCycleEventSubject.pipe(
      Ye((n) => n.requestId === e)
    ), Ji = (t) => (e) => (n) => {
      const r = new ne();
      e.requestControl && e.requestControl({
        cancelRequest: () => (J.debug(
          `\u{1F535}\u2B06\uFE0F\u274C wallet request canceled
${JSON.stringify(
        n,
        null,
        2
      )}`
        ), r.next())
      });
      const i = r.asObservable().pipe(
        Ve(
          () => Y(st(me.canceledByUser, n.requestId))
        )
      ), o = t.responseSubject.pipe(
        Ye((v) => v.requestId === n.requestId),
        Ve(
          (v) => "items" in v ? V(v) : Y(v)
        )
      ), s = xt(
        o,
        i
      ).pipe(ln()), a = Qi(t, n.requestId).pipe(
        Oe((v) => {
          e.eventCallback && e.eventCallback(v.eventType);
        }),
        Ei(o),
        dr()
      ), c = a.subscribe(), u = Ni(yr.extensionDetectionTime).pipe(
        Ve(
          () => Y(st(me.missingExtension, n.requestId))
        )
      ), l = xt(
        u,
        a
      ).pipe(
        ln(),
        Ye((v) => !("eventType" in v))
      ), m = Mi(!0).pipe(
        Oe(() => {
          t.outgoingMessageSubject.next(n);
        }),
        Ye(() => !1)
      ), f = xt(
        s,
        l,
        m
      ).pipe(
        Oe(() => {
          c.unsubscribe();
        })
      );
      return qi(f);
    };
    var O;
    (function(t) {
      t.assertEqual = (i) => i;
      function e(i) {
      }
      t.assertIs = e;
      function n(i) {
        throw new Error();
      }
      t.assertNever = n, t.arrayToEnum = (i) => {
        const o = {};
        for (const s of i)
          o[s] = s;
        return o;
      }, t.getValidEnumValues = (i) => {
        const o = t.objectKeys(i).filter((a) => typeof i[i[a]] != "number"), s = {};
        for (const a of o)
          s[a] = i[a];
        return t.objectValues(s);
      }, t.objectValues = (i) => t.objectKeys(i).map(function(o) {
        return i[o];
      }), t.objectKeys = typeof Object.keys == "function" ? (i) => Object.keys(i) : (i) => {
        const o = [];
        for (const s in i)
          Object.prototype.hasOwnProperty.call(i, s) && o.push(s);
        return o;
      }, t.find = (i, o) => {
        for (const s of i)
          if (o(s))
            return s;
      }, t.isInteger = typeof Number.isInteger == "function" ? (i) => Number.isInteger(i) : (i) => typeof i == "number" && isFinite(i) && Math.floor(i) === i;
      function r(i, o = " | ") {
        return i.map((s) => typeof s == "string" ? `'${s}'` : s).join(o);
      }
      t.joinValues = r, t.jsonStringifyReplacer = (i, o) => typeof o == "bigint" ? o.toString() : o;
    })(O || (O = {}));
    const h = O.arrayToEnum([
      "string",
      "nan",
      "number",
      "integer",
      "float",
      "boolean",
      "date",
      "bigint",
      "symbol",
      "function",
      "undefined",
      "null",
      "array",
      "object",
      "unknown",
      "promise",
      "void",
      "never",
      "map",
      "set"
    ]), ve = (t) => {
      switch (typeof t) {
        case "undefined":
          return h.undefined;
        case "string":
          return h.string;
        case "number":
          return isNaN(t) ? h.nan : h.number;
        case "boolean":
          return h.boolean;
        case "function":
          return h.function;
        case "bigint":
          return h.bigint;
        case "object":
          return Array.isArray(t) ? h.array : t === null ? h.null : t.then && typeof t.then == "function" && t.catch && typeof t.catch == "function" ? h.promise : typeof Map < "u" && t instanceof Map ? h.map : typeof Set < "u" && t instanceof Set ? h.set : typeof Date < "u" && t instanceof Date ? h.date : h.object;
        default:
          return h.unknown;
      }
    }, p = O.arrayToEnum([
      "invalid_type",
      "invalid_literal",
      "custom",
      "invalid_union",
      "invalid_union_discriminator",
      "invalid_enum_value",
      "unrecognized_keys",
      "invalid_arguments",
      "invalid_return_type",
      "invalid_date",
      "invalid_string",
      "too_small",
      "too_big",
      "invalid_intersection_types",
      "not_multiple_of"
    ]);
    class He extends Error {
      constructor(e) {
        super(), this.issues = [], this.addIssue = (r) => {
          this.issues = [...this.issues, r];
        }, this.addIssues = (r = []) => {
          this.issues = [...this.issues, ...r];
        };
        const n = new.target.prototype;
        Object.setPrototypeOf ? Object.setPrototypeOf(this, n) : this.__proto__ = n, this.name = "ZodError", this.issues = e;
      }
      get errors() {
        return this.issues;
      }
      format(e) {
        const n = e || function(o) {
          return o.message;
        }, r = { _errors: [] }, i = (o) => {
          for (const s of o.issues)
            if (s.code === "invalid_union")
              s.unionErrors.map(i);
            else if (s.code === "invalid_return_type")
              i(s.returnTypeError);
            else if (s.code === "invalid_arguments")
              i(s.argumentsError);
            else if (s.path.length === 0)
              r._errors.push(n(s));
            else {
              let a = r, c = 0;
              for (; c < s.path.length; ) {
                const u = s.path[c];
                c === s.path.length - 1 ? (a[u] = a[u] || { _errors: [] }, a[u]._errors.push(n(s))) : a[u] = a[u] || { _errors: [] }, a = a[u], c++;
              }
            }
        };
        return i(this), r;
      }
      toString() {
        return this.message;
      }
      get message() {
        return JSON.stringify(this.issues, O.jsonStringifyReplacer, 2);
      }
      get isEmpty() {
        return this.issues.length === 0;
      }
      flatten(e = (n) => n.message) {
        const n = {}, r = [];
        for (const i of this.issues)
          i.path.length > 0 ? (n[i.path[0]] = n[i.path[0]] || [], n[i.path[0]].push(e(i))) : r.push(e(i));
        return { formErrors: r, fieldErrors: n };
      }
      get formErrors() {
        return this.flatten();
      }
    }
    He.create = (t) => new He(t);
    const mr = (t, e) => {
      let n;
      switch (t.code) {
        case p.invalid_type:
          t.received === h.undefined ? n = "Required" : n = `Expected ${t.expected}, received ${t.received}`;
          break;
        case p.invalid_literal:
          n = `Invalid literal value, expected ${JSON.stringify(t.expected, O.jsonStringifyReplacer)}`;
          break;
        case p.unrecognized_keys:
          n = `Unrecognized key(s) in object: ${O.joinValues(t.keys, ", ")}`;
          break;
        case p.invalid_union:
          n = "Invalid input";
          break;
        case p.invalid_union_discriminator:
          n = `Invalid discriminator value. Expected ${O.joinValues(t.options)}`;
          break;
        case p.invalid_enum_value:
          n = `Invalid enum value. Expected ${O.joinValues(t.options)}, received '${t.received}'`;
          break;
        case p.invalid_arguments:
          n = "Invalid function arguments";
          break;
        case p.invalid_return_type:
          n = "Invalid function return type";
          break;
        case p.invalid_date:
          n = "Invalid date";
          break;
        case p.invalid_string:
          typeof t.validation == "object" ? "startsWith" in t.validation ? n = `Invalid input: must start with "${t.validation.startsWith}"` : "endsWith" in t.validation ? n = `Invalid input: must end with "${t.validation.endsWith}"` : O.assertNever(t.validation) : t.validation !== "regex" ? n = `Invalid ${t.validation}` : n = "Invalid";
          break;
        case p.too_small:
          t.type === "array" ? n = `Array must contain ${t.inclusive ? "at least" : "more than"} ${t.minimum} element(s)` : t.type === "string" ? n = `String must contain ${t.inclusive ? "at least" : "over"} ${t.minimum} character(s)` : t.type === "number" ? n = `Number must be greater than ${t.inclusive ? "or equal to " : ""}${t.minimum}` : t.type === "date" ? n = `Date must be greater than ${t.inclusive ? "or equal to " : ""}${new Date(t.minimum)}` : n = "Invalid input";
          break;
        case p.too_big:
          t.type === "array" ? n = `Array must contain ${t.inclusive ? "at most" : "less than"} ${t.maximum} element(s)` : t.type === "string" ? n = `String must contain ${t.inclusive ? "at most" : "under"} ${t.maximum} character(s)` : t.type === "number" ? n = `Number must be less than ${t.inclusive ? "or equal to " : ""}${t.maximum}` : t.type === "date" ? n = `Date must be smaller than ${t.inclusive ? "or equal to " : ""}${new Date(t.maximum)}` : n = "Invalid input";
          break;
        case p.custom:
          n = "Invalid input";
          break;
        case p.invalid_intersection_types:
          n = "Intersection results could not be merged";
          break;
        case p.not_multiple_of:
          n = `Number must be a multiple of ${t.multipleOf}`;
          break;
        default:
          n = e.defaultError, O.assertNever(t);
      }
      return { message: n };
    };
    let Ki = mr;
    function _i() {
      return Ki;
    }
    const $i = (t) => {
      const { data: e, path: n, errorMaps: r, issueData: i } = t, o = [...n, ...i.path || []], s = {
        ...i,
        path: o
      };
      let a = "";
      const c = r.filter((u) => !!u).slice().reverse();
      for (const u of c)
        a = u(s, { data: e, defaultError: a }).message;
      return {
        ...i,
        path: o,
        message: i.message || a
      };
    };
    function y(t, e) {
      const n = $i({
        issueData: e,
        data: t.data,
        path: t.path,
        errorMaps: [
          t.common.contextualErrorMap,
          t.schemaErrorMap,
          _i(),
          mr
        ].filter((r) => !!r)
      });
      t.common.issues.push(n);
    }
    class R {
      constructor() {
        this.value = "valid";
      }
      dirty() {
        this.value === "valid" && (this.value = "dirty");
      }
      abort() {
        this.value !== "aborted" && (this.value = "aborted");
      }
      static mergeArray(e, n) {
        const r = [];
        for (const i of n) {
          if (i.status === "aborted")
            return x;
          i.status === "dirty" && e.dirty(), r.push(i.value);
        }
        return { status: e.value, value: r };
      }
      static async mergeObjectAsync(e, n) {
        const r = [];
        for (const i of n)
          r.push({
            key: await i.key,
            value: await i.value
          });
        return R.mergeObjectSync(e, r);
      }
      static mergeObjectSync(e, n) {
        const r = {};
        for (const i of n) {
          const { key: o, value: s } = i;
          if (o.status === "aborted" || s.status === "aborted")
            return x;
          o.status === "dirty" && e.dirty(), s.status === "dirty" && e.dirty(), (typeof s.value < "u" || i.alwaysSet) && (r[o.value] = s.value);
        }
        return { status: e.value, value: r };
      }
    }
    const x = Object.freeze({
      status: "aborted"
    }), X = (t) => ({ status: "valid", value: t }), fn = (t) => t.status === "aborted", pn = (t) => t.status === "dirty", Et = (t) => t.status === "valid", hn = (t) => typeof Promise !== void 0 && t instanceof Promise;
    var A;
    (function(t) {
      t.errToObj = (e) => typeof e == "string" ? { message: e } : e || {}, t.toString = (e) => typeof e == "string" ? e : e == null ? void 0 : e.message;
    })(A || (A = {}));
    class oe {
      constructor(e, n, r, i) {
        this.parent = e, this.data = n, this._path = r, this._key = i;
      }
      get path() {
        return this._path.concat(this._key);
      }
    }
    const vn = (t, e) => {
      if (Et(e))
        return { success: !0, data: e.value };
      if (!t.common.issues.length)
        throw new Error("Validation failed but no issues detected.");
      return { success: !1, error: new He(t.common.issues) };
    };
    function T(t) {
      if (!t)
        return {};
      const { errorMap: e, invalid_type_error: n, required_error: r, description: i } = t;
      if (e && (n || r))
        throw new Error(`Can't use "invalid_type_error" or "required_error" in conjunction with custom error map.`);
      return e ? { errorMap: e, description: i } : { errorMap: (o, s) => o.code !== "invalid_type" ? { message: s.defaultError } : typeof s.data > "u" ? { message: r != null ? r : s.defaultError } : { message: n != null ? n : s.defaultError }, description: i };
    }
    class S {
      constructor(e) {
        this.spa = this.safeParseAsync, this.superRefine = this._refinement, this._def = e, this.parse = this.parse.bind(this), this.safeParse = this.safeParse.bind(this), this.parseAsync = this.parseAsync.bind(this), this.safeParseAsync = this.safeParseAsync.bind(this), this.spa = this.spa.bind(this), this.refine = this.refine.bind(this), this.refinement = this.refinement.bind(this), this.superRefine = this.superRefine.bind(this), this.optional = this.optional.bind(this), this.nullable = this.nullable.bind(this), this.nullish = this.nullish.bind(this), this.array = this.array.bind(this), this.promise = this.promise.bind(this), this.or = this.or.bind(this), this.and = this.and.bind(this), this.transform = this.transform.bind(this), this.default = this.default.bind(this), this.describe = this.describe.bind(this), this.isNullable = this.isNullable.bind(this), this.isOptional = this.isOptional.bind(this);
      }
      get description() {
        return this._def.description;
      }
      _getType(e) {
        return ve(e.data);
      }
      _getOrReturnCtx(e, n) {
        return n || {
          common: e.parent.common,
          data: e.data,
          parsedType: ve(e.data),
          schemaErrorMap: this._def.errorMap,
          path: e.path,
          parent: e.parent
        };
      }
      _processInputParams(e) {
        return {
          status: new R(),
          ctx: {
            common: e.parent.common,
            data: e.data,
            parsedType: ve(e.data),
            schemaErrorMap: this._def.errorMap,
            path: e.path,
            parent: e.parent
          }
        };
      }
      _parseSync(e) {
        const n = this._parse(e);
        if (hn(n))
          throw new Error("Synchronous parse encountered promise.");
        return n;
      }
      _parseAsync(e) {
        const n = this._parse(e);
        return Promise.resolve(n);
      }
      parse(e, n) {
        const r = this.safeParse(e, n);
        if (r.success)
          return r.data;
        throw r.error;
      }
      safeParse(e, n) {
        var r;
        const i = {
          common: {
            issues: [],
            async: (r = n == null ? void 0 : n.async) !== null && r !== void 0 ? r : !1,
            contextualErrorMap: n == null ? void 0 : n.errorMap
          },
          path: (n == null ? void 0 : n.path) || [],
          schemaErrorMap: this._def.errorMap,
          parent: null,
          data: e,
          parsedType: ve(e)
        }, o = this._parseSync({ data: e, path: i.path, parent: i });
        return vn(i, o);
      }
      async parseAsync(e, n) {
        const r = await this.safeParseAsync(e, n);
        if (r.success)
          return r.data;
        throw r.error;
      }
      async safeParseAsync(e, n) {
        const r = {
          common: {
            issues: [],
            contextualErrorMap: n == null ? void 0 : n.errorMap,
            async: !0
          },
          path: (n == null ? void 0 : n.path) || [],
          schemaErrorMap: this._def.errorMap,
          parent: null,
          data: e,
          parsedType: ve(e)
        }, i = this._parse({ data: e, path: [], parent: r }), o = await (hn(i) ? i : Promise.resolve(i));
        return vn(r, o);
      }
      refine(e, n) {
        const r = (i) => typeof n == "string" || typeof n > "u" ? { message: n } : typeof n == "function" ? n(i) : n;
        return this._refinement((i, o) => {
          const s = e(i), a = () => o.addIssue({
            code: p.custom,
            ...r(i)
          });
          return typeof Promise < "u" && s instanceof Promise ? s.then((c) => c ? !0 : (a(), !1)) : s ? !0 : (a(), !1);
        });
      }
      refinement(e, n) {
        return this._refinement((r, i) => e(r) ? !0 : (i.addIssue(typeof n == "function" ? n(r, i) : n), !1));
      }
      _refinement(e) {
        return new De({
          schema: this,
          typeName: b.ZodEffects,
          effect: { type: "refinement", refinement: e }
        });
      }
      optional() {
        return K.create(this);
      }
      nullable() {
        return Ee.create(this);
      }
      nullish() {
        return this.optional().nullable();
      }
      array() {
        return _.create(this);
      }
      promise() {
        return lt.create(this);
      }
      or(e) {
        return ut.create([this, e]);
      }
      and(e) {
        return ct.create(this, e);
      }
      transform(e) {
        return new De({
          schema: this,
          typeName: b.ZodEffects,
          effect: { type: "transform", transform: e }
        });
      }
      default(e) {
        const n = typeof e == "function" ? e : () => e;
        return new wr({
          innerType: this,
          defaultValue: n,
          typeName: b.ZodDefault
        });
      }
      brand() {
        return new io({
          typeName: b.ZodBranded,
          type: this,
          ...T(void 0)
        });
      }
      describe(e) {
        const n = this.constructor;
        return new n({
          ...this._def,
          description: e
        });
      }
      isOptional() {
        return this.safeParse(void 0).success;
      }
      isNullable() {
        return this.safeParse(null).success;
      }
    }
    const eo = /^c[^\s-]{8,}$/i, to = /^([a-f0-9]{8}-[a-f0-9]{4}-[1-5][a-f0-9]{3}-[a-f0-9]{4}-[a-f0-9]{12}|00000000-0000-0000-0000-000000000000)$/i, no = /^(([^<>()[\]\.,;:\s@\"]+(\.[^<>()[\]\.,;:\s@\"]+)*)|(\".+\"))@(([^<>()[\]\.,;:\s@\"]+\.)+[^<>()[\]\.,;:\s@\"]{2,})$/i;
    class Ze extends S {
      constructor() {
        super(...arguments), this._regex = (e, n, r) => this.refinement((i) => e.test(i), {
          validation: n,
          code: p.invalid_string,
          ...A.errToObj(r)
        }), this.nonempty = (e) => this.min(1, A.errToObj(e)), this.trim = () => new Ze({
          ...this._def,
          checks: [...this._def.checks, { kind: "trim" }]
        });
      }
      _parse(e) {
        if (this._getType(e) !== h.string) {
          const i = this._getOrReturnCtx(e);
          return y(
            i,
            {
              code: p.invalid_type,
              expected: h.string,
              received: i.parsedType
            }
          ), x;
        }
        const n = new R();
        let r;
        for (const i of this._def.checks)
          if (i.kind === "min")
            e.data.length < i.value && (r = this._getOrReturnCtx(e, r), y(r, {
              code: p.too_small,
              minimum: i.value,
              type: "string",
              inclusive: !0,
              message: i.message
            }), n.dirty());
          else if (i.kind === "max")
            e.data.length > i.value && (r = this._getOrReturnCtx(e, r), y(r, {
              code: p.too_big,
              maximum: i.value,
              type: "string",
              inclusive: !0,
              message: i.message
            }), n.dirty());
          else if (i.kind === "email")
            no.test(e.data) || (r = this._getOrReturnCtx(e, r), y(r, {
              validation: "email",
              code: p.invalid_string,
              message: i.message
            }), n.dirty());
          else if (i.kind === "uuid")
            to.test(e.data) || (r = this._getOrReturnCtx(e, r), y(r, {
              validation: "uuid",
              code: p.invalid_string,
              message: i.message
            }), n.dirty());
          else if (i.kind === "cuid")
            eo.test(e.data) || (r = this._getOrReturnCtx(e, r), y(r, {
              validation: "cuid",
              code: p.invalid_string,
              message: i.message
            }), n.dirty());
          else if (i.kind === "url")
            try {
              new URL(e.data);
            } catch {
              r = this._getOrReturnCtx(e, r), y(r, {
                validation: "url",
                code: p.invalid_string,
                message: i.message
              }), n.dirty();
            }
          else
            i.kind === "regex" ? (i.regex.lastIndex = 0, i.regex.test(e.data) || (r = this._getOrReturnCtx(e, r), y(r, {
              validation: "regex",
              code: p.invalid_string,
              message: i.message
            }), n.dirty())) : i.kind === "trim" ? e.data = e.data.trim() : i.kind === "startsWith" ? e.data.startsWith(i.value) || (r = this._getOrReturnCtx(e, r), y(r, {
              code: p.invalid_string,
              validation: { startsWith: i.value },
              message: i.message
            }), n.dirty()) : i.kind === "endsWith" ? e.data.endsWith(i.value) || (r = this._getOrReturnCtx(e, r), y(r, {
              code: p.invalid_string,
              validation: { endsWith: i.value },
              message: i.message
            }), n.dirty()) : O.assertNever(i);
        return { status: n.value, value: e.data };
      }
      _addCheck(e) {
        return new Ze({
          ...this._def,
          checks: [...this._def.checks, e]
        });
      }
      email(e) {
        return this._addCheck({ kind: "email", ...A.errToObj(e) });
      }
      url(e) {
        return this._addCheck({ kind: "url", ...A.errToObj(e) });
      }
      uuid(e) {
        return this._addCheck({ kind: "uuid", ...A.errToObj(e) });
      }
      cuid(e) {
        return this._addCheck({ kind: "cuid", ...A.errToObj(e) });
      }
      regex(e, n) {
        return this._addCheck({
          kind: "regex",
          regex: e,
          ...A.errToObj(n)
        });
      }
      startsWith(e, n) {
        return this._addCheck({
          kind: "startsWith",
          value: e,
          ...A.errToObj(n)
        });
      }
      endsWith(e, n) {
        return this._addCheck({
          kind: "endsWith",
          value: e,
          ...A.errToObj(n)
        });
      }
      min(e, n) {
        return this._addCheck({
          kind: "min",
          value: e,
          ...A.errToObj(n)
        });
      }
      max(e, n) {
        return this._addCheck({
          kind: "max",
          value: e,
          ...A.errToObj(n)
        });
      }
      length(e, n) {
        return this.min(e, n).max(e, n);
      }
      get isEmail() {
        return !!this._def.checks.find((e) => e.kind === "email");
      }
      get isURL() {
        return !!this._def.checks.find((e) => e.kind === "url");
      }
      get isUUID() {
        return !!this._def.checks.find((e) => e.kind === "uuid");
      }
      get isCUID() {
        return !!this._def.checks.find((e) => e.kind === "cuid");
      }
      get minLength() {
        let e = null;
        for (const n of this._def.checks)
          n.kind === "min" && (e === null || n.value > e) && (e = n.value);
        return e;
      }
      get maxLength() {
        let e = null;
        for (const n of this._def.checks)
          n.kind === "max" && (e === null || n.value < e) && (e = n.value);
        return e;
      }
    }
    Ze.create = (t) => new Ze({
      checks: [],
      typeName: b.ZodString,
      ...T(t)
    });
    function ro(t, e) {
      const n = (t.toString().split(".")[1] || "").length, r = (e.toString().split(".")[1] || "").length, i = n > r ? n : r, o = parseInt(t.toFixed(i).replace(".", "")), s = parseInt(e.toFixed(i).replace(".", ""));
      return o % s / Math.pow(10, i);
    }
    class ze extends S {
      constructor() {
        super(...arguments), this.min = this.gte, this.max = this.lte, this.step = this.multipleOf;
      }
      _parse(e) {
        if (this._getType(e) !== h.number) {
          const i = this._getOrReturnCtx(e);
          return y(i, {
            code: p.invalid_type,
            expected: h.number,
            received: i.parsedType
          }), x;
        }
        let n;
        const r = new R();
        for (const i of this._def.checks)
          i.kind === "int" ? O.isInteger(e.data) || (n = this._getOrReturnCtx(e, n), y(n, {
            code: p.invalid_type,
            expected: "integer",
            received: "float",
            message: i.message
          }), r.dirty()) : i.kind === "min" ? (i.inclusive ? e.data < i.value : e.data <= i.value) && (n = this._getOrReturnCtx(e, n), y(n, {
            code: p.too_small,
            minimum: i.value,
            type: "number",
            inclusive: i.inclusive,
            message: i.message
          }), r.dirty()) : i.kind === "max" ? (i.inclusive ? e.data > i.value : e.data >= i.value) && (n = this._getOrReturnCtx(e, n), y(n, {
            code: p.too_big,
            maximum: i.value,
            type: "number",
            inclusive: i.inclusive,
            message: i.message
          }), r.dirty()) : i.kind === "multipleOf" ? ro(e.data, i.value) !== 0 && (n = this._getOrReturnCtx(e, n), y(n, {
            code: p.not_multiple_of,
            multipleOf: i.value,
            message: i.message
          }), r.dirty()) : O.assertNever(i);
        return { status: r.value, value: e.data };
      }
      gte(e, n) {
        return this.setLimit("min", e, !0, A.toString(n));
      }
      gt(e, n) {
        return this.setLimit("min", e, !1, A.toString(n));
      }
      lte(e, n) {
        return this.setLimit("max", e, !0, A.toString(n));
      }
      lt(e, n) {
        return this.setLimit("max", e, !1, A.toString(n));
      }
      setLimit(e, n, r, i) {
        return new ze({
          ...this._def,
          checks: [
            ...this._def.checks,
            {
              kind: e,
              value: n,
              inclusive: r,
              message: A.toString(i)
            }
          ]
        });
      }
      _addCheck(e) {
        return new ze({
          ...this._def,
          checks: [...this._def.checks, e]
        });
      }
      int(e) {
        return this._addCheck({
          kind: "int",
          message: A.toString(e)
        });
      }
      positive(e) {
        return this._addCheck({
          kind: "min",
          value: 0,
          inclusive: !1,
          message: A.toString(e)
        });
      }
      negative(e) {
        return this._addCheck({
          kind: "max",
          value: 0,
          inclusive: !1,
          message: A.toString(e)
        });
      }
      nonpositive(e) {
        return this._addCheck({
          kind: "max",
          value: 0,
          inclusive: !0,
          message: A.toString(e)
        });
      }
      nonnegative(e) {
        return this._addCheck({
          kind: "min",
          value: 0,
          inclusive: !0,
          message: A.toString(e)
        });
      }
      multipleOf(e, n) {
        return this._addCheck({
          kind: "multipleOf",
          value: e,
          message: A.toString(n)
        });
      }
      get minValue() {
        let e = null;
        for (const n of this._def.checks)
          n.kind === "min" && (e === null || n.value > e) && (e = n.value);
        return e;
      }
      get maxValue() {
        let e = null;
        for (const n of this._def.checks)
          n.kind === "max" && (e === null || n.value < e) && (e = n.value);
        return e;
      }
      get isInt() {
        return !!this._def.checks.find((e) => e.kind === "int");
      }
    }
    ze.create = (t) => new ze({
      checks: [],
      typeName: b.ZodNumber,
      ...T(t)
    });
    class yn extends S {
      _parse(e) {
        if (this._getType(e) !== h.bigint) {
          const n = this._getOrReturnCtx(e);
          return y(n, {
            code: p.invalid_type,
            expected: h.bigint,
            received: n.parsedType
          }), x;
        }
        return X(e.data);
      }
    }
    yn.create = (t) => new yn({
      typeName: b.ZodBigInt,
      ...T(t)
    });
    class kt extends S {
      _parse(e) {
        if (this._getType(e) !== h.boolean) {
          const n = this._getOrReturnCtx(e);
          return y(n, {
            code: p.invalid_type,
            expected: h.boolean,
            received: n.parsedType
          }), x;
        }
        return X(e.data);
      }
    }
    kt.create = (t) => new kt({
      typeName: b.ZodBoolean,
      ...T(t)
    });
    class at extends S {
      _parse(e) {
        if (this._getType(e) !== h.date) {
          const i = this._getOrReturnCtx(e);
          return y(i, {
            code: p.invalid_type,
            expected: h.date,
            received: i.parsedType
          }), x;
        }
        if (isNaN(e.data.getTime())) {
          const i = this._getOrReturnCtx(e);
          return y(i, {
            code: p.invalid_date
          }), x;
        }
        const n = new R();
        let r;
        for (const i of this._def.checks)
          i.kind === "min" ? e.data.getTime() < i.value && (r = this._getOrReturnCtx(e, r), y(r, {
            code: p.too_small,
            message: i.message,
            inclusive: !0,
            minimum: i.value,
            type: "date"
          }), n.dirty()) : i.kind === "max" ? e.data.getTime() > i.value && (r = this._getOrReturnCtx(e, r), y(r, {
            code: p.too_big,
            message: i.message,
            inclusive: !0,
            maximum: i.value,
            type: "date"
          }), n.dirty()) : O.assertNever(i);
        return {
          status: n.value,
          value: new Date(e.data.getTime())
        };
      }
      _addCheck(e) {
        return new at({
          ...this._def,
          checks: [...this._def.checks, e]
        });
      }
      min(e, n) {
        return this._addCheck({
          kind: "min",
          value: e.getTime(),
          message: A.toString(n)
        });
      }
      max(e, n) {
        return this._addCheck({
          kind: "max",
          value: e.getTime(),
          message: A.toString(n)
        });
      }
      get minDate() {
        let e = null;
        for (const n of this._def.checks)
          n.kind === "min" && (e === null || n.value > e) && (e = n.value);
        return e != null ? new Date(e) : null;
      }
      get maxDate() {
        let e = null;
        for (const n of this._def.checks)
          n.kind === "max" && (e === null || n.value < e) && (e = n.value);
        return e != null ? new Date(e) : null;
      }
    }
    at.create = (t) => new at({
      checks: [],
      typeName: b.ZodDate,
      ...T(t)
    });
    class mn extends S {
      _parse(e) {
        if (this._getType(e) !== h.undefined) {
          const n = this._getOrReturnCtx(e);
          return y(n, {
            code: p.invalid_type,
            expected: h.undefined,
            received: n.parsedType
          }), x;
        }
        return X(e.data);
      }
    }
    mn.create = (t) => new mn({
      typeName: b.ZodUndefined,
      ...T(t)
    });
    class gn extends S {
      _parse(e) {
        if (this._getType(e) !== h.null) {
          const n = this._getOrReturnCtx(e);
          return y(n, {
            code: p.invalid_type,
            expected: h.null,
            received: n.parsedType
          }), x;
        }
        return X(e.data);
      }
    }
    gn.create = (t) => new gn({
      typeName: b.ZodNull,
      ...T(t)
    });
    class bn extends S {
      constructor() {
        super(...arguments), this._any = !0;
      }
      _parse(e) {
        return X(e.data);
      }
    }
    bn.create = (t) => new bn({
      typeName: b.ZodAny,
      ...T(t)
    });
    class wn extends S {
      constructor() {
        super(...arguments), this._unknown = !0;
      }
      _parse(e) {
        return X(e.data);
      }
    }
    wn.create = (t) => new wn({
      typeName: b.ZodUnknown,
      ...T(t)
    });
    class se extends S {
      _parse(e) {
        const n = this._getOrReturnCtx(e);
        return y(n, {
          code: p.invalid_type,
          expected: h.never,
          received: n.parsedType
        }), x;
      }
    }
    se.create = (t) => new se({
      typeName: b.ZodNever,
      ...T(t)
    });
    class xn extends S {
      _parse(e) {
        if (this._getType(e) !== h.undefined) {
          const n = this._getOrReturnCtx(e);
          return y(n, {
            code: p.invalid_type,
            expected: h.void,
            received: n.parsedType
          }), x;
        }
        return X(e.data);
      }
    }
    xn.create = (t) => new xn({
      typeName: b.ZodVoid,
      ...T(t)
    });
    class _ extends S {
      _parse(e) {
        const { ctx: n, status: r } = this._processInputParams(e), i = this._def;
        if (n.parsedType !== h.array)
          return y(n, {
            code: p.invalid_type,
            expected: h.array,
            received: n.parsedType
          }), x;
        if (i.minLength !== null && n.data.length < i.minLength.value && (y(n, {
          code: p.too_small,
          minimum: i.minLength.value,
          type: "array",
          inclusive: !0,
          message: i.minLength.message
        }), r.dirty()), i.maxLength !== null && n.data.length > i.maxLength.value && (y(n, {
          code: p.too_big,
          maximum: i.maxLength.value,
          type: "array",
          inclusive: !0,
          message: i.maxLength.message
        }), r.dirty()), n.common.async)
          return Promise.all(n.data.map((s, a) => i.type._parseAsync(new oe(n, s, n.path, a)))).then((s) => R.mergeArray(r, s));
        const o = n.data.map((s, a) => i.type._parseSync(new oe(n, s, n.path, a)));
        return R.mergeArray(r, o);
      }
      get element() {
        return this._def.type;
      }
      min(e, n) {
        return new _({
          ...this._def,
          minLength: { value: e, message: A.toString(n) }
        });
      }
      max(e, n) {
        return new _({
          ...this._def,
          maxLength: { value: e, message: A.toString(n) }
        });
      }
      length(e, n) {
        return this.min(e, n).max(e, n);
      }
      nonempty(e) {
        return this.min(1, e);
      }
    }
    _.create = (t, e) => new _({
      type: t,
      minLength: null,
      maxLength: null,
      typeName: b.ZodArray,
      ...T(e)
    });
    var Lt;
    (function(t) {
      t.mergeShapes = (e, n) => ({
        ...e,
        ...n
      });
    })(Lt || (Lt = {}));
    const An = (t) => (e) => new D({
      ...t,
      shape: () => ({
        ...t.shape(),
        ...e
      })
    });
    function Ae(t) {
      if (t instanceof D) {
        const e = {};
        for (const n in t.shape) {
          const r = t.shape[n];
          e[n] = K.create(Ae(r));
        }
        return new D({
          ...t._def,
          shape: () => e
        });
      } else
        return t instanceof _ ? _.create(Ae(t.element)) : t instanceof K ? K.create(Ae(t.unwrap())) : t instanceof Ee ? Ee.create(Ae(t.unwrap())) : t instanceof ge ? ge.create(t.items.map((e) => Ae(e))) : t;
    }
    class D extends S {
      constructor() {
        super(...arguments), this._cached = null, this.nonstrict = this.passthrough, this.augment = An(this._def), this.extend = An(this._def);
      }
      _getCached() {
        if (this._cached !== null)
          return this._cached;
        const e = this._def.shape(), n = O.objectKeys(e);
        return this._cached = { shape: e, keys: n };
      }
      _parse(e) {
        if (this._getType(e) !== h.object) {
          const c = this._getOrReturnCtx(e);
          return y(c, {
            code: p.invalid_type,
            expected: h.object,
            received: c.parsedType
          }), x;
        }
        const { status: n, ctx: r } = this._processInputParams(e), { shape: i, keys: o } = this._getCached(), s = [];
        if (!(this._def.catchall instanceof se && this._def.unknownKeys === "strip"))
          for (const c in r.data)
            o.includes(c) || s.push(c);
        const a = [];
        for (const c of o) {
          const u = i[c], l = r.data[c];
          a.push({
            key: { status: "valid", value: c },
            value: u._parse(new oe(r, l, r.path, c)),
            alwaysSet: c in r.data
          });
        }
        if (this._def.catchall instanceof se) {
          const c = this._def.unknownKeys;
          if (c === "passthrough")
            for (const u of s)
              a.push({
                key: { status: "valid", value: u },
                value: { status: "valid", value: r.data[u] }
              });
          else if (c === "strict")
            s.length > 0 && (y(r, {
              code: p.unrecognized_keys,
              keys: s
            }), n.dirty());
          else if (c !== "strip")
            throw new Error("Internal ZodObject error: invalid unknownKeys value.");
        } else {
          const c = this._def.catchall;
          for (const u of s) {
            const l = r.data[u];
            a.push({
              key: { status: "valid", value: u },
              value: c._parse(
                new oe(r, l, r.path, u)
              ),
              alwaysSet: u in r.data
            });
          }
        }
        return r.common.async ? Promise.resolve().then(async () => {
          const c = [];
          for (const u of a) {
            const l = await u.key;
            c.push({
              key: l,
              value: await u.value,
              alwaysSet: u.alwaysSet
            });
          }
          return c;
        }).then((c) => R.mergeObjectSync(n, c)) : R.mergeObjectSync(n, a);
      }
      get shape() {
        return this._def.shape();
      }
      strict(e) {
        return A.errToObj, new D({
          ...this._def,
          unknownKeys: "strict",
          ...e !== void 0 ? {
            errorMap: (n, r) => {
              var i, o, s, a;
              const c = (s = (o = (i = this._def).errorMap) === null || o === void 0 ? void 0 : o.call(i, n, r).message) !== null && s !== void 0 ? s : r.defaultError;
              return n.code === "unrecognized_keys" ? {
                message: (a = A.errToObj(e).message) !== null && a !== void 0 ? a : c
              } : {
                message: c
              };
            }
          } : {}
        });
      }
      strip() {
        return new D({
          ...this._def,
          unknownKeys: "strip"
        });
      }
      passthrough() {
        return new D({
          ...this._def,
          unknownKeys: "passthrough"
        });
      }
      setKey(e, n) {
        return this.augment({ [e]: n });
      }
      merge(e) {
        return new D({
          unknownKeys: e._def.unknownKeys,
          catchall: e._def.catchall,
          shape: () => Lt.mergeShapes(this._def.shape(), e._def.shape()),
          typeName: b.ZodObject
        });
      }
      catchall(e) {
        return new D({
          ...this._def,
          catchall: e
        });
      }
      pick(e) {
        const n = {};
        return O.objectKeys(e).map((r) => {
          this.shape[r] && (n[r] = this.shape[r]);
        }), new D({
          ...this._def,
          shape: () => n
        });
      }
      omit(e) {
        const n = {};
        return O.objectKeys(this.shape).map((r) => {
          O.objectKeys(e).indexOf(r) === -1 && (n[r] = this.shape[r]);
        }), new D({
          ...this._def,
          shape: () => n
        });
      }
      deepPartial() {
        return Ae(this);
      }
      partial(e) {
        const n = {};
        if (e)
          return O.objectKeys(this.shape).map((r) => {
            O.objectKeys(e).indexOf(r) === -1 ? n[r] = this.shape[r] : n[r] = this.shape[r].optional();
          }), new D({
            ...this._def,
            shape: () => n
          });
        for (const r in this.shape) {
          const i = this.shape[r];
          n[r] = i.optional();
        }
        return new D({
          ...this._def,
          shape: () => n
        });
      }
      required() {
        const e = {};
        for (const n in this.shape) {
          let r = this.shape[n];
          for (; r instanceof K; )
            r = r._def.innerType;
          e[n] = r;
        }
        return new D({
          ...this._def,
          shape: () => e
        });
      }
      keyof() {
        return gr(O.objectKeys(this.shape));
      }
    }
    D.create = (t, e) => new D({
      shape: () => t,
      unknownKeys: "strip",
      catchall: se.create(),
      typeName: b.ZodObject,
      ...T(e)
    });
    D.strictCreate = (t, e) => new D({
      shape: () => t,
      unknownKeys: "strict",
      catchall: se.create(),
      typeName: b.ZodObject,
      ...T(e)
    });
    D.lazycreate = (t, e) => new D({
      shape: t,
      unknownKeys: "strip",
      catchall: se.create(),
      typeName: b.ZodObject,
      ...T(e)
    });
    class ut extends S {
      _parse(e) {
        const { ctx: n } = this._processInputParams(e), r = this._def.options;
        function i(o) {
          for (const a of o)
            if (a.result.status === "valid")
              return a.result;
          for (const a of o)
            if (a.result.status === "dirty")
              return n.common.issues.push(...a.ctx.common.issues), a.result;
          const s = o.map((a) => new He(a.ctx.common.issues));
          return y(n, {
            code: p.invalid_union,
            unionErrors: s
          }), x;
        }
        if (n.common.async)
          return Promise.all(r.map(async (o) => {
            const s = {
              ...n,
              common: {
                ...n.common,
                issues: []
              },
              parent: null
            };
            return {
              result: await o._parseAsync({
                data: n.data,
                path: n.path,
                parent: s
              }),
              ctx: s
            };
          })).then(i);
        {
          let o;
          const s = [];
          for (const c of r) {
            const u = {
              ...n,
              common: {
                ...n.common,
                issues: []
              },
              parent: null
            }, l = c._parseSync({
              data: n.data,
              path: n.path,
              parent: u
            });
            if (l.status === "valid")
              return l;
            l.status === "dirty" && !o && (o = { result: l, ctx: u }), u.common.issues.length && s.push(u.common.issues);
          }
          if (o)
            return n.common.issues.push(...o.ctx.common.issues), o.result;
          const a = s.map((c) => new He(c));
          return y(n, {
            code: p.invalid_union,
            unionErrors: a
          }), x;
        }
      }
      get options() {
        return this._def.options;
      }
    }
    ut.create = (t, e) => new ut({
      options: t,
      typeName: b.ZodUnion,
      ...T(e)
    });
    function Ct(t, e) {
      const n = ve(t), r = ve(e);
      if (t === e)
        return { valid: !0, data: t };
      if (n === h.object && r === h.object) {
        const i = O.objectKeys(e), o = O.objectKeys(t).filter((a) => i.indexOf(a) !== -1), s = { ...t, ...e };
        for (const a of o) {
          const c = Ct(t[a], e[a]);
          if (!c.valid)
            return { valid: !1 };
          s[a] = c.data;
        }
        return { valid: !0, data: s };
      } else if (n === h.array && r === h.array) {
        if (t.length !== e.length)
          return { valid: !1 };
        const i = [];
        for (let o = 0; o < t.length; o++) {
          const s = t[o], a = e[o], c = Ct(s, a);
          if (!c.valid)
            return { valid: !1 };
          i.push(c.data);
        }
        return { valid: !0, data: i };
      } else
        return n === h.date && r === h.date && +t == +e ? { valid: !0, data: t } : { valid: !1 };
    }
    class ct extends S {
      _parse(e) {
        const { status: n, ctx: r } = this._processInputParams(e), i = (o, s) => {
          if (fn(o) || fn(s))
            return x;
          const a = Ct(o.value, s.value);
          return a.valid ? ((pn(o) || pn(s)) && n.dirty(), { status: n.value, value: a.data }) : (y(r, {
            code: p.invalid_intersection_types
          }), x);
        };
        return r.common.async ? Promise.all([
          this._def.left._parseAsync({
            data: r.data,
            path: r.path,
            parent: r
          }),
          this._def.right._parseAsync({
            data: r.data,
            path: r.path,
            parent: r
          })
        ]).then(([o, s]) => i(o, s)) : i(this._def.left._parseSync({
          data: r.data,
          path: r.path,
          parent: r
        }), this._def.right._parseSync({
          data: r.data,
          path: r.path,
          parent: r
        }));
      }
    }
    ct.create = (t, e, n) => new ct({
      left: t,
      right: e,
      typeName: b.ZodIntersection,
      ...T(n)
    });
    class ge extends S {
      _parse(e) {
        const { status: n, ctx: r } = this._processInputParams(e);
        if (r.parsedType !== h.array)
          return y(r, {
            code: p.invalid_type,
            expected: h.array,
            received: r.parsedType
          }), x;
        if (r.data.length < this._def.items.length)
          return y(r, {
            code: p.too_small,
            minimum: this._def.items.length,
            inclusive: !0,
            type: "array"
          }), x;
        !this._def.rest && r.data.length > this._def.items.length && (y(r, {
          code: p.too_big,
          maximum: this._def.items.length,
          inclusive: !0,
          type: "array"
        }), n.dirty());
        const i = r.data.map((o, s) => {
          const a = this._def.items[s] || this._def.rest;
          return a ? a._parse(new oe(r, o, r.path, s)) : null;
        }).filter((o) => !!o);
        return r.common.async ? Promise.all(i).then((o) => R.mergeArray(n, o)) : R.mergeArray(n, i);
      }
      get items() {
        return this._def.items;
      }
      rest(e) {
        return new ge({
          ...this._def,
          rest: e
        });
      }
    }
    ge.create = (t, e) => {
      if (!Array.isArray(t))
        throw new Error("You must pass an array of schemas to z.tuple([ ... ])");
      return new ge({
        items: t,
        typeName: b.ZodTuple,
        rest: null,
        ...T(e)
      });
    };
    class Tn extends S {
      _parse(e) {
        const { status: n, ctx: r } = this._processInputParams(e);
        if (r.parsedType !== h.map)
          return y(r, {
            code: p.invalid_type,
            expected: h.map,
            received: r.parsedType
          }), x;
        const i = this._def.keyType, o = this._def.valueType, s = [...r.data.entries()].map(([a, c], u) => ({
          key: i._parse(new oe(r, a, r.path, [u, "key"])),
          value: o._parse(new oe(r, c, r.path, [u, "value"]))
        }));
        if (r.common.async) {
          const a = /* @__PURE__ */ new Map();
          return Promise.resolve().then(async () => {
            for (const c of s) {
              const u = await c.key, l = await c.value;
              if (u.status === "aborted" || l.status === "aborted")
                return x;
              (u.status === "dirty" || l.status === "dirty") && n.dirty(), a.set(u.value, l.value);
            }
            return { status: n.value, value: a };
          });
        } else {
          const a = /* @__PURE__ */ new Map();
          for (const c of s) {
            const u = c.key, l = c.value;
            if (u.status === "aborted" || l.status === "aborted")
              return x;
            (u.status === "dirty" || l.status === "dirty") && n.dirty(), a.set(u.value, l.value);
          }
          return { status: n.value, value: a };
        }
      }
    }
    Tn.create = (t, e, n) => new Tn({
      valueType: e,
      keyType: t,
      typeName: b.ZodMap,
      ...T(n)
    });
    class Fe extends S {
      _parse(e) {
        const { status: n, ctx: r } = this._processInputParams(e);
        if (r.parsedType !== h.set)
          return y(r, {
            code: p.invalid_type,
            expected: h.set,
            received: r.parsedType
          }), x;
        const i = this._def;
        i.minSize !== null && r.data.size < i.minSize.value && (y(r, {
          code: p.too_small,
          minimum: i.minSize.value,
          type: "set",
          inclusive: !0,
          message: i.minSize.message
        }), n.dirty()), i.maxSize !== null && r.data.size > i.maxSize.value && (y(r, {
          code: p.too_big,
          maximum: i.maxSize.value,
          type: "set",
          inclusive: !0,
          message: i.maxSize.message
        }), n.dirty());
        const o = this._def.valueType;
        function s(c) {
          const u = /* @__PURE__ */ new Set();
          for (const l of c) {
            if (l.status === "aborted")
              return x;
            l.status === "dirty" && n.dirty(), u.add(l.value);
          }
          return { status: n.value, value: u };
        }
        const a = [...r.data.values()].map((c, u) => o._parse(new oe(r, c, r.path, u)));
        return r.common.async ? Promise.all(a).then((c) => s(c)) : s(a);
      }
      min(e, n) {
        return new Fe({
          ...this._def,
          minSize: { value: e, message: A.toString(n) }
        });
      }
      max(e, n) {
        return new Fe({
          ...this._def,
          maxSize: { value: e, message: A.toString(n) }
        });
      }
      size(e, n) {
        return this.min(e, n).max(e, n);
      }
      nonempty(e) {
        return this.min(1, e);
      }
    }
    Fe.create = (t, e) => new Fe({
      valueType: t,
      minSize: null,
      maxSize: null,
      typeName: b.ZodSet,
      ...T(e)
    });
    class Mn extends S {
      get schema() {
        return this._def.getter();
      }
      _parse(e) {
        const { ctx: n } = this._processInputParams(e);
        return this._def.getter()._parse({ data: n.data, path: n.path, parent: n });
      }
    }
    Mn.create = (t, e) => new Mn({
      getter: t,
      typeName: b.ZodLazy,
      ...T(e)
    });
    class Wt extends S {
      _parse(e) {
        if (e.data !== this._def.value) {
          const n = this._getOrReturnCtx(e);
          return y(n, {
            code: p.invalid_literal,
            expected: this._def.value
          }), x;
        }
        return { status: "valid", value: e.data };
      }
      get value() {
        return this._def.value;
      }
    }
    Wt.create = (t, e) => new Wt({
      value: t,
      typeName: b.ZodLiteral,
      ...T(e)
    });
    function gr(t, e) {
      return new br({
        values: t,
        typeName: b.ZodEnum,
        ...T(e)
      });
    }
    class br extends S {
      _parse(e) {
        if (typeof e.data != "string") {
          const n = this._getOrReturnCtx(e), r = this._def.values;
          return y(n, {
            expected: O.joinValues(r),
            received: n.parsedType,
            code: p.invalid_type
          }), x;
        }
        if (this._def.values.indexOf(e.data) === -1) {
          const n = this._getOrReturnCtx(e), r = this._def.values;
          return y(n, {
            received: n.data,
            code: p.invalid_enum_value,
            options: r
          }), x;
        }
        return X(e.data);
      }
      get options() {
        return this._def.values;
      }
      get enum() {
        const e = {};
        for (const n of this._def.values)
          e[n] = n;
        return e;
      }
      get Values() {
        const e = {};
        for (const n of this._def.values)
          e[n] = n;
        return e;
      }
      get Enum() {
        const e = {};
        for (const n of this._def.values)
          e[n] = n;
        return e;
      }
    }
    br.create = gr;
    class On extends S {
      _parse(e) {
        const n = O.getValidEnumValues(this._def.values), r = this._getOrReturnCtx(e);
        if (r.parsedType !== h.string && r.parsedType !== h.number) {
          const i = O.objectValues(n);
          return y(r, {
            expected: O.joinValues(i),
            received: r.parsedType,
            code: p.invalid_type
          }), x;
        }
        if (n.indexOf(e.data) === -1) {
          const i = O.objectValues(n);
          return y(r, {
            received: r.data,
            code: p.invalid_enum_value,
            options: i
          }), x;
        }
        return X(e.data);
      }
      get enum() {
        return this._def.values;
      }
    }
    On.create = (t, e) => new On({
      values: t,
      typeName: b.ZodNativeEnum,
      ...T(e)
    });
    class lt extends S {
      _parse(e) {
        const { ctx: n } = this._processInputParams(e);
        if (n.parsedType !== h.promise && n.common.async === !1)
          return y(n, {
            code: p.invalid_type,
            expected: h.promise,
            received: n.parsedType
          }), x;
        const r = n.parsedType === h.promise ? n.data : Promise.resolve(n.data);
        return X(r.then((i) => this._def.type.parseAsync(i, {
          path: n.path,
          errorMap: n.common.contextualErrorMap
        })));
      }
    }
    lt.create = (t, e) => new lt({
      type: t,
      typeName: b.ZodPromise,
      ...T(e)
    });
    class De extends S {
      innerType() {
        return this._def.schema;
      }
      _parse(e) {
        const { status: n, ctx: r } = this._processInputParams(e), i = this._def.effect || null;
        if (i.type === "preprocess") {
          const s = i.transform(r.data);
          return r.common.async ? Promise.resolve(s).then((a) => this._def.schema._parseAsync({
            data: a,
            path: r.path,
            parent: r
          })) : this._def.schema._parseSync({
            data: s,
            path: r.path,
            parent: r
          });
        }
        const o = {
          addIssue: (s) => {
            y(r, s), s.fatal ? n.abort() : n.dirty();
          },
          get path() {
            return r.path;
          }
        };
        if (o.addIssue = o.addIssue.bind(o), i.type === "refinement") {
          const s = (a) => {
            const c = i.refinement(a, o);
            if (r.common.async)
              return Promise.resolve(c);
            if (c instanceof Promise)
              throw new Error("Async refinement encountered during synchronous parse operation. Use .parseAsync instead.");
            return a;
          };
          if (r.common.async === !1) {
            const a = this._def.schema._parseSync({
              data: r.data,
              path: r.path,
              parent: r
            });
            return a.status === "aborted" ? x : (a.status === "dirty" && n.dirty(), s(a.value), { status: n.value, value: a.value });
          } else
            return this._def.schema._parseAsync({ data: r.data, path: r.path, parent: r }).then((a) => a.status === "aborted" ? x : (a.status === "dirty" && n.dirty(), s(a.value).then(() => ({ status: n.value, value: a.value }))));
        }
        if (i.type === "transform")
          if (r.common.async === !1) {
            const s = this._def.schema._parseSync({
              data: r.data,
              path: r.path,
              parent: r
            });
            if (!Et(s))
              return s;
            const a = i.transform(s.value, o);
            if (a instanceof Promise)
              throw new Error("Asynchronous transform encountered during synchronous parse operation. Use .parseAsync instead.");
            return { status: n.value, value: a };
          } else
            return this._def.schema._parseAsync({ data: r.data, path: r.path, parent: r }).then((s) => Et(s) ? Promise.resolve(i.transform(s.value, o)).then((a) => ({ status: n.value, value: a })) : s);
        O.assertNever(i);
      }
    }
    De.create = (t, e, n) => new De({
      schema: t,
      typeName: b.ZodEffects,
      effect: e,
      ...T(n)
    });
    De.createWithPreprocess = (t, e, n) => new De({
      schema: e,
      effect: { type: "preprocess", transform: t },
      typeName: b.ZodEffects,
      ...T(n)
    });
    class K extends S {
      _parse(e) {
        return this._getType(e) === h.undefined ? X(void 0) : this._def.innerType._parse(e);
      }
      unwrap() {
        return this._def.innerType;
      }
    }
    K.create = (t, e) => new K({
      innerType: t,
      typeName: b.ZodOptional,
      ...T(e)
    });
    class Ee extends S {
      _parse(e) {
        return this._getType(e) === h.null ? X(null) : this._def.innerType._parse(e);
      }
      unwrap() {
        return this._def.innerType;
      }
    }
    Ee.create = (t, e) => new Ee({
      innerType: t,
      typeName: b.ZodNullable,
      ...T(e)
    });
    class wr extends S {
      _parse(e) {
        const { ctx: n } = this._processInputParams(e);
        let r = n.data;
        return n.parsedType === h.undefined && (r = this._def.defaultValue()), this._def.innerType._parse({
          data: r,
          path: n.path,
          parent: n
        });
      }
      removeDefault() {
        return this._def.innerType;
      }
    }
    wr.create = (t, e) => new K({
      innerType: t,
      typeName: b.ZodOptional,
      ...T(e)
    });
    class In extends S {
      _parse(e) {
        if (this._getType(e) !== h.nan) {
          const n = this._getOrReturnCtx(e);
          return y(n, {
            code: p.invalid_type,
            expected: h.nan,
            received: n.parsedType
          }), x;
        }
        return { status: "valid", value: e.data };
      }
    }
    In.create = (t) => new In({
      typeName: b.ZodNaN,
      ...T(t)
    });
    class io extends S {
      _parse(e) {
        const { ctx: n } = this._processInputParams(e), r = n.data;
        return this._def.type._parse({
          data: r,
          path: n.path,
          parent: n
        });
      }
      unwrap() {
        return this._def.type;
      }
    }
    var b;
    (function(t) {
      t.ZodString = "ZodString", t.ZodNumber = "ZodNumber", t.ZodNaN = "ZodNaN", t.ZodBigInt = "ZodBigInt", t.ZodBoolean = "ZodBoolean", t.ZodDate = "ZodDate", t.ZodUndefined = "ZodUndefined", t.ZodNull = "ZodNull", t.ZodAny = "ZodAny", t.ZodUnknown = "ZodUnknown", t.ZodNever = "ZodNever", t.ZodVoid = "ZodVoid", t.ZodArray = "ZodArray", t.ZodObject = "ZodObject", t.ZodUnion = "ZodUnion", t.ZodDiscriminatedUnion = "ZodDiscriminatedUnion", t.ZodIntersection = "ZodIntersection", t.ZodTuple = "ZodTuple", t.ZodRecord = "ZodRecord", t.ZodMap = "ZodMap", t.ZodSet = "ZodSet", t.ZodFunction = "ZodFunction", t.ZodLazy = "ZodLazy", t.ZodLiteral = "ZodLiteral", t.ZodEnum = "ZodEnum", t.ZodEffects = "ZodEffects", t.ZodNativeEnum = "ZodNativeEnum", t.ZodOptional = "ZodOptional", t.ZodNullable = "ZodNullable", t.ZodDefault = "ZodDefault", t.ZodPromise = "ZodPromise", t.ZodBranded = "ZodBranded";
    })(b || (b = {}));
    const j = Ze.create, Je = ze.create, xr = kt.create;
    se.create;
    _.create;
    const z = D.create;
    const Ge = ut.create;
    ct.create;
    ge.create;
    const te = Wt.create;
    lt.create;
    K.create;
    Ee.create;
    const g = {
      oneTimeAccountsRead: te("oneTimeAccountsRead"),
      ongoingAccountsRead: te("ongoingAccountsRead"),
      oneTimePersonaDataRead: te("oneTimePersonaDataRead"),
      ongoingPersonaDataRead: te("ongoingPersonaDataRead"),
      usePersonaRead: te("usePersonaRead"),
      loginRead: te("loginRead"),
      sendTransactionWrite: te("sendTransactionWrite")
    }, oo = te("rejectedByUser"), Kt = z({
      address: j(),
      label: j(),
      appearanceId: Je()
    }), Ar = z({
      account: Kt,
      challenge: j(),
      signature: j()
    }), Tr = z({
      field: j(),
      value: j()
    }), so = z({
      networkId: Je(),
      dAppId: j()
    }), ao = z({
      requestType: g.oneTimeAccountsRead,
      requiresProofOfOwnership: xr(),
      numberOfAccounts: Je().optional()
    }), uo = z({
      requestType: g.oneTimeAccountsRead,
      accounts: Ar.array()
    }), co = z({
      requestType: g.oneTimeAccountsRead,
      accounts: Kt.array()
    }), lo = Ge([
      uo,
      co
    ]);
    z({
      requestType: g.ongoingAccountsRead,
      requiresProofOfOwnership: xr(),
      numberOfAccounts: Je().optional()
    });
    const fo = z({
      requestType: g.ongoingAccountsRead,
      accounts: Ar.array()
    }), po = z({
      requestType: g.ongoingAccountsRead,
      accounts: Kt.array()
    }), ho = Ge([
      fo,
      po
    ]);
    z({
      requestType: g.oneTimePersonaDataRead,
      fields: j().array()
    });
    const vo = z({
      requestType: g.oneTimePersonaDataRead,
      fields: Tr.array()
    });
    z({
      requestType: g.ongoingPersonaDataRead,
      fields: j().array()
    });
    const yo = z({
      requestType: g.ongoingPersonaDataRead,
      fields: Tr.array()
    });
    z({
      requestType: g.usePersonaRead,
      id: j()
    });
    const mo = z({
      requestType: g.usePersonaRead,
      id: j()
    });
    z({
      requestType: g.loginRead,
      challenge: j().optional()
    });
    const go = z({
      requestType: g.loginRead,
      personaId: j()
    }), bo = z({
      requestType: g.loginRead,
      personaId: j(),
      challenge: j(),
      publicKey: j(),
      signature: j(),
      identityComponentAddress: j()
    }), wo = Ge([
      go,
      bo
    ]), xo = z({
      requestType: g.sendTransactionWrite,
      transactionManifest: j(),
      version: Je(),
      blobs: j().array().optional(),
      message: j().optional()
    }), Ao = z({
      requestType: g.sendTransactionWrite,
      transactionIntentHash: j()
    }), To = Ge([
      ao,
      xo
    ]), Mo = Ge([
      lo,
      ho,
      vo,
      yo,
      mo,
      wo,
      Ao
    ]), Oo = z({
      requestId: j(),
      items: To.array(),
      metadata: so
    }), Io = z({
      requestId: j(),
      items: Mo.array()
    }), So = z({
      requestId: j(),
      error: oo,
      message: j().optional()
    }), Po = Ge([
      Io,
      So
    ]), Sn = (t) => ee.fromPromise(
      Oo.parseAsync(t),
      (e) => e.issues
    ).map(() => t).mapErr(() => (J.error("\u{1F535}\u{1F4A5} invalid wallet request"), st(
      me.walletRequestValidation,
      t.requestId
    ))), Pn = (t) => ee.fromPromise(
      Po.parseAsync(t),
      (e) => e.issues
    ).map(() => t).mapErr(() => (J.error("\u{1F535}\u{1F4A5} invalid wallet response"), st(
      me.walletRequestValidation,
      t.requestId
    ))), Nn = (t) => t.reduce((e, n) => {
      switch (n.requestType) {
        case g.usePersonaRead.value: {
          const { requestType: r, ...i } = n;
          return { ...e, persona: i };
        }
        case g.loginRead.value: {
          const { requestType: r, ...i } = n;
          return { ...e, login: i };
        }
        case g.oneTimeAccountsRead.value: {
          const { requestType: r, ...i } = n;
          return { ...e, oneTimeAccounts: i.accounts };
        }
        case g.ongoingAccountsRead.value: {
          const { requestType: r, ...i } = n;
          return { ...e, ongoingAccounts: i.accounts };
        }
        case g.oneTimePersonaDataRead.value: {
          const { requestType: r, ...i } = n;
          return { ...e, oneTimePersonaData: i.fields };
        }
        case g.ongoingPersonaDataRead.value: {
          const { requestType: r, ...i } = n;
          return { ...e, ongoingPersonaData: i.fields };
        }
        case g.sendTransactionWrite.value: {
          const { requestType: r, ...i } = n;
          return { ...e, ...i };
        }
        default:
          return e;
      }
    }, {}), C = {
      oneTimeAccountsWithoutProofOfOwnership: "oneTimeAccountsWithoutProofOfOwnership",
      oneTimeAccountsWithProofOfOwnership: "oneTimeAccountsWithProofOfOwnership",
      ongoingAccountsWithoutProofOfOwnership: "ongoingAccountsWithoutProofOfOwnership",
      ongoingAccountsWithProofOfOwnership: "ongoingAccountsWithProofOfOwnership",
      usePersona: "usePersona",
      loginWithoutChallenge: "loginWithoutChallenge",
      loginWithChallenge: "loginWithChallenge",
      oneTimePersonaData: "oneTimePersonaData",
      ongoingPersonaData: "ongoingPersonaData"
    }, No = (/* @__PURE__ */ new Map()).set(
      C.oneTimeAccountsWithoutProofOfOwnership,
      g.oneTimeAccountsRead.value
    ).set(
      C.oneTimeAccountsWithProofOfOwnership,
      g.oneTimeAccountsRead.value
    ).set(
      C.ongoingAccountsWithProofOfOwnership,
      g.ongoingAccountsRead.value
    ).set(
      C.ongoingAccountsWithoutProofOfOwnership,
      g.ongoingAccountsRead.value
    ).set(
      C.loginWithChallenge,
      g.loginRead.value
    ).set(
      C.loginWithoutChallenge,
      g.loginRead.value
    ).set(
      C.usePersona,
      g.usePersonaRead.value
    ).set(
      C.oneTimePersonaData,
      g.oneTimePersonaDataRead.value
    ).set(
      C.ongoingPersonaData,
      g.ongoingPersonaDataRead.value
    ).set("sendTransaction", g.sendTransactionWrite.value), jn = (t) => V(
      Object.entries(t).reduce(
        (e, [n, r]) => {
          switch (n) {
            case C.oneTimeAccountsWithoutProofOfOwnership:
              return [
                ...e,
                {
                  requestType: g.oneTimeAccountsRead.value,
                  ...r,
                  requiresProofOfOwnership: !1
                }
              ];
            case C.oneTimeAccountsWithProofOfOwnership:
              return [
                ...e,
                {
                  requestType: g.oneTimeAccountsRead.value,
                  ...r,
                  requiresProofOfOwnership: !0
                }
              ];
            case C.ongoingAccountsWithProofOfOwnership:
              return [
                ...e,
                {
                  requestType: g.ongoingAccountsRead.value,
                  ...r,
                  requiresProofOfOwnership: !0
                }
              ];
            case C.ongoingAccountsWithoutProofOfOwnership:
              return [
                ...e,
                {
                  requestType: g.ongoingAccountsRead.value,
                  ...r,
                  requiresProofOfOwnership: !1
                }
              ];
            default:
              return [
                ...e,
                { requestType: No.get(n), ...r }
              ];
          }
        },
        []
      )
    ), Zn = (t) => (e, n = crypto.randomUUID()) => V({
      items: e,
      requestId: n,
      metadata: t
    }), jo = {
      sendTransaction: "sendTransaction"
    }, Zo = {
      ...C,
      ...jo
    }, zo = (t, e) => ({
      request: (n, r = {}) => jn(n).andThen(Zn(t)).asyncAndThen(Sn).andThen(e(r)).andThen(Pn).map((i) => i.items).map(Nn),
      sendTransaction: (n, r = {}) => jn({ [Zo.sendTransaction]: n }).andThen(Zn(t)).asyncAndThen(Sn).andThen(e(r)).andThen(Pn).map((i) => i.items).map(Nn)
    });
    var Co = "Expected a function", Wo = 9007199254740991, Go = "[object Arguments]", Bo = "[object Function]", Ro = "[object GeneratorFunction]", Xo = typeof Xe == "object" && Xe && Xe.Object === Object && Xe, Uo = typeof self == "object" && self && self.Object === Object && self, Vo = Xo || Uo || Function("return this")();
    function Yo(t, e, n) {
      switch (n.length) {
        case 0:
          return t.call(e);
        case 1:
          return t.call(e, n[0]);
        case 2:
          return t.call(e, n[0], n[1]);
        case 3:
          return t.call(e, n[0], n[1], n[2]);
      }
      return t.apply(e, n);
    }
    function Ho(t, e) {
      for (var n = -1, r = e.length, i = t.length; ++n < r; )
        t[i + n] = e[n];
      return t;
    }
    var _t = Object.prototype, Fo = _t.hasOwnProperty, Mr = _t.toString, zn = Vo.Symbol, qo = _t.propertyIsEnumerable, Dn = zn ? zn.isConcatSpreadable : void 0, En = Math.max;
    function Or(t, e, n, r, i) {
      var o = -1, s = t.length;
      for (n || (n = Ko), i || (i = []); ++o < s; ) {
        var a = t[o];
        e > 0 && n(a) ? e > 1 ? Or(a, e - 1, n, r, i) : Ho(i, a) : r || (i[i.length] = a);
      }
      return i;
    }
    function Qo(t, e) {
      return e = En(e === void 0 ? t.length - 1 : e, 0), function() {
        for (var n = arguments, r = -1, i = En(n.length - e, 0), o = Array(i); ++r < i; )
          o[r] = n[e + r];
        r = -1;
        for (var s = Array(e + 1); ++r < e; )
          s[r] = n[r];
        return s[e] = o, Yo(t, this, s);
      };
    }
    function Jo(t) {
      return Qo(function(e) {
        e = Or(e, 1);
        var n = e.length, r = n;
        for (t && e.reverse(); r--; )
          if (typeof e[r] != "function")
            throw new TypeError(Co);
        return function() {
          for (var i = 0, o = n ? e[i].apply(this, arguments) : arguments[0]; ++i < n; )
            o = e[i].call(this, o);
          return o;
        };
      });
    }
    function Ko(t) {
      return $o(t) || _o(t) || !!(Dn && t && t[Dn]);
    }
    function _o(t) {
      return ts(t) && Fo.call(t, "callee") && (!qo.call(t, "callee") || Mr.call(t) == Go);
    }
    var $o = Array.isArray;
    function es(t) {
      return t != null && rs(t.length) && !ns(t);
    }
    function ts(t) {
      return os(t) && es(t);
    }
    function ns(t) {
      var e = is(t) ? Mr.call(t) : "";
      return e == Bo || e == Ro;
    }
    function rs(t) {
      return typeof t == "number" && t > -1 && t % 1 == 0 && t <= Wo;
    }
    function is(t) {
      var e = typeof t;
      return !!t && (e == "object" || e == "function");
    }
    function os(t) {
      return !!t && typeof t == "object";
    }
    Jo();
    const hs = {
      Mainnet: 1,
      Stokenet: 2,
      Adapanet: 10,
      Nebunet: 11,
      Gilganet: 32,
      Enkinet: 33,
      Hammunet: 34
    }, vs = ({
      networkId: t = hs.Mainnet,
      dAppId: e,
      logLevel: n = yr.logLevel
    }) => {
      J.setLevel(n), J.debug("\u{1F535} wallet sdk instantiated");
      const r = Ri(), i = () => {
        J.debug("\u{1F535}\u{1F9F9} destroying wallet sdk instance"), r.destroy();
      };
      return {
        ...zo(
          { networkId: t, dAppId: e },
          Ji(r.subjects)
        ),
        destroy: i,
        __subjects: r.subjects
      };
    };
    var Gt = function(t, e) {
      return Gt = Object.setPrototypeOf || { __proto__: [] } instanceof Array && function(n, r) {
        n.__proto__ = r;
      } || function(n, r) {
        for (var i in r)
          Object.prototype.hasOwnProperty.call(r, i) && (n[i] = r[i]);
      }, Gt(t, e);
    };
    function Ke(t, e) {
      if (typeof e != "function" && e !== null)
        throw new TypeError("Class extends value " + String(e) + " is not a constructor or null");
      Gt(t, e);
      function n() {
        this.constructor = t;
      }
      t.prototype = e === null ? Object.create(e) : (n.prototype = e.prototype, new n());
    }
    function ys(t, e, n, r) {
      function i(o) {
        return o instanceof n ? o : new n(function(s) {
          s(o);
        });
      }
      return new (n || (n = Promise))(function(o, s) {
        function a(l) {
          try {
            u(r.next(l));
          } catch (m) {
            s(m);
          }
        }
        function c(l) {
          try {
            u(r.throw(l));
          } catch (m) {
            s(m);
          }
        }
        function u(l) {
          l.done ? o(l.value) : i(l.value).then(a, c);
        }
        u((r = r.apply(t, e || [])).next());
      });
    }
    function Ir(t, e) {
      var n = { label: 0, sent: function() {
        if (o[0] & 1)
          throw o[1];
        return o[1];
      }, trys: [], ops: [] }, r, i, o, s;
      return s = { next: a(0), throw: a(1), return: a(2) }, typeof Symbol == "function" && (s[Symbol.iterator] = function() {
        return this;
      }), s;
      function a(u) {
        return function(l) {
          return c([u, l]);
        };
      }
      function c(u) {
        if (r)
          throw new TypeError("Generator is already executing.");
        for (; s && (s = 0, u[0] && (n = 0)), n; )
          try {
            if (r = 1, i && (o = u[0] & 2 ? i.return : u[0] ? i.throw || ((o = i.return) && o.call(i), 0) : i.next) && !(o = o.call(i, u[1])).done)
              return o;
            switch (i = 0, o && (u = [u[0] & 2, o.value]), u[0]) {
              case 0:
              case 1:
                o = u;
                break;
              case 4:
                return n.label++, { value: u[1], done: !1 };
              case 5:
                n.label++, i = u[1], u = [0];
                continue;
              case 7:
                u = n.ops.pop(), n.trys.pop();
                continue;
              default:
                if (o = n.trys, !(o = o.length > 0 && o[o.length - 1]) && (u[0] === 6 || u[0] === 2)) {
                  n = 0;
                  continue;
                }
                if (u[0] === 3 && (!o || u[1] > o[0] && u[1] < o[3])) {
                  n.label = u[1];
                  break;
                }
                if (u[0] === 6 && n.label < o[1]) {
                  n.label = o[1], o = u;
                  break;
                }
                if (o && n.label < o[2]) {
                  n.label = o[2], n.ops.push(u);
                  break;
                }
                o[2] && n.ops.pop(), n.trys.pop();
                continue;
            }
            u = e.call(t, n);
          } catch (l) {
            u = [6, l], i = 0;
          } finally {
            r = o = 0;
          }
        if (u[0] & 5)
          throw u[1];
        return { value: u[0] ? u[1] : void 0, done: !0 };
      }
    }
    function ke(t) {
      var e = typeof Symbol == "function" && Symbol.iterator, n = e && t[e], r = 0;
      if (n)
        return n.call(t);
      if (t && typeof t.length == "number")
        return {
          next: function() {
            return t && r >= t.length && (t = void 0), { value: t && t[r++], done: !t };
          }
        };
      throw new TypeError(e ? "Object is not iterable." : "Symbol.iterator is not defined.");
    }
    function Le(t, e) {
      var n = typeof Symbol == "function" && t[Symbol.iterator];
      if (!n)
        return t;
      var r = n.call(t), i, o = [], s;
      try {
        for (; (e === void 0 || e-- > 0) && !(i = r.next()).done; )
          o.push(i.value);
      } catch (a) {
        s = { error: a };
      } finally {
        try {
          i && !i.done && (n = r.return) && n.call(r);
        } finally {
          if (s)
            throw s.error;
        }
      }
      return o;
    }
    function qe(t, e, n) {
      if (n || arguments.length === 2)
        for (var r = 0, i = e.length, o; r < i; r++)
          (o || !(r in e)) && (o || (o = Array.prototype.slice.call(e, 0, r)), o[r] = e[r]);
      return t.concat(o || Array.prototype.slice.call(e));
    }
    function Ie(t) {
      return this instanceof Ie ? (this.v = t, this) : new Ie(t);
    }
    function ms(t, e, n) {
      if (!Symbol.asyncIterator)
        throw new TypeError("Symbol.asyncIterator is not defined.");
      var r = n.apply(t, e || []), i, o = [];
      return i = {}, s("next"), s("throw"), s("return"), i[Symbol.asyncIterator] = function() {
        return this;
      }, i;
      function s(f) {
        r[f] && (i[f] = function(v) {
          return new Promise(function(N, d) {
            o.push([f, v, N, d]) > 1 || a(f, v);
          });
        });
      }
      function a(f, v) {
        try {
          c(r[f](v));
        } catch (N) {
          m(o[0][3], N);
        }
      }
      function c(f) {
        f.value instanceof Ie ? Promise.resolve(f.value.v).then(u, l) : m(o[0][2], f);
      }
      function u(f) {
        a("next", f);
      }
      function l(f) {
        a("throw", f);
      }
      function m(f, v) {
        f(v), o.shift(), o.length && a(o[0][0], o[0][1]);
      }
    }
    function gs(t) {
      if (!Symbol.asyncIterator)
        throw new TypeError("Symbol.asyncIterator is not defined.");
      var e = t[Symbol.asyncIterator], n;
      return e ? e.call(t) : (t = typeof ke == "function" ? ke(t) : t[Symbol.iterator](), n = {}, r("next"), r("throw"), r("return"), n[Symbol.asyncIterator] = function() {
        return this;
      }, n);
      function r(o) {
        n[o] = t[o] && function(s) {
          return new Promise(function(a, c) {
            s = t[o](s), i(a, c, s.done, s.value);
          });
        };
      }
      function i(o, s, a, c) {
        Promise.resolve(c).then(function(u) {
          o({ value: u, done: a });
        }, s);
      }
    }
    function Z(t) {
      return typeof t == "function";
    }
    function Sr(t) {
      var e = function(r) {
        Error.call(r), r.stack = new Error().stack;
      }, n = t(e);
      return n.prototype = Object.create(Error.prototype), n.prototype.constructor = n, n;
    }
    var Ot = Sr(function(t) {
      return function(n) {
        t(this), this.message = n ? n.length + ` errors occurred during unsubscription:
` + n.map(function(r, i) {
          return i + 1 + ") " + r.toString();
        }).join(`
  `) : "", this.name = "UnsubscriptionError", this.errors = n;
      };
    });
    function Bt(t, e) {
      if (t) {
        var n = t.indexOf(e);
        0 <= n && t.splice(n, 1);
      }
    }
    var Be = function() {
      function t(e) {
        this.initialTeardown = e, this.closed = !1, this._parentage = null, this._finalizers = null;
      }
      return t.prototype.unsubscribe = function() {
        var e, n, r, i, o;
        if (!this.closed) {
          this.closed = !0;
          var s = this._parentage;
          if (s)
            if (this._parentage = null, Array.isArray(s))
              try {
                for (var a = ke(s), c = a.next(); !c.done; c = a.next()) {
                  var u = c.value;
                  u.remove(this);
                }
              } catch (d) {
                e = { error: d };
              } finally {
                try {
                  c && !c.done && (n = a.return) && n.call(a);
                } finally {
                  if (e)
                    throw e.error;
                }
              }
            else
              s.remove(this);
          var l = this.initialTeardown;
          if (Z(l))
            try {
              l();
            } catch (d) {
              o = d instanceof Ot ? d.errors : [d];
            }
          var m = this._finalizers;
          if (m) {
            this._finalizers = null;
            try {
              for (var f = ke(m), v = f.next(); !v.done; v = f.next()) {
                var N = v.value;
                try {
                  kn(N);
                } catch (d) {
                  o = o != null ? o : [], d instanceof Ot ? o = qe(qe([], Le(o)), Le(d.errors)) : o.push(d);
                }
              }
            } catch (d) {
              r = { error: d };
            } finally {
              try {
                v && !v.done && (i = f.return) && i.call(f);
              } finally {
                if (r)
                  throw r.error;
              }
            }
          }
          if (o)
            throw new Ot(o);
        }
      }, t.prototype.add = function(e) {
        var n;
        if (e && e !== this)
          if (this.closed)
            kn(e);
          else {
            if (e instanceof t) {
              if (e.closed || e._hasParent(this))
                return;
              e._addParent(this);
            }
            (this._finalizers = (n = this._finalizers) !== null && n !== void 0 ? n : []).push(e);
          }
      }, t.prototype._hasParent = function(e) {
        var n = this._parentage;
        return n === e || Array.isArray(n) && n.includes(e);
      }, t.prototype._addParent = function(e) {
        var n = this._parentage;
        this._parentage = Array.isArray(n) ? (n.push(e), n) : n ? [n, e] : e;
      }, t.prototype._removeParent = function(e) {
        var n = this._parentage;
        n === e ? this._parentage = null : Array.isArray(n) && Bt(n, e);
      }, t.prototype.remove = function(e) {
        var n = this._finalizers;
        n && Bt(n, e), e instanceof t && e._removeParent(this);
      }, t.EMPTY = function() {
        var e = new t();
        return e.closed = !0, e;
      }(), t;
    }(), Pr = Be.EMPTY;
    function Nr(t) {
      return t instanceof Be || t && "closed" in t && Z(t.remove) && Z(t.add) && Z(t.unsubscribe);
    }
    function kn(t) {
      Z(t) ? t() : t.unsubscribe();
    }
    var $t = {
      onUnhandledError: null,
      onStoppedNotification: null,
      Promise: void 0,
      useDeprecatedSynchronousErrorHandling: !1,
      useDeprecatedNextContext: !1
    }, Rt = {
      setTimeout: function(t, e) {
        for (var n = [], r = 2; r < arguments.length; r++)
          n[r - 2] = arguments[r];
        var i = Rt.delegate;
        return i != null && i.setTimeout ? i.setTimeout.apply(i, qe([t, e], Le(n))) : setTimeout.apply(void 0, qe([t, e], Le(n)));
      },
      clearTimeout: function(t) {
        return (clearTimeout)(t);
      },
      delegate: void 0
    };
    function jr(t) {
      Rt.setTimeout(function() {
        throw t;
      });
    }
    function Ln() {
    }
    function rt(t) {
      t();
    }
    var en = function(t) {
      Ke(e, t);
      function e(n) {
        var r = t.call(this) || this;
        return r.isStopped = !1, n ? (r.destination = n, Nr(n) && n.add(r)) : r.destination = As, r;
      }
      return e.create = function(n, r, i) {
        return new Xt(n, r, i);
      }, e.prototype.next = function(n) {
        this.isStopped || this._next(n);
      }, e.prototype.error = function(n) {
        this.isStopped || (this.isStopped = !0, this._error(n));
      }, e.prototype.complete = function() {
        this.isStopped || (this.isStopped = !0, this._complete());
      }, e.prototype.unsubscribe = function() {
        this.closed || (this.isStopped = !0, t.prototype.unsubscribe.call(this), this.destination = null);
      }, e.prototype._next = function(n) {
        this.destination.next(n);
      }, e.prototype._error = function(n) {
        try {
          this.destination.error(n);
        } finally {
          this.unsubscribe();
        }
      }, e.prototype._complete = function() {
        try {
          this.destination.complete();
        } finally {
          this.unsubscribe();
        }
      }, e;
    }(Be), bs = Function.prototype.bind;
    function It(t, e) {
      return bs.call(t, e);
    }
    var ws = function() {
      function t(e) {
        this.partialObserver = e;
      }
      return t.prototype.next = function(e) {
        var n = this.partialObserver;
        if (n.next)
          try {
            n.next(e);
          } catch (r) {
            tt(r);
          }
      }, t.prototype.error = function(e) {
        var n = this.partialObserver;
        if (n.error)
          try {
            n.error(e);
          } catch (r) {
            tt(r);
          }
        else
          tt(e);
      }, t.prototype.complete = function() {
        var e = this.partialObserver;
        if (e.complete)
          try {
            e.complete();
          } catch (n) {
            tt(n);
          }
      }, t;
    }(), Xt = function(t) {
      Ke(e, t);
      function e(n, r, i) {
        var o = t.call(this) || this, s;
        if (Z(n) || !n)
          s = {
            next: n != null ? n : void 0,
            error: r != null ? r : void 0,
            complete: i != null ? i : void 0
          };
        else {
          var a;
          o && $t.useDeprecatedNextContext ? (a = Object.create(n), a.unsubscribe = function() {
            return o.unsubscribe();
          }, s = {
            next: n.next && It(n.next, a),
            error: n.error && It(n.error, a),
            complete: n.complete && It(n.complete, a)
          }) : s = n;
        }
        return o.destination = new ws(s), o;
      }
      return e;
    }(en);
    function tt(t) {
      jr(t);
    }
    function xs(t) {
      throw t;
    }
    var As = {
      closed: !0,
      next: Ln,
      error: xs,
      complete: Ln
    }, tn = function() {
      return typeof Symbol == "function" && Symbol.observable || "@@observable";
    }();
    function Zr(t) {
      return t;
    }
    function Ts(t) {
      return t.length === 0 ? Zr : t.length === 1 ? t[0] : function(n) {
        return t.reduce(function(r, i) {
          return i(r);
        }, n);
      };
    }
    var $ = function() {
      function t(e) {
        e && (this._subscribe = e);
      }
      return t.prototype.lift = function(e) {
        var n = new t();
        return n.source = this, n.operator = e, n;
      }, t.prototype.subscribe = function(e, n, r) {
        var i = this, o = Os(e) ? e : new Xt(e, n, r);
        return rt(function() {
          var s = i, a = s.operator, c = s.source;
          o.add(a ? a.call(o, c) : c ? i._subscribe(o) : i._trySubscribe(o));
        }), o;
      }, t.prototype._trySubscribe = function(e) {
        try {
          return this._subscribe(e);
        } catch (n) {
          e.error(n);
        }
      }, t.prototype.forEach = function(e, n) {
        var r = this;
        return n = Cn(n), new n(function(i, o) {
          var s = new Xt({
            next: function(a) {
              try {
                e(a);
              } catch (c) {
                o(c), s.unsubscribe();
              }
            },
            error: o,
            complete: i
          });
          r.subscribe(s);
        });
      }, t.prototype._subscribe = function(e) {
        var n;
        return (n = this.source) === null || n === void 0 ? void 0 : n.subscribe(e);
      }, t.prototype[tn] = function() {
        return this;
      }, t.prototype.pipe = function() {
        for (var e = [], n = 0; n < arguments.length; n++)
          e[n] = arguments[n];
        return Ts(e)(this);
      }, t.prototype.toPromise = function(e) {
        var n = this;
        return e = Cn(e), new e(function(r, i) {
          var o;
          n.subscribe(function(s) {
            return o = s;
          }, function(s) {
            return i(s);
          }, function() {
            return r(o);
          });
        });
      }, t.create = function(e) {
        return new t(e);
      }, t;
    }();
    function Cn(t) {
      var e;
      return (e = t != null ? t : $t.Promise) !== null && e !== void 0 ? e : Promise;
    }
    function Ms(t) {
      return t && Z(t.next) && Z(t.error) && Z(t.complete);
    }
    function Os(t) {
      return t && t instanceof en || Ms(t) && Nr(t);
    }
    function Is(t) {
      return Z(t == null ? void 0 : t.lift);
    }
    function yt(t) {
      return function(e) {
        if (Is(e))
          return e.lift(function(n) {
            try {
              return t(n, this);
            } catch (r) {
              this.error(r);
            }
          });
        throw new TypeError("Unable to lift unknown Observable type");
      };
    }
    function Qe(t, e, n, r, i) {
      return new Ss(t, e, n, r, i);
    }
    var Ss = function(t) {
      Ke(e, t);
      function e(n, r, i, o, s, a) {
        var c = t.call(this, n) || this;
        return c.onFinalize = s, c.shouldUnsubscribe = a, c._next = r ? function(u) {
          try {
            r(u);
          } catch (l) {
            n.error(l);
          }
        } : t.prototype._next, c._error = o ? function(u) {
          try {
            o(u);
          } catch (l) {
            n.error(l);
          } finally {
            this.unsubscribe();
          }
        } : t.prototype._error, c._complete = i ? function() {
          try {
            i();
          } catch (u) {
            n.error(u);
          } finally {
            this.unsubscribe();
          }
        } : t.prototype._complete, c;
      }
      return e.prototype.unsubscribe = function() {
        var n;
        if (!this.shouldUnsubscribe || this.shouldUnsubscribe()) {
          var r = this.closed;
          t.prototype.unsubscribe.call(this), !r && ((n = this.onFinalize) === null || n === void 0 || n.call(this));
        }
      }, e;
    }(en), Ps = Sr(function(t) {
      return function() {
        t(this), this.name = "ObjectUnsubscribedError", this.message = "object unsubscribed";
      };
    }), _e = function(t) {
      Ke(e, t);
      function e() {
        var n = t.call(this) || this;
        return n.closed = !1, n.currentObservers = null, n.observers = [], n.isStopped = !1, n.hasError = !1, n.thrownError = null, n;
      }
      return e.prototype.lift = function(n) {
        var r = new Wn(this, this);
        return r.operator = n, r;
      }, e.prototype._throwIfClosed = function() {
        if (this.closed)
          throw new Ps();
      }, e.prototype.next = function(n) {
        var r = this;
        rt(function() {
          var i, o;
          if (r._throwIfClosed(), !r.isStopped) {
            r.currentObservers || (r.currentObservers = Array.from(r.observers));
            try {
              for (var s = ke(r.currentObservers), a = s.next(); !a.done; a = s.next()) {
                var c = a.value;
                c.next(n);
              }
            } catch (u) {
              i = { error: u };
            } finally {
              try {
                a && !a.done && (o = s.return) && o.call(s);
              } finally {
                if (i)
                  throw i.error;
              }
            }
          }
        });
      }, e.prototype.error = function(n) {
        var r = this;
        rt(function() {
          if (r._throwIfClosed(), !r.isStopped) {
            r.hasError = r.isStopped = !0, r.thrownError = n;
            for (var i = r.observers; i.length; )
              i.shift().error(n);
          }
        });
      }, e.prototype.complete = function() {
        var n = this;
        rt(function() {
          if (n._throwIfClosed(), !n.isStopped) {
            n.isStopped = !0;
            for (var r = n.observers; r.length; )
              r.shift().complete();
          }
        });
      }, e.prototype.unsubscribe = function() {
        this.isStopped = this.closed = !0, this.observers = this.currentObservers = null;
      }, Object.defineProperty(e.prototype, "observed", {
        get: function() {
          var n;
          return ((n = this.observers) === null || n === void 0 ? void 0 : n.length) > 0;
        },
        enumerable: !1,
        configurable: !0
      }), e.prototype._trySubscribe = function(n) {
        return this._throwIfClosed(), t.prototype._trySubscribe.call(this, n);
      }, e.prototype._subscribe = function(n) {
        return this._throwIfClosed(), this._checkFinalizedStatuses(n), this._innerSubscribe(n);
      }, e.prototype._innerSubscribe = function(n) {
        var r = this, i = this, o = i.hasError, s = i.isStopped, a = i.observers;
        return o || s ? Pr : (this.currentObservers = null, a.push(n), new Be(function() {
          r.currentObservers = null, Bt(a, n);
        }));
      }, e.prototype._checkFinalizedStatuses = function(n) {
        var r = this, i = r.hasError, o = r.thrownError, s = r.isStopped;
        i ? n.error(o) : s && n.complete();
      }, e.prototype.asObservable = function() {
        var n = new $();
        return n.source = this, n;
      }, e.create = function(n, r) {
        return new Wn(n, r);
      }, e;
    }($), Wn = function(t) {
      Ke(e, t);
      function e(n, r) {
        var i = t.call(this) || this;
        return i.destination = n, i.source = r, i;
      }
      return e.prototype.next = function(n) {
        var r, i;
        (i = (r = this.destination) === null || r === void 0 ? void 0 : r.next) === null || i === void 0 || i.call(r, n);
      }, e.prototype.error = function(n) {
        var r, i;
        (i = (r = this.destination) === null || r === void 0 ? void 0 : r.error) === null || i === void 0 || i.call(r, n);
      }, e.prototype.complete = function() {
        var n, r;
        (r = (n = this.destination) === null || n === void 0 ? void 0 : n.complete) === null || r === void 0 || r.call(n);
      }, e.prototype._subscribe = function(n) {
        var r, i;
        return (i = (r = this.source) === null || r === void 0 ? void 0 : r.subscribe(n)) !== null && i !== void 0 ? i : Pr;
      }, e;
    }(_e), zr = function(t) {
      return t && typeof t.length == "number" && typeof t != "function";
    };
    function Ns(t) {
      return Z(t == null ? void 0 : t.then);
    }
    function js(t) {
      return Z(t[tn]);
    }
    function Zs(t) {
      return Symbol.asyncIterator && Z(t == null ? void 0 : t[Symbol.asyncIterator]);
    }
    function zs(t) {
      return new TypeError("You provided " + (t !== null && typeof t == "object" ? "an invalid object" : "'" + t + "'") + " where a stream was expected. You can provide an Observable, Promise, ReadableStream, Array, AsyncIterable, or Iterable.");
    }
    function Ds() {
      return typeof Symbol != "function" || !Symbol.iterator ? "@@iterator" : Symbol.iterator;
    }
    var Es = Ds();
    function ks(t) {
      return Z(t == null ? void 0 : t[Es]);
    }
    function Ls(t) {
      return ms(this, arguments, function() {
        var n, r, i, o;
        return Ir(this, function(s) {
          switch (s.label) {
            case 0:
              n = t.getReader(), s.label = 1;
            case 1:
              s.trys.push([1, , 9, 10]), s.label = 2;
            case 2:
              return [4, Ie(n.read())];
            case 3:
              return r = s.sent(), i = r.value, o = r.done, o ? [4, Ie(void 0)] : [3, 5];
            case 4:
              return [2, s.sent()];
            case 5:
              return [4, Ie(i)];
            case 6:
              return [4, s.sent()];
            case 7:
              return s.sent(), [3, 2];
            case 8:
              return [3, 10];
            case 9:
              return n.releaseLock(), [7];
            case 10:
              return [2];
          }
        });
      });
    }
    function Cs(t) {
      return Z(t == null ? void 0 : t.getReader);
    }
    function nn(t) {
      if (t instanceof $)
        return t;
      if (t != null) {
        if (js(t))
          return Ws(t);
        if (zr(t))
          return Gs(t);
        if (Ns(t))
          return Bs(t);
        if (Zs(t))
          return Dr(t);
        if (ks(t))
          return Rs(t);
        if (Cs(t))
          return Xs(t);
      }
      throw zs(t);
    }
    function Ws(t) {
      return new $(function(e) {
        var n = t[tn]();
        if (Z(n.subscribe))
          return n.subscribe(e);
        throw new TypeError("Provided object does not correctly implement Symbol.observable");
      });
    }
    function Gs(t) {
      return new $(function(e) {
        for (var n = 0; n < t.length && !e.closed; n++)
          e.next(t[n]);
        e.complete();
      });
    }
    function Bs(t) {
      return new $(function(e) {
        t.then(function(n) {
          e.closed || (e.next(n), e.complete());
        }, function(n) {
          return e.error(n);
        }).then(null, jr);
      });
    }
    function Rs(t) {
      return new $(function(e) {
        var n, r;
        try {
          for (var i = ke(t), o = i.next(); !o.done; o = i.next()) {
            var s = o.value;
            if (e.next(s), e.closed)
              return;
          }
        } catch (a) {
          n = { error: a };
        } finally {
          try {
            o && !o.done && (r = i.return) && r.call(i);
          } finally {
            if (n)
              throw n.error;
          }
        }
        e.complete();
      });
    }
    function Dr(t) {
      return new $(function(e) {
        Us(t, e).catch(function(n) {
          return e.error(n);
        });
      });
    }
    function Xs(t) {
      return Dr(Ls(t));
    }
    function Us(t, e) {
      var n, r, i, o;
      return ys(this, void 0, void 0, function() {
        var s, a;
        return Ir(this, function(c) {
          switch (c.label) {
            case 0:
              c.trys.push([0, 5, 6, 11]), n = gs(t), c.label = 1;
            case 1:
              return [4, n.next()];
            case 2:
              if (r = c.sent(), !!r.done)
                return [3, 4];
              if (s = r.value, e.next(s), e.closed)
                return [2];
              c.label = 3;
            case 3:
              return [3, 1];
            case 4:
              return [3, 11];
            case 5:
              return a = c.sent(), i = { error: a }, [3, 11];
            case 6:
              return c.trys.push([6, , 9, 10]), r && !r.done && (o = n.return) ? [4, o.call(n)] : [3, 8];
            case 7:
              c.sent(), c.label = 8;
            case 8:
              return [3, 10];
            case 9:
              if (i)
                throw i.error;
              return [7];
            case 10:
              return [7];
            case 11:
              return e.complete(), [2];
          }
        });
      });
    }
    function Vs(t, e, n, r, i) {
      r === void 0 && (r = 0), i === void 0 && (i = !1);
      var o = e.schedule(function() {
        n(), i ? t.add(this.schedule(null, r)) : this.unsubscribe();
      }, r);
      if (t.add(o), !i)
        return o;
    }
    function Er(t, e) {
      return yt(function(n, r) {
        var i = 0;
        n.subscribe(Qe(r, function(o) {
          r.next(t.call(e, o, i++));
        }));
      });
    }
    var Ys = Array.isArray;
    function Hs(t, e) {
      return Ys(e) ? t.apply(void 0, qe([], Le(e))) : t(e);
    }
    function Fs(t) {
      return Er(function(e) {
        return Hs(t, e);
      });
    }
    function qs(t, e, n, r, i, o, s, a) {
      var c = [], u = 0, l = 0, m = !1, f = function() {
        m && !c.length && !u && e.complete();
      }, v = function(d) {
        return u < r ? N(d) : c.push(d);
      }, N = function(d) {
        o && e.next(d), u++;
        var I = !1;
        nn(n(d, l++)).subscribe(Qe(e, function(M) {
          i == null || i(M), o ? v(M) : e.next(M);
        }, function() {
          I = !0;
        }, void 0, function() {
          if (I)
            try {
              u--;
              for (var M = function() {
                var w = c.shift();
                s ? Vs(e, s, function() {
                  return N(w);
                }) : N(w);
              }; c.length && u < r; )
                M();
              f();
            } catch (w) {
              e.error(w);
            }
        }));
      };
      return t.subscribe(Qe(e, v, function() {
        m = !0, f();
      })), function() {
        a == null || a();
      };
    }
    function kr(t, e, n) {
      return n === void 0 && (n = 1 / 0), Z(e) ? kr(function(r, i) {
        return Er(function(o, s) {
          return e(r, o, i, s);
        })(nn(t(r, i)));
      }, n) : (typeof e == "number" && (n = e), yt(function(r, i) {
        return qs(r, i, t, n);
      }));
    }
    var Qs = ["addListener", "removeListener"], Js = ["addEventListener", "removeEventListener"], Ks = ["on", "off"];
    function Ut(t, e, n, r) {
      if (Z(n) && (r = n, n = void 0), r)
        return Ut(t, e, n).pipe(Fs(r));
      var i = Le(ea(t) ? Js.map(function(a) {
        return function(c) {
          return t[a](e, c, n);
        };
      }) : _s(t) ? Qs.map(Gn(t, e)) : $s(t) ? Ks.map(Gn(t, e)) : [], 2), o = i[0], s = i[1];
      if (!o && zr(t))
        return kr(function(a) {
          return Ut(a, e, n);
        })(nn(t));
      if (!o)
        throw new TypeError("Invalid event target");
      return new $(function(a) {
        var c = function() {
          for (var u = [], l = 0; l < arguments.length; l++)
            u[l] = arguments[l];
          return a.next(1 < u.length ? u : u[0]);
        };
        return o(c), function() {
          return s(c);
        };
      });
    }
    function Gn(t, e) {
      return function(n) {
        return function(r) {
          return t[n](e, r);
        };
      };
    }
    function _s(t) {
      return Z(t.addListener) && Z(t.removeListener);
    }
    function $s(t) {
      return Z(t.on) && Z(t.off);
    }
    function ea(t) {
      return Z(t.addEventListener) && Z(t.removeEventListener);
    }
    function Bn(t, e) {
      return yt(function(n, r) {
        var i = 0;
        n.subscribe(Qe(r, function(o) {
          return t.call(e, o, i++) && r.next(o);
        }));
      });
    }
    function Ue(t, e, n) {
      var r = Z(t) || e || n ? { next: t, error: e, complete: n } : t;
      return r ? yt(function(i, o) {
        var s;
        (s = r.subscribe) === null || s === void 0 || s.call(r);
        var a = !0;
        i.subscribe(Qe(o, function(c) {
          var u;
          (u = r.next) === null || u === void 0 || u.call(r, c), o.next(c);
        }, function() {
          var c;
          a = !1, (c = r.complete) === null || c === void 0 || c.call(r), o.complete();
        }, function(c) {
          var u;
          a = !1, (u = r.error) === null || u === void 0 || u.call(r, c), o.error(c);
        }, function() {
          var c, u;
          a && ((c = r.unsubscribe) === null || c === void 0 || c.call(r)), (u = r.finalize) === null || u === void 0 || u.call(r);
        }));
      }) : Zr;
    }
    const rn = {
      elementTag: "radix-connect-button",
      links: { "What is a radix wallet?": "https://wallet.radixdlt.com/" }
    }, Vt = "radixdlt.connected", ta = () => localStorage.getItem(Vt) === "true", na = (t) => {
      t ? localStorage.setItem(Vt, String(t)) : localStorage.removeItem(Vt);
    }, Lr = new _e(), Cr = new _e(), Wr = new _e(), Gr = new _e(), St = Lr.asObservable(), ra = Cr.asObservable(), ia = Wr.asObservable(), oa = Gr.asObservable();
    let q, Te;
    const $a = (t) => {
      const { onConnect: e, onDestroy: n, onDisconnect: r, onCancel: i, initialState: o, ...s } = t;
      q = vs(s);
      let a;
      const c = ({ connected: l, loading: m }) => {
        const f = sa();
        l != null && (f.connected = l, na(l)), m != null && (f.loading = m);
      };
      o && c(o), Te = {
        getWalletData: q.request,
        sendTransaction: q.sendTransaction,
        destroy: () => {
          u == null || u.unsubscribe(), q.destroy();
        },
        onConnect$: St,
        setState: c
      };
      const u = new Be();
      return u.add(
        St.pipe(
          Ue(() => {
            const l = Te;
            return l.getWalletData = (m, f) => q.request(m, {
              ...f,
              requestControl: ({ cancelRequest: v }) => {
                a = v;
              }
            }), e(l);
          })
        ).subscribe()
      ), u.add(
        ra.pipe(Ue(() => r(Te))).subscribe()
      ), u.add(
        oa.pipe(
          Ue(() => {
            a(), i && i();
          })
        ).subscribe()
      ), u.add(
        ia.pipe(
          Ue(() => {
            n && n();
          })
        ).subscribe()
      ), {
        getWalletData: q.request,
        sendTransaction: q.sendTransaction,
        setState: c,
        destroy: () => {
          u == null || u.unsubscribe(), q.destroy(), q = void 0, Te = void 0;
        },
        onConnect$: St
      };
    }, sa = () => {
      const t = document.querySelector(rn.elementTag);
      if (!t)
        throw new Error("radix connect button not found");
      return t;
    };
    var aa = Object.defineProperty, ua = Object.getOwnPropertyDescriptor, ca = (t, e, n, r) => {
      for (var i = r > 1 ? void 0 : r ? ua(e, n) : e, o = t.length - 1, s; o >= 0; o--)
        (s = t[o]) && (i = (r ? s(e, n, i) : s(i)) || i);
      return r && i && aa(e, n, i), i;
    };
    let Yt = class extends s {
      render() {
        return y$1`<div class="loader"></div>`;
      }
    };
    Yt.styles = i$2`
    :host {
      width: 1.5rem;
      height: 1.5rem;
      border: 3px solid #fff;
      border-left-color: rgba(255, 255, 255, 0.3);
      border-top-color: rgba(255, 255, 255, 0.3);
      border-bottom-color: rgba(255, 255, 255, 0.3);
      border-radius: 50%;
      display: inline-block;
      box-sizing: border-box;
      animation: rotation 1s linear infinite;
      align-self: center;
      margin-top: 0.1rem;
    }

    :host(.small) {
      width: 1rem;
      height: 1rem;
    }

    @keyframes rotation {
      0% {
        transform: rotate(0deg);
      }
      100% {
        transform: rotate(360deg);
      }
    }
  `;
    Yt = ca([
      e$1("loading-spinner")
    ], Yt);
    const Q = {
      radixBlue: i$2`#060F8F`,
      radixGrey1: i$2`#003057`,
      radixGrey4: i$2`#E2E5ED`,
      radixGrey5: i$2`#F4F5F9`
    };
    var la = Object.defineProperty, da = Object.getOwnPropertyDescriptor, fa = (t, e, n, r) => {
      for (var i = r > 1 ? void 0 : r ? da(e, n) : e, o = t.length - 1, s; o >= 0; o--)
        (s = t[o]) && (i = (r ? s(e, n, i) : s(i)) || i);
      return r && i && la(e, n, i), i;
    };
    let Ht = class extends s {
      render() {
        return y$1`<div class="wrapper">
      <div id="arrow"></div>
      <slot></slot>
    </div>`;
      }
    };
    Ht.styles = i$2`
    :host {
      width: 18rem;
      border-radius: 12px;
      position: absolute;
      background: ${Q.radixGrey5};
      box-shadow: 0px 4px 9px rgba(0, 0, 0, 0.25);
      border-radius: 12px;
      border: 1px solid ${Q.radixGrey4};
      padding: 1.13rem;
      z-index: 9999;
    }

    #arrow,
    #arrow::before {
      position: absolute;
      width: 8px;
      height: 8px;
      top: -0.21rem;
      right: 2rem;
      background: ${Q.radixGrey5};
      border: 1px solid ${Q.radixGrey4};
      border-bottom-width: 0;
      border-right-width: 0;
    }

    #arrow {
      visibility: hidden;
    }

    #arrow::before {
      visibility: visible;
      content: '';
      transform: rotate(45deg);
    }
  `;
    Ht = fa([
      e$1("radix-popover")
    ], Ht);
    const pa = "data:image/svg+xml;base64,PHN2ZyB3aWR0aD0iMTM4IiBoZWlnaHQ9IjQyIiB2aWV3Qm94PSIwIDAgMTM4IDQyIiBmaWxsPSJub25lIiB4bWxucz0iaHR0cDovL3d3dy53My5vcmcvMjAwMC9zdmciPgo8cmVjdCB3aWR0aD0iMTM4IiBoZWlnaHQ9IjQyIiByeD0iMTIiIGZpbGw9IiMwNTJDQzAiLz4KPG1hc2sgaWQ9Im1hc2swXzFfMTMiIHN0eWxlPSJtYXNrLXR5cGU6YWxwaGEiIG1hc2tVbml0cz0idXNlclNwYWNlT25Vc2UiIHg9IjAiIHk9IjAiIHdpZHRoPSIxMzgiIGhlaWdodD0iNDIiPgo8cmVjdCB5PSI3LjYyOTM5ZS0wNiIgd2lkdGg9IjEzOCIgaGVpZ2h0PSI0MiIgcng9IjEyIiBmaWxsPSIjMDYwRjhGIi8+CjwvbWFzaz4KPGcgbWFzaz0idXJsKCNtYXNrMF8xXzEzKSI+CjxnIGZpbHRlcj0idXJsKCNmaWx0ZXIwX2ZfMV8xMykiPgo8cGF0aCBkPSJNMTcuNDA2MyAtMjcuNDgzOEMzMy42MTA5IC0zNC44MjEyIDUxLjYxNzQgLTMwLjAxMzkgNTcuNjI0OSAtMTYuNzQ2NEM2My42MzI1IC0zLjQ3ODg1IDU1LjM2NjEgMTMuMjI0OCAzOS4xNjE1IDIwLjU2MjJDMjIuOTU2OCAyNy44OTk2IC0yNS41MTI3IDUuODM4MzEgLTMxLjUyMDIgLTcuNDI5MjNDLTM3LjUyNzcgLTIwLjY5NjggMS4yMDE2OCAtMjAuMTQ2MyAxNy40MDYzIC0yNy40ODM4WiIgZmlsbD0iIzIxRkZCRSIvPgo8L2c+CjxnIGZpbHRlcj0idXJsKCNmaWx0ZXIxX2ZfMV8xMykiPgo8cGF0aCBkPSJNNzcuOTQ4MiAyOC40NjcxQzg2LjczNjIgMjIuMDg3IDk4LjA5NSAyMi43NDc4IDEwMy4zMTkgMjkuOTQzQzEwOC41NDIgMzcuMTM4MyAxMDUuNjUzIDQ4LjE0MzIgOTYuODY0OSA1NC41MjMzQzg4LjA3NjggNjAuOTAzNCA1Ni4zNzk5IDUzLjY3MDMgNTEuMTU2MiA0Ni40NzUxQzQ1LjkzMjUgMzkuMjc5OCA2OS4xNjAxIDM0Ljg0NzIgNzcuOTQ4MiAyOC40NjcxWiIgZmlsbD0iIzIwRTRGRiIvPgo8L2c+CjxnIGZpbHRlcj0idXJsKCNmaWx0ZXIyX2ZfMV8xMykiPgo8cGF0aCBkPSJNMTYuMTQyMSAyOS41MDkxQzI2LjkyNjYgMzQuMDQyNyAzMi41MTE2IDQ1LjIyOTIgMjguNjE2NCA1NC40OTQ5QzI0LjcyMTMgNjMuNzYwNiAxMi44MjExIDY3LjU5NjYgMi4wMzY1OCA2My4wNjNDLTguNzQ3OTIgNTguNTI5MyAtMTkuMjc4MSAyNC4wOTA0IC0xNS4zODMgMTQuODI0N0MtMTEuNDg3OCA1LjU1OTA0IDUuMzU3NjUgMjQuOTc1NCAxNi4xNDIxIDI5LjUwOTFaIiBmaWxsPSIjMDYwRjhGIi8+CjwvZz4KPGcgZmlsdGVyPSJ1cmwoI2ZpbHRlcjNfZl8xXzEzKSI+CjxwYXRoIGQ9Ik0xMjAuMTM1IDE2LjI2MTNDMTAzLjU3IDE3LjMyMDkgODkuNDM4MiA3LjE4NTI1IDg4LjU3MDcgLTYuMzc3MThDODcuNzAzMiAtMTkuOTM5NiAxMDAuNDI4IC0zMS43OTMgMTE2Ljk5MyAtMzIuODUyNkMxMzMuNTU4IC0zMy45MTIxIDE2OC41ODkgMS4zMzIzMiAxNjkuNDU2IDE0Ljg5NDdDMTcwLjMyNCAyOC40NTcyIDEzNi42OTkgMTUuMjAxOCAxMjAuMTM1IDE2LjI2MTNaIiBmaWxsPSIjRkY0M0NBIi8+CjwvZz4KPC9nPgo8ZGVmcz4KPGZpbHRlciBpZD0iZmlsdGVyMF9mXzFfMTMiIHg9Ii02Mi4zNDMxIiB5PSItNjEuMTEzNSIgd2lkdGg9IjE1Mi4xMjQiIGhlaWdodD0iMTEzLjMzIiBmaWx0ZXJVbml0cz0idXNlclNwYWNlT25Vc2UiIGNvbG9yLWludGVycG9sYXRpb24tZmlsdGVycz0ic1JHQiI+CjxmZUZsb29kIGZsb29kLW9wYWNpdHk9IjAiIHJlc3VsdD0iQmFja2dyb3VuZEltYWdlRml4Ii8+CjxmZUJsZW5kIG1vZGU9Im5vcm1hbCIgaW49IlNvdXJjZUdyYXBoaWMiIGluMj0iQmFja2dyb3VuZEltYWdlRml4IiByZXN1bHQ9InNoYXBlIi8+CjxmZUdhdXNzaWFuQmx1ciBzdGREZXZpYXRpb249IjE1LjA5NzkiIHJlc3VsdD0iZWZmZWN0MV9mb3JlZ3JvdW5kQmx1cl8xXzEzIi8+CjwvZmlsdGVyPgo8ZmlsdGVyIGlkPSJmaWx0ZXIxX2ZfMV8xMyIgeD0iMjYuMzk5NyIgeT0iMC4wODI3Nzg5IiB3aWR0aD0iMTAzLjUyMSIgaGVpZ2h0PSI4MC45IiBmaWx0ZXJVbml0cz0idXNlclNwYWNlT25Vc2UiIGNvbG9yLWludGVycG9sYXRpb24tZmlsdGVycz0ic1JHQiI+CjxmZUZsb29kIGZsb29kLW9wYWNpdHk9IjAiIHJlc3VsdD0iQmFja2dyb3VuZEltYWdlRml4Ii8+CjxmZUJsZW5kIG1vZGU9Im5vcm1hbCIgaW49IlNvdXJjZUdyYXBoaWMiIGluMj0iQmFja2dyb3VuZEltYWdlRml4IiByZXN1bHQ9InNoYXBlIi8+CjxmZUdhdXNzaWFuQmx1ciBzdGREZXZpYXRpb249IjEyIiByZXN1bHQ9ImVmZmVjdDFfZm9yZWdyb3VuZEJsdXJfMV8xMyIvPgo8L2ZpbHRlcj4KPGZpbHRlciBpZD0iZmlsdGVyMl9mXzFfMTMiIHg9Ii0zNi4yMTA3IiB5PSItNy42NDk0MSIgd2lkdGg9Ijg2LjA2NzQiIGhlaWdodD0iOTIuNjE3MiIgZmlsdGVyVW5pdHM9InVzZXJTcGFjZU9uVXNlIiBjb2xvci1pbnRlcnBvbGF0aW9uLWZpbHRlcnM9InNSR0IiPgo8ZmVGbG9vZCBmbG9vZC1vcGFjaXR5PSIwIiByZXN1bHQ9IkJhY2tncm91bmRJbWFnZUZpeCIvPgo8ZmVCbGVuZCBtb2RlPSJub3JtYWwiIGluPSJTb3VyY2VHcmFwaGljIiBpbjI9IkJhY2tncm91bmRJbWFnZUZpeCIgcmVzdWx0PSJzaGFwZSIvPgo8ZmVHYXVzc2lhbkJsdXIgc3RkRGV2aWF0aW9uPSIxMCIgcmVzdWx0PSJlZmZlY3QxX2ZvcmVncm91bmRCbHVyXzFfMTMiLz4KPC9maWx0ZXI+CjxmaWx0ZXIgaWQ9ImZpbHRlcjNfZl8xXzEzIiB4PSI0OC41Mjg5IiB5PSItNzIuODc1OSIgd2lkdGg9IjE2MC45NDQiIGhlaWdodD0iMTMzLjkyMSIgZmlsdGVyVW5pdHM9InVzZXJTcGFjZU9uVXNlIiBjb2xvci1pbnRlcnBvbGF0aW9uLWZpbHRlcnM9InNSR0IiPgo8ZmVGbG9vZCBmbG9vZC1vcGFjaXR5PSIwIiByZXN1bHQ9IkJhY2tncm91bmRJbWFnZUZpeCIvPgo8ZmVCbGVuZCBtb2RlPSJub3JtYWwiIGluPSJTb3VyY2VHcmFwaGljIiBpbjI9IkJhY2tncm91bmRJbWFnZUZpeCIgcmVzdWx0PSJzaGFwZSIvPgo8ZmVHYXVzc2lhbkJsdXIgc3RkRGV2aWF0aW9uPSIyMCIgcmVzdWx0PSJlZmZlY3QxX2ZvcmVncm91bmRCbHVyXzFfMTMiLz4KPC9maWx0ZXI+CjwvZGVmcz4KPC9zdmc+Cg==", ha = "data:image/svg+xml;base64,PHN2ZyB3aWR0aD0iMTYiIGhlaWdodD0iMTIiIHZpZXdCb3g9IjAgMCAxNiAxMiIgZmlsbD0ibm9uZSIgeG1sbnM9Imh0dHA6Ly93d3cudzMub3JnLzIwMDAvc3ZnIj4KPHBhdGggZD0iTTUuNzYzNzEgMTEuNzE4M0M1LjUxNDM0IDExLjcxODMgNS4yNzcyNiAxMS41OTg2IDUuMTI4NjIgMTEuMzkyNUwyLjAyNDQyIDcuMDcwOTdIMFY1LjQ5NzU4SDIuNDI0ODhDMi42NzY3MSA1LjQ5NzU4IDIuOTEyNTYgNS42MTg1MiAzLjA1OTk3IDUuODIzMzdMNS41OTY2NCA5LjM1MzkxTDkuNDY3MzcgMC40NzEzOThDOS41OTI2NiAwLjE4NTEwNCA5Ljg3Mzk3IDAgMTAuMTg0OCAwSDE1LjAyMzVWMS41NzMzOEgxMC42OTdMNi40ODExIDExLjI0NjlDNi4zNjgwOSAxMS41MDYxIDYuMTI2MDkgMTEuNjgzOCA1Ljg0NjAxIDExLjcxMzRDNS44MjAyMSAxMS43MTcxIDUuNzkxOTYgMTEuNzE4MyA1Ljc2MzcxIDExLjcxODNaIiBmaWxsPSJ3aGl0ZSIvPgo8L3N2Zz4K";
    var va = Object.defineProperty, ya = Object.getOwnPropertyDescriptor, Br = (t, e, n, r) => {
      for (var i = r > 1 ? void 0 : r ? ya(e, n) : e, o = t.length - 1, s; o >= 0; o--)
        (s = t[o]) && (i = (r ? s(e, n, i) : s(i)) || i);
      return r && i && va(e, n, i), i;
    };
    let dt = class extends s {
      constructor() {
        super(...arguments), this.loading = !1;
      }
      onClick(t) {
        this.dispatchEvent(
          new CustomEvent("onClick", {
            detail: t,
            bubbles: !0,
            composed: !0
          })
        );
      }
      render() {
        return y$1` <button part="button" @click=${this.onClick}>
        ${this.loading ? y$1`<loading-spinner />` : y$1`<slot></slot>`}</button
      ><slot></slot>`;
      }
    };
    dt.styles = i$2`
    button {
      width: 100%;
      height: 2.6rem;
      border-radius: 12px;
      border: 1px solid transparent;
      font-size: 1rem;
      font-weight: 500;
      font-family: inherit;
      transition: border-color 0.25s;
      background-color: ${Q.radixBlue};
      color: white;
      text-shadow: 0px 0.7px 6px rgba(0, 0, 0, 0.7);
      background-color: ${Q.radixBlue};
    }

    :host(:not([disabled],.disabled)) > button {
      cursor: pointer;
    }

    button::before {
      content: url(${r$2(ha)});
    }

    :host(.no-logo) > button::before {
      content: '';
    }

    :host(.gradient) > button {
      background: url(${r$2(pa)}) no-repeat;
      background-size: cover;
      width: 8.6rem;
    }

    :host(.text) > button {
      background: none;
      color: ${Q.radixBlue};
      text-shadow: 0px 0px 0px;
    }

    button:hover {
      border-color: none;
    }
    button:focus,
    button:focus-visible {
      outline: 0px auto -webkit-focus-ring-color;
    }
  `;
    Br([
      e({ type: Boolean })
    ], dt.prototype, "loading", 2);
    dt = Br([
      e$1("radix-button")
    ], dt);
    const ma = "data:image/png;base64,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", ga = "data:image/svg+xml;base64,PHN2ZyB3aWR0aD0iMTgiIGhlaWdodD0iMTgiIHZpZXdCb3g9IjAgMCAxOCAxOCIgZmlsbD0ibm9uZSIgeG1sbnM9Imh0dHA6Ly93d3cudzMub3JnLzIwMDAvc3ZnIj4KPHBhdGggZD0iTTguMjUgMTIuNzVIOS43NVY4LjI1SDguMjVWMTIuNzVaTTkgMS41QzQuODYgMS41IDEuNSA0Ljg2IDEuNSA5QzEuNSAxMy4xNCA0Ljg2IDE2LjUgOSAxNi41QzEzLjE0IDE2LjUgMTYuNSAxMy4xNCAxNi41IDlDMTYuNSA0Ljg2IDEzLjE0IDEuNSA5IDEuNVpNOSAxNUM1LjY5MjUgMTUgMyAxMi4zMDc1IDMgOUMzIDUuNjkyNSA1LjY5MjUgMyA5IDNDMTIuMzA3NSAzIDE1IDUuNjkyNSAxNSA5QzE1IDEyLjMwNzUgMTIuMzA3NSAxNSA5IDE1Wk04LjI1IDYuNzVIOS43NVY1LjI1SDguMjVWNi43NVoiIGZpbGw9IiMwNTJDQzAiLz4KPHBhdGggZD0iTTguMjUgNS4yNUg5Ljc1VjYuNzVIOC4yNVY1LjI1Wk04LjI1IDguMjVIOS43NVYxMi43NUg4LjI1VjguMjVaIiBmaWxsPSIjMDUyQ0MwIi8+CjxwYXRoIGQ9Ik05IDEuNUM0Ljg2IDEuNSAxLjUgNC44NiAxLjUgOUMxLjUgMTMuMTQgNC44NiAxNi41IDkgMTYuNUMxMy4xNCAxNi41IDE2LjUgMTMuMTQgMTYuNSA5QzE2LjUgNC44NiAxMy4xNCAxLjUgOSAxLjVaTTkgMTVDNS42OTI1IDE1IDMgMTIuMzA3NSAzIDlDMyA1LjY5MjUgNS42OTI1IDMgOSAzQzEyLjMwNzUgMyAxNSA1LjY5MjUgMTUgOUMxNSAxMi4zMDc1IDEyLjMwNzUgMTUgOSAxNVoiIGZpbGw9IiMwNTJDQzAiLz4KPC9zdmc+Cg==";
    var ba = Object.defineProperty, wa = Object.getOwnPropertyDescriptor, mt = (t, e, n, r) => {
      for (var i = r > 1 ? void 0 : r ? wa(e, n) : e, o = t.length - 1, s; o >= 0; o--)
        (s = t[o]) && (i = (r ? s(e, n, i) : s(i)) || i);
      return r && i && ba(e, n, i), i;
    };
    let Ce = class extends s {
      constructor() {
        super(), this.connected = ta(), this.loading = !1, this.showPopover = !1, this.subscriptions = new Be(), this.fontGoogleApiHref = "https://fonts.googleapis.com/css?family=IBM+Plex+Sans:400,600", this.injectFontCSS(), this.subscriptions.add(
          Ut(window, "click").pipe(
            Bn(() => this.showPopover),
            Bn((t) => !this.contains(t.target)),
            Ue(() => {
              this.showPopover = !1;
            })
          ).subscribe()
        );
      }
      injectFontCSS() {
        if (this.shouldSkipFontInjection())
          return;
        const t = document.createElement("link");
        t.setAttribute("rel", "stylesheet"), t.setAttribute("href", this.fontGoogleApiHref), document.head.append(t);
      }
      onConnect() {
        Lr.next(), this.loading = !0, this.showPopover = !1;
      }
      cancelConnect() {
        Gr.next(), this.loading = !1, this.showPopover = !1;
      }
      togglePopover() {
        this.showPopover = !this.showPopover;
      }
      connectButtonTemplate() {
        const t = this.connected ? "Connected" : "Connect", e = this.loading && !this.connected, n = `
      ${this.loading ? "no-logo" : ""} 
      ${this.connected ? "gradient" : ""}
    `, r = this.loading ? y$1`<loading-spinner class="small"></loading-spinner>` : "";
        return e ? y$1` <radix-button
          loading
          class="no-logo"
          @onClick=${this.togglePopover}
        />` : y$1`<radix-button
          class="${n}"
          @onClick=${this.togglePopover}
          >${r} ${t}</radix-button
        >`;
      }
      disconnectedCallback() {
        super.disconnectedCallback(), Wr.next(), this.subscriptions.unsubscribe();
      }
      onDisconnectWallet() {
        Cr.next(), this.showPopover = !1;
      }
      notConnectedTemplate() {
        return this.loading ? y$1`<radix-button @onClick=${this.cancelConnect}>Cancel</radix-button>` : y$1`<div class="connect--wrapper">
            <img class="logo" src=${ma} />
            <span class="connect--text">Connect your Radix Wallet</span>
          </div>
          <radix-button @onClick=${this.onConnect}>Connect Now</radix-button>
          <a href=${rn.links["What is a radix wallet?"]} target="_blank"
            >What is a Radix Wallet?</a
          >`;
      }
      popoverTemplate() {
        return this.showPopover ? y$1`<radix-popover class="popover">
          ${this.connected ? y$1`<radix-button
                class="no-logo text"
                @onClick=${this.onDisconnectWallet}
                >Disconnect Wallet</radix-button
              >` : this.notConnectedTemplate()}
        </radix-popover>` : "";
      }
      render() {
        return y$1`
      <div class="main--wrapper">
        ${this.connectButtonTemplate()} ${this.popoverTemplate()}
      </div>
    `;
      }
      shouldSkipFontInjection() {
        return !!document.head.querySelector(
          `link[href|="${this.fontGoogleApiHref}"]`
        ) || document.fonts.check("16px IBM Plex Sans");
      }
    };
    Ce.styles = i$2`
    :host {
      font-family: 'IBM Plex Sans';
      position: relative;
    }
    .main--wrapper {
      width: 8.6rem;
    }
    .popover {
      position: absolute;
      top: calc(100% + 1rem);
      right: calc(100% - 8.6rem);
    }
    .connect--wrapper {
      display: flex;
      margin-bottom: 1.5rem;
    }
    .connect--text {
      color: ${Q.radixGrey1};
      font-style: normal;
      font-size: 1.1rem;
      width: 10rem;
      margin-left: 0.9rem;
      font-weight: 600;
    }
    loading-spinner.small {
      display: inline-block;
      vertical-align: top;
    }
    .logo {
      width: 3rem;
      align-self: center;
    }
    a::before {
      position: relative;
      top: 0.2rem;
      padding-right: 0.2rem;
      content: url(${r$2(ga)});
    }
    a {
      margin-top: 1.2rem;
      text-decoration: none;
      color: ${Q.radixBlue};
      font-size: 1rem;
      font-weight: 600;
      display: inline-block;
    }
  `;
    mt([
      e({ type: Boolean })
    ], Ce.prototype, "connected", 2);
    mt([
      e({ type: Boolean })
    ], Ce.prototype, "loading", 2);
    mt([
      e({ type: Boolean })
    ], Ce.prototype, "showPopover", 2);
    Ce = mt([
      e$1(rn.elementTag)
    ], Ce);

    const walletSdk = Di$1({ dAppId: 'dashboard', logLevel: 'DEBUG' });

    console.log(walletSdk);

    $a({
        dAppId: 'dashboard',
        networkId: 34,
        logLevel: 'DEBUG',
        onConnect: ({ setState, getWalletData }) => {
          getWalletData({
            oneTimeAccountsWithoutProofOfOwnership: {},
          }).map(({ oneTimeAccounts }) => {
            setState({ connected: true });
            return oneTimeAccounts[0].address;
          }).andThen(sendTx);
        },
        onDisconnect: ({ setState }) => {
          setState({ connected: false });
        },
        onCancel() {
          console.log('Cancel Clicked');
        },
        onDestroy() {
          console.log('Button Destroyed');
        },
      });




    const app = new App({
    	target: document.body,
    	props: {
    		name: 'world'
    	}
    });

    return app;

})();
//# sourceMappingURL=bundle.js.map
