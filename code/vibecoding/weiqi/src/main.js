/* 入口：创建应用，按需运行规则自测 */
(function (W) {
  'use strict';

  function boot() {
    var app = new W.App();
    W.app = app;

    var isSelfTest = /(?:^|[?&])selftest=1(?:&|$)/.test(window.location.search);
    if (isSelfTest && W.Selftest) {
      W.Selftest.run(app);
    }
  }

  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', boot);
  } else {
    boot();
  }
})(window.WQ = window.WQ || {});
