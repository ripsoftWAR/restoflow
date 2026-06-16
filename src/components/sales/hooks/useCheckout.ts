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
    console.log('🔵 [1] handleCheckout DIPANGGIL', {
      cartLength: params.cart?.length,
      paymentMethod: params.paymentMethod,
      cashPaid: params.cashPaid,
      finalTotal: params.finalTotal,
      isCartEmpty: params.isCartEmpty,
      paymentError: params.paymentError,
    });

    const {
      cart, recipes, paymentMethod, cashPaid, cashChange,
      totals, discount, finalTotal, voucherCode, voucherId, voucherLabel,
      isCartEmpty, onTriggerSale, onRefreshStats, onSuccess, cashInputRef,
    } = params;

    if (isCartEmpty) {
      console.log('🔴 [STOP] Cart kosong, keluar.');
      return;
    }

    if (paymentMethod === 'CASH') {
      if (!cashPaid || cashPaid < finalTotal) {
        console.log('🔴 [STOP] CASH tapi cashPaid kurang atau kosong', { cashPaid, finalTotal });
        cashInputRef.current?.focus();
        return;
      }
    }

    console.log('🟡 [2] Lolos validasi, mulai setCheckoutLoading(true)');
    setCheckoutLoading(true);

    const invoiceId = `INV-${Date.now().toString().slice(-6)}`;

    const lineReceipts = cart.map(item => {
      const parts: string[] = [];
      if (item.selectedSpice) parts.push(`Level: ${item.selectedSpice}`);
      if (item.selectedSugar) parts.push(item.selectedSugar);
      Object.entries(item.customChoices ?? {}).forEach(([k, v]) => parts.push(`${k}: ${v}`));

      const lineTotal = item.price * item.qty;
      const share = totals.subtotal > 0 ? (discount * lineTotal) / totals.subtotal : 0;
      const discountedLineTotal = Math.max(0, Math.round(lineTotal - share));

      return {
        menuName: item.menuName,
        qty: item.qty,
        price: item.price,
        total: discountedLineTotal,
        options: parts.join(', '),
        category: recipes.find(r => r.menu_name === item.menuName)?.category ?? 'Makanan',
      };
    });

    const receipt: ReceiptData = {
      invoiceId,
      timestamp: new Date().toLocaleTimeString('id-ID') + ', ' + new Date().toLocaleDateString('id-ID'),
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

    console.log('🟡 [3] Receipt sudah disusun:', receipt);

    try {
      console.log('🟡 [4] Mulai Promise.all onTriggerSale untuk', cart.length, 'item');

      await Promise.all(cart.map(async (item, idx) => {
        console.log(`🟡 [4.${idx}] Kirim item: ${item.menuName}`);
        try {
          await onTriggerSale({
            menu_name: item.menuName,
            quantity: item.qty,
            total_price: lineReceipts[idx].total,
            selected_options: lineReceipts[idx].options,
            payment_method: paymentMethod,
            cash_paid: paymentMethod === 'CASH' ? cashPaid : null,
            cash_change: paymentMethod === 'CASH' ? cashChange : null,
            voucher_code: voucherCode || undefined,
            discount_amount: discount,
          });
          console.log(`✅ [4.${idx}] onTriggerSale sukses: ${item.menuName}`);
        } catch (e) {
          console.error(`❌ [4.${idx}] onTriggerSale GAGAL: ${item.menuName}`, e);
        }
      }));

      console.log('🟢 [5] Semua API selesai, memanggil onSuccess...');
      setCheckoutSuccess(true);
      onSuccess(receipt);
      console.log('🟢 [6] onSuccess SELESAI dipanggil ✓');

    } catch (err) {
      console.error('🔴 [ERROR] Global Checkout Error:', err);
      alert('Terjadi kesalahan saat memproses transaksi.');
    } finally {
      console.log('🏁 [FINALLY] setCheckoutLoading(false)');
      setCheckoutLoading(false);
    }
  };

  return { checkoutLoading, checkoutSuccess, handleCheckout };
}