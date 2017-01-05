const d3 = require("d3");
const $ = require("jquery-slim");


module.exports = (THREE) => {
    class PlaneTransform {
        constructor(scene, camera, renderer) {
            this.scene = scene;
            this.camera = camera;
            this.renderer = renderer;
            this.frame = 0;
            this.displayHandles = false;
            this.prevDisplayHandles = true;
            this.updatePos = true;
            this.prev_anchor_array = [];

            this.init();
        }

        init(){
            //webcam detection
            this.video = document.createElement("video");
            var video = this.video;
            var hasUserMedia = navigator.webkitGetUserMedia ? true : false;
            // Detect `navigator.getUserMedia` cross-browser.
            navigator.getUserMedia = (navigator.getUserMedia ||
                                      navigator.webkitGetUserMedia ||
                                      navigator.mozGetUserMedia ||
                                      navigator.msGetUserMedia);
            // Detect `window.URL` cross-browser.
            window.URL = (window.URL || window.webkitURL || window.mozURL ||
                          window.msURL);
            navigator.getUserMedia(
                {video: {optional: [{minWidth: 320},
                                    {minWidth: 640},
                                    {minWidth: 1024},
                                    {minWidth: 1280},
                                    {minWidth: 1920},
                                    {minWidth: 2560}]}},
                (stream) => {
                    this.video.src = URL.createObjectURL(stream);
                    this.initVideo();
                },
                function(error){
                    console.log("Failed to get a stream due to", error);
                });

            var size = this.renderer.getSize();
            //draw the plane and add diagonal ratios
            this.geometry = new THREE.PlaneBufferGeometry(size.width,
                                                          size.height, 1, 1);
            var diagonalRatios = new Float32Array(4);
            for (var i = 0; i < 4; i++) {
                diagonalRatios[0] = 1.0;
            }
            this.geometry.addAttribute('diagonalRatio', new
                                       THREE.BufferAttribute(diagonalRatios, 1));
        }

        initVideo() {
            //add video texture
            this.videoTexture = new THREE.Texture(this.video);
            this.videoTexture.minFilter = THREE.NearestFilter;
            this.videoTexture.magFilter = THREE.NearestFilter;

            var customUniforms = {
                uSampler: {
                type: "t",
                value: this.videoTexture
                },
            };

            var vertexShader = `
            varying vec4 textureCoord;
            attribute float diagonalRatio;
            void main() {
                textureCoord = vec4(uv.xy, 0.0, 1.0);
                textureCoord.w = diagonalRatio;
                textureCoord.xy *= textureCoord.w;
                gl_Position = projectionMatrix * modelViewMatrix * vec4(position, 1.0);
            }`;

            var fragmentShader = `
            uniform sampler2D uSampler;
            varying vec4 textureCoord;
            void main() {
                gl_FragColor = texture2D(uSampler, textureCoord.xy/textureCoord.w);
            }`;

            var customMaterial = new THREE.ShaderMaterial({
                uniforms: customUniforms,
                side: THREE.DoubleSide,
                vertexShader: vertexShader,
                fragmentShader: fragmentShader
            });

            this.mesh = new THREE.Mesh(this.geometry, customMaterial);
            this.scene.add(this.mesh);

            var diagonalRatios = this.calculateDiagonalRatios();
            if(diagonalRatios){
                for (var i = 0; i < 4; i++) {
                    this.geometry.attributes.diagonalRatio.array[i] = diagonalRatios[i];
                }
            }
            this.updateCorners();
        }

        update_geometry_array(geometry_array) {
            var array = this.geometry.attributes.position.array;
            return (_fp.forEach.convert({"cap": false})
                    ((value, i) => { array[i] = value; }))(geometry_array);
        }

        update_geometry_positions(geometry_positions) {
            /* Convert geometry position array of size 12 = 3 (i.e., x, y,
             * z) * 4 points to 4 objects with x and y attributes. */
            var array = f_geometry_array(geometry_positions);
            return this.update_geometry_array(array);
        }

        set_anchors(anchor_positions) {
            var anchor_array = f_positions_array_2d(anchor_positions);

            if(this.updatePos){
                if(this.prev_anchor_array.length < 4) {
                    this.prev_anchor_array = _.clone(anchor_array);
                }
                var transform =
                    PerspectiveTransform
                    .getNormalizationCoefficients(this.prev_anchor_array,
                                                  anchor_array);

                var geometry_array = this.geometry.attributes.position.array;

                /* Convert geometry position array of size 12 = 3 (i.e., x, y,
                 * z) * 4 points to 4 objects with x and y attributes. */
                var geometry_positions = f_geometry_positions(geometry_array);

                geometry_positions = _fp.map(f_transform(transform))
                                     (geometry_positions);
                geometry_array = f_geometry_array(geometry_positions);
                this.update_geometry_array(geometry_array);
            }
            this.prev_anchor_array = _.clone(anchor_array);

            //new diagonal ratios
            var diagonalRatios = this.calculateDiagonalRatios();
            if(diagonalRatios){
                var array = this.geometry.attributes.diagonalRatio.array;
                _.forEach(diagonalRatios, (value, i) => { array[i] = value });
            }
            this.updateCorners();
        }

        updateCorners() {
            this.geometry.attributes.position.needsUpdate = true;
            this.geometry.attributes.diagonalRatio.needsUpdate = true;
        }

        update() {
            this.frame += 1;
            if( this.video.readyState === this.video.HAVE_ENOUGH_DATA ){
                this.videoTexture.needsUpdate = true;
            }
            this.renderer.render(this.scene, this.camera);
        }

        calculateDiagonalRatios() {
            if(this.geometry === undefined)
                return false;

            //four corners (top right, bottom right... etc)
            var tr, br, tl, bl;
            tr = [this.geometry.attributes.position.array[3],
                  this.geometry.attributes.position.array[4]];
            br = [this.geometry.attributes.position.array[9],
                  this.geometry.attributes.position.array[10]]
            bl = [this.geometry.attributes.position.array[6],
                  this.geometry.attributes.position.array[7]]
            tl = [this.geometry.attributes.position.array[0],
                  this.geometry.attributes.position.array[1]]
            var slope1 = (tr[1] - bl[1])/(tr[0] - bl[0]);
            var slope2 = (tl[1] - br[1])/(tl[0] - br[0]);

            if (slope1 == slope2)
                return false;

            var intx = ((tr[1] - tl[1] - (slope1 * tr[0] - slope2 * tl[0])) /
                        (slope2 - slope1));
            var inty = slope1 * (intx - tr[0]) + tr[1];

            var dis1 = this.calculateDistance(intx, inty, tr[0], tr[1]);
            var dis2 = this.calculateDistance(intx, inty, br[0], br[1]);
            var dis3 = this.calculateDistance(intx, inty, tl[0], tl[1]);
            var dis4 = this.calculateDistance(intx, inty, bl[0], bl[1]);

            if(!(dis1 && dis2 && dis3 && dis4))
                return false;

            return [(dis2 + dis3) / dis2, (dis1 + dis4) / dis4,
                    (dis1 + dis4) / dis1, (dis2 + dis3) / dis3];
        }

        calculateDistance(x1, y1, x2, y2){
            return Math.sqrt((x1 - x2) * (x1 - x2) + (y1 - y2) * (y1 - y2));
        }

        getUpdatedPosArray(array, M, dim){
            var newArray = [];

            for(var i = 0; i < array.length/dim; i ++){
                var result = this.getUpdatedPos(array[dim*i], array[dim*i+1], M);
                newArray.push(result[0]);
                newArray.push(result[1]);
                if(dim == 3)
                    newArray.push(0.0);
            }
            return newArray;
        }

        rotateLeft(){
            this.controlPoints.unshift(this.controlPoints.pop());
            this.onControlPointChange(null);
        }

        rotateRight(){
            this.controlPoints.push(this.controlPoints.shift());
            this.onControlPointChange(null);
        }

        flipHorizontal(){
            //1234-> 4321
            this.rotateRight();
            var temp = this.controlPoints[1];
            this.controlPoints[1] = this.controlPoints[3];
            this.controlPoints[3] = temp;
            this.onControlPointChange(null);
        }

        flipVertical(){
            //1234-> 2143
            this.rotateLeft();
            var temp = this.controlPoints[1];
            this.controlPoints[1] = this.controlPoints[3];
            this.controlPoints[3] = temp;
            this.onControlPointChange(null);
        }
    }

    return PlaneTransform;
}


