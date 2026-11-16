import Script from 'next/script';

export const metadata = {
  title: 'Online Work Jamoasi - LMS',
  description: 'Onlayn ta’lim platformasi',
};

export default function RootLayout({ children }) {
  return (
    <html lang="uz">
      <head>
        <Script src="https://telegram.org/js/telegram-web-app.js" strategy="beforeInteractive" />
        <script src="https://cdn.tailwindcss.com"></script>
      </head>
      <body className="bg-slate-950 text-white min-h-screen font-sans">
        {children}
      </body>
    </html>
  );
}
