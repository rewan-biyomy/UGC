import type { RequestPackageDTO, RequestReviewDTO } from "../models/RequestPackage";

const LOCAL_REQUESTS_KEY = "ugc.requests";

export interface CreatorReview extends RequestReviewDTO {
  requestId: string;
}

function readRatedRequests(): RequestPackageDTO[] {
  try {
    const value: unknown = JSON.parse(localStorage.getItem(LOCAL_REQUESTS_KEY) ?? "[]");
    return Array.isArray(value) ? value as RequestPackageDTO[] : [];
  } catch (error) {
    console.error("Unable to read creator ratings", error);
    return [];
  }
}

export class CreatorRatingService {
  static averageFor(creatorId: string): number {
    const reviews = readRatedRequests()
      .filter((request) => request.creatorId === creatorId && request.review)
      .map((request) => request.review!.rating)
      .filter((rating) => Number.isInteger(rating) && rating >= 1 && rating <= 5);
    if (!reviews.length) return 0;
    return Math.round((reviews.reduce((sum, rating) => sum + rating, 0) / reviews.length) * 10) / 10;
  }

  static listFor(creatorId: string): CreatorReview[] {
    return readRatedRequests()
      .filter((request) => request.creatorId === creatorId && request.review)
      .map((request) => ({ ...request.review!, requestId: request.id }));
  }
}
