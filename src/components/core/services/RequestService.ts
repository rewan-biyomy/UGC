// src/core/services/RequestService.ts
import { PortfolioService } from "./PortfolioService";
import type { CreatorSnapshot } from "../models/PortfolioItem";
import {
  RequestPackage,
  type DeliveryFileDTO,
  type RequestPackageDTO,
} from "../models/RequestPackage";
import type { ArabicDialect } from "../constants/arabic-dialects";

const LOCAL_REQUESTS_KEY = "ugc.requests";

function readLocalRequests(): RequestPackageDTO[] {
  try {
    const value: unknown = JSON.parse(localStorage.getItem(LOCAL_REQUESTS_KEY) ?? "[]");
    return Array.isArray(value) ? value as RequestPackageDTO[] : [];
  } catch (error) {
    console.error("Unable to read local campaign requests", error);
    return [];
  }
}

function toDTO(request: RequestPackage): RequestPackageDTO {
  return {
    id: request.id,
    clientId: request.clientId,
    creatorId: request.creatorId,
    itemIds: [...request.itemIds],
    brief: request.brief,
    dialects: [...request.dialects],
    status: request.status,
    adminNotes: [...request.adminNotes],
    createdAt: request.createdAt.toISOString(),
    delivery: request.delivery,
    review: request.review,
    deliveryFeedback: request.deliveryFeedback,
  };
}

export class RequestService {
  private static instance: RequestService;
  private constructor() {}

  static getInstance(): RequestService {
    return (RequestService.instance ??= new RequestService());
  }

  async submit(input: { clientId: string; itemIds: string[]; brief: string; dialects: ArabicDialect[] }): Promise<RequestPackage[]> {
    const approvedItems = await PortfolioService.getInstance().listApproved({});
    const selectedItems = input.itemIds.map((id) => {
      const item = approvedItems.find((candidate) => candidate.id === id);
      if (!item) throw new Error("تحتوي الباقة على عمل لم يعد متاحاً.");
      return item;
    });
    const itemsByCreator = new Map<string, typeof selectedItems>();
    for (const item of selectedItems) {
      const creatorItems = itemsByCreator.get(item.creator.id) ?? [];
      creatorItems.push(item);
      itemsByCreator.set(item.creator.id, creatorItems);
    }
    const requests = [...itemsByCreator.values()].map((items) =>
      RequestPackage.submit(input.clientId, items.map((item) => item.id), input.brief, input.dialects),
    );
    const savedRequests = requests.map(toDTO);
    localStorage.setItem(LOCAL_REQUESTS_KEY, JSON.stringify([...savedRequests, ...readLocalRequests()]));
    return requests;
  }

  listForAdmin(): Promise<RequestPackage[]> {
    return Promise.resolve(readLocalRequests().map(RequestPackage.fromDTO));
  }

  listForCreator(creatorId: string): Promise<RequestPackage[]> {
    return Promise.resolve(readLocalRequests()
      .filter((request) => request.creatorId === creatorId
        && ["ROUTED", "ACCEPTED", "DELIVERY_SUBMITTED", "DELIVERY_REVISION_REQUIRED"].includes(request.status))
      .map(RequestPackage.fromDTO));
  }

  listForClient(clientId: string): Promise<RequestPackage[]> {
    return Promise.resolve(readLocalRequests()
      .filter((request) => request.clientId === clientId)
      .map(RequestPackage.fromDTO));
  }

  respond(id: string, creatorId: string, decision: "ACCEPTED" | "DECLINED"): Promise<RequestPackage> {
    const requests = readLocalRequests();
    const index = requests.findIndex((request) => request.id === id);
    if (index < 0) return Promise.reject(new Error("لم يتم العثور على الطلب."));
    if (requests[index].creatorId !== creatorId) {
      return Promise.reject(new Error("لا تملك صلاحية الرد على هذا الطلب."));
    }
    try {
      const updated = RequestPackage.fromDTO(requests[index]).respond(decision);
      requests[index] = toDTO(updated);
      localStorage.setItem(LOCAL_REQUESTS_KEY, JSON.stringify(requests));
      return Promise.resolve(updated);
    } catch (error) {
      return Promise.reject(error);
    }
  }

  /** Only the Admin can bind a creator to a request. */
  async route(id: string, creatorId: string, note: string): Promise<RequestPackage> {
    const requests = readLocalRequests();
    const index = requests.findIndex((request) => request.id === id);
    if (index < 0) throw new Error("لم يتم العثور على الطلب المحلي.");
    const approvedItems = await PortfolioService.getInstance().listApproved({});
    if (!requests[index].itemIds.some((itemId) => approvedItems.some(
      (item) => item.id === itemId && item.creator.id === creatorId,
    ))) {
      throw new Error("يجب توجيه الطلب إلى منشئ أحد الأعمال المحددة فيه.");
    }
    const routed = RequestPackage.fromDTO(requests[index]).routeTo(creatorId, note.trim());
    requests[index] = toDTO(routed);
    localStorage.setItem(LOCAL_REQUESTS_KEY, JSON.stringify(requests));
    return routed;
  }

  submitDelivery(id: string, creatorId: string, delivery: DeliveryFileDTO): Promise<RequestPackage> {
    const requests = readLocalRequests();
    const index = requests.findIndex((request) => request.id === id);
    if (index < 0) return Promise.reject(new Error("لم يتم العثور على الطلب."));
    try {
      const updated = RequestPackage.fromDTO(requests[index]).submitDelivery(creatorId, delivery);
      requests[index] = toDTO(updated);
      localStorage.setItem(LOCAL_REQUESTS_KEY, JSON.stringify(requests));
      return Promise.resolve(updated);
    } catch (error) {
      return Promise.reject(error);
    }
  }

  reviewDelivery(
    id: string,
    decision: "DELIVERED" | "DELIVERY_REVISION_REQUIRED",
    adminNote: string,
  ): Promise<RequestPackage> {
    const requests = readLocalRequests();
    const index = requests.findIndex((request) => request.id === id);
    if (index < 0) return Promise.reject(new Error("لم يتم العثور على الطلب."));
    try {
      const updated = RequestPackage.fromDTO(requests[index]).reviewDelivery(decision, adminNote);
      requests[index] = toDTO(updated);
      localStorage.setItem(LOCAL_REQUESTS_KEY, JSON.stringify(requests));
      return Promise.resolve(updated);
    } catch (error) {
      return Promise.reject(error);
    }
  }

  rate(id: string, clientId: string, rating: number, comment: string, clientName: string): Promise<RequestPackage> {
    const requests = readLocalRequests();
    const index = requests.findIndex((request) => request.id === id);
    if (index < 0) return Promise.reject(new Error("لم يتم العثور على الطلب."));
    try {
      const updated = RequestPackage.fromDTO(requests[index]).rate(clientId, rating, comment, clientName);
      requests[index] = toDTO(updated);
      localStorage.setItem(LOCAL_REQUESTS_KEY, JSON.stringify(requests));
      return Promise.resolve(updated);
    } catch (error) {
      return Promise.reject(error);
    }
  }

  async listCreators(): Promise<CreatorSnapshot[]> {
    const items = await PortfolioService.getInstance().listApproved({});
    return [...new Map(items.map((item) => [item.creator.id, item.creator])).values()];
  }
}