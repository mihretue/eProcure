'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { BarChart2, FileText, AlertTriangle } from 'lucide-react';

export default function MarketAnalysisView({ procurement }: { procurement: any }) {
  const router = useRouter();
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  const analysis = procurement.marketAnalysis;

  const handleRunAnalysis = async () => {
    setLoading(true);
    setError('');
    try {
      // Use the procurement creator's ID for the MVP
      const createdById = procurement.createdById;
      const res = await fetch(`/api/procurements/${procurement.id}/analyze`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ createdById })
      });
      
      if (!res.ok) throw new Error('Failed to run analysis');
      
      router.refresh();
    } catch (err: any) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  if (!analysis) {
    return (
      <div>
        {error && <div style={{ color: 'red', marginBottom: '1rem' }}>{error}</div>}
        <button onClick={handleRunAnalysis} disabled={loading} className="btn btn-primary" style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
          <BarChart2 size={16} /> {loading ? 'Analyzing Market...' : 'Run Market Analysis & Ranking'}
        </button>
      </div>
    );
  }

  return (
    <div style={{ width: '100%' }}>
      <div className="card" style={{ backgroundColor: '#f8fafc' }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
          <div>
            <h3 style={{ marginBottom: '1.5rem', color: 'var(--primary-blue)' }}>Market Analysis Summary</h3>
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '2rem' }}>
              <div>
                <p style={{ color: 'var(--text-muted)', fontSize: '0.875rem' }}>Total Quotations: <strong>{analysis.quotationCount}</strong></p>
                <p style={{ color: 'var(--text-muted)', fontSize: '0.875rem' }}>Qualified Quotations: <strong style={{color: 'var(--success)'}}>{analysis.qualifiedQuotationCount}</strong></p>
                <div style={{ marginTop: '1rem' }}>
                  <p style={{ fontSize: '0.875rem' }}>Lowest Overall Price:</p>
                  <strong style={{ fontSize: '1.25rem' }}>{analysis.lowestOverallPrice?.toLocaleString() || '-'} ETB</strong>
                  <p style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>*Includes non-qualified</p>
                </div>
              </div>
              
              <div style={{ borderLeft: '1px solid var(--border-color)', paddingLeft: '2rem' }}>
                <p style={{ fontSize: '0.875rem', color: 'var(--text-muted)', marginBottom: '0.5rem' }}>Recommended Benchmark Price</p>
                <strong style={{ fontSize: '2rem', color: 'var(--info)' }}>{analysis.recommendedBenchmarkPrice?.toLocaleString() || '-'} ETB</strong>
                <p style={{ fontSize: '0.75rem', color: 'var(--text-muted)', marginTop: '0.25rem' }}>
                  Based on: {analysis.calculationMethod?.replace(/_/g, ' ')}
                </p>

                <div style={{ marginTop: '1rem', display: 'flex', gap: '1rem' }}>
                  <a href={`/api/procurements/${procurement.id}/specification`} target="_blank" rel="noopener noreferrer" className="btn btn-primary" style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', backgroundColor: 'var(--primary-blue)', textDecoration: 'none' }}>
                    <FileText size={16} /> Generate Specification
                  </a>
                  <button onClick={handleRunAnalysis} disabled={loading} className="btn btn-secondary">
                    {loading ? 'Recalculating...' : 'Recalculate'}
                  </button>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
      
      {/* Warnings Section */}
      {procurement.quotations.map((q: any) => {
        if (q.qualificationStatus !== 'QUALIFIED' || !analysis.recommendedBenchmarkPrice) return null;
        
        const diff = q.totalPrice - analysis.recommendedBenchmarkPrice;
        const percent = diff / analysis.recommendedBenchmarkPrice;
        const threshold = analysis.anomalyThreshold || 0.2;
        
        if (percent < -threshold) {
          return (
             <div key={q.id} style={{ backgroundColor: 'var(--warning)', padding: '1rem', borderRadius: '4px', color: '#fff', marginTop: '1rem', display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
               <AlertTriangle size={20} />
               <strong>Warning:</strong> {q.supplier.name} offered a price significantly BELOW the market benchmark ({Math.round(Math.abs(percent)*100)}% lower). Review specifications carefully.
             </div>
          );
        }
        if (percent > threshold) {
          return (
             <div key={q.id} style={{ backgroundColor: 'var(--warning)', padding: '1rem', borderRadius: '4px', color: '#fff', marginTop: '1rem', display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
               <AlertTriangle size={20} />
               <strong>Warning:</strong> {q.supplier.name} offered a price significantly ABOVE the market benchmark ({Math.round(percent*100)}% higher).
             </div>
          );
        }
        return null;
      })}
    </div>
  );
}
