import { useState, useEffect } from "react";
import { PageLayout } from "@/components/layout/PageLayout";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Trash2, Plus, Minus, ShoppingCart, Loader2 } from "lucide-react";
import { useNavigate } from "react-router-dom";
import { API_BASE_URL } from "@/lib/api-config";

interface CartItem {
  id: string;
  name: string;
  price: number;
  quantity: number;
  image: string;
  category: string;
  productId: string;
}

interface ApiCartItem {
  id: string;
  quantity: number;
  product: {
    id: string;
    title: string;
    price: number;
    images?: string[];
    category?: {
      name: string;
    };
  };
}

interface ApiCart {
  id: string;
  items: ApiCartItem[];
}

// Mock data - used as fallback
const mockCartItems: CartItem[] = [
  {
    id: "1",
    productId: "1",
    name: "کود ارگانیک",
    price: 250000,
    quantity: 2,
    image: "/images/fertilizer.jpg",
    category: "کود",
  },
  {
    id: "2",
    productId: "2",
    name: "بذر گندم با کیفیت بالا",
    price: 150000,
    quantity: 1,
    image: "/images/seeds.jpg",
    category: "بذر",
  },
];

export default function CartPage() {
  const navigate = useNavigate();
  const [cartItems, setCartItems] = useState<CartItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [cartId, setCartId] = useState<string | null>(null);

  useEffect(() => {
    fetchCart();
  }, []);

  const fetchCart = async () => {
    try {
      setLoading(true);
      setError(null);

      const token = localStorage.getItem("token");
      const guestToken = localStorage.getItem("guestToken");
      
      const headers: Record<string, string> = {
        "Content-Type": "application/json",
      };
      
      if (token) {
        headers["Authorization"] = `Bearer ${token}`;
      }

      const url = guestToken 
        ? `${API_BASE_URL}/cart?guestToken=${guestToken}`
        : `${API_BASE_URL}/cart`;

      const response = await fetch(url, { headers });

      if (!response.ok) {
        throw new Error("Failed to fetch cart");
      }

      const result = await response.json();
      
      if (result.success && result.data) {
        const apiCart: ApiCart = result.data;
        setCartId(apiCart.id);
        
        const items: CartItem[] = apiCart.items.map((item: ApiCartItem) => ({
          id: item.id,
          productId: item.product.id,
          name: item.product.title,
          price: item.product.price,
          quantity: item.quantity,
          image: item.product.images?.[0] || "/images/placeholder.jpg",
          category: item.product.category?.name || "دسته‌بندی نشده",
        }));
        
        setCartItems(items);
      } else {
        // Use mock data as fallback
        console.warn("Using mock cart data");
        setCartItems(mockCartItems);
      }
    } catch (err) {
      console.error("Error fetching cart:", err);
      setError("خطا در بارگذاری سبد خرید");
      // Use mock data on error
      setCartItems(mockCartItems);
    } finally {
      setLoading(false);
    }
  };

  const updateQuantity = async (itemId: string, newQuantity: number) => {
    if (newQuantity <= 0) {
      removeItem(itemId);
      return;
    }

    try {
      const token = localStorage.getItem("token");
      const headers: Record<string, string> = {
        "Content-Type": "application/json",
      };
      
      if (token) {
        headers["Authorization"] = `Bearer ${token}`;
      }

      const response = await fetch(
        `${API_BASE_URL}/cart/items/${itemId}`,
        {
          method: "PUT",
          headers,
          body: JSON.stringify({ quantity: newQuantity }),
        }
      );

      if (!response.ok) {
        throw new Error("Failed to update item");
      }

      // Update local state
      setCartItems(
        cartItems.map((item) =>
          item.id === itemId ? { ...item, quantity: newQuantity } : item
        )
      );
    } catch (err) {
      console.error("Error updating quantity:", err);
      setError("خطا در به‌روزرسانی تعداد");
      
      // Optimistic update anyway
      setCartItems(
        cartItems.map((item) =>
          item.id === itemId ? { ...item, quantity: newQuantity } : item
        )
      );
    }
  };

  const removeItem = async (itemId: string) => {
    try {
      const token = localStorage.getItem("token");
      const headers: Record<string, string> = {
        "Content-Type": "application/json",
      };
      
      if (token) {
        headers["Authorization"] = `Bearer ${token}`;
      }

      const response = await fetch(
        `${API_BASE_URL}/cart/items/${itemId}`,
        {
          method: "DELETE",
          headers,
        }
      );

      if (!response.ok) {
        throw new Error("Failed to remove item");
      }

      // Update local state
      setCartItems(cartItems.filter((item) => item.id !== itemId));
    } catch (err) {
      console.error("Error removing item:", err);
      setError("خطا در حذف محصول");
      
      // Optimistic update anyway
      setCartItems(cartItems.filter((item) => item.id !== itemId));
    }
  };

  const subtotal = cartItems.reduce(
    (sum, item) => sum + item.price * item.quantity,
    0
  );
  const shipping = subtotal > 1000000 ? 0 : 50000;
  const tax = Math.round(subtotal * 0.09);
  const total = subtotal + shipping + tax;

  if (loading) {
    return (
      <PageLayout>
        <div
          className="min-h-screen bg-gradient-to-br from-green-50 to-blue-50 py-12"
          dir="rtl"
        >
          <div className="container-arad max-w-4xl">
            <Card className="p-12 text-center">
              <Loader2 className="w-16 h-16 mx-auto text-green-600 animate-spin mb-4" />
              <h2 className="text-xl font-semibold text-gray-900">
                در حال بارگذاری سبد خرید...
              </h2>
            </Card>
          </div>
        </div>
      </PageLayout>
    );
  }

  if (cartItems.length === 0) {
    return (
      <PageLayout>
        <div
          className="min-h-screen bg-gradient-to-br from-green-50 to-blue-50 py-12"
          dir="rtl"
        >
          <div className="container-arad max-w-4xl">
            <div className="mb-8">
              <h1 className="text-4xl font-bold text-gray-900 text-right mb-2">
                سبد خریدم
              </h1>
            </div>

            <Card className="p-12 text-center">
              <ShoppingCart className="w-16 h-16 mx-auto text-gray-400 mb-4" />
              <h2 className="text-xl font-semibold text-gray-900 mb-2">
                سبد خریدتان خالی است
              </h2>
              <p className="text-gray-600 mb-6">
                برای اضافه کردن محصول، بر روی محصول کلیک کنید
              </p>
              <Button
                onClick={() => navigate("/products")}
                className="bg-green-600 hover:bg-green-700"
              >
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
          {/* Header */}
          <div className="mb-8">
            <h1 className="text-4xl font-bold text-gray-900 text-right mb-2">
              سبد خریدم
            </h1>
            <p className="text-gray-600 text-right">
              {cartItems.length} مورد در سبد خرید شما
            </p>
            {error && (
              <div className="mt-4 bg-red-50 border border-red-200 rounded-lg p-3 text-right text-sm text-red-700">
                {error}
              </div>
            )}
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
            {/* Cart Items */}
            <div className="lg:col-span-2">
              <Card className="overflow-hidden">
                <div className="divide-y">
                  {cartItems.map((item) => (
                    <div
                      key={item.id}
                      className="p-6 hover:bg-gray-50 transition-colors"
                    >
                      <div className="flex items-center gap-4 flex-row-reverse">
                        {/* Product Image */}
                        <div className="w-24 h-24 bg-gray-200 rounded-lg flex items-center justify-center flex-shrink-0">
                          <ShoppingCart className="w-8 h-8 text-gray-400" />
                        </div>

                        {/* Product Info */}
                        <div className="flex-1 text-right">
                          <h3 className="text-lg font-semibold text-gray-900 mb-1">
                            {item.name}
                          </h3>
                          <p className="text-sm text-gray-600 mb-3">
                            دسته‌بندی: {item.category}
                          </p>
                          <p className="text-lg font-bold text-green-600">
                            {(item.price * item.quantity).toLocaleString("fa-IR")}{" "}
                            تومان
                          </p>
                        </div>

                        {/* Quantity Controls */}
                        <div className="flex items-center gap-2 bg-gray-100 rounded-lg p-2 flex-shrink-0">
                          <button
                            onClick={() =>
                              updateQuantity(item.id, item.quantity + 1)
                            }
                            className="p-1 hover:bg-gray-200 rounded transition-colors"
                          >
                            <Plus className="w-4 h-4" />
                          </button>
                          <span className="text-sm font-semibold w-8 text-center">
                            {item.quantity}
                          </span>
                          <button
                            onClick={() =>
                              updateQuantity(item.id, item.quantity - 1)
                            }
                            className="p-1 hover:bg-gray-200 rounded transition-colors"
                          >
                            <Minus className="w-4 h-4" />
                          </button>
                        </div>

                        {/* Remove Button */}
                        <button
                          onClick={() => removeItem(item.id)}
                          className="p-2 hover:bg-red-50 rounded-lg text-red-600 transition-colors flex-shrink-0"
                        >
                          <Trash2 className="w-5 h-5" />
                        </button>
                      </div>
                    </div>
                  ))}
                </div>
              </Card>
            </div>

            {/* Order Summary */}
            <div>
              <Card className="p-6 sticky top-20">
                <h3 className="text-lg font-semibold text-gray-900 text-right mb-6">
                  خلاصه سفارش
                </h3>

                <div className="space-y-4 mb-6 pb-6 border-b border-gray-200">
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

                <div className="flex justify-between text-right mb-6">
                  <span className="text-lg font-bold text-gray-900">کل:</span>
                  <span className="text-lg font-bold text-green-600">
                    {total.toLocaleString("fa-IR")} تومان
                  </span>
                </div>

                {subtotal <= 1000000 && (
                  <div className="bg-blue-50 border border-blue-200 rounded-lg p-3 mb-6 text-right text-sm text-blue-700">
                    🎁 برای ارسال رایگان، {(1000000 - subtotal).toLocaleString("fa-IR")} تومان دیگر اضافه کنید
                  </div>
                )}

                <Button
                  onClick={() => navigate("/checkout")}
                  className="w-full bg-green-600 hover:bg-green-700 text-white font-semibold py-3 mb-3"
                >
                  پیش‌رفتن به صورتحساب
                </Button>

                <Button
                  onClick={() => navigate("/products")}
                  variant="outline"
                  className="w-full"
                >
                  خرید بیشتر
                </Button>
              </Card>
            </div>
          </div>
        </div>
      </div>
    </PageLayout>
  );
}
