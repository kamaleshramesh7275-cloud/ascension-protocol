import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Share2 } from "lucide-react";
import { BragCardModal, BragCardData } from "@/components/brag-card-modal";

interface ShareTelemetryButtonProps {
  data: BragCardData;
  label?: string;
  variant?: "outline" | "default" | "secondary" | "ghost";
  size?: "default" | "sm" | "lg" | "icon";
  className?: string;
}

export function ShareTelemetryButton({
  data,
  label = "SHARE TELEMETRY",
  variant = "outline",
  size = "sm",
  className = "",
}: ShareTelemetryButtonProps) {
  const [modalOpen, setModalOpen] = useState(false);

  return (
    <>
      <Button
        variant={variant}
        size={size}
        className={`font-mono text-xs uppercase tracking-wider ${className}`}
        onClick={() => setModalOpen(true)}
      >
        <Share2 className="w-3.5 h-3.5 mr-1.5" />
        {label}
      </Button>

      {modalOpen && (
        <BragCardModal
          isOpen={modalOpen}
          onClose={() => setModalOpen(false)}
          data={data}
        />
      )}
    </>
  );
}
