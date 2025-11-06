import "./globals.css";

export const metadata = {
  title: "Tienda Digital Cedeño",
  description: "E-commerce demo",
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="es">
      <body>{children}</body>
    </html>
  );
}
