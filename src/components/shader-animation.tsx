import { memo } from 'react';
import { Warp } from "@paper-design/shaders-react";

// Memoized shader colors to prevent re-renders
const SHADER_COLORS: string[] = [
  "hsl(200, 100%, 20%)",
  "hsl(200, 100%, 75%)",
  "hsl(210, 90%, 30%)",
  "hsl(200, 100%, 80%)"
];

// Shader style - static to prevent recreation
const shaderStyle = { height: "100%", width: "100%" } as const;

export const ShaderAnimation = memo(() => {
  return (
    <div className="absolute inset-0 w-full h-full pointer-events-none overflow-hidden">
      <Warp
        style={shaderStyle}
        proportion={0.45}
        softness={1}
        distortion={0.25}
        swirl={0.8}
        swirlIterations={10}
        shape="checks"
        shapeScale={0.1}
        scale={1}
        rotation={0}
        speed={0.5}
        colors={SHADER_COLORS}
      />
    </div>
  );
});

ShaderAnimation.displayName = 'ShaderAnimation';
