/*
 * Currently, ``browserify-shim`` is used for ``two.js``, as described [here][1].
 * Support for ``browserify`` [has been added on the ``dev`` branch][2].
 *
 * **TODO** Switch to using ``two.js`` node package directly once [this
 * commit][3] on the ``dev`` branch of ``two.js`` is released in the mainline
 * package.
 *
 * [1]: https://github.com/jonobr1/two.js/issues/43#issuecomment-250081235
 * [2]: https://github.com/jonobr1/two.js/issues/43#issuecomment-250240820
 * [3]: https://github.com/jonobr1/two.js/commit/bf60571398f84f71c40eaf438650fa5ec3275784
 */
global.Plotly = require('plotly.js');
global.Ajv = require('ajv');
global.Two = require('two');
global.dat = require('dat.gui');
global.io = require('socket.io-client');
global._ = require('lodash');
global._fp = require('lodash/fp');
global.THREE = require('three');
global.Key = require('keyboard-shortcut');
global.PhosphorMenus = require('phosphor-menus');
global.PhosphorWidget =require('phosphor-widget');

global.THREELine2d = {}
global.THREELine2d.Line = require('../lib/three-line-2d')(THREE);
global.THREELine2d.BasicShader = require('../lib/shaders/basic')(THREE);
global.THREELine2d.DashShader = require('./shader-dash')(THREE);
global.THREELine2d.GradientShader = require('./shader-gradient')(THREE);

global.THREELine2d.normalize = require('normalize-path-scale');
global.THREELine2d.arc = require('arc-to');
global.THREELine2d.curve = require('adaptive-bezier-curve');

require('codemirror/mode/xml/xml');
require('codemirror/mode/javascript/javascript');
require('codemirror/mode/css/css');
require('codemirror/mode/htmlmixed/htmlmixed');

global.CodeMirror = require('codemirror/lib/codemirror');
global.$ = require("jquery-slim");
global.d3 = require("d3");
global.OrbitControls = require('three-orbit-controls')(THREE);
global.Stats = require("stats-js");
global.DockPanel = require('phosphor-dockpanel').DockPanel;

global.MouseEventHandler =
    require("../lib/ThreeHelpers.MouseEventHandler.js")(THREE);
global.ThreeHelpers =
    require("../lib/ThreeHelpers.SvgPathsGroup.js")(THREE);
global.ZmqPlugin = require("../lib/zmq-plugin.js");
global.ControlPointsUI = require("../lib/d3.controlPoints.js");
global.PerspectiveTransform = require("../lib/PerspectiveTransform.js");
global.PlaneTransform = require("../lib/planeTransform.js")(THREE);
global.DataFrame = require("../lib/pandas-helpers.js").DataFrame;
global.Widgets = require("../lib/widgets.js")(THREE);
