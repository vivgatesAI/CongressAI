import "@/styles/Home.module.css";

export const metadata = {
  title: "CongressAI",
  description: "Congress agenda analysis with Venice AI",
};

export default function RootLayout({ children }) {
  return (
    <html lang="en">
      <body>{children}</body>
    </html>
  );
}
