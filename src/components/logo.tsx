import Image from "next/image";

export function Logo({ size = 40, withText = false, textClass = "" }: { size?: number; withText?: boolean; textClass?: string }) {
  return (
    <div className="flex items-center gap-2.5">
      <div
        className="relative shrink-0 rounded-2xl overflow-hidden"
        style={{ width: size, height: size }}
      >
        {/* Soft outer glow behind logo */}
        <div
          className="absolute -inset-1 rounded-2xl blur-md opacity-50 pointer-events-none"
          style={{
            background:
              "radial-gradient(circle at 30% 30%, rgba(52, 211, 153, 0.5), transparent 70%), radial-gradient(circle at 70% 70%, rgba(6, 182, 212, 0.5), transparent 70%)",
          }}
        />
        <Image
          src="/logo.svg"
          alt="SwiftPay Logo"
          fill
          priority
          sizes={`${size}px`}
          className="object-contain relative drop-shadow-[0_0_8px_rgba(52,211,153,0.35)]"
        />
      </div>
      {withText && (
        <div className={`flex flex-col leading-none ${textClass}`}>
          <span className="text-lg font-bold tracking-tight gradient-text">SwiftPay</span>
          <span className="text-[10px] text-muted-foreground tracking-wider uppercase">M-Pesa Wallet</span>
        </div>
      )}
    </div>
  );
}
