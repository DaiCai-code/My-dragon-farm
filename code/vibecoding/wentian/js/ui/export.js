/**
 * 打印 / 导出 PDF
 * ------------------------------------------------------------------
 * 复用 css 里已有的 @media print 白底样式，点击后调浏览器自带打印，
 * 用户在打印对话框里选「另存为 PDF」即可。
 *
 * 打印前必须把所有 <details> 展开，否则折叠起来的大运与六维不会进纸面；
 * 打印结束后再恢复原来的开合状态。
 */
(function (WT) {
  'use strict';

  var opened = [];

  function openAll() {
    opened = [];
    // 只展开正文大块；「依据」那些小折叠保持收起，否则纸面会被推导过程撑爆
    var list = document.querySelectorAll('#result-wrap details.dy-item, #result-wrap details.topic-item');
    Array.prototype.forEach.call(list, function (d) {
      if (!d.open) {
        opened.push(d);
        d.open = true;
      }
    });
  }

  function restore() {
    opened.forEach(function (d) { d.open = false; });
    opened = [];
  }

  function print() {
    openAll();
    // 展开后需要一帧让布局稳定，否则首屏可能截在旧高度上
    window.setTimeout(function () {
      window.print();
      window.setTimeout(restore, 200);
    }, 60);
  }

  WT.exporter = { print: print };
})(window.WT = window.WT || {});
