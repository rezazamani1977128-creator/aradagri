import { useState, useEffect } from "react";
import { ProductCard } from "@/components/cards";
import { Link } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { ArrowLeft, Loader2 } from "lucide-react";
import { API_BASE_URL } from "@/lib/api-config";

interface Product {
  id: string;
  name: string;
  price: number;
  originalPrice?: number;
  image: string;
  category: string;
  rating?: number;
}

// Fallback products in case API fails
const fallbackProducts: Product[] = [
  {
    id: "1",
    name: "نهال سیب گلدن دلیشس پایه مالینگ",
    price: 850000,
    originalPrice: 1000000,
    image: "https://images.unsplash.com/photo-1560806887-1e4cd0b6cbd6?w=400",
    category: "نهال میوه",
    rating: 4.8,
  },
  {
    id: "2",
    name: "کود NPK آلی ویژه درختان میوه",
    price: 450000,
    image: "https://images.unsplash.com/photo-1416879595882-3373a0480b5b?w=400",
    category: "کود",
    rating: 4.6,
  },
  {
    id: "3",
    name: "سیستم آبیاری قطره‌ای هوشمند",
    price: 2500000,
    originalPrice: 3000000,
    image: "https://images.unsplash.com/photo-1563514227147-6d2ff665a6a0?w=400",
    category: "سیستم آبیاری",
    rating: 4.9,
  },
  {
    id: "4",
    name: "بذر گوجه فرنگی گلخانه‌ای",
    price: 180000,
    image: "https://images.unsplash.com/photo-1592921870789-04563d55041c?w=400",
    category: "بذر",
    rating: 4.7,
  },
];

export function FeaturedProductsSection() {
  const [products, setProducts] = useState<Product[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchProducts();
  }, []);

  const fetchProducts = async () => {
    try {
      const response = await fetch(`${API_BASE_URL}/products?limit=8`);
      if (response.ok) {
        const data = await response.json();
        if (data.success && Array.isArray(data.data)) {
          const mapped: Product[] = data.data.map((p: any) => ({
            id: p.id,
            name: p.title,
            price: p.price,
            image: p.images?.[0] || "https://images.unsplash.com/photo-1560806887-1e4cd0b6cbd6?w=400",
            category: p.category?.name || "محصول",
            rating: 4.5 + Math.random() * 0.5,
          }));
          setProducts(mapped);
        } else {
          setProducts(fallbackProducts);
        }
      } else {
        setProducts(fallbackProducts);
      }
    } catch (err) {
      console.error("Error fetching featured products:", err);
      setProducts(fallbackProducts);
    } finally {
      setLoading(false);
    }
  };

  return (
    <section className="section-padding bg-muted/50">
      <div className="container-arad">
        {/* Header */}
        <div className="flex flex-col md:flex-row md:items-end md:justify-between gap-4 mb-12">
          <div>
            <span className="inline-block px-4 py-1 bg-primary/10 text-primary rounded-full text-sm font-medium mb-4">
              محصولات ویژه
            </span>
            <h2 className="text-3xl md:text-4xl font-bold text-foreground mb-2">
              پرفروش‌ترین‌ها
            </h2>
            <p className="text-muted-foreground">
              محصولات پرطرفدار با بهترین کیفیت و قیمت
            </p>
          </div>
          <Link to="/products">
            <Button variant="outline" className="group">
              <span>مشاهده همه</span>
              <ArrowLeft className="w-4 h-4 group-hover:-translate-x-1 transition-transform" />
            </Button>
          </Link>
        </div>

        {/* Products Grid */}
        {loading ? (
          <div className="flex justify-center items-center py-12">
            <Loader2 className="w-8 h-8 animate-spin text-primary" />
          </div>
        ) : (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
            {products.map((product) => (
              <ProductCard key={product.id} {...product} />
            ))}
          </div>
        )}
      </div>
    </section>
  );
}
