import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { PageLayout } from "@/components/layout/PageLayout";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { ChevronLeft, Loader2 } from "lucide-react";
import { API_BASE_URL } from "@/lib/api-config";

interface CartItem {
  id: string;
  productId: string;
  name: string;
  price: number;
  quantity: number;
}

interface Address {
  id: string;
  title: string;
  fullName: string;
  street: string;
  city: string;
  province: string;
  postalCode: string;
  phone: string;
  isDefault?: boolean;
}

interface CheckoutFormData {
  addressId: string;
  paymentMethod: "credit_card" | "bank_transfer" | "cash_on_delivery";
  notes?: string;
}

export default function CheckoutPage() {
  const navigate = useNavigate();
  const [cartItems, setCartItems] = useState<CartItem[]>([]);
  const [cartId, setCartId] = useState<string | null>(null);
  const [addresses, setAddresses] = useState<Address[]>([]);
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [selectedAddressId, setSelectedAddressId] = useState<string>("");
  const [paymentMethod, setPaymentMethod] = useState<"credit_card" | "bank_transfer" | "cash_on_delivery">("cash_on_delivery");
  const [notes, setNotes] = useState("");

  // Load cart and addresses on mount
  useEffect(() => {
    loadCheckoutData();
  }, []);

  const loadCheckoutData = async () => {
    try {
      setLoading(true);
      const token = localStorage.getItem("token");
      const headers: Record<string, string> = {};
      
      if (token) {
        headers["Authorization"] = `Bearer ${token}`;
      }

      // Fetch cart
      const guestToken = localStorage.getItem("guestToken");
      const cartUrl = guestToken 
        ? `${API_BASE_URL}/cart?guestToken=${guestToken}`
        : `${API_BASE_URL}/cart`;
      
      const cartResp = await fetch(cartUrl, { headers });
      if (cartResp.ok) {
        const cartData = await cartResp.json();
        if (cartData.success && cartData.data) {
          setCartId(cartData.data.id);
          if (cartData.data.items) {
            const items: CartItem[] = cartData.data.items.map((item: any) => ({
              id: item.id,
              productId: item.product.id,
              name: item.product.title || item.product.name,
              price: item.product.price,
              quantity: item.quantity,
            }));
            setCartItems(items);
          }
        }
      }

      // Fetch addresses if logged in
      if (token) {
        const addrResp = await fetch(`${API_BASE_URL}/address`, { headers });
        if (addrResp.ok) {
          const addrData = await addrResp.json();
          if (addrData.success && Array.isArray(addrData.data)) {
            setAddresses(addrData.data);
            const defaultAddr = addrData.data.find((a: any) => a.isDefault);
            if (defaultAddr) {
              setSelectedAddressId(defaultAddr.id);
            }
          }
        }
      }
    } catch (err) {
      console.error("Error loading checkout data:", err);
      setError("خطا در بارگذاری اطلاعات");
    } finally {
      setLoading(false);
    }
  };

  const subtotal = cartItems.reduce((sum, item) => sum + item.price * item.quantity, 0);
  const shipping = subtotal > 1000000 ? 0 : 50000;
  const tax = Math.round(subtotal * 0.09);
  const total = subtotal + shipping + tax;

  const handlePlaceOrder = async () => {
    if (!cartId) {
      setError("سبد خرید یافت نشد");
      return;
    }

    if (!selectedAddressId && addresses.length > 0) {
      setError("لطفا آدرس تحویل را انتخاب کنید");
      return;
    }

    try {
      setSubmitting(true);
      setError(null);

      const token = localStorage.getItem("token");
      if (!token) {
        setError("لطفا ابتدا وارد حساب کاربری شوید");
        navigate("/login");
        return;
      }

      const headers: Record<string, string> = {
        "Content-Type": "application/json",
        "Authorization": `Bearer ${token}`,
      };

      const response = await fetch("${API_BASE_URL}/orders", {
        method: "POST",
        headers,
        body: JSON.stringify({ cartId }),
      });

      if (!response.ok) {
        throw new Error("Failed to place order");
      }

      const result = await response.json();
      
      if (result.success) {
        // Clear cart and redirect to success page
        localStorage.removeItem("guestToken");
        navigate("/order-success", { state: { orderId: result.data.id } });
      } else {
        setError(result.message || "خطا در ثبت سفارش");
      }
    } catch (err) {
      console.error("Error placing order:", err);
      setError("خطا در ثبت سفارش. لطفا دوباره تلاش کنید.");
    } finally {
      setSubmitting(false);
    }
  };

  if (loading) {
    return (
      <PageLayout>
        <div className="min-h-screen bg-gradient-to-br from-green-50 to-blue-50 py-12" dir="rtl">
          <div className="container-arad max-w-4xl">
            <Card className="p-12 text-center">
              <Loader2 className="w-8 h-8 animate-spin text-green-600 mx-auto mb-4" />
              <p className="text-muted-foreground">در حال بارگذاری...</p>
            </Card>
          </div>
        </div>
      </PageLayout>
    );
  }

  if (cartItems.length === 0) {
    return (
      <PageLayout>
        <div className="min-h-screen bg-gradient-to-br from-green-50 to-blue-50 py-12" dir="rtl">
          <div className="container-arad max-w-4xl">
            <Card className="p-12 text-center">
              <h2 className="text-xl font-semibold text-gray-900 mb-4">سبد خرید شما خالی است</h2>
              <Button onClick={() => navigate("/products")} className="bg-green-600 hover:bg-green-700">
                مرور محصولات
              </Button>
            </Card>
          </div>
        </div>
      </PageLayout>
    );
  }

  return (
    <PageLayout>
      <div className="min-h-screen bg-gradient-to-br from-green-50 to-blue-50 py-12" dir="rtl">
        <div className="container-arad max-w-5xl">
          <div className="mb-8">
            <h1 className="text-4xl font-bold text-gray-900 text-right mb-2">تکمیل سفارش</h1>
            <p className="text-gray-600 text-right">مرحله آخر برای تکمیل خریدتان</p>
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
            {/* Checkout Form */}
            <div className="lg:col-span-2 space-y-6">
              {/* Delivery Address */}
              <Card className="p-6">
                <h2 className="text-lg font-bold text-gray-900 text-right mb-4">آدرس تحویل</h2>
                
                {addresses.length > 0 ? (
                  <div className="space-y-3">
                    {addresses.map((addr) => (
                      <label
                        key={addr.id}
                        className="flex items-start gap-3 p-4 border border-gray-200 rounded-lg cursor-pointer hover:bg-gray-50"
                      >
                        <input
                          type="radio"
                          name="address"
                          value={addr.id}
                          checked={selectedAddressId === addr.id}
                          onChange={(e) => setSelectedAddressId(e.target.value)}
                          className="mt-1"
                        />
                        <div className="flex-1 text-right">
                          <p className="font-semibold text-gray-900">{addr.title} - {addr.fullName}</p>
                          <p className="text-gray-700">{addr.street}</p>
                          <p className="text-sm text-gray-600">
                            {addr.city} - {addr.province} - {addr.postalCode}
                          </p>
                          <p className="text-sm text-gray-600">{addr.phone}</p>
                          {addr.isDefault && (
                            <span className="inline-block mt-2 px-2 py-1 text-xs bg-green-100 text-green-700 rounded">
                              آدرس پیش‌فرض
                            </span>
                          )}
                        </div>
                      </label>
                    ))}
                  </div>
                ) : (
                  <div className="p-4 bg-blue-50 border border-blue-200 rounded-lg text-right">
                    <p className="text-sm text-blue-700 mb-3">هیچ آدرس ذخیره‌شده‌ای ندارید</p>
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => navigate("/profile")}
                      className="w-full"
                    >
                      افزودن آدرس
                    </Button>
                  </div>
                )}
              </Card>

              {/* Payment Method */}
              <Card className="p-6">
                <h2 className="text-lg font-bold text-gray-900 text-right mb-4">روش پرداخت</h2>
                <div className="space-y-3">
                  {[
                    { value: "cash_on_delivery", label: "پرداخت درمحل" },
                    { value: "credit_card", label: "پرداخت با کارت اعتباری" },
                    { value: "bank_transfer", label: "انتقال بانکی" },
                  ].map((method) => (
                    <label
                      key={method.value}
                      className="flex items-center gap-3 p-4 border border-gray-200 rounded-lg cursor-pointer hover:bg-gray-50"
                    >
                      <input
                        type="radio"
                        name="payment"
                        value={method.value}
                        checked={paymentMethod === method.value}
                        onChange={(e) => setPaymentMethod(e.target.value as any)}
                      />
                      <span className="text-gray-900 font-medium">{method.label}</span>
                    </label>
                  ))}
                </div>
              </Card>

              {/* Notes */}
              <Card className="p-6">
                <h2 className="text-lg font-bold text-gray-900 text-right mb-4">یادداشت اضافی</h2>
                <textarea
                  value={notes}
                  onChange={(e) => setNotes(e.target.value)}
                  placeholder="توضیحات اضافی درباره سفارش (اختیاری)"
                  className="w-full h-24 p-3 border border-gray-200 rounded-lg resize-none focus:outline-none focus:ring-2 focus:ring-green-500"
                />
              </Card>

              {error && (
                <div className="p-4 bg-red-50 border border-red-200 rounded-lg text-right text-sm text-red-700">
                  {error}
                </div>
              )}
            </div>

            {/* Order Summary */}
            <div>
              <Card className="p-6 sticky top-20">
                <h2 className="text-lg font-bold text-gray-900 text-right mb-6">خلاصه سفارش</h2>

                {/* Items List */}
                <div className="space-y-3 mb-6 pb-6 border-b border-gray-200 max-h-48 overflow-y-auto">
                  {cartItems.map((item) => (
                    <div key={item.id} className="flex justify-between text-right text-sm">
                      <span className="text-gray-600">
                        {item.name.substring(0, 25)}... × {item.quantity}
                      </span>
                      <span className="font-medium">
                        {(item.price * item.quantity).toLocaleString("fa-IR")}
                      </span>
                    </div>
                  ))}
                </div>

                {/* Totals */}
                <div className="space-y-3 mb-6 pb-6 border-b border-gray-200">
                  <div className="flex justify-between text-right">
                    <span className="text-gray-600">جمع‌کل:</span>
                    <span className="font-semibold">
                      {subtotal.toLocaleString("fa-IR")} تومان
                    </span>
                  </div>
                  <div className="flex justify-between text-right">
                    <span className="text-gray-600">ارسال:</span>
                    <span className="font-semibold">
                      {shipping === 0 ? (
                        <span className="text-green-600">رایگان</span>
                      ) : (
                        shipping.toLocaleString("fa-IR") + " تومان"
                      )}
                    </span>
                  </div>
                  <div className="flex justify-between text-right">
                    <span className="text-gray-600">مالیات (9%):</span>
                    <span className="font-semibold">
                      {tax.toLocaleString("fa-IR")} تومان
                    </span>
                  </div>
                </div>

                {/* Total */}
                <div className="flex justify-between text-right mb-6">
                  <span className="text-lg font-bold text-gray-900">کل:</span>
                  <span className="text-lg font-bold text-green-600">
                    {total.toLocaleString("fa-IR")} تومان
                  </span>
                </div>

                {/* Place Order Button */}
                <Button
                  onClick={handlePlaceOrder}
                  disabled={submitting || (addresses.length > 0 && !selectedAddressId)}
                  className="w-full bg-green-600 hover:bg-green-700 text-white font-semibold py-3 mb-3"
                >
                  {submitting ? (
                    <>
                      <Loader2 className="w-4 h-4 animate-spin ml-2" />
                      در حال ثبت...
                    </>
                  ) : (
                    "ثبت سفارش"
                  )}
                </Button>

                <Button
                  onClick={() => navigate("/cart")}
                  variant="outline"
                  className="w-full flex items-center justify-end gap-2"
                >
                  <ChevronLeft className="w-4 h-4" />
                  بازگشت به سبد خرید
                </Button>
              </Card>
            </div>
          </div>
        </div>
      </div>
    </PageLayout>
  );
}
