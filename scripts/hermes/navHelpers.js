const fiberHelpers = `
  function fiberName(fiber) {
    if (!fiber || !fiber.type) return '';
    var t = fiber.type;
    if (typeof t === 'string') return t;
    if (t && typeof t === 'object' && t.type) {
      var inner = t.type;
      return inner.displayName || inner.name || 'Memo';
    }
    return t.displayName || t.name || (t.render && t.render.displayName) || '';
  }

  function walkAll(fiber, depth, visit) {
    if (!fiber || depth > 700) return;
    visit(fiber, depth);
    walkAll(fiber.child, depth + 1, visit);
    walkAll(fiber.sibling, depth, visit);
  }

  function getRoots(hook) {
    var roots = [];
    hook.renderers.forEach(function(_, rendererID) {
      hook.getFiberRoots(rendererID).forEach(function(root) {
        roots.push(root.current || root);
      });
    });
    return roots;
  }

  function collectNavigations(hook) {
    var candidates = [];
    getRoots(hook).forEach(function(root) {
      walkAll(root, 0, function(fiber) {
        var props = fiber.memoizedProps || {};
        if (props.navigation && typeof props.navigation.navigate === 'function') {
          candidates.push(props.navigation);
        }
      });
    });
    return candidates;
  }

  function findNavWithRoute(hook, routeName) {
    var candidates = collectNavigations(hook);
    for (var i = 0; i < candidates.length; i++) {
      try {
        var names = candidates[i].getState && candidates[i].getState().routeNames;
        if (names && names.indexOf(routeName) >= 0) return candidates[i];
      } catch (e) {}
    }
    for (var j = 0; j < candidates.length; j++) {
      var n = candidates[j];
      for (var d = 0; d < 14 && n; d++) {
        try {
          var rn = n.getState && n.getState().routeNames;
          if (rn && rn.indexOf(routeName) >= 0) return n;
        } catch (e2) {}
        n = n.getParent && n.getParent();
      }
    }
    return null;
  }

  function navigateDrawerScreen(hook, screen, nested) {
    var drawer = findNavWithRoute(hook, screen);
    if (drawer) {
      drawer.navigate(screen, nested || undefined);
      return { ok: true, via: 'drawer', screen: screen };
    }
    return { ok: false, error: 'navigation introuvable pour ' + screen };
  }
`;

function buildNavigateExpression(screen, nestedParams) {
  const nestedLiteral = nestedParams
    ? `, ${JSON.stringify(nestedParams)}`
    : '';
  return `(function(){
  ${fiberHelpers}
  var hook = globalThis.__REACT_DEVTOOLS_GLOBAL_HOOK__;
  if (!hook) return JSON.stringify({ error: 'Pas de hook React' });
  var result = navigateDrawerScreen(hook, ${JSON.stringify(screen)}${nestedLiteral});
  return JSON.stringify(result.ok ? { navigated: true, route: ${JSON.stringify(screen)}, via: result.via } : { error: result.error });
})()`;
}

function buildNavigateHomeExpression() {
  return `(function(){
  ${fiberHelpers}
  var hook = globalThis.__REACT_DEVTOOLS_GLOBAL_HOOK__;
  if (!hook) return JSON.stringify({ error: 'Pas de hook React' });
  var drawer = findNavWithRoute(hook, 'BottomTabs') || findNavWithRoute(hook, 'DrawerNavigator');
  if (!drawer) return JSON.stringify({ error: 'drawer introuvable' });
  try {
    drawer.navigate('BottomTabs', { screen: 'Home', params: { screen: 'HomeScreen' } });
    return JSON.stringify({ ok: true, route: 'HomeScreen' });
  } catch (e) {
    return JSON.stringify({ error: String(e) });
  }
})()`;
}

module.exports = {
  fiberHelpers,
  buildNavigateExpression,
  buildNavigateHomeExpression,
};
