'use client';

import { useState, useEffect, useCallback, useRef } from 'react';
import { useRouter } from 'next/navigation';
import { useAuth } from '@/lib/useAuth';
import Container from '@/components/ui/Container';
import {
  fetchProductsAdmin,
  createProduct,
  updateProduct,
  deleteProduct,
  fetchProductCategories,
  createProductCategory,
  updateProductCategory,
  deleteProductCategory,
  getProductUploadUrl,
  Product,
  ProductCategory,
} from '@/lib/api';

// ============================================
// Types
// ============================================

type TabType = 'products' | 'categories';

interface ProductFormData {
  title: string;
  titleHi: string;
  subtitle: string;
  subtitleHi: string;
  description: string;
  descriptionHi: string;
  categoryId: string;
  price: string;
  originalPrice: string;
  weight: string;
  weightHi: string;
  tags: string;
  stockStatus: string;
  isFeatured: boolean;
  isActive: boolean;
  displayOrder: string;
  purchaseLink: string;
  purchaseLinkHi: string;
}

interface CategoryFormData {
  name: string;
  nameHi: string;
  description: string;
  descriptionHi: string;
  isActive: boolean;
  displayOrder: string;
}

const EMPTY_PRODUCT: ProductFormData = {
  title: '',
  titleHi: '',
  subtitle: '',
  subtitleHi: '',
  description: '',
  descriptionHi: '',
  categoryId: '',
  price: '',
  originalPrice: '',
  weight: '',
  weightHi: '',
  tags: '',
  stockStatus: 'in_stock',
  isFeatured: false,
  isActive: true,
  displayOrder: '0',
  purchaseLink: '',
  purchaseLinkHi: '',
};

const EMPTY_CATEGORY: CategoryFormData = {
  name: '',
  nameHi: '',
  description: '',
  descriptionHi: '',
  isActive: true,
  displayOrder: '0',
};

const STOCK_COLORS: Record<string, string> = {
  in_stock: 'bg-green-100 text-green-800',
  out_of_stock: 'bg-red-100 text-red-800',
  limited: 'bg-yellow-100 text-yellow-800',
};

const STOCK_LABELS: Record<string, string> = {
  in_stock: 'In Stock',
  out_of_stock: 'Out of Stock',
  limited: 'Limited',
};

// ============================================
// Main Component
// ============================================

