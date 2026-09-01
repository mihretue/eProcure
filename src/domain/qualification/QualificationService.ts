import { PrismaClient, ProcurementRequirement, QuotationSpecification } from '@prisma/client';
import { ComparisonType, QualificationStatus, SpecificationType } from '../types';

export class QualificationService {
  constructor(private prisma: PrismaClient) {}

  /**
   * Evaluates a single quotation against the procurement requirements.
   * Updates the quotation with its qualification status and score.
   */
  async evaluateQuotation(quotationId: string): Promise<QualificationStatus> {
    const quotation = await this.prisma.quotation.findUnique({
      where: { id: quotationId },
      include: {
        specifications: true,
        procurementRequest: {
          include: { requirements: true }
        }
      }
    });

    if (!quotation) throw new Error('Quotation not found');

    const requirements = quotation.procurementRequest.requirements;
    const suppliedSpecs = quotation.specifications;

    let allPass = true;
    let missingRequired = false;
    let passedCount = 0;
    let totalRequiredCount = 0;

    for (const req of requirements) {
      if (!req.required) continue;
      
      totalRequiredCount++;
      const supplied = suppliedSpecs.find(s => s.procurementRequirementId === req.id);

      if (!supplied || !supplied.value || supplied.value.trim() === '') {
        missingRequired = true;
        allPass = false;
        continue;
      }

      const passed = this.compareSpecification(req, supplied);
      if (!passed) {
        allPass = false;
      } else {
        passedCount++;
      }
    }

    let status = QualificationStatus.QUALIFIED;
    
    if (missingRequired) {
      status = QualificationStatus.INCOMPLETE;
    } else if (!allPass) {
      status = QualificationStatus.NOT_QUALIFIED;
    }

    const score = totalRequiredCount > 0 ? (passedCount / totalRequiredCount) * 100 : 100;

    await this.prisma.quotation.update({
      where: { id: quotationId },
      data: {
        qualificationStatus: status,
        qualificationScore: score,
      }
    });

    return status;
  }

  /**
   * Compares the required value with the supplied value based on comparisonType.
   */
  private compareSpecification(
    requirement: ProcurementRequirement,
    supplied: QuotationSpecification
  ): boolean {
    if (!requirement.requiredValue) return true; // Nothing required to compare
    if (!supplied.value) return false;

    const reqVal = requirement.requiredValue.trim();
    const supVal = supplied.value.trim();

    try {
      switch (requirement.comparisonType as ComparisonType) {
        case ComparisonType.MINIMUM:
          if (requirement.type === SpecificationType.NUMBER) {
            return parseFloat(supVal) >= parseFloat(reqVal);
          }
          break;
        case ComparisonType.MAXIMUM:
          if (requirement.type === SpecificationType.NUMBER) {
            return parseFloat(supVal) <= parseFloat(reqVal);
          }
          break;
        case ComparisonType.EXACT:
          if (requirement.type === SpecificationType.BOOLEAN) {
            return supVal.toLowerCase() === reqVal.toLowerCase();
          }
          if (requirement.type === SpecificationType.NUMBER) {
             return parseFloat(supVal) === parseFloat(reqVal);
          }
          return supVal === reqVal;
        case ComparisonType.ALLOWED_VALUE:
          if (requirement.allowedValues) {
            const allowed: string[] = JSON.parse(requirement.allowedValues);
            return allowed.includes(supVal);
          }
          break;
        case ComparisonType.TEXT_MATCH:
          // A simple text match (case-insensitive substring or match)
          return supVal.toLowerCase().includes(reqVal.toLowerCase()) || reqVal.toLowerCase().includes(supVal.toLowerCase());
        default:
          return supVal === reqVal;
      }
    } catch (e) {
      // In case of parsing errors
      return false;
    }

    return false;
  }
}
