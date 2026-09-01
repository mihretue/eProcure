import { prisma } from '@/lib/prisma';
import Link from 'next/link';
import { Plus, CheckCircle, XCircle, AlertCircle, BarChart2 } from 'lucide-react';
import QuotationComparison from '@/components/QuotationComparison';
import MarketAnalysisView from '@/components/MarketAnalysisView';

export default async function ProcurementDetailsPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  
  const procurement = await prisma.procurementRequest.findUnique({
    where: { id },
    include: {
      requirements: true,
      createdBy: { select: { name: true } },
      marketAnalysis: true,
      quotations: {
        include: {
          supplier: true,
          specifications: true,
        },
        orderBy: { totalPrice: 'asc' }
      }
    }
  });

  if (!procurement) {
    return <div className="page-container">Procurement Request not found.</div>;
  }

  const getStatusBadgeClass = (status: string) => {
    switch(status) {
      case 'QUALIFIED': return 'badge-success';
      case 'NOT_QUALIFIED': return 'badge-danger';
      case 'INCOMPLETE': return 'badge-warning';
      default: return 'badge-neutral';
    }
  };

  const getWorkflowBadgeClass = (status: string) => {
    switch(status) {
      case 'COMPLETED': return 'badge-success';
      case 'DRAFT': return 'badge-neutral';
      case 'READY_FOR_PROCUREMENT': return 'badge-info';
      default: return 'badge-warning';
    }
  };

  return (
    <div className="page-container">
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '2rem' }}>
        <div>
          <div style={{ display: 'flex', alignItems: 'center', gap: '1rem', marginBottom: '0.5rem' }}>
            <h1 style={{ margin: 0 }}>{procurement.title}</h1>
            <span className={`badge ${getWorkflowBadgeClass(procurement.status)}`}>{procurement.status.replace(/_/g, ' ')}</span>
          </div>
          <p style={{ color: 'var(--text-muted)' }}>Reference: {procurement.reference} | Created by {procurement.createdBy.name}</p>
        </div>
      </div>

      <div style={{ display: 'grid', gridTemplateColumns: '2fr 1fr', gap: '2rem', marginBottom: '2rem' }}>
        <div className="card" style={{ marginBottom: 0 }}>
          <h3>Procurement Details</h3>
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1rem', marginTop: '1rem' }}>
            <div><span style={{ color: 'var(--text-muted)' }}>Department:</span> <strong>{procurement.department}</strong></div>
            <div><span style={{ color: 'var(--text-muted)' }}>Required Date:</span> <strong>{new Date(procurement.requiredDate).toLocaleDateString()}</strong></div>
            <div><span style={{ color: 'var(--text-muted)' }}>Quantity:</span> <strong>{procurement.requiredQuantity} {procurement.unitOfMeasure}</strong></div>
            <div><span style={{ color: 'var(--text-muted)' }}>Created At:</span> <strong>{new Date(procurement.createdAt).toLocaleDateString()}</strong></div>
          </div>
          {procurement.description && (
            <div style={{ marginTop: '1rem' }}>
              <span style={{ color: 'var(--text-muted)' }}>Description:</span> 
              <p style={{ marginTop: '0.25rem' }}>{procurement.description}</p>
            </div>
          )}
        </div>

        <div className="card" style={{ marginBottom: 0, backgroundColor: '#f8fafc' }}>
          <h3>Minimum Requirements</h3>
          <ul style={{ listStyleType: 'none', marginTop: '1rem' }}>
            {procurement.requirements.map(req => (
              <li key={req.id} style={{ marginBottom: '0.5rem', fontSize: '0.875rem' }}>
                <strong>{req.name}:</strong> {req.comparisonType.toLowerCase().replace('_', ' ')} {req.requiredValue} {req.unit}
              </li>
            ))}
          </ul>
        </div>
      </div>

      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1rem' }}>
        <h2>Supplier Quotations ({procurement.quotations.length})</h2>
        <div style={{ display: 'flex', gap: '1rem' }}>
          <Link href={`/procurements/${procurement.id}/quotations/new`} className="btn btn-secondary" style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
            <Plus size={16} /> Add Quotation
          </Link>
        </div>
      </div>

      {procurement.quotations.length > 0 ? (
        <div className="card">
          <QuotationComparison procurement={procurement} />
        </div>
      ) : (
        <div className="card" style={{ textAlign: 'center', padding: '3rem', color: 'var(--text-muted)' }}>
          <p>No supplier quotations added yet.</p>
          <Link href={`/procurements/${procurement.id}/quotations/new`} className="btn btn-primary" style={{ marginTop: '1rem' }}>
            Add First Quotation
          </Link>
        </div>
      )}

      {procurement.quotations.length > 0 && (
        <div style={{ marginTop: '3rem' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1rem' }}>
            <h2>Market Analysis & Benchmarking</h2>
            <MarketAnalysisView procurement={procurement} />
          </div>
        </div>
      )}
    </div>
  );
}
