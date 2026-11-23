import AppKit
import CoreGraphics

// usage: patch.swift <src> <dst> <x> <y> <w> <h> <dx> <dy>
// copia el rectángulo (x+dx, y+dy, w, h) encima de (x, y). Coordenadas desde arriba.
let a = CommandLine.arguments
guard a.count == 9,
      let x = Int(a[3]), let y = Int(a[4]), let w = Int(a[5]), let h = Int(a[6]),
      let dx = Int(a[7]), let dy = Int(a[8]) else {
    print("usage: patch.swift <src> <dst> <x> <y> <w> <h> <dx> <dy>"); exit(1)
}
guard let s = CGImageSourceCreateWithURL(URL(fileURLWithPath: a[1]) as CFURL, nil),
      let img = CGImageSourceCreateImageAtIndex(s, 0, nil) else { exit(1) }
let W = img.width, H = img.height
guard let ctx = CGContext(data: nil, width: W, height: H, bitsPerComponent: 8, bytesPerRow: 0,
                          space: CGColorSpaceCreateDeviceRGB(),
                          bitmapInfo: CGImageAlphaInfo.premultipliedLast.rawValue) else { exit(1) }
// CGContext tiene origen abajo-izquierda; las coordenadas de la imagen, arriba-izquierda.
ctx.draw(img, in: CGRect(x: 0, y: 0, width: W, height: H))

let srcRect = CGRect(x: x + dx, y: y + dy, width: w, height: h)
guard let piece = img.cropping(to: srcRect) else { exit(1) }
ctx.draw(piece, in: CGRect(x: x, y: H - y - h, width: w, height: h))

guard let out = ctx.makeImage(),
      let dest = CGImageDestinationCreateWithURL(URL(fileURLWithPath: a[2]) as CFURL, "public.png" as CFString, 1, nil) else { exit(1) }
CGImageDestinationAddImage(dest, out, nil)
CGImageDestinationFinalize(dest)
print("parche \(w)x\(h) desde +\(dx),+\(dy)")
