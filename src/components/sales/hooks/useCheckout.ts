import { useState, type RefObject } from 'react';
import { RecipeWithDetails } from '../../../types';
import { CartItem } from '../utils/cartHelpers';

export interface ReceiptData {
  invoiceId: string;
  timestamp: string;
  items: {
    menuName: string; qty: number; price: number;
    total: number; options: string; category: string;
  }[];
  paymentMethod: string;
  cashPaid: number; cashChange: number;
  subtotal: number; tax: number; serviceCharge: number;
  discount: number; totalAmount: number;
  voucherLabel?: string;
}

interface CheckoutParams {
  cart: CartItem[];
  recipes: RecipeWithDetails[];
  paymentMethod: 'CASH' | 'QRIS' | 'Debit' | 'Kredit';
  cashPaid: number;
  cashChange: number;
  totals: { subtotal: number; tax: number; service: number; grandTotal: number };
  discount: number;
  finalTotal: number;
  voucherCode?: string;
  voucherId?: string | number;
  voucherLabel?: string;
  isCartEmpty: boolean;
  paymentError: string | null;
  onTriggerSale: (data: any) => Promise<void>;
  onRefreshStats: () => void;
  onSuccess: (receipt: ReceiptData) => void;
  cashInputRef: RefObject<HTMLInputElement | null>;
}

export function useCheckout() {
  const [checkoutLoading, setCheckoutLoading] = useState(false);
  const [checkoutSuccess, setCheckoutSuccess] = useState(false);

  const handleCheckout = async (params: CheckoutParams) => {
    const {
      cart, recipes, paymentMethod, cashPaid, cashChange,
      totals, discount, finalTotal, voucherCode, voucherId, voucherLabel,
      isCartEmpty, paymentError,
      onTriggerSale, onRefreshStats, onSuccess, cashInputRef,
    } = params;

    if (isCartEmpty) return;
    if (paymentMethod === 'CASH') {
      if (!cashPaid || cashPaid < finalTotal) {
        cashInputRef.current?.focus();
        return;
      }
    }

    setCheckoutLoading(true);
    const invoiceId = `INV-${Date.now().toString().slice(-6)}`;
    const lineReceipts: ReceiptData['items'] = [];

    try {
      for (const item of cart) {
        const parts: string[] = [];
        if (item.selectedSpice) parts.push(`Level: ${item.selectedSpice}`);
        if (item.selectedSugar) parts.push(item.selectedSugar);
        Object.entries(item.customChoices ?? {}).forEach(([k, v]) => parts.push(`${k}: ${v}`));
        const optionsStr = parts.join(', ');
        const lineTotal = item.price * item.qty;
        const share = totals.subtotal > 0 ? (discount * lineTotal) / totals.subtotal : 0;
        const discountedLineTotal = Math.max(0, Math.round(lineTotal - share));

        await onTriggerSale({
          menu_name: item.menuName,
          quantity: item.qty,
          total_price: discountedLineTotal,
          selected_options: optionsStr,
          payment_method: paymentMethod,
          cash_paid: paymentMethod === 'CASH' ? cashPaid : null,
          cash_change: paymentMethod === 'CASH' ? cashChange : null,
          voucher_code: voucherCode || undefined,
          voucher_id: voucherId || undefined,
          voucher_label: voucherLabel || undefined,
          discount_amount: discount,
        });

        lineReceipts.push({
          menuName: item.menuName, qty: item.qty, price: item.price, total: discountedLineTotal,
          options: optionsStr,
          category: recipes.find(r => r.menu_name === item.menuName)?.category ?? 'Makanan',
        });
      }

      const receipt: ReceiptData = {
        invoiceId, timestamp:
          new Date().toLocaleTimeString('id-ID', { hour: '2-digit', minute: '2-digit' }) +
          ', ' + new Date().toLocaleDateString('id-ID'),
        items: lineReceipts,
        paymentMethod,
        cashPaid: paymentMethod === 'CASH' ? cashPaid : finalTotal,
        cashChange: paymentMethod === 'CASH' ? cashChange : 0,
        subtotal: totals.subtotal,
        tax: totals.tax,
        serviceCharge: totals.service,
        discount,
        totalAmount: finalTotal,
        voucherLabel,
      };

      setCheckoutSuccess(true);
      onSuccess(receipt);
      onRefreshStats();
      setTimeout(() => setCheckoutSuccess(false), 3000);
    } catch (err) {
      console.error(err);
    } finally {
      setCheckoutLoading(false);
    }
  };

  return { checkoutLoading, checkoutSuccess, handleCheckout };
}
