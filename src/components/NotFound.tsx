import { Link } from 'react-router-dom';
import Layout from './Layout';

export default function NotFound() {
  return (
    <Layout theme="eating">
      <main className="flex flex-col items-center justify-center min-h-screen px-6 text-center">
        <div className="text-7xl mb-4">🐇</div>
        <h1 className="text-3xl font-semibold text-ink mb-2">This gathering hopped away</h1>
        <p className="text-ink/60 mb-6 max-w-sm">Double-check the link, or start a fresh one.</p>
        <Link
          to="/"
          className="rounded-full bg-surface border border-soft px-5 py-3 font-semibold text-ink shadow-card hover:-translate-y-0.5 transition-transform"
        >
          Create a new one →
        </Link>
      </main>
    </Layout>
  );
}
