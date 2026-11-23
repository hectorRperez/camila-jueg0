import AppKit
import CoreGraphics

// Quita el fondo (marrones), pips (crema/verde/azul) y deja el icono.
// usage: key.swift <src> <dst>
let a = CommandLine.arguments
guard let s = CGImageSourceCreateWithURL(URL(fileURLWithPath: a[1]) as CFURL, nil),
      let img = CGImageSourceCreateImageAtIndex(s, 0, nil) else { exit(1) }
let w = img.width, h = img.height
var d = [UInt8](repeating: 0, count: w * h * 4)
let ctx = CGContext(data: &d, width: w, height: h, bitsPerComponent: 8, bytesPerRow: w * 4,
                    space: CGColorSpaceCreateDeviceRGB(),
                    bitmapInfo: CGImageAlphaInfo.premultipliedLast.rawValue)!
ctx.draw(img, in: CGRect(x: 0, y: 0, width: w, height: h))

var removed = 0
for i in stride(from: 0, to: d.count, by: 4) {
    let r = Int(d[i]), g = Int(d[i+1]), b = Int(d[i+2])
    let brown = (r < 115 && g < 95 && b < 75)
    let lightest = min(r, min(g, b))
    let cream = (lightest > 175 && !(r > g + 25))
    let green = (g > r + 25 && g > b + 35)
    let blue  = (b > r + 35 && b > g + 15)
    if brown || cream || green || blue {
        d[i] = 0; d[i+1] = 0; d[i+2] = 0; d[i+3] = 0
        removed += 1
    }
}
guard let out = ctx.makeImage(),
      let dest = CGImageDestinationCreateWithURL(URL(fileURLWithPath: a[2]) as CFURL, "public.png" as CFString, 1, nil) else { exit(1) }
CGImageDestinationAddImage(dest, out, nil)
CGImageDestinationFinalize(dest)
print("\(a[2]) quitados \(removed) px de \(w*h)")
