var pins = (function (exports) {
  'use strict';

  var HOST_CALLBACKS = {};

  var get = function (name) {
    if (Object.keys(HOST_CALLBACKS).includes(name)) { return HOST_CALLBACKS[name]; }
    else { return function () {
      var args = [], len = arguments.length;
      while ( len-- ) args[ len ] = arguments[ len ];

      return null;
    }; }
  };

  var set = function (name, callback) {
    HOST_CALLBACKS[name] = callback;
  };

  var callbacks = {
    get: get,
    set: set,
  };

  var getOption = function (name, defval) {
    var option = get('getOption')(name);
    return option != null ? option : defval;
  };

  var unique = function (arr) {
    function onlyUnique(value, index, self) {
      return self.indexOf(value) === index;
    }

    return arr.filter(onlyUnique);
  };

  var concat = function (arr, value) {
    if (value !== null) {
      arr = arr.concat(value);
    }

    return arr;
  };

  var BOARDS_REGISTERED = {};

  var list = function () { return Object.keys(BOARDS_REGISTERED); };

  var get$1 = function (name) { return BOARDS_REGISTERED[name]; };

  var set$1 = function (name, board) {
    BOARDS_REGISTERED[name] = board;
  };

  var userCacheDir = function () {
    return callbacks.get('userCacheDir')('pins');
  };

  var boardCachePath = function () {
    return getOption('pins.path', userCacheDir());
  };

  var dir = Object.freeze({
    create: function create(dirPath, ref) {
      if ( ref === void 0 ) ref = { recursive: false };
      var recursive = ref.recursive;

      callbacks.get('dirCreate')(dirPath);
    },
    exists: function exists(dirPath) {
      callbacks.get('dirExists')(dirPath);
    },
  });

  var tools = Object.freeze({
    filePathSansExt: function filePathSansExt(filePath) {
      return filePath.replace(/\.[^/.]+$/, '');
    },
  });

  var boardInitializeLocal = function (board, cache) {
    var args = [], len = arguments.length - 2;
    while ( len-- > 0 ) args[ len ] = arguments[ len + 2 ];

    if (!dir.exists(board['cache']))
      { dir.create(board['cache'], { recursive: true }); }

    return board;
  };

  var boardInitialize = function (board) {
    var args = [], len = arguments.length - 1;
    while ( len-- > 0 ) args[ len ] = arguments[ len + 1 ];

    // TODO: UseMethod("board_initialize")
    return boardInitializeLocal(board, args['cache'], args);
  };

  function objectWithoutProperties (obj, exclude) { var target = {}; for (var k in obj) if (Object.prototype.hasOwnProperty.call(obj, k) && exclude.indexOf(k) === -1) target[k] = obj[k]; return target; }

  var newBoard = function (board, name, cache, versions) {
    var args = [], len = arguments.length - 4;
    while ( len-- > 0 ) args[ len ] = arguments[ len + 4 ];

    if (cache == null) { throw new Error("Please specify the 'cache' parameter."); }

    board = {
      board: board,
      name: name,
      cache: cache,
      versions: versions,
      class: board,
    };

    board = boardInitialize(board, (cache = cache), (versions = versions), args);

    return board;
  };

  var boardInfer = function (x, ref) {
    var name = ref.name;
    var board = ref.board;
    var registerCall = ref.registerCall;
    var connect = ref.connect;
    var url = ref.url;

    var inferred = {
      name: name,
      board: board == null ? name : board,
      connect: connect == null ? name !== 'packages' : connect,
      url: url,
      registerCall: registerCall,
    };

    // if boards starts with http:// or https:// assume this is a website board
    if (/^http:\/\/|^https:\/\//gi.test(x)) {
      inferred['url'] = x;
      inferred['board'] = 'datatxt';

      // use only subdomain as friendly name which is also used as cache folder
      if (name == null || x === name) {
        inferred['name'] = inferred['url']
          .replace(/https?:\/\//gi, '')
          .replace(/\\\\..*/gi, '');
      }

      inferred['registerCall'] =
        'pins::board_register(board = "datatxt", name = "' +
        inferred['name'] +
        '", url = "' +
        inferred['url'] +
        '")';
    }

    if (inferred['name'] == null) { inferred['name'] = x; }
    if (inferred['board'] == null) { inferred['board'] = x; }

    return inferred;
  };

  var boardRegisterCode = function (board, name) {
    return callbacks.get('boardRegisterCode')(board, name);
  };

  var boardConnect = function (board, code) {
    var args = [], len = arguments.length - 2;
    while ( len-- > 0 ) args[ len ] = arguments[ len + 2 ];

    var board = boardGet(board);

    callbacks.get('uiViewerRegister')(board, code);

    return board;
  };

  var boardDisconnect = function (name) {
    var args = [], len = arguments.length - 1;
    while ( len-- > 0 ) args[ len ] = arguments[ len + 1 ];

    throw 'NYI';
  };

  var boardList = function () {
    var defaults = concat(['local', 'packages'], boardDefault());
    var boards = concat(list(), defaults);

    return unique(boards);
  };

  var boardGet = function (name) {
    if (name === null) {
      name = boardDefault();
    }

    var registerCall = 'pins::board_register(board = "' + name + '")';

    if (!list().includes(name)) {
      var boardInferred = boardInfer(name);

      if (boardInferred['registerCall'] !== null) {
        registerCall = boardInferred['registerCall'];
      }

      // attempt to automatically register board
      name = boardInferred['name'];
      try {
        boardRegister(board_inferred['board'], {
          name: boardInferred['name'],
          connect: boardInferred['connect'],
          registerCall: registerCall,
          url: boardInferred['url'],
        });
      } catch (err) {}

      if (!list().includes(name)) {
        throw (
          "Board '" +
          name +
          "' not a board, available boards: " +
          boardList().join(', ')
        );
      }
    }

    return get$1(name);
  };

  var boardRegister = function (board, ref) {
    var name = ref.name;
    var cache = ref.cache;
    var versions = ref.versions;
    var rest = objectWithoutProperties( ref, ["name", "cache", "versions"] );
    var args = rest;

    if (name == null) { name = board; }
    if (cache == null) { cache = boardCachePath(); }

    var inferred = boardInfer(board, {
      board: board,
      name: name,
      registerCall: args['registerCall'],
      connect: args['connect'],
      url: args['url'],
    });

    args['url'] = inferred['url'];
    board = newBoard(inferred['board'], inferred['name'], cache, versions, args);

    set$1(inferred['name'], board);

    if (inferred['registerCall'] == null)
      { inferred['registerCall'] = boardRegisterCode(
        board['name'],
        inferred['name']
      ); }

    if (inferred['connect'] !== false)
      { boardConnect(board['name'], inferred['registerCall']); }

    return inferred['name'];
  };

  var boardDeregister = function (name) {
    var args = [], len = arguments.length - 1;
    while ( len-- > 0 ) args[ len ] = arguments[ len + 1 ];

    throw 'NYI';
  };

  var boardDefault = function () {
    return getOption('pins.board', 'local');
  };

  var METHODS = {};
  var DEFAULT_CLASS_NAME = 'default';

  var useMethod = function (methodName, object) {
    var ref;

    var args = [], len = arguments.length - 2;
    while ( len-- > 0 ) args[ len ] = arguments[ len + 2 ];
    var className =
      object && object.constructor ? object.constructor.name : DEFAULT_CLASS_NAME;

    if (METHODS[methodName] && METHODS[methodName][className]) {
      return (ref = METHODS[methodName])[className].apply(ref, args);
    }

    throw new Error(
      ("no applicable method for '" + methodName + "' applied to an object of class '" + className + "'")
    );
  };

  function objectWithoutProperties$1 (obj, exclude) { var target = {}; for (var k in obj) if (Object.prototype.hasOwnProperty.call(obj, k) && exclude.indexOf(k) === -1) target[k] = obj[k]; return target; }

  var pin = function (x) {
    var args = [], len = arguments.length - 1;
    while ( len-- > 0 ) args[ len ] = arguments[ len + 1 ];

    useMethod.apply(void 0, [ 'pin', x ].concat( args ));
  };

  var pinGet = function (
    name,
    ref
  ) {
    var board = ref.board;
    var cache = ref.cache;
    var extract = ref.extract;
    var version = ref.version;
    var files = ref.files;
    var signature = ref.signature;
    var rest = objectWithoutProperties$1( ref, ["board", "cache", "extract", "version", "files", "signature"] );

    throw 'NYI';
  };

  var pinRemove = function (name, board) {
    throw 'NYI';
  };

  var pinFind = function (ref) {
    var text = ref.text;
    var board = ref.board;
    var name = ref.name;
    var extended = ref.extended;
    var rest = objectWithoutProperties$1( ref, ["text", "board", "name", "extended"] );

    throw 'NYI';
  };

  var pinPreview = function () {
    var args = [], len = arguments.length;
    while ( len-- ) args[ len ] = arguments[ len ];

    useMethod.apply(void 0, [ 'pinPreview' ].concat( args ));
  };

  var pinLoad = function () {
    var args = [], len = arguments.length;
    while ( len-- ) args[ len ] = arguments[ len ];

    useMethod.apply(void 0, [ 'pinLoad' ].concat( args ));
  };

  var pinInfo = function (
    name,
    ref
  ) {
    var board = ref.board;
    var extended = ref.extended;
    var metadata = ref.metadata;
    var signature = ref.signature;
    var rest = objectWithoutProperties$1( ref, ["board", "extended", "metadata", "signature"] );

    throw 'NYI';
  };

  var pinFetch = function () {
    var args = [], len = arguments.length;
    while ( len-- ) args[ len ] = arguments[ len ];

    useMethod.apply(void 0, [ 'pinFetch' ].concat( args ));
  };

  var pinVersions = function (name, ref) {
    var board = ref.board;
    var full = ref.full; if ( full === void 0 ) full = false;
    var rest = objectWithoutProperties$1( ref, ["board", "full"] );

    throw 'NYI';
  };

  exports.boardConnect = boardConnect;
  exports.boardDefault = boardDefault;
  exports.boardDeregister = boardDeregister;
  exports.boardDisconnect = boardDisconnect;
  exports.boardGet = boardGet;
  exports.boardList = boardList;
  exports.boardRegister = boardRegister;
  exports.callbacks = callbacks;
  exports.pin = pin;
  exports.pinFetch = pinFetch;
  exports.pinFind = pinFind;
  exports.pinGet = pinGet;
  exports.pinInfo = pinInfo;
  exports.pinLoad = pinLoad;
  exports.pinPreview = pinPreview;
  exports.pinRemove = pinRemove;
  exports.pinVersions = pinVersions;

  return exports;

}({}));
