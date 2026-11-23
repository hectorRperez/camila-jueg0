import AppKit
import CoreGraphics

// usage: pixel.swift <src> [x y]...
let a = CommandLine.arguments
guard let src = CGImageSourceCreateWithURL(URL(fileURLWithPath: a[1]) as CFURL, nil),
      let img = CGImageSourceCreateImageAtIndex(src, 0, nil) else { exit(1) }
print("size \(img.width)x\(img.height)")
let w = img.width, h = img.height
var data = [UInt8](repeating: 0, count: w * h * 4)
let ctx = CGContext(data: &data, width: w, height: h, bitsPerComponent: 8, bytesPerRow: w * 4,
                    space: CGColorSpaceCreateDeviceRGB(), bitmapInfo: CGImageAlphaInfo.premultipliedLast.rawValue)!
ctx.draw(img, in: CGRect(x: 0, y: 0, width: w, height: h))
func px(_ x: Int, _ y: Int) -> String {
    let i = (y * w + x) * 4
    return String(format: "#%02x%02x%02x a=%d", data[i], data[i+1], data[i+2], data[i+3])
}
if a.count > 2 {
    var i = 2
    while i + 1 < a.count {
        let x = Int(a[i]) ?? 0, y = Int(a[i+1]) ?? 0
        print("(\(x),\(y)) \(px(x,y))")
        i += 2
    }
} else {
    // fila central vertical + columna: detecta cambios de color
    var last = ""
    for y in stride(from: 0, to: h, by: 1) {
        let c = px(w/2, y)
        if c != last { print("y=\(y) \(c)"); last = c }
    }
}
