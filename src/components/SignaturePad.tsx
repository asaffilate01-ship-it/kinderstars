import React, { useRef, useState, useEffect, useCallback } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { PenLine, Type, Trash2 } from "lucide-react";

interface SignaturePadProps {
  value: string;
  type: "typed" | "drawn";
  onChange: (data: string, type: "typed" | "drawn") => void;
  label?: string;
  disabled?: boolean;
}

const SignaturePad: React.FC<SignaturePadProps> = ({ value, type, onChange, label = "Signature", disabled = false }) => {
  const [mode, setMode] = useState<"typed" | "drawn">(type || "typed");
  const [typedName, setTypedName] = useState(type === "typed" ? value : "");
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const isDrawing = useRef(false);
  const lastPos = useRef({ x: 0, y: 0 });

  // Restore drawn signature from base64
  useEffect(() => {
    if (mode === "drawn" && value && type === "drawn" && canvasRef.current) {
      const img = new Image();
      img.onload = () => {
        const ctx = canvasRef.current?.getContext("2d");
        if (ctx && canvasRef.current) {
          ctx.clearRect(0, 0, canvasRef.current.width, canvasRef.current.height);
          ctx.drawImage(img, 0, 0);
        }
      };
      img.src = value;
    }
  }, [mode]);

  const getPos = (e: React.MouseEvent | React.TouchEvent) => {
    const canvas = canvasRef.current;
    if (!canvas) return { x: 0, y: 0 };
    const rect = canvas.getBoundingClientRect();
    if ("touches" in e) {
      return { x: e.touches[0].clientX - rect.left, y: e.touches[0].clientY - rect.top };
    }
    return { x: e.clientX - rect.left, y: e.clientY - rect.top };
  };

  const startDraw = (e: React.MouseEvent | React.TouchEvent) => {
    if (disabled) return;
    isDrawing.current = true;
    lastPos.current = getPos(e);
  };

  const draw = useCallback((e: React.MouseEvent | React.TouchEvent) => {
    if (!isDrawing.current || disabled) return;
    const ctx = canvasRef.current?.getContext("2d");
    if (!ctx || !canvasRef.current) return;
    const pos = getPos(e);
    ctx.beginPath();
    ctx.moveTo(lastPos.current.x, lastPos.current.y);
    ctx.lineTo(pos.x, pos.y);
    ctx.strokeStyle = "#1a1a2e";
    ctx.lineWidth = 2;
    ctx.lineCap = "round";
    ctx.stroke();
    lastPos.current = pos;
  }, [disabled]);

  const endDraw = () => {
    if (isDrawing.current && canvasRef.current) {
      isDrawing.current = false;
      onChange(canvasRef.current.toDataURL("image/png"), "drawn");
    }
  };

  const clearCanvas = () => {
    const ctx = canvasRef.current?.getContext("2d");
    if (ctx && canvasRef.current) {
      ctx.clearRect(0, 0, canvasRef.current.width, canvasRef.current.height);
      onChange("", "drawn");
    }
  };

  const handleTyped = (val: string) => {
    setTypedName(val);
    onChange(val, "typed");
  };

  return (
    <div className="space-y-2">
      <div className="flex items-center justify-between">
        <p className="text-xs font-bold uppercase text-muted-foreground">{label}</p>
        {!disabled && (
          <div className="flex gap-1">
            <button onClick={() => setMode("typed")}
              className={`px-2 py-1 rounded text-xs font-medium transition-colors ${mode === "typed" ? "bg-primary text-primary-foreground" : "bg-muted text-muted-foreground hover:bg-accent"}`}>
              <Type className="w-3 h-3 inline mr-1" />Type
            </button>
            <button onClick={() => setMode("drawn")}
              className={`px-2 py-1 rounded text-xs font-medium transition-colors ${mode === "drawn" ? "bg-primary text-primary-foreground" : "bg-muted text-muted-foreground hover:bg-accent"}`}>
              <PenLine className="w-3 h-3 inline mr-1" />Draw
            </button>
          </div>
        )}
      </div>

      {mode === "typed" ? (
        <div className="space-y-1">
          <Input
            value={typedName}
            onChange={(e) => handleTyped(e.target.value)}
            placeholder="Type your full name"
            disabled={disabled}
            className="text-lg"
          />
          {typedName && (
            <div className="border border-border rounded-lg p-4 bg-white text-center">
              <p className="text-2xl italic text-black" style={{ fontFamily: "'Brush Script MT', 'Segoe Script', cursive" }}>
                {typedName}
              </p>
            </div>
          )}
        </div>
      ) : (
        <div className="space-y-1">
          <div className="relative border border-border rounded-lg bg-white overflow-hidden">
            <canvas
              ref={canvasRef}
              width={400}
              height={120}
              className="w-full cursor-crosshair touch-none"
              onMouseDown={startDraw}
              onMouseMove={draw}
              onMouseUp={endDraw}
              onMouseLeave={endDraw}
              onTouchStart={startDraw}
              onTouchMove={draw}
              onTouchEnd={endDraw}
            />
            {!disabled && (
              <button onClick={clearCanvas} className="absolute top-1 right-1 p-1 rounded bg-muted/80 hover:bg-muted text-muted-foreground">
                <Trash2 className="w-3 h-3" />
              </button>
            )}
          </div>
          <p className="text-[10px] text-muted-foreground text-center">Draw your signature above</p>
        </div>
      )}
    </div>
  );
};

export default SignaturePad;
