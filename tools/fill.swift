import AppKit
import CoreGraphics

// Rellena un rectángulo interpolando verticalmente las filas de arriba y abajo,
// con un poco de grano para que no se vea plano.
// usage: fill.swift <src> <dst> <x> <y> <w> <h>
let a = CommandLine.arguments
guard a.count == 7,
      let x0 = Int(a[3]), let y0 = Int(a[4]), let w = Int(a[5]), let h = Int(a[6]) else {
    print("usage: fill.swift <src> <dst> <x> <y> <w> <h>"); exit(1)
}
guard let s = CGImageSourceCreateWithURL(URL(fileURLWithPath: a[1]) as CFURL, nil),
      let img = CGImageSourceCreateImageAtIndex(s, 0, nil) else { exit(1) }
let W = img.width, H = img.height
var d = [UInt8](repeating: 0, count: W * H * 4)
let ctx = CGContext(data: &d, width: W, height: H, bitsPerComponent: 8, bytesPerRow: W * 4,
                    space: CGColorSpaceCreateDeviceRGB(),
                    bitmapInfo: CGImageAlphaInfo.premultipliedLast.rawValue)!
ctx.draw(img, in: CGRect(x: 0, y: 0, width: W, height: H))

func idx(_ x: Int, _ y: Int) -> Int { (y * W + x) * 4 }

for x in x0..<min(x0 + w, W) {
    let top = idx(x, max(0, y0 - 1))
    let bot = idx(x, min(H - 1, y0 + h))
    for i in 0..<h {
        let y = y0 + i
        let t = Double(i + 1) / Double(h + 1)
        let o = idx(x, y)
        for c in 0..<3 {
            let v = Double(d[top + c]) * (1 - t) + Double(d[bot + c]) * t
            let grain = Double(Int.random(in: -5...5))
            d[o + c] = UInt8(max(0, min(255, Int(v + grain))))
        }
        d[o + 3] = 255
    }
}

guard let out = ctx.makeImage(),
      let dest = CGImageDestinationCreateWithURL(URL(fileURLWithPath: a[2]) as CFURL, "public.png" as CFString, 1, nil) else { exit(1) }
CGImageDestinationAddImage(dest, out, nil)
CGImageDestinationFinalize(dest)
print("relleno \(w)x\(h) en \(x0),\(y0)")
