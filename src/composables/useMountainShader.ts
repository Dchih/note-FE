import { onMounted, onBeforeUnmount, type Ref } from 'vue'

const vertexShaderSource = `
attribute vec2 a_position;
void main() {
  gl_Position = vec4(a_position, 0.0, 1.0);
}`

const fragmentShaderSource = `
precision highp float;
uniform vec2 u_resolution;
uniform float u_time;

float hash(float n) {
  return fract(sin(n) * 43758.5453123);
}

float hash2(vec2 p) {
  return fract(sin(dot(p, vec2(127.1, 311.7))) * 43758.5453);
}

float vnoise(float x) {
  float i = floor(x);
  float f = fract(x);
  float u = f * f * f * (f * (f * 6.0 - 15.0) + 10.0);
  return mix(hash(i), hash(i + 1.0), u);
}

float ridge(float x) {
  float n = vnoise(x);
  n = abs(n * 2.0 - 1.0);
  n = 1.0 - n;
  return n * n;
}

float terrain(float x, float seed, float sharpness) {
  float v = 0.0;
  float amp = 0.55;
  float freq = 1.0;
  float px = x + seed;

  for (int i = 0; i < 10; i++) {
    float n;
    if (i < 2) {
      n = vnoise(px * freq);
    } else if (i < 5) {
      n = mix(vnoise(px * freq), ridge(px * freq), sharpness * 0.7);
    } else {
      n = ridge(px * freq);
    }
    v += amp * n;
    freq *= 2.05;
    amp *= 0.48;
  }

  float spire = pow(max(0.0, ridge(x * 0.3 + seed * 1.7)), 3.0) * 0.4;
  v += spire;

  float bigWave = vnoise(x * 0.08 + seed * 0.3) * 0.35;
  v += bigWave;

  return v;
}

float birdShape(vec2 p, float wing) {
  float flapAngle = sin(wing) * 0.087;
  float body = length(p) - 0.0003;

  vec2 lw = p;
  lw.x = -abs(lw.x);
  float ca = cos(flapAngle);
  float sa = sin(flapAngle);
  vec2 rw = vec2(lw.x * ca - lw.y * sa, lw.x * sa + lw.y * ca);

  float wingSpan = 0.0035;
  float t = clamp(-rw.x / wingSpan, 0.0, 1.0);
  vec2 wingPt = vec2(-t * wingSpan, -t * t * wingSpan * 0.5);
  float wingDist = length(rw - wingPt) - 0.00018;

  return min(body, wingDist);
}

float drawBirds(vec2 uv, float aspect, float time) {
  float result = 0.0;
  float size = 1.0;

  vec2 flockCenter = vec2(0.45, 0.68);
  float flockSpread = 0.08;
  float speed = 0.03;

  for (int j = 0; j < 8; j++) {
    float fj = float(j);
    float id = fj * 7.13 + 3.0;

    float ox = (hash(id * 1.1) - 0.5) * flockSpread * aspect;
    float oy = (hash(id * 2.3) - 0.5) * flockSpread * 0.35;

    float drift = time * speed;
    float wobbleX = sin(time * (1.2 + hash(id * 3.7) * 0.8) + fj) * 0.005;
    float wobbleY = sin(time * (0.8 + hash(id * 5.1) * 0.6) + fj * 2.0) * 0.003;

    float bx = fract((flockCenter.x + ox + drift + wobbleX) / (aspect + 0.1)) * (aspect + 0.1) - 0.05;
    float by = flockCenter.y + oy + wobbleY;

    vec2 bp = vec2(uv.x * aspect - bx, uv.y - by);
    bp /= size;

    float flapSpeed = 5.0 + hash(id * 7.3) * 2.0;
    float flapPhase = time * flapSpeed + fj * 1.8;

    float d = birdShape(bp, flapPhase);

    float alpha = smoothstep(0.0001, -0.0001, d * size);
    result = max(result, alpha);
  }

  return result;
}

void main() {
  vec2 uv = gl_FragCoord.xy / u_resolution.xy;
  float aspect = u_resolution.x / u_resolution.y;
  float px = uv.x * aspect;
  float t = u_time * 0.125;

  // Sky
  vec3 skyTop     = vec3(0.25, 0.22, 0.22);
  vec3 skyMid     = vec3(0.58, 0.40, 0.24);
  vec3 skyGlow    = vec3(0.95, 0.75, 0.38);
  vec3 skyHorizon = vec3(1.0, 0.88, 0.52);

  vec3 sky;
  if (uv.y > 0.72) {
    sky = mix(skyMid, skyTop, (uv.y - 0.72) / 0.28);
  } else if (uv.y > 0.50) {
    sky = mix(skyGlow, skyMid, (uv.y - 0.50) / 0.22);
  } else if (uv.y > 0.36) {
    sky = mix(skyHorizon, skyGlow, (uv.y - 0.36) / 0.14);
  } else {
    sky = skyHorizon;
  }

  float sunX = aspect * 0.50;
  float sunY = 0.52;
  float d = length(vec2((px - sunX) * 0.7, (uv.y - sunY) * 1.8));
  sky += vec3(1.0, 0.92, 0.65) * exp(-d * 3.5) * 0.5;
  sky += vec3(0.9, 0.7, 0.4)  * exp(-d * 1.5) * 0.2;

  vec3 col = sky;

  // Mountain layers
  for (int i = 0; i < 9; i++) {
    float fi = float(i);
    float layerT = fi / 8.0;

    float speed = 0.03 + pow(layerT, 1.8) * 1.2;
    float scroll = t * speed;
    float tx = px / aspect + scroll;
    float seed = fi * 173.7 + 31.0;
    float jagged = 0.25 + layerT * 0.6;

    float baseY = 0.48 - layerT * 0.32;
    float scale = 0.16 + layerT * 0.22;

    float h = terrain(tx * (0.5 + layerT * 0.3), seed, jagged) * scale + baseY;
    h = min(h, 0.92);

    if (uv.y < h) {
      float fog = pow(1.0 - layerT, 1.5);

      vec3 fogColor  = vec3(0.82, 0.65, 0.38);
      vec3 darkColor = vec3(0.022, 0.025, 0.015);
      vec3 layerCol = mix(darkColor, fogColor, fog);

      float edgeDist = h - uv.y;
      float rim = exp(-edgeDist * 90.0) * fog * 0.45;
      layerCol += vec3(0.95, 0.78, 0.42) * rim;

      float sunProx = exp(-pow((px - sunX) / aspect, 2.0) * 3.0);
      layerCol += vec3(0.3, 0.2, 0.08) * rim * sunProx;

      col = layerCol;
    }

    if (i == 3) {
      float birds = drawBirds(uv, aspect, u_time);
      vec3 birdCol = vec3(0.08, 0.06, 0.04);
      col = mix(col, birdCol, birds * 0.7);
    }
  }

  // Bottom darkening
  col *= 1.0 - smoothstep(0.15, 0.0, uv.y) * 0.5;

  // Vignette
  vec2 vc = uv - 0.5;
  col *= 1.0 - dot(vc, vc) * 0.35;

  col = pow(col, vec3(0.93));
  col += (hash2(gl_FragCoord.xy + fract(u_time)) - 0.5) * 0.012;

  gl_FragColor = vec4(clamp(col, 0.0, 1.0), 1.0);
}`

