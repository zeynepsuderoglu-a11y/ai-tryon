import { Instagram, Facebook } from "lucide-react";
import DecorativeBg from "@/components/DecorativeBg";

export default function AuthLayout({ children }: { children: React.ReactNode }) {
  return (
    <div className="relative overflow-hidden">
      <DecorativeBg rings={false} />
      <div className="relative">
      {children}
      <footer className="fixed bottom-0 left-0 right-0 flex justify-center items-center gap-5 py-3 text-xs text-[#b0b0b0] bg-white/80 backdrop-blur-sm border-t border-[#f0f0f0] z-10">
        <a href="https://www.instagram.com/imaaistudio" target="_blank" rel="noopener noreferrer" className="flex items-center gap-1.5 hover:text-[#0f0f0f] transition-colors">
          <Instagram className="w-3.5 h-3.5" /> @imaaistudio
        </a>
        <a href="https://www.facebook.com/imaaistudio/" target="_blank" rel="noopener noreferrer" className="flex items-center gap-1.5 hover:text-[#0f0f0f] transition-colors">
          <Facebook className="w-3.5 h-3.5" /> Facebook
        </a>
      </footer>
      </div>
    </div>
  );
}
