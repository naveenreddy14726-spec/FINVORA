import Logo from "@/components/Logo";

export default function AuthLayout({ children }: { children: React.ReactNode }) {
  return (
    <div className="flex flex-1 flex-col items-center justify-center bg-slate-50 px-4 py-12">
      <Logo className="mb-6" />
      <div className="w-full max-w-sm rounded-2xl border border-slate-200 bg-white p-6">{children}</div>
    </div>
  );
}
