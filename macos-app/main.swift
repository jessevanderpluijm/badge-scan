// PrintBadges — native macOS event app.
//
// A thin shell around the hosted portal (print-badges.com) with the
// printer bridge built in: the portal's JS posts {type:"health"|"print"}
// messages to window.webkit.messageHandlers.printbadges, and this app
// answers via window.__printbadgesCallback. Printing shells out to CUPS'
// `lp`, exactly like the standalone print agent — but with no localhost
// HTTP in between, so WebKit's mixed-content blocking (the Safari issue)
// never comes into play.
//
// Built by macos-app/build-app.sh with plain swiftc — no Xcode project.

import AppKit
import WebKit

let portalURL = ProcessInfo.processInfo.environment["PORTAL_URL"]
  ?? "https://print-badges.com"
let printerQueue = ProcessInfo.processInfo.environment["PRINTER"]
  ?? "EPSON_CW_C4000e"
let printMedia = ProcessInfo.processInfo.environment["MEDIA"]
  ?? "Custom.104x269mm"

// ── Shell helpers ───────────────────────────────────────────────────

func run(_ path: String, _ args: [String]) -> (status: Int32, output: String) {
  let p = Process()
  p.executableURL = URL(fileURLWithPath: path)
  p.arguments = args
  let pipe = Pipe()
  p.standardOutput = pipe
  p.standardError = pipe
  do { try p.run() } catch { return (127, "\(error)") }
  let data = pipe.fileHandleForReading.readDataToEndOfFile()
  p.waitUntilExit()
  return (p.terminationStatus, String(data: data, encoding: .utf8) ?? "")
}

// Same dual signal as the standalone agent: the CUPS queue must exist and
// the printer must be visible on USB.
func printerHealth() -> [String: Any] {
  let queue = run("/usr/bin/lpstat", ["-p", printerQueue])
  if queue.status != 0 {
    return [
      "ok": true, "printerOnline": false,
      "error": "Printerwachtrij '\(printerQueue)' ontbreekt — installeer de Epson-driver (stap 2 van de handleiding).",
    ]
  }
  let usb = run("/usr/sbin/ioreg", ["-p", "IOUSB", "-l"])
  let online = usb.output.contains("CW-C4000")
  return [
    "ok": true, "printerOnline": online,
    "error": online ? NSNull()
      : "Printer niet gevonden op USB — staat hij aan en zit de kabel erin?",
  ]
}

func printPdf(base64: String) -> [String: Any] {
  guard let data = Data(base64Encoded: base64), !data.isEmpty else {
    return ["ok": false, "error": "Lege of onleesbare PDF ontvangen"]
  }
  let health = printerHealth()
  if (health["printerOnline"] as? Bool) != true {
    return ["ok": false, "error": health["error"] ?? "Printer niet gereed"]
  }
  let tmp = FileManager.default.temporaryDirectory
    .appendingPathComponent("badge-\(UUID().uuidString).pdf")
  do { try data.write(to: tmp) } catch {
    return ["ok": false, "error": "Kon PDF niet wegschrijven: \(error)"]
  }
  defer { try? FileManager.default.removeItem(at: tmp) }
  let lp = run("/usr/bin/lp", [
    "-d", printerQueue,
    "-o", "media=\(printMedia)",
    "-o", "fit-to-page=false",
    tmp.path,
  ])
  if lp.status != 0 {
    return ["ok": false, "error": "lp mislukte: \(lp.output.trimmingCharacters(in: .whitespacesAndNewlines))"]
  }
  // "request id is EPSON_CW_C4000e-123 (1 file(s))"
  let jobId = lp.output.split(separator: " ").first { $0.contains(printerQueue + "-") }
    .map(String.init) ?? "?"
  return ["ok": true, "jobId": jobId]
}

// ── Bridge between the portal's JS and the printer ──────────────────

final class PrintBridge: NSObject, WKScriptMessageHandler {
  weak var webView: WKWebView?

