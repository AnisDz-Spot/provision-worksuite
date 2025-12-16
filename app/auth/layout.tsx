export default function AuthLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <div className="min-h-screen flex flex-col items-center justify-center bg-gradient-to-br from-indigo-100/70 via-background to-pink-100/60 dark:from-black dark:to-zinc-900">
      {children}
    </div>
  );
}



