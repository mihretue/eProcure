import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import PDFDocument from 'pdfkit';

export async function GET(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  try {
    const { id } = await params;
    
    const procurement = await prisma.procurementRequest.findUnique({
      where: { id },
      include: {
        requirements: true,
        marketAnalysis: true,
      }
    });

    if (!procurement) {
      return NextResponse.json({ error: 'Procurement Request not found' }, { status: 404 });
    }

    if (!procurement.marketAnalysis || !procurement.marketAnalysis.recommendedBenchmarkPrice) {
      return NextResponse.json({ error: 'Market analysis must be completed before generating a specification' }, { status: 400 });
    }

    // Create a new PDF document
    const doc = new PDFDocument({ margin: 50 });
    
    const stream = new ReadableStream({
      start(controller) {
        doc.on('data', chunk => controller.enqueue(chunk));
        doc.on('end', () => controller.close());
        
        // Generate PDF Content
        doc.fontSize(20).text('Government Procurement Specification', { align: 'center' });
        doc.moveDown();
        
        doc.fontSize(12).text(`Procurement Reference: ${procurement.reference}`);
        doc.text(`Title: ${procurement.title}`);
        doc.text(`Department: ${procurement.department}`);
        doc.text(`Quantity Required: ${procurement.requiredQuantity} ${procurement.unitOfMeasure}`);
        doc.text(`Generated Date: ${new Date().toLocaleDateString()}`);
        doc.moveDown();
        
        doc.fontSize(16).text('1. Background & Purpose');
        doc.fontSize(12).text(procurement.description || 'N/A');
        doc.moveDown();
        
        doc.fontSize(16).text('2. Technical Specifications');
        doc.fontSize(12).text('The supplier must meet the following mandatory minimum technical specifications:');
        doc.moveDown(0.5);
        
        procurement.requirements.forEach((req, index) => {
           let condition = req.comparisonType.replace(/_/g, ' ').toLowerCase();
           doc.text(`${index + 1}. ${req.name}: ${condition} ${req.requiredValue} ${req.unit}`);
        });
        doc.moveDown();
        
        doc.fontSize(16).text('3. Budget & Financial Requirements');
        doc.fontSize(12).text('Based on recent market intelligence and benchmarking:');
        doc.text(`Estimated Unit Price: ${procurement.marketAnalysis?.recommendedBenchmarkPrice?.toLocaleString()} ETB`);
        doc.text(`Total Estimated Budget: ${procurement.marketAnalysis?.estimatedProcurementBudget?.toLocaleString()} ETB`);
        doc.moveDown();
        
        doc.text('Note: Suppliers are expected to quote within reasonable variance of the benchmark price.');
        
        doc.end();
      }
    });

    return new NextResponse(stream, {
      headers: {
        'Content-Type': 'application/pdf',
        'Content-Disposition': `attachment; filename="specification-${procurement.reference}.pdf"`
      }
    });
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
