import AppKit
import PDFKit

// usage: swift sheet.swift out.png cellWidth columns file1 file2 ...
let args = Array(CommandLine.arguments.dropFirst())
guard args.count >= 4 else {
    print("usage: sheet.swift out.png cellWidth columns files...")
    exit(1)
}
let outPath = args[0]
let cellW = CGFloat(Double(args[1]) ?? 170)
let cols = max(1, Int(args[2]) ?? 8)
let files = Array(args.dropFirst(3))
let labelH: CGFloat = 16
let cellH = cellW * 2.05

struct Item { let name: String; let image: NSImage? }

func renderPDF(_ path: String) -> NSImage? {
    guard let doc = PDFDocument(url: URL(fileURLWithPath: path)),
          let page = doc.page(at: 0) else { return nil }
    let b = page.bounds(for: .mediaBox)
    let scale: CGFloat = 2.0
    let w = Int(b.width * scale), h = Int(b.height * scale)
    guard let ctx = CGContext(data: nil, width: w, height: h, bitsPerComponent: 8,
                              bytesPerRow: 0, space: CGColorSpaceCreateDeviceRGB(),
                              bitmapInfo: CGImageAlphaInfo.premultipliedLast.rawValue) else { return nil }
    ctx.setFillColor(NSColor.white.cgColor)
    ctx.fill(CGRect(x: 0, y: 0, width: CGFloat(w), height: CGFloat(h)))
    ctx.scaleBy(x: scale, y: scale)
    page.draw(with: .mediaBox, to: ctx)
    guard let cg = ctx.makeImage() else { return nil }
    return NSImage(cgImage: cg, size: NSSize(width: CGFloat(w), height: CGFloat(h)))
}

var items: [Item] = []
for p in files {
    let name = (p as NSString).lastPathComponent
    if p.lowercased().hasSuffix(".pdf") {
        items.append(Item(name: name, image: renderPDF(p)))
    } else {
        items.append(Item(name: name, image: NSImage(contentsOfFile: p)))
    }
}

let rows = Int(ceil(Double(items.count) / Double(cols)))
let pad: CGFloat = 8
let W = CGFloat(cols) * (cellW + pad) + pad
let H = CGFloat(rows) * (cellH + labelH + pad) + pad

let canvas = NSImage(size: NSSize(width: W, height: H))
canvas.lockFocus()
NSColor(calibratedRed: 0.11, green: 0.12, blue: 0.14, alpha: 1).setFill()
NSRect(x: 0, y: 0, width: W, height: H).fill()

let attrs: [NSAttributedString.Key: Any] = [
    .font: NSFont.monospacedSystemFont(ofSize: 10, weight: .regular),
    .foregroundColor: NSColor(calibratedWhite: 0.93, alpha: 1)
]

for (i, it) in items.enumerated() {
    let c = i % cols
    let r = i / cols
    let x = pad + CGFloat(c) * (cellW + pad)
    let y = H - pad - CGFloat(r + 1) * (cellH + labelH) - CGFloat(r) * pad
    let cell = NSRect(x: x, y: y + labelH, width: cellW, height: cellH)
    NSColor(calibratedWhite: 0.22, alpha: 1).setFill()
    cell.fill()
    if let img = it.image {
        let size = img.size
        let s = min(cellW / size.width, cellH / size.height)
        let dw = size.width * s, dh = size.height * s
        let dst = NSRect(x: x + (cellW - dw) / 2, y: y + labelH + (cellH - dh) / 2, width: dw, height: dh)
        img.draw(in: dst, from: .zero, operation: .sourceOver, fraction: 1.0)
    }
    (it.name as NSString).draw(at: NSPoint(x: x, y: y + 2), withAttributes: attrs)
}
canvas.unlockFocus()

guard let tiff = canvas.tiffRepresentation,
      let rep = NSBitmapImageRep(data: tiff),
      let png = rep.representation(using: .png, properties: [:]) else {
    print("failed to encode"); exit(1)
}
try png.write(to: URL(fileURLWithPath: outPath))
print("wrote \(outPath) \(Int(W))x\(Int(H))")
