// The browser only ever talks to this site. Everything under /api/* is proxied to the Flask
// backend (PythonAnywhere), which keeps the admin cookie first-party (no CORS, no cross-site cookies).
const API = (process.env.API_URL || 'http://127.0.0.1:5000').replace(/\/+$/, '');

/** @type {import('next').NextConfig} */
export default {
  async rewrites() {
    return [{ source: '/api/:path*', destination: `${API}/api/:path*` }];
  },
};
