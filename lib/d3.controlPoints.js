const Backbone = require("backbone");
const _ = require("lodash");
const d3 = require("d3");


module.exports = function ControlPointsUI() {
    var radius = 30;

    function my(selection) {
        my.selection = selection;
        my.events = {};
        my.reset_drag_direction = function () { my.drag_direction = {x: true, y: true}; }
        my.reset_drag_direction();

        // Use d3.js to provide user-draggable control points
        var rectDragBehav = d3.behavior.drag()
            .on('dragstart', function(d,i) {
              my.reset_drag_direction();
              my.events = {dragstart: _.clone(d3.event)};
            })
            .on('dragend', function(d,i) {
              my.reset_drag_direction();
              my.events = {dragend: _.clone(d3.event)};
            })
            .on('drag', function(d,i) {
                    if (d3.event.sourceEvent.ctrlKey) {
                      if (my.drag_direction.x && my.drag_direction.y &&
                          ((d3.event.dx > 0) || (d3.event.dy > 0))) {
                        my.drag_direction.x = Math.abs(d3.event.dx) >= Math.abs(d3.event.dy);
                        my.drag_direction.y = Math.abs(d3.event.dx) < Math.abs(d3.event.dy);
                        console.log(my.drag_direction, d3.event.dx, d3.event.dy);
                      }
                    } else {
                      my.reset_drag_direction();
                    }
                    for (key in my.drag_direction) {
                      if (my.drag_direction[key]) {
                        // d[key] += d3.event['d' + key];
                        d[key] = d3.event.sourceEvent['offset' + key.toUpperCase()];
                      }
                    }

                    d3.select(this)
                      .attr('cx',d.x).attr('cy',d.y);
                    my.trigger("changed", [{"d": d, "i": i}]);
                    my.events.drag = _.clone(d3.event);
                });

        var dragT = selection.enter()
          .append('circle')
            .attr('r', radius)
            .attr('class', 'control-point')
            .on('mousedown', function (d, i) {
              my.events = {mousedown: _.clone(d3.event)};
            })
            .on('mouseup', function (d, i) {
              my.events.mouseup = _.clone(d3.event);
            })
            .call(rectDragBehav);
        my.update_positions();
      return my;
    }

    my.radius = function (radius) {
      my.selection.attr('r', radius);
      return my;
    }

    my.rotate = function (n) {
      var data = _.clone(my.selection.data());
      data.unshift.apply(data, data.splice(n, data.length ))
      my.selection.data(data);
      my.trigger("changed", data.map(function (d, i) { return {"d": d, "i": i}; }));
      my.update_positions();
      return my;
    }

    my.update_positions = function () {
      my.selection
        .attr('cx', function(d) { return d.x; })
        .attr('cy', function(d) { return d.y; })
      return my;
    }

    _.extend(my, Backbone.Events);

    return my;
};
