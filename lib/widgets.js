'use strict';

const Message = require('phosphor-messaging');
const PhosphorWidget =require('phosphor-widget');
const ResizeMessage = PhosphorWidget.ResizeMessage;
const Widget = PhosphorWidget.Widget;
const $ = require('jquery-slim');
const dat = require('dat.gui');
const Backbone = require('backbone');
global.JsonEditor = require('json-editor');


module.exports = (THREE) => {
  /**
   * A widget which hosts a dat.GUI.
   */
  class DatGuiWidget extends Widget {
    constructor(config=null) {
      super();
      this.addClass('DatGuiWidget');
      this._gui = new dat.GUI(config);
      this.node.appendChild(this._gui.domElement);
    }

    get gui() {
      return this._gui;
    }

    onAfterAttach(msg) {}

    onResize(msg) {
      if (msg.width >= 0) {
        // Resize `dat.GUI` element to fill width of `Widget`.
        $(this.node).find("div").width(null).attr("style", null);
        // Hide close button, since widget position, etc. is managed as a
        // phosphor widget.
        $(".close-button").hide();
      }
    }
  }


  /**
   * A widget which hosts a `three.js` WebGL renderer.
   */
  class ThreeRendererWidget extends Widget {
    constructor(rendererSettings={}, cameraSettings={}){
      super();
      this.addClass('ThreeRendererWidget');
      this._scene = new THREE.Scene();
      this._canvas = document.createElement('canvas');
      $(this._canvas).css({position: "absolute"});
      //for the control points
      this._control_handles_element = document.createElement('svg');
      $(this._control_handles_element).css({position: "absolute"});

      rendererSettings.canvas = this._canvas;
      this._renderer = new THREE.WebGLRenderer(rendererSettings);
      this._camera = new THREE.PerspectiveCamera(cameraSettings.fov,
                                                 cameraSettings.aspect,
                                                 cameraSettings.near,
                                                 cameraSettings.far);
      this._scene.add(this._camera);
      this._canvas_ready = false;
      this._tanFOV = null;
      this._renderer.render(this._scene, this._camera);
      this.node.appendChild(this._canvas);
      this.node.appendChild(this._control_handles_element);
      _.extend(this, Backbone.Events);
    }

    get camera() { return this._camera; }
    get control_handles_element() { return this._control_handles_element; }
    get canvas() { return this._canvas; }
    get renderer() { return this._renderer; }
    get scene() { return this._scene; }

    update() {
      this.renderer.render(this.scene, this.camera);
    }

    onAfterAttach(msg) {}

    onResize(msg) {
      if (msg.width >= 0 || msg.height >= 0) {
        $(this.canvas).height(msg.height);
        $(this.canvas).width(msg.width);

        this.renderer.setSize(msg.width, msg.height);

        this._camera.position.z = msg.width;
        this._camera.aspect = msg.width / msg.height;
        console.log("resize", this._init_height, msg.height, this.camera.aspect);
        this.camera.updateProjectionMatrix();
        this.trigger("onResize", msg);
      }
    }
  }

  /**
   * A widget which hosts a [JSONEditor][1].
   *
   * [1]: https://github.com/jdorn/json-editor
   */
  class JsonEditorWidget extends Widget {
    constructor(options={}){
      super();
      options = _.merge(_.clone(window.JSONEditor.default.options), options);
      this._options = null;
      this._editor = null;
      this.options = options;
      this.addClass('JsonEditorWidget');
      _.extend(this, Backbone.Events);
    }

    get value() { return this.editor.getValue(); }
    set value(value) { this.editor.setValue(value); }

    get editor() { return this._editor; }
    get options() { return this._options; }
    set options(value) {
        if (this._editor) { this._editor.destroy(); }
        this._editor = new window.JSONEditor(this.node, value);
        this._options = _.clone(value);
    }
  }

  return {ThreeRendererWidget: ThreeRendererWidget,
          DatGuiWidget: DatGuiWidget,
          JsonEditorWidget: JsonEditorWidget};
}