/* Convert geometry position array with length 3 (i.e., x, y, z) times the
 * number of points to objects with x and y attributes.
 *
 * See also
 * --------
 * `f_geometry_array` for inverse operation. */
var f_geometry_positions = _fp.pipe(_fp.chunk(3), _fp.map(_fp.zipObject(["x", "y"])));
/* Convert objects with x and y attributes to geometry position array of length
 * 3 (i.e., x, y, z) times the number of points.
 *
 * See also
 * --------
 * `f_geometry_positions` for inverse operation. */
var f_geometry_array = _fp.pipe(_fp.map(_fp.pipe(_fp.at(["x", "y"]),
                                _.partialRight(_.concat, [0]))),
                                _fp.spread(_.concat));
/* Transform positions (as objects with x and y attributes) according to
 * perspective transform matrix to positions as objects with x and y
 * attributes. */
function getUpdatedPos(x, y, M) {
    var W = x*M[6] + y*M[7] + M[8];
    var X = x*M[0]/W + y*M[1]/W + M[2]/W;
    var Y = x*M[3]/W + y*M[4]/W + M[5]/W;
    return [X, Y];
}

var f_transform = (transform) =>
    _fp.pipe(_fp.at(["x", "y"]),
             _.spread(_.partialRight(getUpdatedPos, transform)),
             _fp.zipObject(["x", "y"]));
var f_positions_array_2d = _fp.pipe(_fp.map(_fp.at(["x", "y"])),
                                    _fp.spread(_.concat));
