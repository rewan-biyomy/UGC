// src/core/models/RequestPackage.ts
import type { ArabicDialect } from "../constants/arabic-dialects";

export type RequestStatus =
  | "SUBMITTED" | "UNDER_REVIEW" | "ROUTED" | "ACCEPTED" | "DECLINED"
  | "DELIVERY_SUBMITTED" | "DELIVERY_REVISION_REQUIRED" | "DELIVERED" | "COMPLETED" | "REJECTED";

export interface DeliveryFileDTO {
  driveFileId: string;
  fileName: string;
  webViewLink: string;
  mimeType: string;
  submittedAt: string;
}

export interface RequestReviewDTO {
  rating: number;
  comment: string;
  clientName: string;
  createdAt: string;
}

export interface RequestPackageDTO {
  id: string; clientId: string; creatorId: string | null;
  itemIds: string[]; brief: string; dialects?: ArabicDialect[]; status: RequestStatus;
  adminNotes: string[]; createdAt: string;
  delivery?: DeliveryFileDTO | null;
  review?: RequestReviewDTO | null;
  deliveryFeedback?: string | null;
}

/**
 * The ONLY communication channel in the platform.
 * There is deliberately NO client↔creator messaging field — the Admin is
 * the single router between the two sides (core business rule).
 */
export class RequestPackage {
  private constructor(
    public readonly id: string,
    public readonly clientId: string,
    public readonly creatorId: string | null,
    public readonly itemIds: readonly string[],
    public readonly brief: string,
    public readonly dialects: readonly ArabicDialect[],
    public readonly status: RequestStatus,
    public readonly adminNotes: readonly string[],
    public readonly createdAt: Date,
    public readonly delivery: DeliveryFileDTO | null = null,
    public readonly review: RequestReviewDTO | null = null,
    public readonly deliveryFeedback: string | null = null,
  ) {}

  static submit(clientId: string, itemIds: string[], brief: string, dialects: ArabicDialect[] = []): RequestPackage {
    if (!clientId.trim()) throw new Error("A client is required to submit a request");
    if (!itemIds.length) throw new Error("A request must include at least one portfolio item");
    if (!brief.trim()) throw new Error("A campaign brief is required");
    return new RequestPackage(crypto.randomUUID(), clientId, null, [...itemIds], brief.trim(), [...dialects], "SUBMITTED", [], new Date());
  }

  static fromDTO(dto: RequestPackageDTO): RequestPackage {
    return new RequestPackage(dto.id, dto.clientId, dto.creatorId, [...dto.itemIds], dto.brief,
      [...(dto.dialects ?? [])], dto.status, [...dto.adminNotes], new Date(dto.createdAt),
      dto.delivery ?? null, dto.review ?? null, dto.deliveryFeedback ?? null);
  }

  routeTo(creatorId: string, adminNote: string): RequestPackage {
    if (!creatorId.trim()) throw new Error("A creator is required to route a request");
    if (this.creatorId) throw new Error("Request already routed");
    return new RequestPackage(this.id, this.clientId, creatorId, [...this.itemIds], this.brief,
      [...this.dialects], "ROUTED", [...this.adminNotes, adminNote], this.createdAt);
  }

  respond(decision: "ACCEPTED" | "DECLINED"): RequestPackage {
    if (!this.creatorId) throw new Error("Only routed requests can receive a creator response.");
    if (this.status !== "ROUTED") throw new Error("This request has already received a response.");
    return new RequestPackage(this.id, this.clientId, this.creatorId, [...this.itemIds], this.brief,
      [...this.dialects], decision, [...this.adminNotes], this.createdAt);
  }

  submitDelivery(creatorId: string, delivery: DeliveryFileDTO): RequestPackage {
    if (this.creatorId !== creatorId) throw new Error("لا تملك صلاحية تسليم هذا الطلب.");
    if (this.status !== "ACCEPTED" && this.status !== "DELIVERY_REVISION_REQUIRED") {
      throw new Error("لا يمكن تسليم ملف لهذا الطلب في حالته الحالية.");
    }
    if (!delivery.driveFileId.trim() || !delivery.fileName.trim() || !delivery.webViewLink.trim()) {
      throw new Error("بيانات الملف المرسل غير مكتملة.");
    }
    return new RequestPackage(this.id, this.clientId, this.creatorId, [...this.itemIds], this.brief,
      [...this.dialects], "DELIVERY_SUBMITTED", [...this.adminNotes], this.createdAt, delivery, null, null);
  }

  reviewDelivery(decision: "DELIVERED" | "DELIVERY_REVISION_REQUIRED", adminNote: string): RequestPackage {
    if (this.status !== "DELIVERY_SUBMITTED" || !this.delivery) {
      throw new Error("لا يوجد ملف تسليم بانتظار المراجعة.");
    }
    const note = adminNote.trim();
    return new RequestPackage(
      this.id, this.clientId, this.creatorId, [...this.itemIds], this.brief, [...this.dialects], decision,
      [...this.adminNotes], this.createdAt, this.delivery, null,
      decision === "DELIVERY_REVISION_REQUIRED" ? note || "يرجى تعديل الملف وإعادة إرساله." : null,
    );
  }

  rate(clientId: string, rating: number, comment: string, clientName: string): RequestPackage {
    if (this.clientId !== clientId) throw new Error("لا تملك صلاحية تقييم هذا الطلب.");
    if (this.status !== "DELIVERED") throw new Error("لا يمكن تقييم الطلب قبل اعتماد التسليم من المنصة.");
    if (!Number.isInteger(rating) || rating < 1 || rating > 5) throw new Error("يجب اختيار تقييم من نجمة إلى خمس نجوم.");
    const normalizedComment = comment.trim();
    if (normalizedComment.length > 1000) throw new Error("يجب ألا يتجاوز التعليق ١٠٠٠ حرف.");
    return new RequestPackage(
      this.id, this.clientId, this.creatorId, [...this.itemIds], this.brief, [...this.dialects], "COMPLETED",
      [...this.adminNotes], this.createdAt, this.delivery,
      { rating, comment: normalizedComment, clientName, createdAt: new Date().toISOString() }, null,
    );
  }
}