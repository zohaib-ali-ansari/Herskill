import { Loader2 } from 'lucide-react';

export default function Spinner({ label = 'Loading...', fullScreen = false }) {
  if (fullScreen) {
    return (
      <div className="flex min-h-screen flex-col items-center justify-center gap-3 bg-[#fffaf7]">
        <Loader2 className="h-8 w-8 animate-spin text-[#a45d81]" />
        <p className="text-sm font-medium text-[#786b75]">{label}</p>
      </div>
    );
  }

  return (
    <div className="flex items-center justify-center gap-2.5 py-8">
      <Loader2 className="h-5 w-5 animate-spin text-[#a45d81]" />
      <span className="text-sm text-[#786b75]">{label}</span>
    </div>
  );
}