  func userContentController(
    _ userContentController: WKUserContentController,
    didReceive message: WKScriptMessage
  ) {
    guard let body = message.body as? [String: Any],
          let id = body["id"] as? String,
          let type = body["type"] as? String
    else { return }

    DispatchQueue.global(qos: .userInitiated).async {
      let result: [String: Any]
      switch type {
      case "health":
        result = printerHealth()
      case "print":
        result = printPdf(base64: body["pdf"] as? String ?? "")
      default:
        result = ["ok": false, "error": "Onbekend verzoek: \(type)"]
      }
      guard
        let json = try? JSONSerialization.data(withJSONObject: result),
        let jsonString = String(data: json, encoding: .utf8),
        let idData = try? JSONSerialization.data(withJSONObject: [id]),
        let idJson = String(data: idData, encoding: .utf8)
      else { return }
      let js = "window.__printbadgesCallback && window.__printbadgesCallback(\(idJson)[0], \(jsonString));"
      DispatchQueue.main.async {
        self.webView?.evaluateJavaScript(js, completionHandler: nil)
      }
    }
  }
}

// ── App shell ───────────────────────────────────────────────────────

final class AppDelegate: NSObject, NSApplicationDelegate, WKNavigationDelegate,
  WKUIDelegate, WKDownloadDelegate
{
  var window: NSWindow!
  var webView: WKWebView!
  let bridge = PrintBridge()

  func applicationDidFinishLaunching(_ notification: Notification) {
    let config = WKWebViewConfiguration()
    config.userContentController.add(bridge, name: "printbadges")

    webView = WKWebView(frame: .zero, configuration: config)
    webView.navigationDelegate = self
    webView.uiDelegate = self
    webView.customUserAgent = (webView.value(forKey: "userAgent") as? String
      ?? "Mozilla/5.0") + " PrintBadgesApp/1.0"
    bridge.webView = webView

    window = NSWindow(
      contentRect: NSRect(x: 0, y: 0, width: 1280, height: 850),
      styleMask: [.titled, .closable, .miniaturizable, .resizable],
      backing: .buffered, defer: false
    )
    window.title = "PrintBadges"
    window.contentView = webView
    window.setFrameAutosaveName("PrintBadgesMain")
    window.center()
    window.makeKeyAndOrderFront(nil)

    webView.load(URLRequest(url: URL(string: portalURL)!))
    NSApp.activate(ignoringOtherApps: true)
  }

  func applicationShouldTerminateAfterLastWindowClosed(_ sender: NSApplication) -> Bool {
    true
  }

  @objc func reload(_ sender: Any?) { webView.reload() }

  // Links leaving the portal (Epson docs, businesslabels.nl, mailto) open
  // in the default browser; the app window is the portal only.
  func webView(
    _ webView: WKWebView,
    decidePolicyFor navigationAction: WKNavigationAction,
    decisionHandler: @escaping (WKNavigationActionPolicy) -> Void
  ) {
    if navigationAction.shouldPerformDownload {
      decisionHandler(.download)
      return
    }
    guard let url = navigationAction.request.url else {
      decisionHandler(.allow)
      return
    }
    let portalHost = URL(string: portalURL)?.host
    let external = url.scheme == "mailto"
      || ((url.scheme == "https" || url.scheme == "http")
        && url.host != nil && url.host != portalHost
        && navigationAction.navigationType == .linkActivated)
    if external {
      NSWorkspace.shared.open(url)
      decisionHandler(.cancel)
      return
    }
    decisionHandler(.allow)
  }

  func webView(
    _ webView: WKWebView,
    decidePolicyFor navigationResponse: WKNavigationResponse,
    decisionHandler: @escaping (WKNavigationResponsePolicy) -> Void
  ) {
    decisionHandler(navigationResponse.canShowMIMEType ? .allow : .download)
  }

  // window.open / target=_blank → default browser.
  func webView(
    _ webView: WKWebView,
    createWebViewWith configuration: WKWebViewConfiguration,
    for navigationAction: WKNavigationAction,
    windowFeatures: WKWindowFeatures
  ) -> WKWebView? {
    if let url = navigationAction.request.url { NSWorkspace.shared.open(url) }
    return nil
  }

  // Badge-PDF downloads ("Download all") land in ~/Downloads and are
  // revealed in Finder when done.
  func webView(_ webView: WKWebView, navigationAction: WKNavigationAction, didBecome download: WKDownload) {
    download.delegate = self
  }
  func webView(_ webView: WKWebView, navigationResponse: WKNavigationResponse, didBecome download: WKDownload) {
    download.delegate = self
  }

  var lastDownload: URL?

  func download(
    _ download: WKDownload,
    decideDestinationUsing response: URLResponse,
    suggestedFilename: String,
    completionHandler: @escaping (URL?) -> Void
  ) {
    let downloads = FileManager.default.urls(
      for: .downloadsDirectory, in: .userDomainMask
    )[0]
    var dest = downloads.appendingPathComponent(suggestedFilename)
    var n = 2
    while FileManager.default.fileExists(atPath: dest.path) {
      let base = (suggestedFilename as NSString).deletingPathExtension
      let ext = (suggestedFilename as NSString).pathExtension
      dest = downloads.appendingPathComponent(
        ext.isEmpty ? "\(base) \(n)" : "\(base) \(n).\(ext)")
      n += 1
    }
    lastDownload = dest
    completionHandler(dest)
  }

  func downloadDidFinish(_ download: WKDownload) {
    if let dest = lastDownload {
      NSWorkspace.shared.activateFileViewerSelecting([dest])
    }
  }

  func download(_ download: WKDownload, didFailWithError error: Error, resumeData: Data?) {
    let alert = NSAlert()
    alert.messageText = "Download mislukt"
    alert.informativeText = error.localizedDescription
    alert.runModal()
  }
}

