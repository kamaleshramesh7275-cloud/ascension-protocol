import { useState, useRef } from "react";
import { toPng, toBlob } from "html-to-image";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { useToast } from "@/hooks/use-toast";
import { Copy, Download, Share2, Check, ShieldCheck, Flame } from "lucide-react";

export interface BragCardData {
  type: "streak" | "quest" | "level" | "workout";
  title: string;
  headlineMetric: string;
  subheadline: string;
  userName: string;
  userTier: string;
  referralCode?: string;
  stats: Array<{
    label: string;
    value: string;
  }>;
}

interface BragCardModalProps {
  isOpen: boolean;
  onClose: () => void;
  data: BragCardData;
}

export function BragCardModal({ isOpen, onClose, data }: BragCardModalProps) {
  const { toast } = useToast();
  const cardRef = useRef<HTMLDivElement>(null);
  const [format, setFormat] = useState<"story" | "square">("story");
  const [isExporting, setIsExporting] = useState(false);
  const [copied, setCopied] = useState(false);

  const getReferralUrl = () => {
    const origin = typeof window !== "undefined" ? window.location.origin : "https://ascensionprotocol.app";
    return data.referralCode ? `${origin}/register?ref=${data.referralCode}` : origin;
  };

  const handleDownload = async () => {
    if (!cardRef.current) return;
    setIsExporting(true);
    try {
      const dataUrl = await toPng(cardRef.current, {
        quality: 0.98,
        pixelRatio: 2,
      });
      const link = document.createElement("a");
      link.download = `ascension-telemetry-${data.type}-${Date.now()}.png`;
      link.href = dataUrl;
      link.click();

      toast({
        title: "TELEMETRY EXPORTED",
        description: "Lossless PNG generated and downloaded to device storage.",
      });
    } catch (err: any) {
      console.error("Export error:", err);
      toast({
        title: "Export Failed",
        description: "Could not generate card image. Try copying instead.",
        variant: "destructive",
      });
    } finally {
      setIsExporting(false);
    }
  };

  const handleCopyImage = async () => {
    if (!cardRef.current) return;
    setIsExporting(true);
    try {
      const blob = await toBlob(cardRef.current, {
        quality: 0.98,
        pixelRatio: 2,
      });
      if (blob && navigator.clipboard && (window as any).ClipboardItem) {
        await navigator.clipboard.write([
          new (window as any).ClipboardItem({ "image/png": blob }),
        ]);
        setCopied(true);
        toast({
          title: "IMAGE COPIED TO CLIPBOARD",
          description: "Ready to paste directly into Instagram Stories or messaging channels.",
        });
        setTimeout(() => setCopied(false), 2500);
      } else {
        await handleDownload();
      }
    } catch (err: any) {
      console.error("Copy image error:", err);
      await handleDownload();
    } finally {
      setIsExporting(false);
    }
  };

  const handleNativeShare = async () => {
    if (!cardRef.current) return;
    setIsExporting(true);
    try {
      const blob = await toBlob(cardRef.current, { quality: 0.98, pixelRatio: 2 });
      if (blob && navigator.share) {
        const file = new File([blob], "ascension-telemetry.png", { type: "image/png" });
        if (navigator.canShare && navigator.canShare({ files: [file] })) {
          await navigator.share({
            title: "ASCENSION PROTOCOL // VERIFIED AUDIT",
            text: `Protocol verification for operative ${data.userName}. Verified execution.`,
            files: [file],
          });
          return;
        }
      }
      await handleCopyImage();
    } catch (err: any) {
      console.error("Native share error:", err);
      await handleCopyImage();
    } finally {
      setIsExporting(false);
    }
  };

  return (
    <Dialog open={isOpen} onOpenChange={(open) => !open && onClose()}>
      <DialogContent className="max-w-lg bg-[#07090C] border-white/10 text-white p-6 max-h-[92vh] overflow-y-auto">
        <DialogHeader className="pb-2">
          <div className="flex items-center gap-2">
            <span className="w-2 h-2 rounded-full bg-emerald-400" />
            <DialogTitle className="text-xs font-mono tracking-widest uppercase font-semibold text-zinc-300">
              DEFIANCE BRAG CARD // AUDIT EXPORT
            </DialogTitle>
          </div>
          <DialogDescription className="text-xs text-zinc-500 font-mono">
            Cryptographically watermarked performance record. Ready for transmission.
          </DialogDescription>
        </DialogHeader>

        {/* Format Selector Pills */}
        <div className="flex items-center gap-2 my-2">
          <Button
            size="sm"
            variant={format === "story" ? "default" : "outline"}
            className={`text-xs font-mono h-7 px-3 uppercase ${
              format === "story" ? "bg-white text-black" : "border-white/10 text-zinc-400"
            }`}
            onClick={() => setFormat("story")}
          >
            9:16 STORY FORMAT
          </Button>
          <Button
            size="sm"
            variant={format === "square" ? "default" : "outline"}
            className={`text-xs font-mono h-7 px-3 uppercase ${
              format === "square" ? "bg-white text-black" : "border-white/10 text-zinc-400"
            }`}
            onClick={() => setFormat("square")}
          >
            1:1 SQUARE FORMAT
          </Button>
        </div>

        {/* The Non-Gamified Brag Card Render Target */}
        <div className="flex justify-center my-3 overflow-hidden bg-black/60 p-2 rounded border border-white/5">
          <div
            ref={cardRef}
            className={`relative bg-[#07080B] text-white flex flex-col justify-between p-6 select-none border border-white/10 overflow-hidden ${
              format === "story" ? "w-[280px] h-[480px]" : "w-[300px] h-[300px]"
            }`}
            style={{
              backgroundImage: "radial-gradient(circle at 50% 0%, rgba(56, 189, 248, 0.08), transparent 70%)",
            }}
          >
            {/* Background Architectural Grid Lines */}
            <div className="absolute inset-0 bg-[linear-gradient(to_right,#ffffff05_1px,transparent_1px),linear-gradient(to_bottom,#ffffff05_1px,transparent_1px)] bg-[size:24px_24px] pointer-events-none" />

            {/* Top Bar Telemetry Header */}
            <div className="relative z-10 flex items-center justify-between pb-3 border-b border-white/10">
              <div className="flex items-center gap-1.5">
                <span className="w-1.5 h-1.5 rounded-full bg-emerald-400" />
                <span className="text-[9px] font-mono tracking-widest text-zinc-400 uppercase font-semibold">
                  ASCENSION PROTOCOL
                </span>
              </div>
              <span className="text-[8px] font-mono text-zinc-500 uppercase tracking-wider">
                AUDIT-VER-02
              </span>
            </div>

            {/* Center Section: Extreme Scale Tabular Metric */}
            <div className="relative z-10 my-auto text-left py-2">
              <div className="text-[10px] font-mono text-zinc-400 uppercase tracking-widest mb-1 flex items-center gap-1.5">
                <span>{data.title}</span>
                <span className="text-zinc-600">//</span>
                <span className="text-emerald-400 font-semibold">{data.userTier}</span>
              </div>

              <h2 className="text-3xl font-extrabold font-mono tracking-tight text-white uppercase leading-none">
                {data.headlineMetric}
              </h2>

              <p className="text-xs font-mono text-zinc-400 uppercase tracking-wider mt-1.5">
                {data.subheadline}
              </p>
            </div>

            {/* Sub-Grid: 4 Telemetry Cells */}
            <div className="relative z-10 grid grid-cols-2 gap-2 pt-3 border-t border-white/10 my-2">
              {data.stats.slice(0, 4).map((s, i) => (
                <div key={i} className="flex flex-col">
                  <span className="text-[8px] font-mono text-zinc-500 uppercase tracking-wider">
                    {s.label}
                  </span>
                  <span className="text-xs font-mono font-bold text-zinc-200">
                    {s.value}
                  </span>
                </div>
              ))}
            </div>

            {/* Bottom Bar: Operative Attribution & QR Token */}
            <div className="relative z-10 pt-2 border-t border-white/10 flex items-center justify-between">
              <div>
                <span className="text-[9px] font-mono font-bold text-white block uppercase tracking-wider">
                  {data.userName}
                </span>
                <span className="text-[8px] font-mono text-zinc-500 block uppercase">
                  VERIFIED HUMAN PROTOCOL
                </span>
              </div>

              <div className="text-right">
                <span className="text-[8px] font-mono text-zinc-500 block uppercase">CALLSIGN CODE</span>
                <span className="text-[9px] font-mono text-blue-400 font-bold tracking-wider">
                  {data.referralCode || "SOVEREIGN"}
                </span>
              </div>
            </div>
          </div>
        </div>

        {/* Action Controls */}
        <div className="grid grid-cols-3 gap-2 mt-2">
          <Button
            size="sm"
            variant="outline"
            className="border-white/10 hover:bg-zinc-800 text-xs font-mono uppercase h-9"
            disabled={isExporting}
            onClick={handleCopyImage}
          >
            {copied ? <Check className="w-3.5 h-3.5 mr-1 text-emerald-400" /> : <Copy className="w-3.5 h-3.5 mr-1" />}
            {copied ? "COPIED" : "CLIPBOARD"}
          </Button>

          <Button
            size="sm"
            variant="outline"
            className="border-white/10 hover:bg-zinc-800 text-xs font-mono uppercase h-9"
            disabled={isExporting}
            onClick={handleDownload}
          >
            <Download className="w-3.5 h-3.5 mr-1" />
            SAVE PNG
          </Button>

          <Button
            size="sm"
            className="bg-white hover:bg-zinc-200 text-black font-mono text-xs font-bold uppercase h-9"
            disabled={isExporting}
            onClick={handleNativeShare}
          >
            <Share2 className="w-3.5 h-3.5 mr-1" />
            TRANSMIT
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  );
}
