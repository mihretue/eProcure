import Link from 'next/link';
import { prisma } from '@/lib/prisma';
import { Plus } from 'lucide-react';

export default async function ProcurementsListPage() {
  const procurements = await prisma.procurementRequest.findMany({
    orderBy: { createdAt: 'desc' },
    include: {
      createdBy: { select: { name: true } },
      _count: { select: { quotations: true } }
    }
  });

  return (
    <div className="page-container">
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '2rem' }}>
        <div>
          <h1>Procurement Requests</h1>
          <p style={{ color: 'var(--text-muted)' }}>Manage active and historical procurement workflows.</p>
        </div>
        <Link href="/procurements/new" className="btn btn-primary" style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
          <Plus size={16} /> New Procurement
        </Link>
      </div>

      <div className="card">
        <div className="table-wrapper">
          <table>
            <thead>
              <tr>
                <th>Reference</th>
                <th>Title</th>
                <th>Department</th>
                <th>Status</th>
                <th>Quotations</th>
                <th>Created Date</th>
              </tr>
            </thead>
            <tbody>
              {procurements.map(pr => (
                <tr key={pr.id}>
                  <td>
                    <Link href={`/procurements/${pr.id}`} style={{ color: 'var(--info)', fontWeight: 500 }}>
                      {pr.reference}
                    </Link>
                  </td>
                  <td>{pr.title}</td>
                  <td>{pr.department}</td>
                  <td>
                    <span className={`badge ${
                      pr.status === 'COMPLETED' ? 'badge-success' : 
                      pr.status === 'DRAFT' ? 'badge-neutral' : 
                      pr.status === 'READY_FOR_PROCUREMENT' ? 'badge-info' : 'badge-warning'
                    }`}>
                      {pr.status.replace(/_/g, ' ')}
                    </span>
                  </td>
                  <td>{pr._count.quotations}</td>
                  <td>{new Date(pr.createdAt).toLocaleDateString()}</td>
                </tr>
              ))}
              {procurements.length === 0 && (
                <tr>
                  <td colSpan={6} style={{ textAlign: 'center', padding: '2rem', color: 'var(--text-muted)' }}>
                    No procurement requests found.
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
