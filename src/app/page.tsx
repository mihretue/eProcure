import Link from 'next/link';
import { prisma } from '@/lib/prisma';
import { ProcurementStatus } from '@/domain/types';

export default async function DashboardPage() {
  const totalProcurements = await prisma.procurementRequest.count();
  const draftProcurements = await prisma.procurementRequest.count({ where: { status: ProcurementStatus.DRAFT } });
  const activeResearch = await prisma.procurementRequest.count({ where: { status: ProcurementStatus.MARKET_RESEARCH } });
  const completedAnalyses = await prisma.procurementRequest.count({ where: { status: ProcurementStatus.COMPLETED } });
  
  const totalQuotations = await prisma.quotation.count();
  const qualifiedQuotations = await prisma.quotation.count({ where: { qualificationStatus: 'QUALIFIED' } });
  
  const recentProcurements = await prisma.procurementRequest.findMany({
    take: 5,
    orderBy: { createdAt: 'desc' }
  });

  return (
    <div className="page-container">
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '2rem' }}>
        <h1>Dashboard</h1>
        <Link href="/procurements/new" className="btn btn-primary">
          + New Procurement
        </Link>
      </div>

      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: '1.5rem', marginBottom: '2rem' }}>
        <div className="card">
          <div style={{ fontSize: '0.875rem', color: 'var(--text-muted)' }}>Total Procurements</div>
          <div style={{ fontSize: '2rem', fontWeight: 'bold', color: 'var(--primary-blue)' }}>{totalProcurements}</div>
        </div>
        <div className="card">
          <div style={{ fontSize: '0.875rem', color: 'var(--text-muted)' }}>Active Market Research</div>
          <div style={{ fontSize: '2rem', fontWeight: 'bold', color: 'var(--info)' }}>{activeResearch}</div>
        </div>
        <div className="card">
          <div style={{ fontSize: '0.875rem', color: 'var(--text-muted)' }}>Drafts</div>
          <div style={{ fontSize: '2rem', fontWeight: 'bold', color: 'var(--warning)' }}>{draftProcurements}</div>
        </div>
        <div className="card">
          <div style={{ fontSize: '0.875rem', color: 'var(--text-muted)' }}>Qualified Quotations</div>
          <div style={{ fontSize: '2rem', fontWeight: 'bold', color: 'var(--success)' }}>
            {qualifiedQuotations} <span style={{ fontSize: '1rem', color: 'var(--text-muted)' }}>/ {totalQuotations}</span>
          </div>
        </div>
      </div>

      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '2rem' }}>
        <div className="card">
          <h3>Recent Procurement Activities</h3>
          <div className="table-wrapper">
            <table>
              <thead>
                <tr>
                  <th>Reference</th>
                  <th>Title</th>
                  <th>Status</th>
                </tr>
              </thead>
              <tbody>
                {recentProcurements.map(pr => (
                  <tr key={pr.id}>
                    <td>
                      <Link href={`/procurements/${pr.id}`} style={{ color: 'var(--info)', fontWeight: 500 }}>
                        {pr.reference}
                      </Link>
                    </td>
                    <td>{pr.title}</td>
                    <td>
                      <span className={`badge ${
                        pr.status === 'COMPLETED' ? 'badge-success' : 
                        pr.status === 'DRAFT' ? 'badge-neutral' : 'badge-info'
                      }`}>
                        {pr.status.replace(/_/g, ' ')}
                      </span>
                    </td>
                  </tr>
                ))}
                {recentProcurements.length === 0 && (
                  <tr>
                    <td colSpan={3} style={{ textAlign: 'center', padding: '2rem' }}>No recent activities</td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
        </div>

        <div className="card">
          <h3>Market Price Trend (Desktop Computers)</h3>
          {/* Simple dummy chart representation for MVP */}
          <div style={{ marginTop: '1rem', borderLeft: '2px solid var(--border-color)', borderBottom: '2px solid var(--border-color)', height: '200px', position: 'relative' }}>
             <div style={{ position: 'absolute', bottom: '20%', left: '10%', height: '10px', width: '10px', backgroundColor: 'var(--info)', borderRadius: '50%' }}></div>
             <div style={{ position: 'absolute', bottom: '40%', left: '50%', height: '10px', width: '10px', backgroundColor: 'var(--info)', borderRadius: '50%' }}></div>
             <div style={{ position: 'absolute', bottom: '60%', left: '90%', height: '10px', width: '10px', backgroundColor: 'var(--info)', borderRadius: '50%' }}></div>
             
             {/* Simple lines connecting points */}
             <svg style={{ position: 'absolute', top: 0, left: 0, width: '100%', height: '100%' }}>
                <line x1="10%" y1="80%" x2="50%" y2="60%" stroke="var(--info)" strokeWidth="2" />
                <line x1="50%" y1="60%" x2="90%" y2="40%" stroke="var(--info)" strokeWidth="2" />
             </svg>

             <div style={{ position: 'absolute', bottom: '-25px', left: '10%', fontSize: '0.75rem' }}>June</div>
             <div style={{ position: 'absolute', bottom: '-25px', left: '50%', fontSize: '0.75rem', transform: 'translateX(-50%)' }}>July</div>
             <div style={{ position: 'absolute', bottom: '-25px', left: '90%', fontSize: '0.75rem', transform: 'translateX(-100%)' }}>August</div>
             
             <div style={{ position: 'absolute', bottom: '20%', left: '-50px', fontSize: '0.75rem', transform: 'translateY(50%)' }}>82,000</div>
             <div style={{ position: 'absolute', bottom: '40%', left: '-50px', fontSize: '0.75rem', transform: 'translateY(50%)' }}>85,000</div>
             <div style={{ position: 'absolute', bottom: '60%', left: '-50px', fontSize: '0.75rem', transform: 'translateY(50%)' }}>87,000</div>
          </div>
        </div>
      </div>
    </div>
  );
}
