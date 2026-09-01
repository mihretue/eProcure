'use client';

import { CheckCircle, XCircle, AlertCircle } from 'lucide-react';

export default function QuotationComparison({ procurement }: { procurement: any }) {
  const requirements = procurement.requirements;
  const quotations = procurement.quotations;

  const renderStatusIcon = (status: string) => {
    switch(status) {
      case 'QUALIFIED': return <div style={{ display: 'flex', alignItems: 'center', gap: '0.25rem', color: 'var(--success)' }}><CheckCircle size={16} /> <span style={{fontSize: '0.75rem', fontWeight: 'bold'}}>Qualified</span></div>;
      case 'NOT_QUALIFIED': return <div style={{ display: 'flex', alignItems: 'center', gap: '0.25rem', color: 'var(--danger)' }}><XCircle size={16} /> <span style={{fontSize: '0.75rem', fontWeight: 'bold'}}>Not Qualified</span></div>;
      case 'INCOMPLETE': return <div style={{ display: 'flex', alignItems: 'center', gap: '0.25rem', color: 'var(--warning)' }}><AlertCircle size={16} /> <span style={{fontSize: '0.75rem', fontWeight: 'bold'}}>Incomplete</span></div>;
      default: return null;
    }
  };

  // Helper to determine if a specific supplied value passed the requirement.
  // Note: For MVP UI, we do a simple check. The backend QualificationService is the source of truth for overall qualification.
  const getCellStatus = (req: any, suppliedValue?: string) => {
    if (!req.requiredValue) return { icon: null, value: suppliedValue || '-' };
    if (!suppliedValue) return { icon: <AlertCircle size={16} color="var(--warning)" />, value: 'Missing' };
    
    // Quick heuristic for UI (full engine is in backend)
    let passed = false;
    try {
      if (req.comparisonType === 'MINIMUM' && req.type === 'NUMBER') {
         passed = parseFloat(suppliedValue) >= parseFloat(req.requiredValue);
      } else {
         passed = suppliedValue.toLowerCase().includes(req.requiredValue.toLowerCase()) || req.requiredValue.toLowerCase().includes(suppliedValue.toLowerCase());
      }
    } catch(e) { passed = false; }
    
    return {
      icon: passed ? <CheckCircle size={16} color="var(--success)" /> : <XCircle size={16} color="var(--danger)" />,
      value: suppliedValue
    };
  };

  return (
    <div className="table-wrapper">
      <table>
        <thead>
          <tr>
            <th style={{ width: '20%' }}>Specification</th>
            <th style={{ width: '15%' }}>Required</th>
            {quotations.map((q: any) => (
              <th key={q.id} style={{ textAlign: 'center', borderLeft: '1px solid var(--border-color)' }}>
                {q.supplier.name}
                <div style={{ marginTop: '0.5rem', display: 'flex', justifyContent: 'center' }}>
                  {renderStatusIcon(q.qualificationStatus)}
                </div>
              </th>
            ))}
          </tr>
        </thead>
        <tbody>
          {requirements.map((req: any) => (
            <tr key={req.id}>
              <td style={{ fontWeight: 500 }}>
                {req.name} {req.required && <span style={{color: 'red'}}>*</span>}
              </td>
              <td style={{ color: 'var(--text-muted)' }}>
                {req.comparisonType.toLowerCase().replace('_', ' ')}<br/>
                <strong>{req.requiredValue} {req.unit}</strong>
              </td>
              {quotations.map((q: any) => {
                const supplied = q.specifications.find((s: any) => s.procurementRequirementId === req.id);
                const status = getCellStatus(req, supplied?.value);
                return (
                  <td key={q.id} style={{ textAlign: 'center', borderLeft: '1px solid var(--border-color)' }}>
                    <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '0.5rem' }}>
                      {status.value} {status.icon}
                    </div>
                  </td>
                );
              })}
            </tr>
          ))}
          <tr style={{ backgroundColor: '#f8fafc' }}>
            <td colSpan={2} style={{ fontWeight: 'bold', textAlign: 'right' }}>Total Price (inc. VAT)</td>
            {quotations.map((q: any) => (
              <td key={q.id} style={{ textAlign: 'center', fontWeight: 'bold', fontSize: '1.1rem', borderLeft: '1px solid var(--border-color)' }}>
                {q.totalPrice.toLocaleString()} {q.currency}
              </td>
            ))}
          </tr>
        </tbody>
      </table>
    </div>
  );
}
