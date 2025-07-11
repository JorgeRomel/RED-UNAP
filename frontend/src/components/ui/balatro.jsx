import { Renderer, Program, Mesh, Triangle } from "ogl";
import { useEffect, useRef, useCallback, useMemo } from "react";

function hexToVec4(hex) {
  let hexStr = hex.replace("#", "");
  let r = 0, g = 0, b = 0, a = 1;
  if (hexStr.length === 6) {
    r = parseInt(hexStr.slice(0, 2), 16) / 255;
    g = parseInt(hexStr.slice(2, 4), 16) / 255;
    b = parseInt(hexStr.slice(4, 6), 16) / 255;
  } else if (hexStr.length === 8) {
    r = parseInt(hexStr.slice(0, 2), 16) / 255;
    g = parseInt(hexStr.slice(2, 4), 16) / 255;
    b = parseInt(hexStr.slice(4, 6), 16) / 255;
    a = parseInt(hexStr.slice(6, 8), 16) / 255;
  }
  return [r, g, b, a];
}

const vertexShader = `
attribute vec2 uv;
attribute vec2 position;
varying vec2 vUv;
void main() {
  vUv = uv;
  gl_Position = vec4(position, 0, 1);
}
`;

const fragmentShader = `
precision highp float;

#define PI 3.14159265359

uniform float iTime;
uniform vec3 iResolution;
uniform float uSpinRotation;
uniform float uSpinSpeed;
uniform vec2 uOffset;
uniform vec4 uColor1;
uniform vec4 uColor2;
uniform vec4 uColor3;
uniform float uContrast;
uniform float uLighting;
uniform float uSpinAmount;
uniform float uPixelFilter;
uniform float uSpinEase;
uniform bool uIsRotate;
uniform vec2 uMouse;

varying vec2 vUv;

vec4 effect(vec2 screenSize, vec2 screen_coords) {
    float pixel_size = length(screenSize.xy) / uPixelFilter;
    vec2 uv = (floor(screen_coords.xy * (1.0 / pixel_size)) * pixel_size - 0.5 * screenSize.xy) / length(screenSize.xy) - uOffset;
    float uv_len = length(uv);
    
    float speed = (uSpinRotation * uSpinEase * 0.2);
    if(uIsRotate){
       speed = iTime * speed;
    }
    speed += 302.2;
    
    float mouseInfluence = (uMouse.x * 2.0 - 1.0);
    speed += mouseInfluence * 0.1;
    
    float new_pixel_angle = atan(uv.y, uv.x) + speed - uSpinEase * 20.0 * (uSpinAmount * uv_len + (1.0 - uSpinAmount));
    vec2 mid = (screenSize.xy / length(screenSize.xy)) / 2.0;
    uv = (vec2(uv_len * cos(new_pixel_angle) + mid.x, uv_len * sin(new_pixel_angle) + mid.y) - mid);
    
    uv *= 30.0;
    float baseSpeed = iTime * uSpinSpeed;
    speed = baseSpeed + mouseInfluence * 2.0;
    
    vec2 uv2 = vec2(uv.x + uv.y);
    
    for(int i = 0; i < 5; i++) {
        uv2 += sin(max(uv.x, uv.y)) + uv;
        uv += 0.5 * vec2(
            cos(5.1123314 + 0.353 * uv2.y + speed * 0.131121),
            sin(uv2.x - 0.113 * speed)
        );
        uv -= cos(uv.x + uv.y) - sin(uv.x * 0.711 - uv.y);
    }
    
    float contrast_mod = (0.25 * uContrast + 0.5 * uSpinAmount + 1.2);
    float paint_res = min(2.0, max(0.0, length(uv) * 0.035 * contrast_mod));
    float c1p = max(0.0, 1.0 - contrast_mod * abs(1.0 - paint_res));
    float c2p = max(0.0, 1.0 - contrast_mod * abs(paint_res));
    float c3p = 1.0 - min(1.0, c1p + c2p);
    float light = (uLighting - 0.2) * max(c1p * 5.0 - 4.0, 0.0) + uLighting * max(c2p * 5.0 - 4.0, 0.0);
    
    return (0.3 / uContrast) * uColor1 + (1.0 - 0.3 / uContrast) * (uColor1 * c1p + uColor2 * c2p + vec4(c3p * uColor3.rgb, c3p * uColor1.a)) + light;
}

void main() {
    vec2 uv = vUv * iResolution.xy;
    gl_FragColor = effect(iResolution.xy, uv);
}
`;

