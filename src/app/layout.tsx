import "./globals.css";

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en">
      <body className="flex min-h-full min-h-screen flex-col font-sans">
        {children}
      </body>
    </html>
  );
}
