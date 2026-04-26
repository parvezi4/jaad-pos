import Link from 'next/link';

export default function Home() {
  return (
    <main className="min-h-screen flex flex-col items-center justify-center bg-gradient-to-br from-blue-600 to-violet-600 text-white p-4">
      <div className="text-center max-w-md">
        <h1 className="text-4xl font-bold mb-4">🍽️ Jaad POS</h1>
        <p className="text-xl mb-8 opacity-90">Scan the QR code at your table to start ordering</p>
        <Link
          href="/menu/jaad-cafe?table=JAAD-T1"
          className="inline-block bg-white text-blue-600 font-semibold px-8 py-3 rounded-full hover:bg-blue-50 transition-colors"
          data-testid="demo-order-btn"
        >
          Demo Order (Table 1)
        </Link>
      </div>
    </main>
  );
}
