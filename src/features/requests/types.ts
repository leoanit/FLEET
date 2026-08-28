export type TransportRequestStatus = 'Pending' | 'Approved' | 'Rejected';

export interface TransportRequest {
  id: string;
  referenceNumber: string;
  requestedBy: string;
  requesterName: string;
  requesterEmail: string;
  origin: string;
  destination: string;
  purpose: string;
  travelDateTime: string;
  status: TransportRequestStatus;
  rejectionReason?: string;
  dispatchId?: string;
  driverName?: string;
  vehicleName?: string;
  plateNumber?: string;
  reviewedBy?: string;
  reviewedAt?: string;
  createdAt: string;
}
