'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';

export default function NewProcurementForm({ createdById }: { createdById: string }) {
  const router = useRouter();
  const [categories, setCategories] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState('');

  // Form State
  const [reference, setReference] = useState('');
  const [title, setTitle] = useState('');
  const [description, setDescription] = useState('');
  const [quantity, setQuantity] = useState(1);
  const [unit, setUnit] = useState('Piece');
  const [department, setDepartment] = useState('IT Department');
  const [requiredDate, setRequiredDate] = useState('');
  
  const [selectedCategoryId, setSelectedCategoryId] = useState('');
  const [selectedItemId, setSelectedItemId] = useState('');
  const [requirements, setRequirements] = useState<any[]>([]);

  useEffect(() => {
    fetch('/api/categories')
      .then(res => res.json())
      .then(data => {
        setCategories(data);
        setLoading(false);
      })
      .catch(err => {
        console.error(err);
        setLoading(false);
      });
  }, []);

  const handleCategoryChange = (e: React.ChangeEvent<HTMLSelectElement>) => {
    setSelectedCategoryId(e.target.value);
    setSelectedItemId('');
    setRequirements([]);
  };

  const handleItemChange = (e: React.ChangeEvent<HTMLSelectElement>) => {
    const itemId = e.target.value;
    setSelectedItemId(itemId);
    
    // Find the item and its specifications to populate requirements
    const category = categories.find(c => c.id === selectedCategoryId);
    const item = category?.items.find((i: any) => i.id === itemId);
    
    if (item && item.specifications) {
      const initialRequirements = item.specifications.map((spec: any) => ({
        specificationDefinitionId: spec.id,
        name: spec.name,
        type: spec.type,
        unit: spec.unit,
        required: spec.required,
        comparisonType: spec.comparisonType,
        requiredValue: '',
        allowedValues: spec.allowedValues,
      }));
      setRequirements(initialRequirements);
    } else {
      setRequirements([]);
    }
  };

  const handleRequirementChange = (index: number, value: string) => {
    const newReqs = [...requirements];
    newReqs[index].requiredValue = value;
    setRequirements(newReqs);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setSubmitting(true);
    setError('');

    try {
      const res = await fetch('/api/procurements', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          reference,
          title,
          description,
          requiredQuantity: quantity,
          unitOfMeasure: unit,
          department,
          requiredDate,
          createdById,
          itemId: selectedItemId,
          requirements
        })
      });

      if (!res.ok) {
        const errorData = await res.json();
        throw new Error(errorData.error || 'Failed to create procurement');
      }

      const newProcurement = await res.json();
      router.push(`/procurements/${newProcurement.id}`);
    } catch (err: any) {
      setError(err.message);
      setSubmitting(false);
    }
  };

  if (loading) return <div>Loading catalog data...</div>;

  const selectedCategory = categories.find(c => c.id === selectedCategoryId);

  return (
    <form onSubmit={handleSubmit}>
      {error && <div style={{ color: 'red', marginBottom: '1rem' }}>{error}</div>}

      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1.5rem', marginBottom: '2rem' }}>
        <div className="form-group">
          <label className="form-label">Procurement Reference</label>
          <input className="form-control" required value={reference} onChange={e => setReference(e.target.value)} placeholder="e.g. PR-2026-002" />
        </div>
        <div className="form-group">
          <label className="form-label">Title</label>
          <input className="form-control" required value={title} onChange={e => setTitle(e.target.value)} placeholder="e.g. Laptops for Engineering" />
        </div>
        <div className="form-group">
          <label className="form-label">Required Quantity</label>
          <input type="number" min="1" className="form-control" required value={quantity} onChange={e => setQuantity(Number(e.target.value))} />
        </div>
        <div className="form-group">
          <label className="form-label">Unit of Measure</label>
          <input className="form-control" required value={unit} onChange={e => setUnit(e.target.value)} />
        </div>
        <div className="form-group">
          <label className="form-label">Department</label>
          <input className="form-control" required value={department} onChange={e => setDepartment(e.target.value)} />
        </div>
        <div className="form-group">
          <label className="form-label">Required By Date</label>
          <input type="date" className="form-control" required value={requiredDate} onChange={e => setRequiredDate(e.target.value)} />
        </div>
        <div className="form-group" style={{ gridColumn: 'span 2' }}>
          <label className="form-label">Description (Optional)</label>
          <textarea className="form-control" rows={3} value={description} onChange={e => setDescription(e.target.value)}></textarea>
        </div>
      </div>

      <h3 style={{ borderBottom: '1px solid var(--border-color)', paddingBottom: '0.5rem', marginBottom: '1rem' }}>Item & Specifications</h3>
      
      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1.5rem', marginBottom: '2rem' }}>
        <div className="form-group">
          <label className="form-label">Category</label>
          <select className="form-control" required value={selectedCategoryId} onChange={handleCategoryChange}>
            <option value="">Select Category...</option>
            {categories.map(c => (
              <option key={c.id} value={c.id}>{c.name}</option>
            ))}
          </select>
        </div>
        <div className="form-group">
          <label className="form-label">Item</label>
          <select className="form-control" required value={selectedItemId} onChange={handleItemChange} disabled={!selectedCategoryId}>
            <option value="">Select Item...</option>
            {selectedCategory?.items.map((i: any) => (
              <option key={i.id} value={i.id}>{i.name}</option>
            ))}
          </select>
        </div>
      </div>

      {requirements.length > 0 && (
        <div style={{ backgroundColor: '#f8fafc', padding: '1.5rem', borderRadius: '8px', marginBottom: '2rem', border: '1px solid var(--border-color)' }}>
          <h4 style={{ marginBottom: '1rem' }}>Define Minimum Requirements</h4>
          <p style={{ fontSize: '0.875rem', color: 'var(--text-muted)', marginBottom: '1.5rem' }}>
            Customize the requirements for this specific procurement based on the item catalog definition.
          </p>
          
          <div style={{ display: 'grid', gap: '1rem' }}>
            {requirements.map((req, index) => (
              <div key={req.specificationDefinitionId} style={{ display: 'flex', gap: '1rem', alignItems: 'center' }}>
                <div style={{ width: '200px', fontWeight: 500, fontSize: '0.875rem' }}>
                  {req.name} {req.required && <span style={{ color: 'red' }}>*</span>}
                  <div style={{ fontSize: '0.75rem', color: 'var(--text-muted)', fontWeight: 'normal' }}>
                    ({req.comparisonType.toLowerCase().replace('_', ' ')})
                  </div>
                </div>
                <div style={{ flex: 1 }}>
                  <input 
                    type={req.type === 'NUMBER' ? 'number' : 'text'}
                    className="form-control"
                    required={req.required}
                    value={req.requiredValue}
                    onChange={e => handleRequirementChange(index, e.target.value)}
                    placeholder={`Enter required ${req.name.toLowerCase()}...`}
                  />
                </div>
                <div style={{ width: '80px', color: 'var(--text-muted)', fontSize: '0.875rem' }}>
                  {req.unit || ''}
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      <div style={{ display: 'flex', justifyContent: 'flex-end' }}>
        <button type="submit" className="btn btn-primary" disabled={submitting || !selectedItemId}>
          {submitting ? 'Creating...' : 'Create Procurement'}
        </button>
      </div>
    </form>
  );
}
