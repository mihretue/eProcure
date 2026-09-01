import { PrismaClient } from '@prisma/client'

const prisma = new PrismaClient()

async function main() {
  console.log('Seeding database...')

  // Clean up existing data (for iterative seeding)
  await prisma.auditLog.deleteMany()
  await prisma.supplierRanking.deleteMany()
  await prisma.marketAnalysis.deleteMany()
  await prisma.quotationSpecification.deleteMany()
  await prisma.quotation.deleteMany()
  await prisma.supplier.deleteMany()
  await prisma.procurementRequirement.deleteMany()
  await prisma.procurementRequest.deleteMany()
  await prisma.specificationDefinition.deleteMany()
  await prisma.procurementItem.deleteMany()
  await prisma.itemCategory.deleteMany()
  await prisma.user.deleteMany()
  await prisma.department.deleteMany()

  // 1. Departments and Users
  const itDept = await prisma.department.create({ data: { name: 'IT Department' } })
  const procurementDept = await prisma.department.create({ data: { name: 'Procurement Department' } })

  const admin = await prisma.user.create({
    data: { name: 'Admin User', email: 'admin@gov.et', role: 'ADMINISTRATOR', departmentId: itDept.id }
  })
  const officer = await prisma.user.create({
    data: { name: 'Procurement Officer A', email: 'officer@gov.et', role: 'PROCUREMENT_OFFICER', departmentId: procurementDept.id }
  })

  // 2. Categories
  const catComputer = await prisma.itemCategory.create({ data: { name: 'Computer Equipment' } })
  const catNetwork = await prisma.itemCategory.create({ data: { name: 'Networking Equipment' } })
  const catFurniture = await prisma.itemCategory.create({ data: { name: 'Office Furniture' } })
  const catSupplies = await prisma.itemCategory.create({ data: { name: 'Office Supplies' } })

  // 3. Items and Specification Definitions
  // -- Desktop Computer
  const desktop = await prisma.procurementItem.create({
    data: {
      name: 'Desktop Computer', categoryId: catComputer.id,
      specifications: {
        create: [
          { name: 'CPU', type: 'TEXT', comparisonType: 'TEXT_MATCH', required: true },
          { name: 'RAM', type: 'NUMBER', unit: 'GB', comparisonType: 'MINIMUM', required: true },
          { name: 'Storage', type: 'NUMBER', unit: 'GB', comparisonType: 'MINIMUM', required: true },
          { name: 'Monitor Size', type: 'NUMBER', unit: 'inch', comparisonType: 'MINIMUM', required: true },
          { name: 'Warranty', type: 'NUMBER', unit: 'years', comparisonType: 'MINIMUM', required: true },
        ]
      }
    }
  })

  // -- Network Switch
  const switchItem = await prisma.procurementItem.create({
    data: {
      name: 'Network Switch', categoryId: catNetwork.id,
      specifications: {
        create: [
          { name: 'Ports', type: 'NUMBER', comparisonType: 'MINIMUM', required: true },
          { name: 'Speed', type: 'TEXT', comparisonType: 'ALLOWED_VALUE', allowedValues: JSON.stringify(['1Gbps', '10Gbps']), required: true },
          { name: 'Managed', type: 'BOOLEAN', comparisonType: 'EXACT', required: true },
        ]
      }
    }
  })

  // 4. Suppliers (10+)
  const suppliers = []
  for (let i = 1; i <= 10; i++) {
    suppliers.push(await prisma.supplier.create({
      data: {
        name: `Supplier ${String.fromCharCode(64 + i)} Tech`,
        contactPerson: `Contact ${i}`,
        status: 'ACTIVE'
      }
    }))
  }

  // 5. Procurement Request & Requirements (Snapshot)
  const req1 = await prisma.procurementRequest.create({
    data: {
      reference: 'PR-2026-001',
      title: 'Desktop Computers for New Office',
      status: 'MARKET_RESEARCH',
      requiredQuantity: 50,
      unitOfMeasure: 'Piece',
      department: 'IT Department',
      requiredDate: new Date('2026-09-01'),
      createdById: officer.id,
      requirements: {
        create: [
          { specificationDefinitionId: 'dummy1', name: 'CPU', type: 'TEXT', comparisonType: 'TEXT_MATCH', requiredValue: 'Intel Core i5 13th Gen' },
          { specificationDefinitionId: 'dummy2', name: 'RAM', type: 'NUMBER', unit: 'GB', comparisonType: 'MINIMUM', requiredValue: '16' },
          { specificationDefinitionId: 'dummy3', name: 'Storage', type: 'NUMBER', unit: 'GB', comparisonType: 'MINIMUM', requiredValue: '512' },
          { specificationDefinitionId: 'dummy4', name: 'Monitor Size', type: 'NUMBER', unit: 'inch', comparisonType: 'MINIMUM', requiredValue: '23.8' },
          { specificationDefinitionId: 'dummy5', name: 'Warranty', type: 'NUMBER', unit: 'years', comparisonType: 'MINIMUM', requiredValue: '1' },
        ]
      }
    },
    include: { requirements: true }
  })
  
  // Need to fix dummy IDs with actual specification definition IDs if needed, 
  // but for the MVP, the snapshot only matters if we trace back to catalog. 
  // Wait, I should link them properly for integrity. Let's fix that.
  
  const desktopSpecs = await prisma.specificationDefinition.findMany({ where: { itemId: desktop.id } });
  
  await prisma.procurementRequirement.deleteMany({ where: { procurementRequestId: req1.id }});
  
  const req1Requirements = [];
  for (const spec of desktopSpecs) {
    let reqValue = '';
    if (spec.name === 'CPU') reqValue = 'Intel Core i5 13th Gen';
    if (spec.name === 'RAM') reqValue = '16';
    if (spec.name === 'Storage') reqValue = '512';
    if (spec.name === 'Monitor Size') reqValue = '23.8';
    if (spec.name === 'Warranty') reqValue = '1';

    req1Requirements.push(await prisma.procurementRequirement.create({
      data: {
        procurementRequestId: req1.id,
        specificationDefinitionId: spec.id,
        name: spec.name,
        type: spec.type,
        unit: spec.unit,
        comparisonType: spec.comparisonType,
        requiredValue: reqValue,
        required: true
      }
    }));
  }

  // 6. Quotations
  
  // Quotation 1: Fully Qualified (Supplier A)
  await prisma.quotation.create({
    data: {
      procurementRequestId: req1.id,
      supplierId: suppliers[0].id,
      quotationDate: new Date(),
      quantity: 50,
      unitPrice: 85000,
      vatRate: 15,
      vatAmount: 85000 * 50 * 0.15,
      subtotal: 85000 * 50,
      totalPrice: (85000 * 50) * 1.15,
      qualificationStatus: 'QUALIFIED',
      qualificationScore: 100,
      createdById: officer.id,
      specifications: {
        create: req1Requirements.map(req => ({
          procurementRequirementId: req.id,
          value: req.name === 'CPU' ? 'Intel Core i5 13th Gen' : 
                 req.name === 'RAM' ? '16' : 
                 req.name === 'Storage' ? '512' : 
                 req.name === 'Monitor Size' ? '24' : '2' // 24 inch, 2 years
        }))
      }
    }
  })

  // Quotation 2: Fully Qualified but expensive (Supplier B)
  await prisma.quotation.create({
    data: {
      procurementRequestId: req1.id, supplierId: suppliers[1].id,
      quotationDate: new Date(), quantity: 50,
      unitPrice: 92000, vatRate: 15, vatAmount: 92000 * 50 * 0.15, subtotal: 92000 * 50, totalPrice: (92000 * 50) * 1.15,
      qualificationStatus: 'QUALIFIED', qualificationScore: 100, createdById: officer.id,
      specifications: {
        create: req1Requirements.map(req => ({
          procurementRequirementId: req.id,
          value: req.name === 'CPU' ? 'Intel Core i7 13th Gen' : 
                 req.name === 'RAM' ? '32' : 
                 req.name === 'Storage' ? '1000' : 
                 req.name === 'Monitor Size' ? '27' : '3'
        }))
      }
    }
  })

  // Quotation 3: NOT QUALIFIED (Fails RAM requirement) (Supplier C)
  await prisma.quotation.create({
    data: {
      procurementRequestId: req1.id, supplierId: suppliers[2].id,
      quotationDate: new Date(), quantity: 50,
      unitPrice: 75000, vatRate: 15, vatAmount: 75000 * 50 * 0.15, subtotal: 75000 * 50, totalPrice: (75000 * 50) * 1.15,
      qualificationStatus: 'NOT_QUALIFIED', qualificationScore: 80, createdById: officer.id,
      specifications: {
        create: req1Requirements.map(req => ({
          procurementRequirementId: req.id,
          value: req.name === 'CPU' ? 'Intel Core i5 12th Gen' : 
                 req.name === 'RAM' ? '8' :  // FAILS HERE
                 req.name === 'Storage' ? '512' : 
                 req.name === 'Monitor Size' ? '23.8' : '1'
        }))
      }
    }
  })

  // Quotation 4: Suspiciously Low Price (Qualified) (Supplier D)
  await prisma.quotation.create({
    data: {
      procurementRequestId: req1.id, supplierId: suppliers[3].id,
      quotationDate: new Date(), quantity: 50,
      unitPrice: 40000, vatRate: 15, vatAmount: 40000 * 50 * 0.15, subtotal: 40000 * 50, totalPrice: (40000 * 50) * 1.15,
      qualificationStatus: 'QUALIFIED', qualificationScore: 100, createdById: officer.id,
      specifications: {
        create: req1Requirements.map(req => ({
          procurementRequirementId: req.id,
          value: req.name === 'CPU' ? 'Intel Core i5 13th Gen' : 
                 req.name === 'RAM' ? '16' : 
                 req.name === 'Storage' ? '512' : 
                 req.name === 'Monitor Size' ? '23.8' : '1'
        }))
      }
    }
  })

  // Quotation 5: INCOMPLETE (Missing Warranty) (Supplier E)
  await prisma.quotation.create({
    data: {
      procurementRequestId: req1.id, supplierId: suppliers[4].id,
      quotationDate: new Date(), quantity: 50,
      unitPrice: 86000, vatRate: 15, vatAmount: 86000 * 50 * 0.15, subtotal: 86000 * 50, totalPrice: (86000 * 50) * 1.15,
      qualificationStatus: 'INCOMPLETE', qualificationScore: 80, createdById: officer.id,
      specifications: {
        create: req1Requirements.filter(r => r.name !== 'Warranty').map(req => ({
          procurementRequirementId: req.id,
          value: req.name === 'CPU' ? 'Intel Core i5 13th Gen' : 
                 req.name === 'RAM' ? '16' : 
                 req.name === 'Storage' ? '512' : 
                 req.name === 'Monitor Size' ? '24' : ''
        }))
      }
    }
  })

  console.log('Seeding finished.')
}

main()
  .catch((e) => {
    console.error(e)
    process.exit(1)
  })
  .finally(async () => {
    await prisma.$disconnect()
  })
