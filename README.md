# Develop #

Install dependencies:

    npm install

Patch node modules:

    xcopy patches\dat.gui node_modules\dat.gui

Build bundle:

    npm run build


## Included Libraries ##

**TODO: Refactor each of the following libraries into a separate `node`
package, which can then be included as a dependency in `package.json`.**

The following libraries are currently included in the `lib` directory:

 - `d3.controlPoints.js`:
     * Library to draw one or more "control points", which can be dragged
       around to change point positions.
     * Triggers `"changed"` event when the position of any control point
       changes, where the only argument passed to the callback is an array of
       control point objects.
 - `pandas-helpers.js`:
     * Defines `DataFrame` class, providing a similar interface to a Python
       Pandas `DataFrame`.
 - `PerspectiveTransform.js`:
     * Defines functions used to compute a transformation matrix corresponding
       to a perspective warp.
     * Used to correct for webcam video viewing angle.
 - `planeTransform.js`:
     * Defines `PlaneTransform` class to manage the transformation of a video
       rendered on a Three.js plane.
     * Uses `PerspectiveTransform.js` for computing transform matrix for video.
 - `ThreeHelpers.MouseEventHandler.js`:
     * Triggers the following interaction events for a specified set of objects
       in a Three.js scene:
         - `'click'`
         - `'contextmenu'` (i.e., right-click)
         - `'mousedown'`
         - `'mousemove'`
         - `'mouseup'`
 - `ThreeHelpers.SvgPathsGroup.js`:
     * Defines functions to help load SVG path shapes into a Three.js scene.
 - `widgets.js`:
     * Defines the following Phosphor JS widgets:
         - `DatGuiWidget`: Widget wrapper for a `dat.gui` dialog.
         - `ThreeRendererWidget`: Widget container for a Three.js renderer
           (through a `<canvas>` tag), along with an SVG overlay layer (e.g.,
           for adding control points as overlay on video).
 - `zmq-plugin.js`:
     * Defines `decode_content_data` function to decode data from Zero MQ
       plugin hub (received through web sockets proxy).
