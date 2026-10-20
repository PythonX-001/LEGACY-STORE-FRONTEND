import Store from '@/components/Store';

export const dynamic = 'force-dynamic';

const API = (process.env.API_URL || 'http://127.0.0.1:5000').replace(/\/+$/, '');

async function loadProducts() {
  try {
    const r = await fetch(`${API}/api/products`, { cache: 'no-store' });
    if (r.ok) return await r.json();
    console.error('products API returned', r.status);
  } catch (e) {
    console.error('products API unreachable:', e.message);
  }
  return [];
}

export default async function Page() {
  return <Store products={await loadProducts()} />;
}
