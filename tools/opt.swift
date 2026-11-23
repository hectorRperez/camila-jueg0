import AppKit
import CoreGraphics

// usage: opt.swift <maxSide> <src> <dst>
let a = CommandLine.arguments
guard a.count == 4, let maxSide = Double(a[1]) else {
    print("usage: opt.swift <maxSide> <src> <dst>"); exit(1)
}
guard let src = CGImageSourceCreateWithURL(URL(fileURLWithPath: a[2]) as CFURL, nil),
      let img = CGImageSourceCreateImageAtIndex(src, 0, nil) else {
    print("cannot read \(a[2])"); exit(1)
}
let w = Double(img.width), h = Double(img.height)
let s = min(1.0, maxSide / max(w, h))
let tw = max(1, Int((w * s).rounded())), th = max(1, Int((h * s).rounded()))
guard let ctx = CGContext(data: nil, width: tw, height: th, bitsPerComponent: 8, bytesPerRow: 0,
                          space: CGColorSpaceCreateDeviceRGB(),
                          bitmapInfo: CGImageAlphaInfo.premultipliedLast.rawValue) else { exit(1) }
ctx.interpolationQuality = .none
ctx.draw(img, in: CGRect(x: 0, y: 0, width: tw, height: th))
guard let out = ctx.makeImage(),
      let dest = CGImageDestinationCreateWithURL(URL(fileURLWithPath: a[3]) as CFURL, "public.png" as CFString, 1, nil) else { exit(1) }
CGImageDestinationAddImage(dest, out, nil)
CGImageDestinationFinalize(dest)
print("\(a[3]) \(tw)x\(th)")
