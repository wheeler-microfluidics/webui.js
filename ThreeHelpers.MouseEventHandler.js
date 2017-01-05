const _ = require("lodash");
const Backbone = require("backbone");


module.exports = (THREE) => function MouseEventHandler(options) {
    /*
     * Parameters
     * ----------
     * options : object
     *     **MUST** contain the following keys:
     *      - `camera`: THREE.Camera
     *      - `shapes`: Array or map containing THREE.Mesh objects.
     *      - `element`: DOM canvas element that is bound to Three.js
     *        rendering.
     */
    var self = this;

    self.options = options;
    self.mouse = new THREE.Vector2();
    self.raycaster = new THREE.Raycaster();
    self.activeShape = null;
    self.enabled = false;
    // Wrap element as jQuery selection.
    self.options.element = $(self.options.element);
    if (!_.isArray(self.options.shapes)) {
        // Assume `options.shapes` is a mapping instead of an `Array`.
        self.options.shapes = _.values(self.options.shapes);
    }

    self.onMouseMove = function (event) {
        /* Triggers:
         *
         *  - `mouseover(x, y, intersection)`
         *  - `mouseout(x, y, intersection)`
         *
         * where:
         *
         *  - `x, y` are in ([-1, 1], [-1, 1]) relative to the canvas.
         *  - `intersection` contains:
         *      * `point`: Point in WebGL/three.js scene space where
         *        intersection occurred.
         *      * `object`: Reference to `THREE.Mesh`.
         */
        // Translate event coordinate from DOM space ([0, width], [0, height])
        // to GL space ([-1, 1], [-1, 1]).
        event = _.clone(event);
        self.mouse.x = ((event.offsetX / self.options.element.width()) * 2
                        - 1);
        self.mouse.y = (-(event.offsetY / self.options.element.height()) *
                        2 + 1);

        // Adjust ray caster vector based on current camera position.
        self.raycaster.setFromCamera(self.mouse, self.options.camera);

        // Find all SVG paths that intersect with ray caster vector.
        var intersects = self.raycaster.intersectObjects(self.options
                                                         .shapes);
        if (intersects.length > 0) {
            var intersection = intersects[0];
            var activeGeometryId = ((self.activeShape == null) ? null :
                                    self.activeShape.object.geometry.id);
            var shapeGeometryId = intersection.object.geometry.id;
            if (activeGeometryId != shapeGeometryId) {
                if (self.activeShape) {
                    self.trigger("mouseout", self.mouse.x, self.mouse.y,
                                 self.activeShape);
                }
                self.activeShape = intersection;
                self.trigger("mouseover", self.mouse.x, self.mouse.y,
                             intersection, event);
            }
            self.trigger("mousemove", self.mouse.x, self.mouse.y,
                         intersection, event);
        } else if (self.activeShape) {
            var intersection = self.activeShape;
            self.activeShape = null;
            self.trigger("mouseout", self.mouse.x, self.mouse.y, intersection,
                         event);
        }
    }

    self.onMouseUp = function (event) {
        self.onIntersectionEvent(event, (x, y, intersects, event_i) =>
                                 self.trigger("mouseup", x, y, intersects,
                                              event_i));
    }

    self.onMouseDown = function (event) {
        self.onIntersectionEvent(event, (x, y, intersects, event_i) =>
                                 self.trigger("mousedown", x, y, intersects,
                                              event_i));
    }

    self.onClick = function (event) {
        self.onIntersectionEvent(event, (x, y, intersects, event_i) =>
                                 self.trigger("clicked", x, y, intersects,
                                              event_i));
    }

    self.onContextMenu = function (event) {
        event.preventDefault();
        self.onIntersectionEvent(event, (x, y, intersects, event_i) =>
                                 self.trigger("contextmenu", x, y, intersects,
                                              event_i));
    }

    self.onIntersectionEvent = function (event, trigger) {
        /* Triggers:
         *
         *  - `clicked(x, y, intersections)`
         *
         * where:
         *
         *  - `x, y` are in ([-1, 1], [-1, 1]) relative to the canvas.
         *  - `intersections` is an `Array` of objects, where each object
         *    contains:
         *      * `point`: Point in WebGL/three.js scene space where
         *        intersection occurred.
         *      * `object`: Reference to `THREE.Mesh`.
         */
        event = _.clone(event);
        // Translate event coordinate from DOM space ([0, width], [0, height])
        // to GL space ([-1, 1], [-1, 1]).
        self.mouse.x = ((event.offsetX / self.options.element.width()) * 2
                        - 1);
        self.mouse.y = (-(event.offsetY / self.options.element.height()) *
                        2 + 1);

        // Adjust ray caster vector based on current camera position.
        self.raycaster.setFromCamera(self.mouse, self.options.camera);

        // Find all SVG paths that intersect with ray caster vector.
        var intersects = self.raycaster.intersectObjects(self.options
                                                         .shapes);
        if ((intersects.length > 0) && trigger) {
            // SVG path was clicked.
            trigger(self.mouse.x, self.mouse.y, intersects, event);
        }
    }

    self.enable = function() {
        self.options.element.on('click', self.onClick);
        self.options.element.on('contextmenu', self.onContextMenu);
        self.options.element.on('mousedown', self.onMouseDown);
        self.options.element.on('mousemove', self.onMouseMove);
        self.options.element.on('mouseup', self.onMouseUp);
        self.enabled = true;
    }

    self.disable = function() {
        self.options.element.off('click', self.onClick);
        self.options.element.off('contextmenu', self.onContextMenu);
        self.options.element.off('mousedown', self.onMouseDown);
        self.options.element.off('mousemove', self.onMouseMove);
        self.options.element.off('mouseup', self.onMouseUp);
        self.enabled = false;
    }
    _.extend(self, Backbone.Events);
    self.enable();
};
