import { PrismaClient, MarketAnalysis } from '@prisma/client';
import { CalculationMethod, QualificationStatus } from '../types';

export class PriceAnalysisService {
  constructor(private prisma: PrismaClient) {}

  /**
   * Generates market analysis for a procurement request based on its quotations.
   */
  async generateAnalysis(procurementRequestId: string, createdById: string): Promise<MarketAnalysis> {
    const request = await this.prisma.procurementRequest.findUnique({
      where: { id: procurementRequestId },
      include: { quotations: true }
    });

    if (!request) throw new Error('Procurement Request not found');

    const quotations = request.quotations;
    const qualifiedQuotations = quotations.filter(q => q.qualificationStatus === QualificationStatus.QUALIFIED);

    const quotationCount = quotations.length;
    const qualifiedQuotationCount = qualifiedQuotations.length;

    let lowestOverallPrice = null;
    let lowestQualifiedPrice = null;
    let highestQualifiedPrice = null;
    let averageQualifiedPrice = null;
    let medianQualifiedPrice = null;
    let recommendedBenchmarkPrice = null;
    let estimatedProcurementBudget = null;
    let calculationMethod = null;
    const anomalyThreshold = 0.2; // 20% deviation is an anomaly

    // Calculate overall lowest
    if (quotationCount > 0) {
      lowestOverallPrice = Math.min(...quotations.map(q => q.unitPrice));
    }

    // Calculate qualified metrics
    if (qualifiedQuotationCount > 0) {
      const qualifiedPrices = qualifiedQuotations.map(q => q.unitPrice).sort((a, b) => a - b);
      
      lowestQualifiedPrice = qualifiedPrices[0];
      highestQualifiedPrice = qualifiedPrices[qualifiedPrices.length - 1];
      
      const sum = qualifiedPrices.reduce((a, b) => a + b, 0);
      averageQualifiedPrice = sum / qualifiedQuotationCount;

      // Median
      const mid = Math.floor(qualifiedPrices.length / 2);
      if (qualifiedPrices.length % 2 === 0) {
        medianQualifiedPrice = (qualifiedPrices[mid - 1] + qualifiedPrices[mid]) / 2;
      } else {
        medianQualifiedPrice = qualifiedPrices[mid];
      }

      if (qualifiedQuotationCount === 1) {
        recommendedBenchmarkPrice = qualifiedPrices[0];
        calculationMethod = CalculationMethod.SINGLE_QUALIFIED_PRICE;
      } else {
        recommendedBenchmarkPrice = medianQualifiedPrice;
        calculationMethod = CalculationMethod.MEDIAN_QUALIFIED_PRICES;
      }

      estimatedProcurementBudget = recommendedBenchmarkPrice * request.requiredQuantity;
    }

    // Upsert market analysis
    const analysis = await this.prisma.marketAnalysis.upsert({
      where: { procurementRequestId },
      create: {
        procurementRequestId,
        quotationCount,
        qualifiedQuotationCount,
        lowestOverallPrice,
        lowestQualifiedPrice,
        highestQualifiedPrice,
        averageQualifiedPrice,
        medianQualifiedPrice,
        recommendedBenchmarkPrice,
        estimatedProcurementBudget,
        calculationMethod,
        qualifiedQuotationIds: JSON.stringify(qualifiedQuotations.map(q => q.id)),
        anomalyThreshold,
        createdById
      },
      update: {
        quotationCount,
        qualifiedQuotationCount,
        lowestOverallPrice,
        lowestQualifiedPrice,
        highestQualifiedPrice,
        averageQualifiedPrice,
        medianQualifiedPrice,
        recommendedBenchmarkPrice,
        estimatedProcurementBudget,
        calculationMethod,
        qualifiedQuotationIds: JSON.stringify(qualifiedQuotations.map(q => q.id)),
        createdById // update tracker
      }
    });

    return analysis;
  }

  /**
   * Checks if a specific price is anomalous compared to the benchmark
   */
  detectPriceAnomaly(price: number, benchmark: number, threshold: number = 0.2): 'LOW' | 'HIGH' | 'NORMAL' {
    const diff = price - benchmark;
    const percentDiff = diff / benchmark;

    if (percentDiff < -threshold) return 'LOW';
    if (percentDiff > threshold) return 'HIGH';
    return 'NORMAL';
  }
}
