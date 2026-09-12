import "./globals.css";
import Navbar from "@/components/Navbar";

export const metadata = {
  title: "The AI Interview Prep Kit",
  description: "Targeted, evidence-backed interview preparation kits powered by AI.",
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en" className="dark">
      <body className="bg-[#090d16] text-gray-100 min-h-screen flex flex-col antialiased">
        <Navbar />
        <main className="flex-1 max-w-7xl w-full mx-auto p-6 md:p-8">
          {children}
        </main>
      </body>
    </html>
  );
}
