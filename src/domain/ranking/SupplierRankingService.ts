import { PrismaClient, SupplierRanking } from '@prisma/client';
import { QualificationStatus } from '../types';

export class SupplierRankingService {
  constructor(private prisma: PrismaClient) {}

  /**
   * Ranks all quotations for a given procurement request.
   * Only QUALIFIED suppliers are eligible to be "recommended" and ranked.
   */
  async rankSuppliers(procurementRequestId: string): Promise<SupplierRanking[]> {
    const request = await this.prisma.procurementRequest.findUnique({
      where: { id: procurementRequestId },
      include: { quotations: { include: { supplier: true } } }
    });

    if (!request) throw new Error('Procurement Request not found');

    // Clean up existing rankings
    await this.prisma.supplierRanking.deleteMany({
      where: { procurementRequestId }
    });

    // We only rank QUALIFIED suppliers
    const qualifiedQuotations = request.quotations.filter(q => q.qualificationStatus === QualificationStatus.QUALIFIED);

    // Sort primarily by Qualification Score (descending), then by Price (ascending)
    qualifiedQuotations.sort((a, b) => {
      const scoreDiff = (b.qualificationScore ?? 0) - (a.qualificationScore ?? 0);
      if (scoreDiff !== 0) return scoreDiff;
      
      // If scores are equal, sort by price
      return a.totalPrice - b.totalPrice;
    });

    const rankings: SupplierRanking[] = [];

    for (let i = 0; i < qualifiedQuotations.length; i++) {
      const q = qualifiedQuotations[i];
      const rank = i + 1;
      
      const ranking = await this.prisma.supplierRanking.create({
        data: {
          procurementRequestId,
          supplierId: q.supplierId,
          rank,
          score: q.qualificationScore ?? 0,
          price: q.totalPrice,
          isRecommended: rank === 1 // the #1 ranked is recommended
        }
      });
      rankings.push(ranking);
    }

    return rankings;
  }
}
