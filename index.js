const vertex = `#version 300 es
in vec4 a_position;

void main() {
  gl_Position = a_position;
}
`;

const fragment = `#version 300 es
#define MAX_POINT_COUNT (4)
precision highp float;

uniform vec2 u_ScreenSize;
uniform vec2 u_PointCoords[MAX_POINT_COUNT];
uniform vec4 u_PointColors[MAX_POINT_COUNT];
out vec4 fragColor;

void main() {
  vec2 uv = gl_FragCoord.xy / u_ScreenSize * 2.0 - 1.0;
  uv.x *= u_ScreenSize.x / u_ScreenSize.y;

  float minDist = 1e9;
  int minPointId = -1;
  for (int i = 0; i < u_PointCoords.length(); i++) {
    vec2 v = u_PointCoords[i] - uv;
    float d = dot(v, v);
    if (d < minDist) {
      minPointId = i;
      minDist = d;
    }
  }

  if (minDist < 5e-5) fragColor = vec4(0, 0, 0, 1);
  else fragColor = u_PointColors[minPointId];
}
`;


/**
 * @param {WebGL2RenderingContext} gl
 * @param {String} source
 * @param {number} type
 */
function compileShader(gl, source, type) {
  const shader = gl.createShader(type);
  gl.shaderSource(shader, source);
  gl.compileShader(shader);
  // TODO: error report
  return shader;
}


/** @param {WebGL2RenderingContext} gl */
function createProgram(gl, vertex, fragment) {
  const vert = compileShader(gl, vertex, gl.VERTEX_SHADER),
        frag = compileShader(gl, fragment, gl.FRAGMENT_SHADER);

  const prog = gl.createProgram();
  gl.attachShader(prog, vert);
  gl.attachShader(prog, frag);
  gl.linkProgram(prog);

  gl.deleteShader(vert), gl.deleteShader(frag);
  return prog;
}

function main() {
  const canvas = document.querySelector(".canvas");
  const dpr = window.devicePixelRatio;
  const {width, height} = canvas.getBoundingClientRect();
  canvas.width  = Math.round(width * dpr);
  canvas.height = Math.round(height * dpr);

  /** @type {WebGL2RenderingContext} */
  const gl = canvas.getContext("webgl2", {
    antialias: true,
  });
  if (gl === null) {
    alert(
      "Unable to initialize WebGL2. Your browser or machine may not support it."
    );
    return;
  }

  const program = createProgram(gl, vertex, fragment);
  const positionLocation = gl.getAttribLocation(program, "a_position");
  const screenSizeLocation = gl.getUniformLocation(program, "u_ScreenSize");
  const pointCoordsLocatoin = gl.getUniformLocation(program, "u_PointCoords");
  const pointColorsLocation = gl.getUniformLocation(program, "u_PointColors");

  const view = new Float32Array([
    -1, -1,
     1, -1,
    -1,  1,
    -1,  1,
     1, -1,
     1,  1
  ]);
  const positionBuffer = gl.createBuffer();
  gl.bindBuffer(gl.ARRAY_BUFFER, positionBuffer);
  gl.bufferData(gl.ARRAY_BUFFER, view, gl.STATIC_DRAW);

  gl.clearColor(0.2, 0.2, 0.2, 1.0);
  gl.clear(gl.COLOR_BUFFER_BIT);
  gl.viewport(0, 0, gl.canvas.width, gl.canvas.height);
  console.log(gl.getFeature);
  function renderFrame() {
    gl.useProgram(program);

    gl.uniform2f(screenSizeLocation, gl.canvas.width, gl.canvas.height);
    gl.uniform2fv(pointCoordsLocatoin, [-0.5, -0.5, 0.75, -0.5, 0.5, 0.25, 0.75, 0.5]);
    gl.uniform4fv(pointColorsLocation, [
      0.9, 0.9, 0.5, 1,
      0.7, 0.9, 0.2, 1,
      0.4, 0.9, 0.9, 1,
      0.7, 0.5, 1.0, 1
    ]);

    // Turn on the attribute
    gl.enableVertexAttribArray(positionLocation);
    // Bind the position buffer.
    gl.bindBuffer(gl.ARRAY_BUFFER, positionBuffer);
    // Tell the attribute how to get data out of positionBuffer (ARRAY_BUFFER)
    gl.vertexAttribPointer(positionLocation, 2, gl.FLOAT, false, 0, 0);

    gl.drawArrays(gl.TRIANGLES, 0, view.length / 2);
    requestAnimationFrame(renderFrame);
  }
  renderFrame();
}

window.onload = main;
