import type { Metadata } from 'next';
import './globals.css';
import { LayoutDashboard, FileText, Users, Settings } from 'lucide-react';
import Link from 'next/link';
import layoutStyles from './layout.module.css';

export const metadata: Metadata = {
  title: 'Gov Procurement Market Intelligence',
  description: 'Government Procurement Market Intelligence and Price Benchmarking System',
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en">
      <body>
        <div className={layoutStyles.container}>
          {/* Sidebar */}
          <aside className={layoutStyles.sidebar}>
            <div className={layoutStyles.sidebarHeader}>
              <h2>GovProcure</h2>
            </div>
            <nav className={layoutStyles.nav}>
              <Link href="/" className={layoutStyles.navItem}>
                <LayoutDashboard size={20} />
                <span>Dashboard</span>
              </Link>
              <Link href="/procurements" className={layoutStyles.navItem}>
                <FileText size={20} />
                <span>Procurements</span>
              </Link>
              <Link href="/suppliers" className={layoutStyles.navItem}>
                <Users size={20} />
                <span>Suppliers</span>
              </Link>
              <Link href="/catalog" className={layoutStyles.navItem}>
                <Settings size={20} />
                <span>Catalog</span>
              </Link>
            </nav>
            <div className={layoutStyles.sidebarFooter}>
              <div className={layoutStyles.userProfile}>
                <div className={layoutStyles.avatar}>PO</div>
                <div>
                  <div className={layoutStyles.userName}>Procurement Officer A</div>
                  <div className={layoutStyles.userRole}>Procurement Dept</div>
                </div>
              </div>
            </div>
          </aside>

          {/* Main Content */}
          <main className={layoutStyles.main}>
            {children}
          </main>
        </div>
      </body>
    </html>
  );
}
