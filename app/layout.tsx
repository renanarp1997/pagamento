import type { Metadata } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: "One Blond",
  description: "Controle seus períodos de trabalho e pagamentos personalizados."
};

export default function RootLayout({
  children
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="pt-BR" suppressHydrationWarning>
      <body className="font-sans">{children}</body>
    </html>
  );
}