const Balatro = ({
  spinRotation = -2.0,
  spinSpeed = 7.0,
  offset = [0.0, 0.0],
  color1 = "#DE443B",
  color2 = "#006BB4",
  color3 = "#162325",
  contrast = 3.5,
  lighting = 0.4,
  spinAmount = 0.25,
  pixelFilter = 745.0,
  spinEase = 1.0,
  isRotate = false,
  mouseInteraction = true,
  className = ""
}) => {
  const containerRef = useRef(null);
  const rendererRef = useRef(null);
  const programRef = useRef(null);
  const meshRef = useRef(null);
  const animationRef = useRef(null);
  const mouseRef = useRef([0.5, 0.5]);
  const isInitializedRef = useRef(false);

  const colors = useMemo(() => ({
    color1: hexToVec4(color1),
    color2: hexToVec4(color2),
    color3: hexToVec4(color3)
  }), [color1, color2, color3]);

  const cleanup = useCallback(() => {
    if (animationRef.current) {
      cancelAnimationFrame(animationRef.current);
      animationRef.current = null;
    }
    
    if (rendererRef.current) {
      const gl = rendererRef.current.gl;
      if (gl && !gl.isContextLost()) {
        try {
          const canvas = gl.canvas;
          if (canvas && canvas.parentNode) {
            canvas.parentNode.removeChild(canvas);
          }
          const ext = gl.getExtension('WEBGL_lose_context');
          if (ext) ext.loseContext();
        } catch (e) {
          console.warn('Error during WebGL cleanup:', e);
        }
      }
    }
    
    rendererRef.current = null;
    programRef.current = null;
    meshRef.current = null;
    isInitializedRef.current = false;
  }, []);

  const handleMouseMove = useCallback((e) => {
    if (!mouseInteraction || !containerRef.current) return;
    
    const rect = containerRef.current.getBoundingClientRect();
    const x = (e.clientX - rect.left) / rect.width;
    const y = 1.0 - (e.clientY - rect.top) / rect.height;
    
    mouseRef.current = [x, y];
    
    if (programRef.current && programRef.current.uniforms.uMouse) {
      programRef.current.uniforms.uMouse.value = mouseRef.current;
    }
  }, [mouseInteraction]);

  const handleResize = useCallback(() => {
    if (!rendererRef.current || !containerRef.current || !programRef.current) return;
    
    const container = containerRef.current;
    const renderer = rendererRef.current;
    const program = programRef.current;
    
    try {
      renderer.setSize(container.offsetWidth, container.offsetHeight);
      if (program.uniforms.iResolution) {
        program.uniforms.iResolution.value = [
          renderer.gl.canvas.width,
          renderer.gl.canvas.height,
          renderer.gl.canvas.width / renderer.gl.canvas.height,
        ];
      }
    } catch (e) {
      console.warn('Error during resize:', e);
    }
  }, []);

  const animate = useCallback((time) => {
    try {
      if (!rendererRef.current || !programRef.current || !meshRef.current) {
        return;
      }

      const renderer = rendererRef.current;
      const program = programRef.current;
      const mesh = meshRef.current;

      if (renderer.gl.isContextLost()) {
        return;
      }

      if (program.uniforms.iTime) {
        program.uniforms.iTime.value = time * 0.001;
      }

      renderer.render({ scene: mesh });
      
      animationRef.current = requestAnimationFrame(animate);
    } catch (e) {
      console.warn('Animation error:', e);
    }
  }, []);

  const initWebGL = useCallback(() => {
    if (!containerRef.current || isInitializedRef.current) return;

    const container = containerRef.current;
    
    try {
      const renderer = new Renderer({
        alpha: true,
        antialias: false,
        preserveDrawingBuffer: false,
        powerPreference: "high-performance"
      });
      
      const gl = renderer.gl;
      gl.clearColor(0, 0, 0, 0);

      renderer.setSize(container.offsetWidth, container.offsetHeight);

      const geometry = new Triangle(gl);
      const program = new Program(gl, {
        vertex: vertexShader,
        fragment: fragmentShader,
        uniforms: {
          iTime: { value: 0 },
          iResolution: {
            value: [
              gl.canvas.width,
              gl.canvas.height,
              gl.canvas.width / gl.canvas.height,
            ],
          },
          uSpinRotation: { value: spinRotation },
          uSpinSpeed: { value: spinSpeed },
          uOffset: { value: offset },
          uColor1: { value: colors.color1 },
          uColor2: { value: colors.color2 },
          uColor3: { value: colors.color3 },
          uContrast: { value: contrast },
          uLighting: { value: lighting },
          uSpinAmount: { value: spinAmount },
          uPixelFilter: { value: pixelFilter },
          uSpinEase: { value: spinEase },
          uIsRotate: { value: isRotate },
          uMouse: { value: mouseRef.current },
        },
      });

      const mesh = new Mesh(gl, { geometry, program });

      rendererRef.current = renderer;
      programRef.current = program;
      meshRef.current = mesh;

      container.appendChild(gl.canvas);

      isInitializedRef.current = true;

      animationRef.current = requestAnimationFrame(animate);

    } catch (error) {
      console.error('WebGL initialization failed:', error);
      cleanup();
    }
  }, [
    spinRotation, spinSpeed, offset, colors, contrast, 
    lighting, spinAmount, pixelFilter, spinEase, 
    isRotate, animate, cleanup
  ]);

  useEffect(() => {
    if (!programRef.current) return;

    const program = programRef.current;
    const uniforms = program.uniforms;

    try {
      if (uniforms.uSpinRotation) uniforms.uSpinRotation.value = spinRotation;
      if (uniforms.uSpinSpeed) uniforms.uSpinSpeed.value = spinSpeed;
      if (uniforms.uOffset) uniforms.uOffset.value = offset;
      if (uniforms.uColor1) uniforms.uColor1.value = colors.color1;
      if (uniforms.uColor2) uniforms.uColor2.value = colors.color2;
      if (uniforms.uColor3) uniforms.uColor3.value = colors.color3;
      if (uniforms.uContrast) uniforms.uContrast.value = contrast;
      if (uniforms.uLighting) uniforms.uLighting.value = lighting;
      if (uniforms.uSpinAmount) uniforms.uSpinAmount.value = spinAmount;
      if (uniforms.uPixelFilter) uniforms.uPixelFilter.value = pixelFilter;
      if (uniforms.uSpinEase) uniforms.uSpinEase.value = spinEase;
      if (uniforms.uIsRotate) uniforms.uIsRotate.value = isRotate;
    } catch (e) {
      console.warn('Error updating uniforms:', e);
    }
  }, [spinRotation, spinSpeed, offset, colors, contrast, lighting, spinAmount, pixelFilter, spinEase, isRotate]);

  useEffect(() => {
    initWebGL();

    window.addEventListener('resize', handleResize);
    if (containerRef.current) {
      containerRef.current.addEventListener('mousemove', handleMouseMove);
    }

    return () => {
      window.removeEventListener('resize', handleResize);
      if (containerRef.current) {
        containerRef.current.removeEventListener('mousemove', handleMouseMove);
      }
      cleanup();
    };
  }, []);

  return (
    <div 
      ref={containerRef} 
      className={`w-full h-full ${className}`}
      style={{ 
        background: 'linear-gradient(45deg, #1a1a2e, #16213e)',
        minHeight: '100%',
        position: 'relative'
      }}
    />
  );
};

export default Balatro;