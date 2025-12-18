import { useState } from "react";
import { Link } from "react-router-dom";
import { cn } from "@/lib/utils";
import { Button } from "@/components/ui/button";
import { ShoppingCart, Heart, Loader2 } from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import { API_BASE_URL } from "@/lib/api-config";

interface ProductCardProps {
  id: string;
  name: string;
  price: number;
  originalPrice?: number;
  image: string;
  category: string;
  rating?: number;
  inStock?: boolean;
  className?: string;
}

export function ProductCard({
  id,
  name,
  price,
  originalPrice,
  image,
  category,
  rating = 4.5,
  inStock = true,
  className,
}: ProductCardProps) {
  const { toast } = useToast();
  const [isAddingToCart, setIsAddingToCart] = useState(false);
  const discount = originalPrice ? Math.round(((originalPrice - price) / originalPrice) * 100) : 0;

  const handleAddToCart = async (e: React.MouseEvent) => {
    e.preventDefault();
    e.stopPropagation();

    if (!inStock) {
      toast({
        title: "خطا",
        description: "این محصول ناموجود است",
        variant: "destructive",
      });
      return;
    }

    try {
      setIsAddingToCart(true);
      const token = localStorage.getItem("token");
      let guestToken = localStorage.getItem("guestToken");
      
      // Get or create cart
      const headers: Record<string, string> = {
        "Content-Type": "application/json",
      };
      
      if (token) {
        headers["Authorization"] = `Bearer ${token}`;
      }

      let cartUrl = "${API_BASE_URL}/cart";
      if (!token && guestToken) {
        cartUrl += `?guestToken=${guestToken}`;
      }

      const cartResponse = await fetch(cartUrl, {
        method: "GET",
        headers,
      });

      if (!cartResponse.ok) {
        throw new Error("Failed to get cart");
      }

      const cartData = await cartResponse.json();
      if (!cartData.success || !cartData.data) {
        throw new Error("Invalid cart response");
      }

      // Persist guest token if backend issues one
      if (!token && cartData.data.guestToken && !guestToken) {
        guestToken = cartData.data.guestToken;
        localStorage.setItem("guestToken", guestToken);
      }

      const cartId = cartData.data.id;

      // Add to cart
      let addUrl = `${API_BASE_URL}/cart/${cartId}/items`;
      if (!token && guestToken) {
        addUrl += `?guestToken=${guestToken}`;
      }

      const addResponse = await fetch(addUrl, {
        method: "POST",
        headers,
        body: JSON.stringify({
          productId: id,
          quantity: 1,
        }),
      });

      if (!addResponse.ok) {
        throw new Error("Failed to add to cart");
      }

      toast({
        title: "موفق",
        description: `${name} به سبد خرید اضافه شد`,
      });
    } catch (error) {
      console.error("Error adding to cart:", error);
      toast({
        title: "خطا",
        description: "خطا در اضافه کردن به سبد خرید",
        variant: "destructive",
      });
    } finally {
      setIsAddingToCart(false);
    }
  };

  return (
    <div
      className={cn(
        "group relative bg-card rounded-2xl overflow-hidden shadow-arad-sm hover:shadow-arad-lg transition-all duration-300 border border-border/50",
        className
      )}
    >
      {/* Image */}
      <Link to={`/product/${id}`} className="block relative aspect-square overflow-hidden">
        <img
          src={image}
          alt={name}
          className="w-full h-full object-cover group-hover:scale-110 transition-transform duration-500"
        />
        {discount > 0 && (
          <span className="absolute top-3 right-3 bg-destructive text-destructive-foreground text-xs font-bold px-2 py-1 rounded-lg">
            {discount}% تخفیف
          </span>
        )}
        {!inStock && (
          <div className="absolute inset-0 bg-background/80 flex items-center justify-center">
            <span className="text-muted-foreground font-medium">ناموجود</span>
          </div>
        )}
        <button className="absolute top-3 left-3 w-9 h-9 rounded-full bg-card/90 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity hover:bg-destructive hover:text-destructive-foreground">
          <Heart className="w-4 h-4" />
        </button>
      </Link>

      {/* Content */}
      <div className="p-4">
        <span className="text-xs text-muted-foreground">{category}</span>
        <Link to={`/product/${id}`}>
          <h3 className="font-bold text-foreground mt-1 mb-2 line-clamp-2 hover:text-primary transition-colors">
            {name}
          </h3>
        </Link>

        {/* Rating */}
        <div className="flex items-center gap-1 mb-3">
          {[...Array(5)].map((_, i) => (
            <svg
              key={i}
              className={cn(
                "w-4 h-4",
                i < Math.floor(rating) ? "text-accent fill-accent" : "text-muted-foreground/30"
              )}
              viewBox="0 0 20 20"
              fill="currentColor"
            >
              <path d="M9.049 2.927c.3-.921 1.603-.921 1.902 0l1.07 3.292a1 1 0 00.95.69h3.462c.969 0 1.371 1.24.588 1.81l-2.8 2.034a1 1 0 00-.364 1.118l1.07 3.292c.3.921-.755 1.688-1.54 1.118l-2.8-2.034a1 1 0 00-1.175 0l-2.8 2.034c-.784.57-1.838-.197-1.539-1.118l1.07-3.292a1 1 0 00-.364-1.118L2.98 8.72c-.783-.57-.38-1.81.588-1.81h3.461a1 1 0 00.951-.69l1.07-3.292z" />
            </svg>
          ))}
          <span className="text-xs text-muted-foreground mr-1">({rating})</span>
        </div>

        {/* Price */}
        <div className="flex items-center justify-between">
          <div>
            <div className="flex items-center gap-2">
              <span className="text-lg font-bold text-primary">
                {price.toLocaleString("fa-IR")}
              </span>
              <span className="text-xs text-muted-foreground">تومان</span>
            </div>
            {originalPrice && (
              <span className="text-sm text-muted-foreground line-through">
                {originalPrice.toLocaleString("fa-IR")}
              </span>
            )}
          </div>
          <Button
            size="icon"
            variant="forest"
            className="rounded-full"
            disabled={!inStock || isAddingToCart}
            onClick={handleAddToCart}
          >
            {isAddingToCart ? (
              <Loader2 className="w-4 h-4 animate-spin" />
            ) : (
              <ShoppingCart className="w-4 h-4" />
            )}
          </Button>
        </div>
      </div>
    </div>
  );
}
