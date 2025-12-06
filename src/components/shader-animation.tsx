import { Warp } from "@paper-design/shaders-react"

export function ShaderAnimation() {
  return (
    <div className="absolute inset-0 w-full h-full pointer-events-none overflow-hidden">
      <Warp
        style={{ height: "100%", width: "100%" }}
        proportion={0.45}
        softness={1}
        distortion={0.25}
        swirl={0.8}
        swirlIterations={10}
        shape="checks"
        shapeScale={0.1}
        scale={1}
        rotation={0}
        speed={1}
        colors={[
          "hsl(200, 100%, 20%)",  // Bleu foncé
          "hsl(200, 100%, 75%)",  // Bleu clair
          "hsl(210, 90%, 30%)",   // Bleu moyen foncé
          "hsl(200, 100%, 80%)"   // Bleu très clair
        ]}
      />
    </div>
  )
}