export default function AdminProductsPage() {
  const router = useRouter();
  const { user, accessToken, isAuthenticated, isLoading } = useAuth();

  const [activeTab, setActiveTab] = useState<TabType>('products');

  // Products state
  const [products, setProducts] = useState<Product[]>([]);
  const [categories, setCategories] = useState<ProductCategory[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);

  // Product form
  const [showProductForm, setShowProductForm] = useState(false);
  const [editingProductId, setEditingProductId] = useState<string | null>(null);
  const [productForm, setProductForm] = useState<ProductFormData>(EMPTY_PRODUCT);
  const [productImages, setProductImages] = useState<string[]>([]); // S3 keys
  const [productImageUrls, setProductImageUrls] = useState<string[]>([]); // preview URLs
  const [productVideoKey, setProductVideoKey] = useState<string>('');
  const [savingProduct, setSavingProduct] = useState(false);
  const [uploadingImage, setUploadingImage] = useState(false);
  const imageInputRef = useRef<HTMLInputElement>(null);
  const videoInputRef = useRef<HTMLInputElement>(null);

  // Category form
  const [showCategoryForm, setShowCategoryForm] = useState(false);
  const [editingCategoryId, setEditingCategoryId] = useState<string | null>(null);
  const [categoryForm, setCategoryForm] = useState<CategoryFormData>(EMPTY_CATEGORY);
  const [categoryImageKey, setCategoryImageKey] = useState<string>('');
  const [categoryImageUrl, setCategoryImageUrl] = useState<string>('');
  const [savingCategory, setSavingCategory] = useState(false);
  const categoryImageInputRef = useRef<HTMLInputElement>(null);

  // Filter
  const [filterCategory, setFilterCategory] = useState<string>('all');

  const isAdmin = user?.role === 'super_admin' || user?.role === 'admin' || user?.role === 'content_editor';

  // ============================================
  // Load Data
  // ============================================

  const loadCategories = useCallback(async () => {
    if (!accessToken) return;
    try {
      const data = await fetchProductCategories(accessToken);
      setCategories(data.items || []);
    } catch {
      // Non-critical
    }
  }, [accessToken]);

  const loadProducts = useCallback(async () => {
    if (!accessToken) return;
    try {
      setLoading(true);
      const data = await fetchProductsAdmin(accessToken);
      setProducts(data.items || []);
    } catch {
      setError('Failed to load products');
    } finally {
      setLoading(false);
    }
  }, [accessToken]);

  useEffect(() => {
    if (!isLoading && !isAuthenticated) {
      router.push('/login');
    }
  }, [isLoading, isAuthenticated, router]);

  useEffect(() => {
    if (isAuthenticated && isAdmin && accessToken) {
      loadProducts();
      loadCategories();
    }
  }, [isAuthenticated, isAdmin, accessToken, loadProducts, loadCategories]);

  // Auto-dismiss success
  useEffect(() => {
    if (success) {
      const t = setTimeout(() => setSuccess(null), 3000);
      return () => clearTimeout(t);
    }
  }, [success]);

  // ============================================
  // Image Upload
  // ============================================

  const handleImageUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = e.target.files;
    if (!files || !accessToken) return;
    if (productImages.length + files.length > 5) {
      setError('Maximum 5 images allowed');
      return;
    }

    setUploadingImage(true);
    setError(null);

    try {
      for (const file of Array.from(files)) {
        const { uploadUrl, key, downloadUrl } = await getProductUploadUrl(
          { fileName: file.name, contentType: file.type },
          accessToken,
        );

        // Upload to S3 via presigned URL
        await fetch(uploadUrl, {
          method: 'PUT',
          headers: { 'Content-Type': file.type },
          body: file,
        });

        setProductImages((prev) => [...prev, key]);
        setProductImageUrls((prev) => [...prev, downloadUrl]);
      }
    } catch {
      setError('Failed to upload image');
    } finally {
      setUploadingImage(false);
      if (imageInputRef.current) imageInputRef.current.value = '';
    }
  };

  const handleVideoUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file || !accessToken) return;

    setUploadingImage(true);
    setError(null);

    try {
      const { uploadUrl, key } = await getProductUploadUrl(
        { fileName: file.name, contentType: file.type },
        accessToken,
      );

      await fetch(uploadUrl, {
        method: 'PUT',
        headers: { 'Content-Type': file.type },
        body: file,
      });

      setProductVideoKey(key);
    } catch {
      setError('Failed to upload video');
    } finally {
      setUploadingImage(false);
      if (videoInputRef.current) videoInputRef.current.value = '';
    }
  };

  const handleCategoryImageUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file || !accessToken) return;

    try {
      const { uploadUrl, key, downloadUrl } = await getProductUploadUrl(
        { fileName: file.name, contentType: file.type },
        accessToken,
      );

      await fetch(uploadUrl, {
        method: 'PUT',
        headers: { 'Content-Type': file.type },
        body: file,
      });

      setCategoryImageKey(key);
      setCategoryImageUrl(downloadUrl);
    } catch {
      setError('Failed to upload image');
    } finally {
      if (categoryImageInputRef.current) categoryImageInputRef.current.value = '';
    }
  };

  const removeImage = (index: number) => {
    setProductImages((prev) => prev.filter((_, i) => i !== index));
    setProductImageUrls((prev) => prev.filter((_, i) => i !== index));
  };

  // ============================================
  // Product CRUD
  // ============================================

  const openCreateProduct = () => {
    setEditingProductId(null);
    setProductForm(EMPTY_PRODUCT);
    setProductImages([]);
    setProductImageUrls([]);
    setProductVideoKey('');
    setShowProductForm(true);
    setError(null);
  };

  const openEditProduct = (p: Product) => {
    setEditingProductId(p.id);
    setProductForm({
      title: p.title,
      titleHi: p.titleHi || '',
      subtitle: p.subtitle || '',
      subtitleHi: p.subtitleHi || '',
      description: p.description,
      descriptionHi: p.descriptionHi || '',
      categoryId: p.categoryId,
      price: String(p.price),
      originalPrice: p.originalPrice ? String(p.originalPrice) : '',
      weight: p.weight || '',
      weightHi: p.weightHi || '',
      tags: (p.tags || []).join(', '),
      stockStatus: p.stockStatus,
      isFeatured: p.isFeatured,
      isActive: p.isActive,
      displayOrder: String(p.displayOrder),
      purchaseLink: p.purchaseLink || '',
      purchaseLinkHi: p.purchaseLinkHi || '',
    });
    setProductImages(p.images || []);
    setProductImageUrls(p.imageUrls || []);
    setProductVideoKey(p.videoKey || '');
    setShowProductForm(true);
    setError(null);
  };

  const handleSaveProduct = async () => {
    if (!accessToken) return;
    if (!productForm.title || !productForm.price || !productForm.categoryId) {
      setError('Title, price, and category are required');
      return;
    }

    setSavingProduct(true);
    setError(null);

    try {
      const payload: Record<string, unknown> = {
        title: productForm.title,
        titleHi: productForm.titleHi || undefined,
        subtitle: productForm.subtitle || undefined,
        subtitleHi: productForm.subtitleHi || undefined,
        description: productForm.description,
        descriptionHi: productForm.descriptionHi || undefined,
        categoryId: productForm.categoryId,
        price: parseFloat(productForm.price),
        originalPrice: productForm.originalPrice ? parseFloat(productForm.originalPrice) : undefined,
        weight: productForm.weight || undefined,
        weightHi: productForm.weightHi || undefined,
        tags: productForm.tags ? productForm.tags.split(',').map((t) => t.trim()).filter(Boolean) : [],
        stockStatus: productForm.stockStatus,
        isFeatured: productForm.isFeatured,
        isActive: productForm.isActive,
        displayOrder: parseInt(productForm.displayOrder, 10) || 0,
        images: productImages,
        videoKey: productVideoKey || undefined,
        purchaseLink: productForm.purchaseLink || undefined,
        purchaseLinkHi: productForm.purchaseLinkHi || undefined,
      };

      if (editingProductId) {
        await updateProduct(editingProductId, payload, accessToken);
        setSuccess('Product updated successfully');
      } else {
        await createProduct(payload, accessToken);
        setSuccess('Product created successfully');
      }

      setShowProductForm(false);
      setEditingProductId(null);
      setProductForm(EMPTY_PRODUCT);
      setProductImages([]);
      setProductImageUrls([]);
      setProductVideoKey('');
      await loadProducts();
    } catch {
      setError('Failed to save product. Please try again.');
    } finally {
      setSavingProduct(false);
    }
  };

  const handleDeleteProduct = async (id: string) => {
    if (!accessToken) return;
    if (!confirm('Are you sure you want to delete this product?')) return;
    try {
      await deleteProduct(id, accessToken);
      setSuccess('Product deleted');
      await loadProducts();
    } catch {
      setError('Failed to delete product');
    }
  };

  // ============================================
  // Category CRUD
  // ============================================

  const openCreateCategory = () => {
    setEditingCategoryId(null);
    setCategoryForm(EMPTY_CATEGORY);
    setCategoryImageKey('');
    setCategoryImageUrl('');
    setShowCategoryForm(true);
    setError(null);
  };

  const openEditCategory = (c: ProductCategory) => {
    setEditingCategoryId(c.id);
    setCategoryForm({
      name: c.name,
      nameHi: c.nameHi || '',
      description: c.description || '',
      descriptionHi: c.descriptionHi || '',
      isActive: c.isActive,
      displayOrder: String(c.displayOrder),
    });
    setCategoryImageKey(c.imageKey || '');
    setCategoryImageUrl(c.imageUrl || '');
    setShowCategoryForm(true);
    setError(null);
  };

  const handleSaveCategory = async () => {
    if (!accessToken) return;
    if (!categoryForm.name) {
      setError('Category name is required');
      return;
    }

    setSavingCategory(true);
    setError(null);

    try {
      const payload: Record<string, unknown> = {
        name: categoryForm.name,
        nameHi: categoryForm.nameHi || undefined,
        description: categoryForm.description || undefined,
        descriptionHi: categoryForm.descriptionHi || undefined,
        isActive: categoryForm.isActive,
        displayOrder: parseInt(categoryForm.displayOrder, 10) || 0,
        imageKey: categoryImageKey || undefined,
      };

      if (editingCategoryId) {
        await updateProductCategory(editingCategoryId, payload, accessToken);
        setSuccess('Category updated');
      } else {
        await createProductCategory(payload, accessToken);
        setSuccess('Category created');
      }

      setShowCategoryForm(false);
      setEditingCategoryId(null);
      setCategoryForm(EMPTY_CATEGORY);
      setCategoryImageKey('');
      setCategoryImageUrl('');
      await loadCategories();
    } catch {
      setError('Failed to save category');
    } finally {
      setSavingCategory(false);
    }
  };

  const handleDeleteCategory = async (id: string) => {
    if (!accessToken) return;
    if (!confirm('Delete this category? Products in this category will remain but become uncategorized.')) return;
    try {
      await deleteProductCategory(id, accessToken);
      setSuccess('Category deleted');
      await loadCategories();
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : 'Failed to delete category';
      setError(msg);
    }
  };

  // ============================================
  // Render Guards
  // ============================================

  if (isLoading || loading) {
    return (
      <Container className="py-20 text-center">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-orange-500 mx-auto" />
        <p className="mt-4 text-gray-600">Loading products…</p>
      </Container>
    );
  }

  if (!isAdmin) {
    return (
      <Container className="py-20 text-center">
        <h1 className="text-2xl font-bold text-red-600">Access Denied</h1>
        <p className="mt-2 text-gray-600">You do not have permission to view this page.</p>
      </Container>
    );
  }

  const filteredProducts =
    filterCategory === 'all'
      ? products
      : products.filter((p) => p.categoryId === filterCategory);

  const getCategoryName = (catId: string) => {
    const cat = categories.find((c) => c.id === catId);
    return cat?.name || 'Unknown';
  };

  // ============================================
  // Render
  // ============================================

  return (
    <Container className="py-10">
      {/* Header */}
      <div className="flex items-center justify-between mb-8">
        <div>
          <h1 className="text-3xl font-bold text-gray-900 dark:text-white">Product Management</h1>
          <p className="text-gray-500 mt-1">Manage products, categories and stock</p>
        </div>
        <div className="flex gap-3">
          <button
            onClick={() => router.push('/admin')}
            className="px-4 py-2 border border-gray-300 rounded-lg hover:bg-gray-50 transition dark:border-gray-600 dark:hover:bg-gray-800"
          >
            ← Back
          </button>
          <button
            onClick={activeTab === 'products' ? openCreateProduct : openCreateCategory}
            className="px-4 py-2 bg-orange-600 text-white rounded-lg hover:bg-orange-700 transition"
          >
            + {activeTab === 'products' ? 'Add Product' : 'Add Category'}
          </button>
        </div>
      </div>

      {/* Messages */}
      {error && <div className="mb-4 p-3 bg-red-50 text-red-700 rounded-lg dark:bg-red-900/30 dark:text-red-400">{error}</div>}
      {success && <div className="mb-4 p-3 bg-green-50 text-green-700 rounded-lg dark:bg-green-900/30 dark:text-green-400">{success}</div>}

      {/* Tabs */}
      <div className="flex gap-2 mb-6 border-b pb-2">
        {(['products', 'categories'] as const).map((tab) => (
          <button
            key={tab}
            onClick={() => setActiveTab(tab)}
            className={`px-4 py-2 rounded-t-lg font-medium transition ${
              activeTab === tab
                ? 'bg-orange-600 text-white'
                : 'text-gray-600 hover:text-orange-600 dark:text-gray-400'
            }`}
          >
            {tab === 'products' ? `🛒 Products (${products.length})` : `📂 Categories (${categories.length})`}
          </button>
        ))}
      </div>

      {/* ======== PRODUCTS TAB ======== */}
      {activeTab === 'products' && (
        <>
          {/* Category Filter */}
          <div className="flex gap-2 mb-4 flex-wrap">
            <button
              onClick={() => setFilterCategory('all')}
              className={`px-3 py-1.5 rounded-full text-sm font-medium transition ${
                filterCategory === 'all' ? 'bg-orange-600 text-white' : 'bg-gray-100 text-gray-700 hover:bg-gray-200 dark:bg-gray-800 dark:text-gray-300'
              }`}
            >
              All
            </button>
            {categories.map((cat) => (
              <button
                key={cat.id}
                onClick={() => setFilterCategory(cat.id)}
                className={`px-3 py-1.5 rounded-full text-sm font-medium transition ${
                  filterCategory === cat.id ? 'bg-orange-600 text-white' : 'bg-gray-100 text-gray-700 hover:bg-gray-200 dark:bg-gray-800 dark:text-gray-300'
                }`}
              >
                {cat.name} ({cat.productCount || 0})
              </button>
            ))}
          </div>

          {/* Product Stats */}
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-6">
            <div className="bg-white rounded-xl border p-4 text-center dark:bg-gray-900 dark:border-gray-700">
              <p className="text-2xl font-bold text-gray-900 dark:text-white">{products.length}</p>
              <p className="text-sm text-gray-500">Total Products</p>
            </div>
            <div className="bg-white rounded-xl border p-4 text-center dark:bg-gray-900 dark:border-gray-700">
              <p className="text-2xl font-bold text-green-600">{products.filter((p) => p.isActive).length}</p>
              <p className="text-sm text-gray-500">Active</p>
            </div>
            <div className="bg-white rounded-xl border p-4 text-center dark:bg-gray-900 dark:border-gray-700">
              <p className="text-2xl font-bold text-blue-600">{products.filter((p) => p.isFeatured).length}</p>
              <p className="text-sm text-gray-500">Featured</p>
            </div>
            <div className="bg-white rounded-xl border p-4 text-center dark:bg-gray-900 dark:border-gray-700">
              <p className="text-2xl font-bold text-red-600">{products.filter((p) => p.stockStatus === 'out_of_stock').length}</p>
              <p className="text-sm text-gray-500">Out of Stock</p>
            </div>
          </div>

          {/* Products Table */}
          {filteredProducts.length === 0 ? (
            <div className="text-center py-16 bg-white rounded-xl border dark:bg-gray-900 dark:border-gray-700">
              <p className="text-4xl mb-3">🛒</p>
              <p className="text-gray-500">No products found. Create your first product!</p>
            </div>
          ) : (
            <div className="bg-white rounded-xl border overflow-hidden dark:bg-gray-900 dark:border-gray-700">
              <div className="overflow-x-auto">
                <table className="w-full text-left">
                  <thead className="bg-gray-50 text-gray-600 text-sm dark:bg-gray-800 dark:text-gray-400">
                    <tr>
                      <th className="px-4 py-3">Product</th>
                      <th className="px-4 py-3">Category</th>
                      <th className="px-4 py-3">Price</th>
                      <th className="px-4 py-3">Stock</th>
                      <th className="px-4 py-3">Rating</th>
                      <th className="px-4 py-3">Status</th>
                      <th className="px-4 py-3 text-right">Actions</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y dark:divide-gray-700">
                    {filteredProducts.map((p) => (
                      <tr key={p.id} className="hover:bg-gray-50 transition dark:hover:bg-gray-800">
                        <td className="px-4 py-3">
                          <div className="flex items-center gap-3">
                            {p.imageUrls?.[0] ? (
                              <img
                                src={p.imageUrls[0]}
                                alt={p.title}
                                className="w-12 h-12 rounded-lg object-cover border"
                              />
                            ) : (
                              <div className="w-12 h-12 rounded-lg bg-gray-100 flex items-center justify-center text-xl dark:bg-gray-800">
                                🖼️
                              </div>
                            )}
                            <div>
                              <p className="font-medium text-gray-900 dark:text-white">{p.title}</p>
                              {p.titleHi && <p className="text-xs text-gray-400">{p.titleHi}</p>}
                              {p.isFeatured && <span className="text-xs bg-blue-100 text-blue-700 px-1.5 py-0.5 rounded">⭐ Featured</span>}
                            </div>
                          </div>
                        </td>
                        <td className="px-4 py-3 text-sm text-gray-600 dark:text-gray-400">{getCategoryName(p.categoryId)}</td>
                        <td className="px-4 py-3">
                          <p className="font-semibold text-gray-900 dark:text-white">₹{p.price}</p>
                          {p.originalPrice && p.originalPrice > p.price && (
                            <p className="text-xs text-gray-400 line-through">₹{p.originalPrice}</p>
                          )}
                        </td>
                        <td className="px-4 py-3">
                          <span className={`px-2 py-1 rounded-full text-xs font-medium ${STOCK_COLORS[p.stockStatus] || 'bg-gray-100'}`}>
                            {STOCK_LABELS[p.stockStatus] || p.stockStatus}
                          </span>
                        </td>
                        <td className="px-4 py-3 text-sm text-gray-600 dark:text-gray-400">
                          ⭐ {p.avgRating || 0} ({p.totalReviews || 0})
                        </td>
                        <td className="px-4 py-3">
                          <span className={`px-2 py-1 rounded-full text-xs font-medium ${
                            p.isActive ? 'bg-green-100 text-green-800' : 'bg-gray-100 text-gray-600'
                          }`}>
                            {p.isActive ? 'Active' : 'Draft'}
                          </span>
                        </td>
                        <td className="px-4 py-3 text-right">
                          <div className="flex gap-2 justify-end">
                            <button
                              onClick={() => openEditProduct(p)}
                              className="text-blue-600 hover:text-blue-800 text-sm font-medium"
                            >
                              Edit
                            </button>
                            <button
                              onClick={() => handleDeleteProduct(p.id)}
                              className="text-red-600 hover:text-red-800 text-sm font-medium"
                            >
                              Delete
                            </button>
                          </div>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          )}
        </>
      )}

      {/* ======== CATEGORIES TAB ======== */}
      {activeTab === 'categories' && (
        <>
          {categories.length === 0 ? (
            <div className="text-center py-16 bg-white rounded-xl border dark:bg-gray-900 dark:border-gray-700">
              <p className="text-4xl mb-3">📂</p>
              <p className="text-gray-500">No categories yet. Create your first category!</p>
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              {categories.map((cat) => (
                <div key={cat.id} className="bg-white rounded-xl border p-4 dark:bg-gray-900 dark:border-gray-700">
                  <div className="flex items-start justify-between">
                    <div className="flex items-center gap-3">
                      {cat.imageUrl ? (
                        <img src={cat.imageUrl} alt={cat.name} className="w-14 h-14 rounded-lg object-cover border" />
                      ) : (
                        <div className="w-14 h-14 rounded-lg bg-gray-100 flex items-center justify-center text-2xl dark:bg-gray-800">📂</div>
                      )}
                      <div>
                        <h3 className="font-semibold text-gray-900 dark:text-white">{cat.name}</h3>
                        {cat.nameHi && <p className="text-sm text-gray-400">{cat.nameHi}</p>}
                        <p className="text-xs text-gray-500 mt-1">{cat.productCount || 0} products</p>
                      </div>
                    </div>
                    <span className={`px-2 py-1 rounded-full text-xs font-medium ${
                      cat.isActive ? 'bg-green-100 text-green-800' : 'bg-gray-100 text-gray-600'
                    }`}>
                      {cat.isActive ? 'Active' : 'Inactive'}
                    </span>
                  </div>
                  {cat.description && (
                    <p className="text-sm text-gray-500 mt-3 line-clamp-2">{cat.description}</p>
                  )}
                  <div className="flex gap-2 mt-4 pt-3 border-t dark:border-gray-700">
                    <button
                      onClick={() => openEditCategory(cat)}
                      className="text-blue-600 hover:text-blue-800 text-sm font-medium"
                    >
                      Edit
                    </button>
                    <button
                      onClick={() => handleDeleteCategory(cat.id)}
                      className="text-red-600 hover:text-red-800 text-sm font-medium"
                    >
                      Delete
                    </button>
                  </div>
                </div>
              ))}
            </div>
          )}
        </>
      )}

      {/* ======== PRODUCT FORM MODAL ======== */}
      {showProductForm && (
        <div className="fixed inset-0 bg-black/50 flex items-start justify-center z-50 overflow-y-auto py-8">
          <div className="bg-white rounded-2xl w-full max-w-3xl mx-4 dark:bg-gray-900">
            <div className="flex items-center justify-between p-6 border-b dark:border-gray-700">
              <h2 className="text-xl font-bold text-gray-900 dark:text-white">
                {editingProductId ? 'Edit Product' : 'Create Product'}
              </h2>
              <button
                onClick={() => setShowProductForm(false)}
                className="text-gray-400 hover:text-gray-600 text-2xl"
              >
                ×
              </button>
            </div>

            <div className="p-6 space-y-6 max-h-[70vh] overflow-y-auto">
              {/* Title */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1 dark:text-gray-300">Title (English) *</label>
                  <input
                    type="text"
                    value={productForm.title}
                    onChange={(e) => setProductForm({ ...productForm, title: e.target.value })}
                    className="w-full border rounded-lg px-3 py-2 dark:bg-gray-800 dark:border-gray-600 dark:text-white"
                    placeholder="Product title"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1 dark:text-gray-300">Title (Hindi)</label>
                  <input
                    type="text"
                    value={productForm.titleHi}
                    onChange={(e) => setProductForm({ ...productForm, titleHi: e.target.value })}
                    className="w-full border rounded-lg px-3 py-2 dark:bg-gray-800 dark:border-gray-600 dark:text-white"
                    placeholder="उत्पाद शीर्षक"
                  />
                </div>
              </div>

              {/* Subtitle */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1 dark:text-gray-300">Subtitle (English)</label>
                  <input
                    type="text"
                    value={productForm.subtitle}
                    onChange={(e) => setProductForm({ ...productForm, subtitle: e.target.value })}
                    className="w-full border rounded-lg px-3 py-2 dark:bg-gray-800 dark:border-gray-600 dark:text-white"
                    placeholder="Short tagline"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1 dark:text-gray-300">Subtitle (Hindi)</label>
                  <input
                    type="text"
                    value={productForm.subtitleHi}
                    onChange={(e) => setProductForm({ ...productForm, subtitleHi: e.target.value })}
                    className="w-full border rounded-lg px-3 py-2 dark:bg-gray-800 dark:border-gray-600 dark:text-white"
                    placeholder="छोटा टैगलाइन"
                  />
                </div>
              </div>

              {/* Description */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1 dark:text-gray-300">Description (English)</label>
                  <textarea
                    value={productForm.description}
                    onChange={(e) => setProductForm({ ...productForm, description: e.target.value })}
                    rows={4}
                    className="w-full border rounded-lg px-3 py-2 dark:bg-gray-800 dark:border-gray-600 dark:text-white"
                    placeholder="Full product description"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1 dark:text-gray-300">Description (Hindi)</label>
                  <textarea
                    value={productForm.descriptionHi}
                    onChange={(e) => setProductForm({ ...productForm, descriptionHi: e.target.value })}
                    rows={4}
                    className="w-full border rounded-lg px-3 py-2 dark:bg-gray-800 dark:border-gray-600 dark:text-white"
                    placeholder="पूर्ण उत्पाद विवरण"
                  />
                </div>
              </div>

              {/* Category + Price */}
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1 dark:text-gray-300">Category *</label>
                  <select
                    value={productForm.categoryId}
                    onChange={(e) => setProductForm({ ...productForm, categoryId: e.target.value })}
                    className="w-full border rounded-lg px-3 py-2 dark:bg-gray-800 dark:border-gray-600 dark:text-white"
                  >
                    <option value="">Select category</option>
                    {categories.map((cat) => (
                      <option key={cat.id} value={cat.id}>{cat.name}</option>
                    ))}
                  </select>
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1 dark:text-gray-300">Price (₹) *</label>
                  <input
                    type="number"
                    value={productForm.price}
                    onChange={(e) => setProductForm({ ...productForm, price: e.target.value })}
                    className="w-full border rounded-lg px-3 py-2 dark:bg-gray-800 dark:border-gray-600 dark:text-white"
                    placeholder="299"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1 dark:text-gray-300">Original Price (₹)</label>
                  <input
                    type="number"
                    value={productForm.originalPrice}
                    onChange={(e) => setProductForm({ ...productForm, originalPrice: e.target.value })}
                    className="w-full border rounded-lg px-3 py-2 dark:bg-gray-800 dark:border-gray-600 dark:text-white"
                    placeholder="499 (for strikethrough)"
                  />
                </div>
              </div>

              {/* Weight + Stock + Order */}
              <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1 dark:text-gray-300">Weight (EN)</label>
                  <input
                    type="text"
                    value={productForm.weight}
                    onChange={(e) => setProductForm({ ...productForm, weight: e.target.value })}
                    className="w-full border rounded-lg px-3 py-2 dark:bg-gray-800 dark:border-gray-600 dark:text-white"
                    placeholder="500g"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1 dark:text-gray-300">Weight (HI)</label>
                  <input
                    type="text"
                    value={productForm.weightHi}
                    onChange={(e) => setProductForm({ ...productForm, weightHi: e.target.value })}
                    className="w-full border rounded-lg px-3 py-2 dark:bg-gray-800 dark:border-gray-600 dark:text-white"
                    placeholder="500 ग्राम"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1 dark:text-gray-300">Stock Status</label>
                  <select
                    value={productForm.stockStatus}
                    onChange={(e) => setProductForm({ ...productForm, stockStatus: e.target.value })}
                    className="w-full border rounded-lg px-3 py-2 dark:bg-gray-800 dark:border-gray-600 dark:text-white"
                  >
                    <option value="in_stock">In Stock</option>
                    <option value="out_of_stock">Out of Stock</option>
                    <option value="limited">Limited</option>
                  </select>
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1 dark:text-gray-300">Display Order</label>
                  <input
                    type="number"
                    value={productForm.displayOrder}
                    onChange={(e) => setProductForm({ ...productForm, displayOrder: e.target.value })}
                    className="w-full border rounded-lg px-3 py-2 dark:bg-gray-800 dark:border-gray-600 dark:text-white"
                  />
                </div>
              </div>

              {/* Tags */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1 dark:text-gray-300">Tags (comma-separated)</label>
                <input
                  type="text"
                  value={productForm.tags}
                  onChange={(e) => setProductForm({ ...productForm, tags: e.target.value })}
                  className="w-full border rounded-lg px-3 py-2 dark:bg-gray-800 dark:border-gray-600 dark:text-white"
                  placeholder="organic, ayurvedic, natural"
                />
              </div>

              {/* Purchase Links */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1 dark:text-gray-300">Purchase Link (English)</label>
                  <input
                    type="url"
                    value={productForm.purchaseLink}
                    onChange={(e) => setProductForm({ ...productForm, purchaseLink: e.target.value })}
                    className="w-full border rounded-lg px-3 py-2 dark:bg-gray-800 dark:border-gray-600 dark:text-white"
                    placeholder="https://..."
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1 dark:text-gray-300">Purchase Link (Hindi)</label>
                  <input
                    type="url"
                    value={productForm.purchaseLinkHi}
                    onChange={(e) => setProductForm({ ...productForm, purchaseLinkHi: e.target.value })}
                    className="w-full border rounded-lg px-3 py-2 dark:bg-gray-800 dark:border-gray-600 dark:text-white"
                    placeholder="https://..."
                  />
                </div>
              </div>

              {/* Toggles */}
              <div className="flex gap-6">
                <label className="flex items-center gap-2 cursor-pointer">
                  <input
                    type="checkbox"
                    checked={productForm.isFeatured}
                    onChange={(e) => setProductForm({ ...productForm, isFeatured: e.target.checked })}
                    className="w-4 h-4 text-orange-600 rounded"
                  />
                  <span className="text-sm text-gray-700 dark:text-gray-300">⭐ Featured (show on home page)</span>
                </label>
                <label className="flex items-center gap-2 cursor-pointer">
                  <input
                    type="checkbox"
                    checked={productForm.isActive}
                    onChange={(e) => setProductForm({ ...productForm, isActive: e.target.checked })}
                    className="w-4 h-4 text-orange-600 rounded"
                  />
                  <span className="text-sm text-gray-700 dark:text-gray-300">Active (visible to public)</span>
                </label>
              </div>

              {/* Images */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2 dark:text-gray-300">
                  Product Images ({productImages.length}/5)
                </label>
                <div className="flex flex-wrap gap-3 mb-3">
                  {productImageUrls.map((url, i) => (
                    <div key={i} className="relative group">
                      <img
                        src={url}
                        alt={`Product ${i + 1}`}
                        className="w-24 h-24 rounded-lg object-cover border"
                      />
                      <button
                        onClick={() => removeImage(i)}
                        className="absolute -top-2 -right-2 w-6 h-6 bg-red-500 text-white rounded-full text-xs flex items-center justify-center opacity-0 group-hover:opacity-100 transition"
                      >
                        ×
                      </button>
                    </div>
                  ))}
                  {productImages.length < 5 && (
                    <button
                      onClick={() => imageInputRef.current?.click()}
                      disabled={uploadingImage}
                      className="w-24 h-24 border-2 border-dashed border-gray-300 rounded-lg flex items-center justify-center text-gray-400 hover:border-orange-400 hover:text-orange-400 transition dark:border-gray-600"
                    >
                      {uploadingImage ? '⏳' : '+ Add'}
                    </button>
                  )}
                </div>
                <input
                  ref={imageInputRef}
                  type="file"
                  accept="image/*"
                  multiple
                  onChange={handleImageUpload}
                  className="hidden"
                />
              </div>

              {/* Video */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2 dark:text-gray-300">Product Video</label>
                {productVideoKey ? (
                  <div className="flex items-center gap-3">
                    <span className="text-sm text-green-600">🎬 Video uploaded</span>
                    <button
                      onClick={() => setProductVideoKey('')}
                      className="text-red-500 text-sm hover:underline"
                    >
                      Remove
                    </button>
                  </div>
                ) : (
                  <button
                    onClick={() => videoInputRef.current?.click()}
                    disabled={uploadingImage}
                    className="px-4 py-2 border border-dashed border-gray-300 rounded-lg text-sm text-gray-500 hover:border-orange-400 hover:text-orange-400 transition dark:border-gray-600"
                  >
                    {uploadingImage ? 'Uploading…' : '🎬 Upload Video'}
                  </button>
                )}
                <input
                  ref={videoInputRef}
                  type="file"
                  accept="video/*"
                  onChange={handleVideoUpload}
                  className="hidden"
                />
              </div>
            </div>

            {/* Form Actions */}
            <div className="flex justify-end gap-3 p-6 border-t dark:border-gray-700">
              <button
                onClick={() => setShowProductForm(false)}
                className="px-4 py-2 border border-gray-300 rounded-lg hover:bg-gray-50 transition dark:border-gray-600 dark:hover:bg-gray-800"
              >
                Cancel
              </button>
              <button
                onClick={handleSaveProduct}
                disabled={savingProduct}
                className="px-6 py-2 bg-orange-600 text-white rounded-lg hover:bg-orange-700 transition disabled:opacity-50"
              >
                {savingProduct ? 'Saving…' : editingProductId ? 'Update Product' : 'Create Product'}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* ======== CATEGORY FORM MODAL ======== */}
      {showCategoryForm && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50">
          <div className="bg-white rounded-2xl w-full max-w-lg mx-4 dark:bg-gray-900">
            <div className="flex items-center justify-between p-6 border-b dark:border-gray-700">
              <h2 className="text-xl font-bold text-gray-900 dark:text-white">
                {editingCategoryId ? 'Edit Category' : 'Create Category'}
              </h2>
              <button
                onClick={() => setShowCategoryForm(false)}
                className="text-gray-400 hover:text-gray-600 text-2xl"
              >
                ×
              </button>
            </div>

            <div className="p-6 space-y-4">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1 dark:text-gray-300">Name (English) *</label>
                  <input
                    type="text"
                    value={categoryForm.name}
                    onChange={(e) => setCategoryForm({ ...categoryForm, name: e.target.value })}
                    className="w-full border rounded-lg px-3 py-2 dark:bg-gray-800 dark:border-gray-600 dark:text-white"
                    placeholder="Category name"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1 dark:text-gray-300">Name (Hindi)</label>
                  <input
                    type="text"
                    value={categoryForm.nameHi}
                    onChange={(e) => setCategoryForm({ ...categoryForm, nameHi: e.target.value })}
                    className="w-full border rounded-lg px-3 py-2 dark:bg-gray-800 dark:border-gray-600 dark:text-white"
                    placeholder="श्रेणी का नाम"
                  />
                </div>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1 dark:text-gray-300">Description (EN)</label>
                  <textarea
                    value={categoryForm.description}
                    onChange={(e) => setCategoryForm({ ...categoryForm, description: e.target.value })}
                    rows={3}
                    className="w-full border rounded-lg px-3 py-2 dark:bg-gray-800 dark:border-gray-600 dark:text-white"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1 dark:text-gray-300">Description (HI)</label>
                  <textarea
                    value={categoryForm.descriptionHi}
                    onChange={(e) => setCategoryForm({ ...categoryForm, descriptionHi: e.target.value })}
                    rows={3}
                    className="w-full border rounded-lg px-3 py-2 dark:bg-gray-800 dark:border-gray-600 dark:text-white"
                  />
                </div>
              </div>

              {/* Category Image */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2 dark:text-gray-300">Category Image</label>
                <div className="flex items-center gap-4">
                  {categoryImageUrl ? (
                    <div className="relative group">
                      <img src={categoryImageUrl} alt="Category" className="w-20 h-20 rounded-lg object-cover border" />
                      <button
                        onClick={() => { setCategoryImageKey(''); setCategoryImageUrl(''); }}
                        className="absolute -top-2 -right-2 w-6 h-6 bg-red-500 text-white rounded-full text-xs flex items-center justify-center opacity-0 group-hover:opacity-100 transition"
                      >
                        ×
                      </button>
                    </div>
                  ) : (
                    <button
                      onClick={() => categoryImageInputRef.current?.click()}
                      className="w-20 h-20 border-2 border-dashed border-gray-300 rounded-lg flex items-center justify-center text-gray-400 hover:border-orange-400 hover:text-orange-400 transition dark:border-gray-600"
                    >
                      + Add
                    </button>
                  )}
                </div>
                <input
                  ref={categoryImageInputRef}
                  type="file"
                  accept="image/*"
                  onChange={handleCategoryImageUpload}
                  className="hidden"
                />
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1 dark:text-gray-300">Display Order</label>
                  <input
                    type="number"
                    value={categoryForm.displayOrder}
                    onChange={(e) => setCategoryForm({ ...categoryForm, displayOrder: e.target.value })}
                    className="w-full border rounded-lg px-3 py-2 dark:bg-gray-800 dark:border-gray-600 dark:text-white"
                  />
                </div>
                <div className="flex items-end">
                  <label className="flex items-center gap-2 cursor-pointer">
                    <input
                      type="checkbox"
                      checked={categoryForm.isActive}
                      onChange={(e) => setCategoryForm({ ...categoryForm, isActive: e.target.checked })}
                      className="w-4 h-4 text-orange-600 rounded"
                    />
                    <span className="text-sm text-gray-700 dark:text-gray-300">Active</span>
                  </label>
                </div>
              </div>
            </div>

            <div className="flex justify-end gap-3 p-6 border-t dark:border-gray-700">
              <button
                onClick={() => setShowCategoryForm(false)}
                className="px-4 py-2 border border-gray-300 rounded-lg hover:bg-gray-50 transition dark:border-gray-600 dark:hover:bg-gray-800"
              >
                Cancel
              </button>
              <button
                onClick={handleSaveCategory}
                disabled={savingCategory}
                className="px-6 py-2 bg-orange-600 text-white rounded-lg hover:bg-orange-700 transition disabled:opacity-50"
              >
                {savingCategory ? 'Saving…' : editingCategoryId ? 'Update Category' : 'Create Category'}
              </button>
            </div>
          </div>
        </div>
      )}
    </Container>
  );
}