// ── Menu (needed for ⌘C/⌘V in the webview, ⌘R reload, ⌘Q quit) ──────

func buildMenu(delegate: AppDelegate) -> NSMenu {
  let main = NSMenu()

  let appMenuItem = NSMenuItem()
  main.addItem(appMenuItem)
  let appMenu = NSMenu()
  appMenu.addItem(
    withTitle: "Over PrintBadges",
    action: #selector(NSApplication.orderFrontStandardAboutPanel(_:)),
    keyEquivalent: "")
  appMenu.addItem(NSMenuItem.separator())
  appMenu.addItem(
    withTitle: "Verberg PrintBadges",
    action: #selector(NSApplication.hide(_:)), keyEquivalent: "h")
  appMenu.addItem(NSMenuItem.separator())
  appMenu.addItem(
    withTitle: "Stop PrintBadges",
    action: #selector(NSApplication.terminate(_:)), keyEquivalent: "q")
  appMenuItem.submenu = appMenu

  let editMenuItem = NSMenuItem()
  main.addItem(editMenuItem)
  let editMenu = NSMenu(title: "Wijzig")
  editMenu.addItem(withTitle: "Ongedaan maken", action: Selector(("undo:")), keyEquivalent: "z")
  editMenu.addItem(withTitle: "Opnieuw", action: Selector(("redo:")), keyEquivalent: "Z")
  editMenu.addItem(NSMenuItem.separator())
  editMenu.addItem(withTitle: "Knip", action: #selector(NSText.cut(_:)), keyEquivalent: "x")
  editMenu.addItem(withTitle: "Kopieer", action: #selector(NSText.copy(_:)), keyEquivalent: "c")
  editMenu.addItem(withTitle: "Plak", action: #selector(NSText.paste(_:)), keyEquivalent: "v")
  editMenu.addItem(
    withTitle: "Selecteer alles",
    action: #selector(NSText.selectAll(_:)), keyEquivalent: "a")
  editMenuItem.submenu = editMenu

  let viewMenuItem = NSMenuItem()
  main.addItem(viewMenuItem)
  let viewMenu = NSMenu(title: "Weergave")
  viewMenu.addItem(
    withTitle: "Ververs", action: #selector(AppDelegate.reload(_:)),
    keyEquivalent: "r")
  viewMenuItem.submenu = viewMenu

  return main
}

let app = NSApplication.shared
let delegate = AppDelegate()
app.delegate = delegate
app.setActivationPolicy(.regular)
app.mainMenu = buildMenu(delegate: delegate)
app.run()
