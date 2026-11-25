import AppKit
import PDFKit

// usage: pdfpng.swift <src.pdf> <dst.png> [scale]
let a = CommandLine.arguments
guard a.count >= 3 else { print("usage: pdfpng.swift <src.pdf> <dst.png> [scale]"); exit(1) }
let scale = a.count > 3 ? (Double(a[3]) ?? 2.0) : 2.0
guard let doc = PDFDocument(url: URL(fileURLWithPath: a[1])), let page = doc.page(at: 0) else {
    print("no se pudo abrir \(a[1])"); exit(1)
}
let b = page.bounds(for: .mediaBox)
let w = Int(b.width * scale), h = Int(b.height * scale)
guard let ctx = CGContext(data: nil, width: w, height: h, bitsPerComponent: 8, bytesPerRow: 0,
                          space: CGColorSpaceCreateDeviceRGB(),
                          bitmapInfo: CGImageAlphaInfo.premultipliedLast.rawValue) else { exit(1) }
ctx.setFillColor(NSColor.white.cgColor)
ctx.fill(CGRect(x: 0, y: 0, width: w, height: h))
ctx.scaleBy(x: scale, y: scale)
page.draw(with: .mediaBox, to: ctx)
guard let img = ctx.makeImage(),
      let dest = CGImageDestinationCreateWithURL(URL(fileURLWithPath: a[2]) as CFURL, "public.png" as CFString, 1, nil) else { exit(1) }
CGImageDestinationAddImage(dest, img, nil)
CGImageDestinationFinalize(dest)
print("\(a[2]) \(w)x\(h)")
