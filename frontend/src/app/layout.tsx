import "@/app/globals.css";

export const metadata = {
  title: 'Swami Rupeshwaranand Ashram',
  description: 'Official website of Swami Rupeshwaranand Ashram',
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en">
      <body>{children}</body>
    </html>
  );
}
