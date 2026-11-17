export type PaymentMethod = 'PIX' | 'CARD';

export type PaymentStatus = 'PENDING' | 'PAID' | 'FAILED' | 'REFUNDED' | 'CANCELED';

export interface Payment {
  id: string;
  status: PaymentStatus;
  method: PaymentMethod;
  amount: number;
  pixCode: string | null;
  failureReason: string | null;
}

export interface PaymentRequest {
  rentalId: string;
  method: PaymentMethod;
  cardLast4: string | null;
}
