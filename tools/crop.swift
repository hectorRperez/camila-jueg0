import AppKit
import CoreGraphics

// usage: crop.swift <src> <x> <y> <w> <h> <dst>   (coords en píxeles, y desde arriba)
let a = CommandLine.arguments
guard a.count == 7,
      let x = Int(a[2]), let y = Int(a[3]), let w = Int(a[4]), let h = Int(a[5]) else {
    print("usage: crop.swift <src> <x> <y> <w> <h> <dst>"); exit(1)
}
guard let src = CGImageSourceCreateWithURL(URL(fileURLWithPath: a[1]) as CFURL, nil),
      let img = CGImageSourceCreateImageAtIndex(src, 0, nil) else { exit(1) }
let rect = CGRect(x: x, y: y, width: w, height: h)
guard let cut = img.cropping(to: rect),
      let dest = CGImageDestinationCreateWithURL(URL(fileURLWithPath: a[6]) as CFURL, "public.png" as CFString, 1, nil) else { exit(1) }
CGImageDestinationAddImage(dest, cut, nil)
CGImageDestinationFinalize(dest)
print("\(a[6]) \(cut.width)x\(cut.height)")