function createShader(gl: WebGLRenderingContext, type: number, source: string): WebGLShader | null {
  const shader = gl.createShader(type)
  if (!shader) return null
  gl.shaderSource(shader, source)
  gl.compileShader(shader)
  if (!gl.getShaderParameter(shader, gl.COMPILE_STATUS)) {
    console.error('Shader compile error:', gl.getShaderInfoLog(shader))
    gl.deleteShader(shader)
    return null
  }
  return shader
}

function initWebGL(gl: WebGLRenderingContext) {
  const vs = createShader(gl, gl.VERTEX_SHADER, vertexShaderSource)
  const fs = createShader(gl, gl.FRAGMENT_SHADER, fragmentShaderSource)
  if (!vs || !fs) return null

  const program = gl.createProgram()!
  gl.attachShader(program, vs)
  gl.attachShader(program, fs)
  gl.linkProgram(program)

  if (!gl.getProgramParameter(program, gl.LINK_STATUS)) {
    console.error('Program link error:', gl.getProgramInfoLog(program))
    return null
  }

  const buffer = gl.createBuffer()
  gl.bindBuffer(gl.ARRAY_BUFFER, buffer)
  gl.bufferData(
    gl.ARRAY_BUFFER,
    new Float32Array([-1, -1, 1, -1, -1, 1, -1, 1, 1, -1, 1, 1]),
    gl.STATIC_DRAW,
  )

  return {
    program,
    aPosition: gl.getAttribLocation(program, 'a_position'),
    uResolution: gl.getUniformLocation(program, 'u_resolution'),
    uTime: gl.getUniformLocation(program, 'u_time'),
  }
}

export function useMountainShader(canvasRef: Ref<HTMLCanvasElement | null>) {
  let animationId: number | null = null
  let gl: WebGLRenderingContext | null = null

  function resize(canvas: HTMLCanvasElement) {
    const dpr = window.devicePixelRatio || 1
    canvas.width = Math.round(canvas.clientWidth * dpr)
    canvas.height = Math.round(canvas.clientHeight * dpr)
    gl?.viewport(0, 0, canvas.width, canvas.height)
  }

  function start() {
    const canvas = canvasRef.value
    if (!canvas) return

    gl = canvas.getContext('webgl', { antialias: true, alpha: false })
    if (!gl) {
      console.error('WebGL not supported')
      return
    }

    resize(canvas)

    const info = initWebGL(gl)
    if (!info) return

    // 监听窗口 resize 和 DPI 变化
    const onResize = () => resize(canvas)
    window.addEventListener('resize', onResize)
    const dprMedia = window.matchMedia(`(resolution: ${window.devicePixelRatio}dppx)`)
    const onDprChange = () => resize(canvas)
    dprMedia.addEventListener('change', onDprChange)

    function render(t: number) {
      if (!gl || !info) return
      gl.useProgram(info.program)
      gl.enableVertexAttribArray(info.aPosition)
      gl.vertexAttribPointer(info.aPosition, 2, gl.FLOAT, false, 0, 0)
      gl.uniform2f(info.uResolution, canvas!.width, canvas!.height)
      gl.uniform1f(info.uTime, t * 0.001)
      gl.drawArrays(gl.TRIANGLES, 0, 6)
      animationId = requestAnimationFrame(render)
    }

    animationId = requestAnimationFrame(render)

    // Return cleanup
    return () => {
      window.removeEventListener('resize', onResize)
      dprMedia.removeEventListener('change', onDprChange)
    }
  }

  function stop() {
    if (animationId !== null) {
      cancelAnimationFrame(animationId)
      animationId = null
    }
  }

  let cleanupResize: (() => void) | undefined

  onMounted(() => {
    cleanupResize = start()
  })

  onBeforeUnmount(() => {
    stop()
    cleanupResize?.()
  })
}
