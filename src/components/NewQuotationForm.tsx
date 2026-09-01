'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';

export default function NewQuotationForm({ procurement, suppliers, createdById }: { procurement: any, suppliers: any[], createdById: string }) {
  const router = useRouter();
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState('');

  const [supplierId, setSupplierId] = useState('');
  const [quotationReference, setQuotationReference] = useState('');
  const [quotationDate, setQuotationDate] = useState('');
  const [unitPrice, setUnitPrice] = useState<number | ''>('');
  const [vatRate, setVatRate] = useState<number>(15);
  const [notes, setNotes] = useState('');

  // Initialize specs array with empty values for each requirement
  const [specifications, setSpecifications] = useState(
    procurement.requirements.map((req: any) => ({
      procurementRequirementId: req.id,
      name: req.name,
      value: '',
      required: req.required,
      type: req.type
    }))
  );

  const handleSpecChange = (index: number, value: string) => {
    const newSpecs = [...specifications];
    newSpecs[index].value = value;
    setSpecifications(newSpecs);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setSubmitting(true);
    setError('');

    try {
      const res = await fetch(`/api/procurements/${procurement.id}/quotations`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          supplierId,
          quotationReference,
          quotationDate,
          quantity: procurement.requiredQuantity, // Inherited from procurement
          unitPrice: Number(unitPrice),
          vatRate,
          currency: 'ETB',
          notes,
          createdById,
          specifications: specifications.map((s: any) => ({
            procurementRequirementId: s.procurementRequirementId,
            value: s.value
          }))
        })
      });

      if (!res.ok) {
        const errorData = await res.json();
        throw new Error(errorData.error || 'Failed to add quotation');
      }

      router.push(`/procurements/${procurement.id}`);
    } catch (err: any) {
      setError(err.message);
      setSubmitting(false);
    }
  };

  const subtotal = Number(unitPrice) * procurement.requiredQuantity;
  const vatAmount = subtotal * (vatRate / 100);
  const total = subtotal + vatAmount;

  return (
    <form onSubmit={handleSubmit}>
      {error && <div style={{ color: 'red', marginBottom: '1rem' }}>{error}</div>}

      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1.5rem', marginBottom: '2rem' }}>
        <div className="form-group">
          <label className="form-label">Supplier <span style={{color: 'red'}}>*</span></label>
          <select className="form-control" required value={supplierId} onChange={e => setSupplierId(e.target.value)}>
            <option value="">Select Supplier...</option>
            {suppliers.map(s => (
              <option key={s.id} value={s.id}>{s.name}</option>
            ))}
          </select>
        </div>
        <div className="form-group">
          <label className="form-label">Quotation Reference</label>
          <input className="form-control" value={quotationReference} onChange={e => setQuotationReference(e.target.value)} placeholder="e.g. QT-2026-ABC" />
        </div>
        <div className="form-group">
          <label className="form-label">Quotation Date <span style={{color: 'red'}}>*</span></label>
          <input type="date" className="form-control" required value={quotationDate} onChange={e => setQuotationDate(e.target.value)} />
        </div>
        <div className="form-group">
          <label className="form-label">Unit Price (ETB) <span style={{color: 'red'}}>*</span></label>
          <input type="number" step="0.01" className="form-control" required value={unitPrice} onChange={e => setUnitPrice(e.target.value === '' ? '' : Number(e.target.value))} />
        </div>
        <div className="form-group">
          <label className="form-label">Quantity</label>
          <input type="number" className="form-control" disabled value={procurement.requiredQuantity} />
          <small style={{ color: 'var(--text-muted)' }}>Fixed by procurement request</small>
        </div>
        <div className="form-group">
          <label className="form-label">VAT Rate (%)</label>
          <input type="number" step="0.1" className="form-control" value={vatRate} onChange={e => setVatRate(Number(e.target.value))} />
        </div>
      </div>

      <div style={{ backgroundColor: '#f8fafc', padding: '1rem', borderRadius: '4px', marginBottom: '2rem', display: 'flex', justifyContent: 'space-between', border: '1px solid var(--border-color)' }}>
        <div>
          <span style={{ color: 'var(--text-muted)', fontSize: '0.875rem' }}>Subtotal:</span>
          <div style={{ fontWeight: 500 }}>{subtotal.toLocaleString()} ETB</div>
        </div>
        <div>
          <span style={{ color: 'var(--text-muted)', fontSize: '0.875rem' }}>VAT ({vatRate}%):</span>
          <div style={{ fontWeight: 500 }}>{vatAmount.toLocaleString()} ETB</div>
        </div>
        <div style={{ textAlign: 'right' }}>
          <span style={{ color: 'var(--text-muted)', fontSize: '0.875rem' }}>Total Price:</span>
          <div style={{ fontWeight: 'bold', fontSize: '1.25rem', color: 'var(--primary-blue)' }}>{total.toLocaleString()} ETB</div>
        </div>
      </div>

      <h3 style={{ borderBottom: '1px solid var(--border-color)', paddingBottom: '0.5rem', marginBottom: '1.5rem' }}>Supplier Specifications</h3>
      <p style={{ fontSize: '0.875rem', color: 'var(--text-muted)', marginBottom: '1.5rem' }}>
        Enter the specifications exactly as offered by the supplier. Leaving mandatory specifications empty will result in an INCOMPLETE status.
      </p>

      <div style={{ display: 'grid', gap: '1rem', marginBottom: '2rem' }}>
        {specifications.map((spec: any, index: number) => (
          <div key={spec.procurementRequirementId} style={{ display: 'flex', gap: '1rem', alignItems: 'center' }}>
            <div style={{ width: '250px', fontWeight: 500, fontSize: '0.875rem' }}>
              {spec.name} {spec.required && <span style={{ color: 'red' }}>*</span>}
            </div>
            <div style={{ flex: 1 }}>
              <input 
                type={spec.type === 'NUMBER' ? 'number' : 'text'}
                step="any"
                className="form-control"
                value={spec.value}
                onChange={e => handleSpecChange(index, e.target.value)}
                placeholder={`Enter supplier's ${spec.name.toLowerCase()}...`}
              />
            </div>
          </div>
        ))}
      </div>

      <div className="form-group" style={{ marginBottom: '2rem' }}>
        <label className="form-label">Additional Notes</label>
        <textarea className="form-control" rows={3} value={notes} onChange={e => setNotes(e.target.value)}></textarea>
      </div>

      <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '1rem' }}>
        <button type="button" className="btn btn-secondary" onClick={() => router.push(`/procurements/${procurement.id}`)}>Cancel</button>
        <button type="submit" className="btn btn-primary" disabled={submitting || !supplierId || unitPrice === ''}>
          {submitting ? 'Adding Quotation...' : 'Save & Qualify Quotation'}
        </button>
      </div>
    </form>
  );
}
