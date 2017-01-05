const Two = require('two');
const _ = require('lodash');

var two = new Two({type: Two.Types['svg']});


module.exports = (THREE) => {
    var ThreeHelpers = {};

    ThreeHelpers.drawShapes = function (jq_selection, fillOptions, lineOptions) {
        /*
        * Create a three.js group object for element in the selection.
        *
        * Args
        * ----
        *
        *     jq_selection (jQuery selection) : Selection specifying which
        *         shapes to process.  Each shape must be compatible with
        *         the `Two.interpret` method.
        *
        * Returns
        * -------
        *
        *     (object) : Array-like object containing three.js shape
        *         objects.
        *
        */
        lineOptions = lineOptions || {color: 0x333333, linewidth: 1};
        fillOptions = fillOptions || {color: 0xffffff, wireframe: false};
        return jq_selection.map(function () {
            var shape2d = two.interpret(this);
            shape2d.visible = false;
            var shape3d = ThreeHelpers.extractShape(shape2d);

            var points = shape3d.createPointsGeometry();
            var material = new THREE.LineBasicMaterial(lineOptions);
            var outline = new THREE.Line(points, material);

            var group = new THREE.Group();
            var meshMaterial = new THREE.MeshBasicMaterial(fillOptions);
            var geometry = new THREE.ShapeGeometry(shape3d);

            var fill = new THREE.Mesh(geometry, meshMaterial);
            shape3d.autoClose = true;
            group.add(fill);
            group.add(outline);
            return group;
        });
    }

    ThreeHelpers.extractShape = function (twojs_shape) {
    /*
    * Args
    * ----
    *
    *     twojs_shape (two.js shape) : two.js shape.
    *
    * Returns
    * -------
    *
    *     (THREE.Shape) : three.js shape.
    *
    */
    var shape = new THREE.Shape();

    for (var i = 0; i < twojs_shape.vertices.length; i++) {
        var vert = twojs_shape.vertices[i];
        var prev = twojs_shape.vertices[i - 1];

        switch (vert._command) {

        case Two.Commands.move:
            shape.moveTo(vert.x, vert.y);
            break;

        case Two.Commands.line:
            shape.lineTo(vert.x, vert.y);
            break;

        case Two.Commands.curve:
            shape.bezierCurveTo(
            prev.controls.right.x + prev.x,
            prev.controls.right.y + prev.y,
            vert.controls.left.x + vert.x,
            vert.controls.left.y + vert.y, vert.x, vert.y
            );
            break;

        case Two.Commands.close:
            shape.closePath();
            break;
        }

    }

    return shape;
    }

    ThreeHelpers.SvgPathsGroup = function (jq_selection) {
        /*
        * Args
        * ----
        *
        *     jq_selection (jQuery selection) : Selection specifying which
        *         shapes to process.  Each shape must be compatible with
        *         the `Two.interpret` method.
        *
        * Returns
        * -------
        *
        *     (THREE.Group) : Group containing a sub-group for each SVG path in
        *     `jq_selection`.
        *
        */

        shapes = ThreeHelpers.drawShapes(jq_selection);

        // Create three.js group, add shapes to group.
        shapesGroup = new THREE.Group();
        $.each(shapes, function (i, shape) { shapesGroup.add(shape); })
        return shapesGroup;
    }

    ThreeHelpers.SvgGroup = function (svgImages) {
        var self = this;
        /*
        * Replace `<img>` tags having `"inject-me"` CSS class with
        * corresponding `<svg>` element.
        */

        // Elements to inject
        self.svgImages = svgImages;
        self.injectedSvgs = [];

        self.load = function () {
            // Options
            var injectorOptions = {
            evalScripts: 'once',
            each: function (svg) {
                // Callback after each SVG is injected
                self.injectedSvgs.push(svg.getAttribute('id'));
                self.shapesGroup = new ThreeHelpers.SvgPathsGroup($(svg).find("g > path"));

                var shape = two.interpret($(svg)[0]);
                self.bounding_box = shape.getBoundingClientRect();
                self.center = new THREE.Vector3(self.bounding_box.left + .5 *
                                                self.bounding_box.width,
                                                self.bounding_box.top + .5 *
                                                self.bounding_box.height, 0);

                self.trigger("loaded", svg, self.shapesGroup, self);
            }
            };

            // Trigger the injection
            SVGInjector(self.svgImages, injectorOptions,
                        function (totalSVGsInjected) {});
        }
        _.extend(self, Backbone.Events);
    }


    ThreeHelpers.verticesToShape = function (vertices) {
    /*
    * Args
    * ----
    *
    *     vertices (Array) : Array of vertex objects, each with at least the
    *         properties `x` and `y`.
    *
    * Returns
    * -------
    *
    *     (THREE.Shape) : three.js shape.
    *
    */
    var shape = new THREE.Shape();

    var vert = vertices[0];
    shape.moveTo(vert.x, vert.y);

    for (var i = 1; i < vertices.length; i++) {
        vert = vertices[i];

        shape.lineTo(vert.x, vert.y);
    }

    return shape;
    }


    ThreeHelpers.shapesById = function(df_i) {
        /*
        * Args
        * ----
        *
        *     df_i (DataFrame) : Data frame containing at least the columns `id`,
        *         `vertex_i`, `x`, and `y`, where each row corresponds to a single
        *         vertex for shape identified by `id`.
        *
        * Returns
        * -------
        *
        *     (Object) : Mapping from each shape `id` to a corresponding
        *         `THREE.Shape`.
        */
        return _fp.mapValues(_fp.flow(_fp.sortBy("vertex_i"),
                                    ThreeHelpers
                                    .verticesToShape))(df_i
                                                        .groupRecordsBy("id"));
    }


    function boundingBox(df_i) {
        var xyStats_i = df_i.pick(["x", "y"]).describe()
        var bbox_i = _.fromPairs(_.zip(["width", "height"], _fp.at(["x", "y"])
                                    (_fp.mapValues(
                                        _fp.flow(_fp.at(["max", "min"]),
                                                    _.spread(_.subtract)))
                                        (xyStats_i))));
        bbox_i.top = xyStats_i.y.min;
        bbox_i.left = xyStats_i.x.min;
        bbox_i.bottom = bbox_i.top + bbox_i.height;
        bbox_i.right = bbox_i.left + bbox_i.width;
        return bbox_i;
    }


    var shapeGroup = function (shape, lineOptions, fillOptions) {
        lineOptions = lineOptions || {color: 0x333333, linewidth: 1};
        fillOptions = fillOptions || {color: 0xffffff, wireframe: false};

        var points = shape.createPointsGeometry();
        var material = new THREE.LineBasicMaterial(lineOptions);
        var outline = new THREE.Line(points, material);

        var group = new THREE.Group();
        var meshMaterial = new THREE.MeshBasicMaterial(fillOptions);
        var geometry = new THREE.ShapeGeometry(shape);

        var fill = new THREE.Mesh(geometry, meshMaterial);
        shape.autoClose = true;
        group.add(fill);
        group.add(outline);
        return group;
    }

    /******************************************************************************
    * Functions for drawing circles at shape centers
    *****************************************************************************/
    var COLORS = {'light blue': new THREE.Color(136/255., 189/255., 230/255.),
                'light green': new THREE.Color(144/255., 205/255., 151/255.),
                'red': new THREE.Color(1, 0, 0),
                'green': new THREE.Color(0, 1, 0),
                'blue': new THREE.Color(0, 0, 1),
                'medium green': new THREE.Color(96/255., 189/255., 104/255.)}


    function getMedian(args) {
    // See here: https://gist.github.com/caseyjustus/1166258
    if (!args.length) {return 0};
    var numbers = args.slice(0).sort((a,b) => a - b);
    var middle = Math.floor(numbers.length / 2);
    var isEven = numbers.length % 2 === 0;
    return isEven ? (numbers[middle] + numbers[middle - 1]) / 2 : numbers[middle];
    }


    var f_circle_at = (position, radius, material, geometry) => {
        var radius = radius || 1;
        var geometry = geometry || new THREE.CircleGeometry(radius, 64);
        var material = material || new THREE.MeshBasicMaterial({transparent: true,
                                                                opacity: 0});
        var result = new THREE.Mesh(geometry, material);
        _.assign(result.position, position);
        return result;
    }


    var f_circles = (radius, material, geometry) =>
        _fp.mapValues(_.partialRight(f_circle_at, radius, material, geometry));


    var f_sizes = _fp.pipe(_fp.map(_fp.at(["width", "height"])), _fp.unzip,
                        _fp.zipObject(["width", "height"]));

    var f_set_attr_properties = (objs, attr, properties) =>
        _fp.forEach(_fp.pipe(_fp.get(attr),
                    _.partialRight(_.assign, properties)))(objs);

    _.merge(ThreeHelpers, {COLORS: COLORS,
                           boundingBox: boundingBox,
                           shapeGroup: shapeGroup,
                           getMedian: getMedian,
                           f_circle_at: f_circle_at,
                           f_circles: f_circles,
                           f_sizes: f_sizes,
                           f_set_attr_properties: f_set_attr_properties});
    return ThreeHelpers;
}
