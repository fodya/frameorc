import { attach, c, frag, operator, hook, append } from './dom.js';
import { Builder } from './builder.js';

let i;
let state;
let ctx;

export const Val = (arg) => {
  const j = i++;
  state[j] ??= arg;
  const val = ctx.container.Ref(state, j);
  return [val(), v => val(v)];
}

const Component_ = (render, is) => (...args) => {
  let vnodeCtx;
  const updateNode = (vnode) => {
    const [prevI, prevState, prevCtx] = [i, state, ctx];
    
    [i, state, ctx] = [0, vnode.data.state, vnodeCtx];
    let newVnode;
    try { newVnode = render(...args); }
    catch (e) { console.error(e); newVnode = frag(); }
    vnode.data.state = state;
    vnode.children = [];
    console.log(vnode, newVnode);
    append(newVnode, vnode, ctx);
    
    [i, state, ctx] = [prevI, prevState, prevCtx];
  }
  
  return frag(
    operator((vnode, ctx) => {
      vnode.data.is = is;
      vnodeCtx = ctx;
    }),
    hook
      .init(vnode => {
        vnode.data.state = [];
        updateNode(vnode);
      })
      .prepatch((oldVnode, vnode) => {
        vnode.data.state = oldVnode.data.state;
        updateNode(vnode);
      })
  );
}

export const Component = (render) => Component_(render, render);
Component.inline = render => Component_(render, render.toString())();

export function ShadowRoot(f) {
  let cont;
  function create(_, n) {
    cont = attach(n.elm.attachShadow({ mode: "open" }));
    f(cont);
  }
  function destroy(n) {
    cont.stop?.();
  }
  return c[f.name ?? 'Div'](hook.create(create).destroy(destroy));
}

