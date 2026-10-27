/* 规则小课堂：5 节课的图文与小棋盘数据 */
(function (W) {
  'use strict';

  function stone(x, y, color) { return { x: x, y: y, color: color }; }
  function mark(x, y, type, text) { return { x: x, y: y, type: type, text: text }; }

  W.LESSONS = [
    {
      id: 'liberty-capture',
      title: '气与提子',
      subtitle: '一眼看懂棋子靠什么活着',
      steps: [
        {
          title: '什么是气',
          text: '棋子上、下、左、右紧挨着的空点，叫做“气”。中间的一颗子最多有 4 口气。',
          board: {
            size: 9,
            stones: [stone(4, 4, 1)],
            marks: [mark(3, 4, 'liberty'), mark(5, 4, 'liberty'), mark(4, 3, 'liberty'), mark(4, 5, 'liberty')],
            caption: '这块黑棋有 4 口气。'
          }
        },
        {
          title: '边和角上的气更少',
          text: '棋盘边缘会挡住一部分方向，所以边上的子只有 3 口气，角上的子只有 2 口气。',
          board: {
            size: 9,
            stones: [stone(0, 0, 1)],
            marks: [mark(1, 0, 'liberty'), mark(0, 1, 'liberty')],
            caption: '角上的黑棋只有 2 口气。'
          }
        },
        {
          title: '连在一起的棋共享气',
          text: '同色的棋子上下左右连在一起，就成为一个整体，它们的气要一起数。',
          board: {
            size: 9,
            stones: [stone(2, 4, 1), stone(3, 4, 1)],
            marks: [
              mark(1, 4, 'liberty'), mark(4, 4, 'liberty'),
              mark(2, 3, 'liberty'), mark(3, 3, 'liberty'),
              mark(2, 5, 'liberty'), mark(3, 5, 'liberty')
            ],
            caption: '这两颗黑棋连成一块，一共 6 口气。'
          }
        },
        {
          title: '堵住最后一口气就能提子',
          text: '当一块棋的气被对方全部占住，它就要被从棋盘上拿掉，这叫“提子”。',
          board: {
            size: 9,
            stones: [stone(3, 4, 1), stone(5, 4, 1), stone(4, 3, 1), stone(4, 4, 2)],
            marks: [mark(4, 5, 'liberty')],
            caption: '白棋只剩 (4,5) 一口气，黑棋下在这里就能提掉它。'
          }
        },
        {
          title: '提子的结果',
          text: '白子被提走后，它原来的位置变成空点，黑棋的这口气也就保住了。',
          board: {
            size: 9,
            stones: [stone(3, 4, 1), stone(5, 4, 1), stone(4, 3, 1), stone(4, 5, 1)],
            marks: [mark(4, 4, 'highlight')],
            caption: '白子被提掉，原来的位置空了出来。'
          }
        }
      ],
      tryIt: {
        text: '试着在 (4,5) 落子，堵住白棋最后一口气，把它提掉。',
        stones: [stone(3, 4, 1), stone(5, 4, 1), stone(4, 3, 1), stone(4, 4, 2)],
        toPlay: 1,
        check: { type: 'capture' },
        success: '提子成功！当一块棋没有气时，它就会被提掉。'
      }
    },
    {
      id: 'suicide-ko',
      title: '禁着点与自杀',
      subtitle: '有些点不能下',
      steps: [
        {
          title: '不能让自己没气',
          text: '如果落子后自己的棋一口气都没有，又不能提掉对方任何棋子，这个点就是“禁着点”，也叫自杀。',
          board: {
            size: 9,
            stones: [stone(3, 4, 2), stone(5, 4, 2), stone(4, 3, 2), stone(4, 5, 2)],
            marks: [mark(4, 4, 'illegal')],
            caption: '中间这个点被白棋四面围住，黑棋不能下。'
          }
        },
        {
          title: '能提子就不算自杀',
          text: '如果落子可以提掉对方的棋，那么即使自己暂时没有气，也是合法的。',
          board: {
            size: 9,
            stones: [stone(3, 4, 1), stone(5, 4, 1), stone(4, 3, 1), stone(4, 4, 2)],
            marks: [mark(4, 5, 'liberty')],
            caption: '黑棋下 (4,5) 能提掉白子，所以合法。'
          }
        },
        {
          title: '自己的眼通常不要填',
          text: '被自己棋子围住的空点叫“眼”。只要整块棋还有别的气，填自己的眼并不违规，但会白白减少自己的气，所以通常不要填。',
          board: {
            size: 9,
            stones: [
              stone(3, 4, 1), stone(5, 4, 1), stone(4, 3, 1), stone(4, 5, 1),
              stone(3, 3, 1), stone(3, 5, 1), stone(5, 3, 1), stone(5, 5, 1)
            ],
            marks: [mark(4, 4, 'highlight')],
            caption: '黑棋围出的这只眼，通常不会自己去填。'
          }
        }
      ],
      tryIt: {
        text: '点一下正中间 (4,4) 试试：这里能落子吗？',
        stones: [stone(3, 4, 2), stone(5, 4, 2), stone(4, 3, 2), stone(4, 5, 2)],
        toPlay: 1,
        check: { type: 'illegal', target: { x: 4, y: 4 } },
        success: '没错，这是禁着点：落子后黑棋没有气，也提不掉白棋。'
      }
    },
    {
      id: 'ko',
      title: '打劫',
      subtitle: '不能立刻提回的那一手',
      steps: [
        {
          title: '一个特殊的形状',
          text: '黑棋下在 (3,4) 可以提掉白棋一颗子，但落下的黑子也只剩一口气。',
          board: {
            size: 9,
            stones: [
              stone(2, 3, 1), stone(3, 2, 1), stone(4, 3, 1),
              stone(3, 3, 2), stone(2, 4, 2), stone(4, 4, 2), stone(3, 5, 2)
            ],
            marks: [mark(3, 4, 'highlight')],
            caption: '黑棋下 (3,4) 可以提子，但自己也会被打吃。'
          }
        },
        {
          title: '为什么不能马上提回',
          text: '如果白棋立刻下在 (3,3) 提回黑子，棋盘就会重复刚才的局面，这样会无限循环。所以规则禁止立刻提回。',
          board: {
            size: 9,
            stones: [
              stone(2, 3, 1), stone(3, 2, 1), stone(4, 3, 1), stone(3, 4, 1),
              stone(2, 4, 2), stone(4, 4, 2), stone(3, 5, 2)
            ],
            marks: [mark(3, 3, 'ko')],
            caption: '黑棋提子后，(3,3) 成为劫点，白棋不能马上提回。'
          }
        },
        {
          title: '怎样解除打劫',
          text: '白棋需要先在别处下一手（这叫“找劫材”），等黑棋应一手之后，才能回到 (3,3) 提回。这个教学版本采用简化的打劫规则。',
          board: {
            size: 9,
            stones: [
              stone(2, 3, 1), stone(3, 2, 1), stone(4, 3, 1), stone(3, 4, 1),
              stone(2, 4, 2), stone(4, 4, 2), stone(3, 5, 2)
            ],
            marks: [mark(3, 3, 'ko')],
            caption: '先在别处下一手，劫就解除了。'
          }
        }
      ],
      tryIt: {
        text: '黑先，在 (3,4) 提掉白子，看看劫点在哪里。',
        stones: [
          stone(2, 3, 1), stone(3, 2, 1), stone(4, 3, 1),
          stone(3, 3, 2), stone(2, 4, 2), stone(4, 4, 2), stone(3, 5, 2)
        ],
        toPlay: 1,
        check: { type: 'ko' },
        success: '打劫形成！注意劫点 (3,3)，白棋不能立刻提回。'
      }
    },
    {
      id: 'territory-score',
      title: '围地与数子',
      subtitle: '围棋最后比的是地盘',
      steps: [
        {
          title: '把空地围起来',
          text: '用棋子把一块空地围住，这块空地就归你。下面黑棋围住了角上的 4 个空点。',
          board: {
            size: 9,
            stones: [
              stone(2, 0, 1), stone(2, 1, 1), stone(1, 2, 1),
              stone(3, 0, 2), stone(3, 1, 2), stone(3, 2, 2),
              stone(2, 3, 2), stone(1, 3, 2), stone(0, 3, 2)
            ],
            marks: [mark(0, 0, 'territory'), mark(1, 0, 'territory'), mark(0, 1, 'territory'), mark(1, 1, 'territory')],
            caption: '黑棋围住角上 4 目空。'
          }
        },
        {
          title: '数子法',
          text: '本游戏采用中国规则数子：黑棋总分 = 黑子数 + 黑棋围空；白棋总分 = 白子数 + 白棋围空 + 贴目。',
          board: {
            size: 9,
            stones: [
              stone(2, 0, 1), stone(2, 1, 1), stone(1, 2, 1),
              stone(3, 0, 2), stone(3, 1, 2), stone(3, 2, 2),
              stone(2, 3, 2), stone(1, 3, 2), stone(0, 3, 2)
            ],
            marks: [mark(0, 0, 'territory'), mark(1, 0, 'territory'), mark(0, 1, 'territory'), mark(1, 1, 'territory')],
            caption: '黑棋：3 子 + 4 空 = 7；白棋：6 子 + 0 空 + 贴目。'
          }
        },
        {
          title: '贴目',
          text: '黑棋先走占便宜，所以终局时要给白棋补偿，叫“贴目”。9 路贴 6.5 目，13 路贴 7.5 目。',
          board: { size: 9, stones: [], marks: [], caption: '贴目让黑白双方更公平。' }
        }
      ],
      tryIt: {
        text: '黑先，在 (0,2) 封住角上的空，数一数黑棋围了几目。',
        stones: [
          stone(2, 0, 1), stone(2, 1, 1), stone(1, 2, 1),
          stone(3, 0, 2), stone(3, 1, 2), stone(3, 2, 2),
          stone(2, 3, 2), stone(1, 3, 2), stone(0, 3, 2)
        ],
        toPlay: 1,
        check: { type: 'territory', seed: { x: 0, y: 0 }, minArea: 4 },
        success: '围住了！角上这 4 个空点都归黑棋。'
      }
    },
    {
      id: 'terms',
      title: '常用术语',
      subtitle: '听懂围棋里的“行话”',
      steps: [
        {
          title: '打吃与长',
          text: '一块棋只剩一口气，叫“打吃”。被叫吃时向外多走一步、增加气，叫“长”。',
          board: {
            size: 9,
            stones: [stone(4, 4, 1), stone(3, 4, 2), stone(5, 4, 2), stone(4, 3, 2)],
            marks: [mark(4, 5, 'liberty'), mark(4, 4, 'highlight')],
            caption: '黑棋被打吃，下在 (4,5) 长一口气。'
          }
        },
        {
          title: '连与断',
          text: '同色棋子上下左右相连叫“连”。对方两颗子之间的空点被占住，使两边无法相连，叫“断”。',
          board: {
            size: 9,
            stones: [stone(3, 3, 1), stone(4, 4, 1), stone(3, 4, 2), stone(4, 3, 2)],
            marks: [mark(3, 4, 'highlight'), mark(4, 3, 'highlight')],
            caption: '白棋这两子把斜对角的黑棋隔开。'
          }
        },
        {
          title: '虎口',
          text: '三颗己方棋子围住一个空点，对方若下进去就只剩一口气，这个形状叫“虎口”。',
          board: {
            size: 9,
            stones: [stone(3, 4, 1), stone(4, 3, 1), stone(4, 5, 1)],
            marks: [mark(4, 4, 'highlight')],
            caption: '白棋下进 (4,4) 会被打吃，这就是虎口。'
          }
        },
        {
          title: '星位与天元',
          text: '棋盘上标注的小圆点叫“星位”。9 路棋盘正中央的星位叫“天元”。',
          board: {
            size: 9,
            stones: [],
            marks: [
              mark(2, 2, 'highlight'), mark(6, 2, 'highlight'),
              mark(2, 6, 'highlight'), mark(6, 6, 'highlight'),
              mark(4, 4, 'highlight')
            ],
            caption: '四个角上的星位 + 中央的天元。'
          }
        },
        {
          title: '贴目',
          text: '因为黑棋先走有优势，终局时黑棋要给白棋补偿若干目，这个补偿叫“贴目”。',
          board: { size: 9, stones: [], marks: [], caption: '9 路贴 6.5 目，13 路贴 7.5 目。' }
        }
      ],
      tryIt: null
    }
  ];

  W.LessonUtil = {
    findById: function (id) {
      for (var i = 0; i < W.LESSONS.length; i++) {
        if (W.LESSONS[i].id === id) return W.LESSONS[i];
      }
      return null;
    }
  };
})(window.WQ = window.WQ || {});
