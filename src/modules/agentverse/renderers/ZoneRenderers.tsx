abstract class BaseZoneRenderer implements IZoneRenderer {
  protected shaderProgram: WebGLProgram;
  protected uniformLocations: Map<string, WebGLUniformLocation>;

  constructor(protected gl: WebGLRenderingContext) {
    this.initShaders();
  }

  abstract get vertexShader(): string;
  abstract get fragmentShader(): string;
  abstract updateUniforms(time: number): void;
}

export class CrystallineRenderer extends BaseZoneRenderer {
  get fragmentShader(): string {
    return `
      precision highp float;
      uniform float time;
      uniform vec2 resolution;
      
      void main() {
        vec2 uv = gl_FragCoord.xy / resolution;
        float pattern = sin(uv.x * 10.0 + time) * sin(uv.y * 10.0 + time);
        vec3 color = vec3(0.5 + 0.5 * pattern, 0.7, 0.9);
        gl_FragColor = vec4(color, 1.0);
      }
    `;
  }

  updateUniforms(time: number) {
    this.gl.uniform1f(this.uniformLocations.get("time"), time * 0.001);
    this.gl.uniform2f(
      this.uniformLocations.get("resolution"),
      this.gl.canvas.width,
      this.gl.canvas.height,
    );
  }
}

export class LibraryRenderer extends BaseZoneRenderer {
  // Similar implementation with book/scroll-like patterns
}

export class SteampunkRenderer extends BaseZoneRenderer {
  // Gear and steam particle effects
}

export class BioluminescentRenderer extends BaseZoneRenderer {
  // Neural network-like glowing patterns
}
