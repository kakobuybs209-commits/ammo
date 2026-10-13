'use client';

import { useState, useEffect, useCallback, useMemo, useRef } from 'react';
import { useRouter } from 'next/navigation';
import Image from 'next/image';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import {
  faTimes,
  faCheck,
  faChevronRight,
  faCopy,
  faHeart,
  faArrowLeft,
  faShare
} from '@fortawesome/free-solid-svg-icons';
import styles from '@/styles/Products.module.css';
import { useAuth } from '@/context/AuthContext';
import { useCurrency } from '@/hooks/useCurrency';
import { useLanguage } from '@/context/LanguageContext';
import { convertLink, SUPPORTED_AGENTS } from '@/utils/converter';

const CLICK_TRACK_COOLDOWN_MS = 60 * 1000;
const ANALYTICS_VISITOR_KEY = '__vf_visitor_id';

const generateAnalyticsVisitorId = () => {
  if (typeof crypto !== 'undefined' && crypto.randomUUID) {
    return crypto.randomUUID();
  }
  return 'xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx'.replace(/[xy]/g, (char) => {
    const random = Math.random() * 16 | 0;
    const value = char === 'x' ? random : (random & 0x3 | 0x8);
    return value.toString(16);
  });
};

const getAnalyticsVisitorId = () => {
  if (typeof window === 'undefined') return null;
  try {
    let visitorId = localStorage.getItem(ANALYTICS_VISITOR_KEY);
    if (!visitorId) {
      visitorId = generateAnalyticsVisitorId();
      localStorage.setItem(ANALYTICS_VISITOR_KEY, visitorId);
    }
    return visitorId;
  } catch (err) {
    return null;
  }
};

const getEstimatedWeight = (category, productName = '') => {
  const cat = (category || '').toLowerCase();
  const name = (productName || '').toLowerCase();
  
  // SHOES - różne wagi w zależności od typu
  if (cat.includes('shoe') || cat.includes('buty')) {
    if (name.includes('slide') || name.includes('slidy') || name.includes('foam runner') || name.includes('crocs')) return '400g';
    if (name.includes('jordan') || name.includes('dunk') || name.includes('air force')) return '1300g';
    if (name.includes('yeezy 350') || name.includes('yeezy boost')) return '900g';
    if (name.includes('yeezy 700')) return '1100g';
    if (name.includes('new balance') || name.includes('nb 9060') || name.includes('2002r')) return '950g';
    if (name.includes('air max') || name.includes('tn')) return '1050g';
    if (name.includes('balenciaga') || name.includes('track')) return '1400g';
    if (name.includes('salomon') || name.includes('xt-6')) return '850g';
    if (name.includes('converse') || name.includes('vans')) return '700g';
    if (name.includes('rick owens') || name.includes('ramones')) return '1200g';
    return '1100g'; // default dla butów
  }
  
  // SHORTS - różne wagi
  if (cat.includes('shorts') || cat.includes('spodenki')) {
    if (name.includes('essentials') || name.includes('mesh')) return '200g';
    if (name.includes('jordan') || name.includes('nike tech')) return '350g';
    if (name.includes('trapstar') || name.includes('corteiz')) return '380g';
    if (name.includes('cargo')) return '420g';
    if (name.includes('stussy') || name.includes('gallery dept')) return '280g';
    return '300g'; // default dla szortów
  }
  
  // HOODIES
  if (cat.includes('hoodie') || cat.includes('bluza')) {
    if (name.includes('essentials') && name.includes('oversized')) return '950g';
    if (name.includes('essentials')) return '750g';
    if (name.includes('trapstar') || name.includes('tech fleece')) return '650g';
    if (name.includes('chrome hearts') || name.includes('heavyweight')) return '1100g';
    if (name.includes('gallery dept') || name.includes('vintage')) return '850g';
    if (name.includes('zip') || name.includes('full zip')) return '900g';
    if (name.includes('stussy') || name.includes('carhartt')) return '800g';
    return '800g'; // default dla bluz
  }
  
  // T-SHIRTS
  if (cat.includes('t-shirt') || cat.includes('koszulka')) {
    if (name.includes('essentials') && name.includes('oversized')) return '350g';
    if (name.includes('essentials')) return '250g';
    if (name.includes('vintage') || name.includes('heavy')) return '400g';
    if (name.includes('chrome hearts') || name.includes('heavyweight')) return '450g';
    if (name.includes('polo') || name.includes('lacoste')) return '320g';
    if (name.includes('tech') || name.includes('performance')) return '200g';
    return '280g'; // default dla koszulek
  }
  
  // JACKETS
  if (cat.includes('jacket') || cat.includes('kurtka')) {
    if (name.includes('moncler') || name.includes('maya') || name.includes('puffer')) return '1400g';
    if (name.includes('north face') && name.includes('nuptse')) return '1300g';
    if (name.includes('canada goose')) return '1600g';
    if (name.includes('stone island') && name.includes('soft shell')) return '900g';
    if (name.includes('arcteryx') || name.includes('beta')) return '850g';
    if (name.includes('windbreaker') || name.includes('coach')) return '550g';
    if (name.includes('bomber')) return '950g';
    if (name.includes('denim') || name.includes('trucker')) return '1000g';
    if (name.includes('leather') || name.includes('biker')) return '1800g';
    return '1000g'; // default dla kurtek
  }
  
  // PANTS
  if (cat.includes('pants') || cat.includes('spodnie')) {
    if (name.includes('cargo') || name.includes('military')) return '650g';
    if (name.includes('jeans') || name.includes('denim')) return '750g';
    if (name.includes('essentials') || name.includes('sweatpants')) return '500g';
    if (name.includes('tech fleece')) return '480g';
    if (name.includes('corduroy')) return '700g';
    if (name.includes('trapstar') || name.includes('corteiz')) return '550g';
    return '600g'; // default dla spodni
  }
  
  // SETS
  if (cat.includes('sets') || cat.includes('tracksuit')) {
    if (name.includes('tech fleece')) return '1100g';
    if (name.includes('essentials')) return '1200g';
    if (name.includes('trapstar') || name.includes('corteiz')) return '1300g';
    return '1250g'; // default dla setów
  }
  
  // ACCESSORIES
  if (cat.includes('accessories') || cat.includes('bag') || cat.includes('torba')) {
    if (name.includes('backpack') || name.includes('plecak')) return '650g';
    if (name.includes('duffle') || name.includes('travel bag')) return '900g';
    if (name.includes('shoulder bag') || name.includes('crossbody')) return '450g';
    if (name.includes('tote')) return '350g';
    if (name.includes('wallet') || name.includes('portfel')) return '150g';
    if (name.includes('cap') || name.includes('hat') || name.includes('czapka')) return '120g';
    if (name.includes('beanie') || name.includes('balaclava')) return '80g';
    if (name.includes('belt') || name.includes('pasek')) return '200g';
    if (name.includes('socks') || name.includes('skarpetki')) return '60g';
    if (name.includes('watch') || name.includes('zegarek')) return '180g';
    if (name.includes('sunglasses') || name.includes('glasses')) return '100g';
    if (name.includes('jewelry') || name.includes('chain') || name.includes('necklace')) return '120g';
    return '300g'; // default dla akcesoriów
  }
  
  return '500g'; // universal fallback
};

export default function ProductDetail({ productId, initialData = null }) {
  const router = useRouter();
  const { t } = useLanguage();
  const { user, fetchWithAuth } = useAuth();
  const { formatPrice } = useCurrency();
  const recentTrackedClicksRef = useRef(new Map());

  // UI States — if we got SSR data, start ready immediately
  const [detailLoading, setDetailLoading] = useState(initialData == null);
  const [productDetails, setProductDetails] = useState(initialData);
  const [galleryImage, setGalleryImage] = useState(null);
  const [selectedSize, setSelectedSize] = useState(null);
  const [selectedColor, setSelectedColor] = useState(null);
  const [copiedId, setCopiedId] = useState(null);
  const [error, setError] = useState({ message: null, type: null });

  // QC Gallery States
  const [qcCardIndex, setQcCardIndex] = useState({});

  // QC Gallery Full-Screen Modal States
  const [activeQcModal, setActiveQcModal] = useState(null);
  const [modalZoomLevel, setModalZoomLevel] = useState(1);
  const [modalPanPosition, setModalPanPosition] = useState({ x: 0, y: 0 });
  const [isDraggingModal, setIsDraggingModal] = useState(false);
  const [dragStartModal, setDragStartModal] = useState({ x: 0, y: 0 });

  // Dynamic QC States
  const [dynamicQcImages, setDynamicQcImages] = useState(null);
  const [dynamicQcLoading, setDynamicQcLoading] = useState(false);

  const qcAlbums = useMemo(() => {
    const images = productDetails?.qcImages || productDetails?.product?.qcImages || [];
    if (images && images.length > 0) {
      const groups = {};
      images.forEach(img => {
        if (!img) return;
        const color = img.colorway || 'Default';
        if (!groups[color]) {
          groups[color] = [];
        }
        const url = typeof img === 'string' ? img : img.url;
        if (url) {
          groups[color].push(url);
        }
      });

      return Object.entries(groups).map(([colorway, urls]) => ({
        colorway,
        images: urls
      }));
    }

    if (dynamicQcImages && dynamicQcImages.length > 0) {
      return dynamicQcImages.map(album => ({
        colorway: album.colorway || album.name || 'Default Style',
        images: album.images || []
      }));
    }

    return [];
  }, [productDetails, dynamicQcImages]);

  // Listen for escape/arrow keys in QC modal
  useEffect(() => {
    if (activeQcModal === null) return;
    
    const handleKeyDown = (e) => {
      if (e.key === 'Escape') {
        setActiveQcModal(null);
      } else if (e.key === 'ArrowRight') {
        const album = qcAlbums[activeQcModal.albumIdx];
        if (album && album.images?.length > 1) {
          setActiveQcModal(prev => ({
            ...prev,
            imageIdx: (prev.imageIdx + 1) % album.images.length
          }));
          setModalZoomLevel(1);
          setModalPanPosition({ x: 0, y: 0 });
        }
      } else if (e.key === 'ArrowLeft') {
        const album = qcAlbums[activeQcModal.albumIdx];
        if (album && album.images?.length > 1) {
          setActiveQcModal(prev => ({
            ...prev,
            imageIdx: (prev.imageIdx - 1 + album.images.length) % album.images.length
          }));
          setModalZoomLevel(1);
          setModalPanPosition({ x: 0, y: 0 });
        }
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [activeQcModal, qcAlbums]);

  // Preferred agent configurations
  const [preferredAgent, setPreferredAgent] = useState('ossbuy');
  const [preferredAgentLogo, setPreferredAgentLogo] = useState('/images/ossbuy.png');

  // Load preferred agent settings
  useEffect(() => {
    const saved = localStorage.getItem('preferredAgent');
    if (saved) {
      const mapping = {
        'Ossbuy': 'ossbuy',
        'KakoBuy': 'kakobuy',
        'ACBuy': 'allchinabuy',
        'USFans': 'usfans',
        'LitBuy': 'litbuy',
        'GTBuy': 'gtbuy',
        'OopBuy': 'oopbuy',
        'MuleBuy': 'mulebuy',
        'HipoBuy': 'hipobuy'
      };
      const logoMapping = {
        'Ossbuy': '/images/ossbuy.png',
        'KakoBuy': '/images/kako.png',
        'ACBuy': '/images/allchinabuy.png',
        'USFans': '/images/usfans.png',
        'LitBuy': '/images/litbuy.png',
        'GTBuy': '/images/gtbuy.png',
        'OopBuy': '/images/oopbuy.png',
        'MuleBuy': '/images/Mulebuy.jpg',
        'HipoBuy': '/images/Hipobuy.png'
      };
      setPreferredAgent(mapping[saved] || 'ossbuy');
      setPreferredAgentLogo(logoMapping[saved] || '/images/ossbuy.png');
    }
  }, []);

  // Seed gallery/selection from initialData on first render
  useEffect(() => {
    if (!initialData) return;
    setGalleryImage(initialData.product.image);
    if (initialData.sizes?.length > 0) setSelectedSize(initialData.sizes[0]);
    if (initialData.colors?.length > 0) {
      const match = initialData.colors.find(c => c.productId === productId) || initialData.colors[0];
      setSelectedColor(match.name);
    }
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // Fetch product data — only when no initialData provided (e.g. colour-variant navigation)
  useEffect(() => {
    if (!productId) return;
    // If we already have data for this product, skip the fetch
    if (productDetails?.product?._id?.toString() === productId) return;

    const fetchDetail = async () => {
      setDetailLoading(true);
      try {
        const res = await fetch(`/api/products/${productId}`);
        if (!res.ok) throw new Error("Failed to load product");
        const data = await res.json();
        if (data.success) {
          setProductDetails(data);
          setGalleryImage(data.product.image);
          if (data.sizes?.length > 0) setSelectedSize(data.sizes[0]);
          if (data.colors?.length > 0) {
            const currentMatch = data.colors.find(c => c.productId === productId) || data.colors[0];
            setSelectedColor(currentMatch.name);
          }
        }
      } catch (err) {
        console.error("Failed to fetch product details:", err);
        setError({ message: "Błąd podczas ładowania szczegółów produktu", type: "error" });
      } finally {
        setDetailLoading(false);
      }
    };

    fetchDetail();
  }, [productId]);

  // Fetch dynamic QC photos if local DB has none
  useEffect(() => {
    const productLink = productDetails?.product?.link;
    if (!productLink) return;

    const localImages = productDetails?.qcImages || productDetails?.product?.qcImages || [];
    if (localImages.length > 0) {
      setDynamicQcImages(null);
      return;
    }

    const fetchDynamicQc = async () => {
      setDynamicQcLoading(true);
      setDynamicQcImages(null);
      try {
        const encodedUrl = encodeURIComponent(productLink);
        const res = await fetch(`/api/qc?url=${encodedUrl}`);
        if (res.ok) {
          const data = await res.json();
          if (data.success && data.albums) {
            const hasImages = data.albums.some(album => album.images && album.images.length > 0);
            if (hasImages) {
              setDynamicQcImages(data.albums);
            } else {
              setDynamicQcImages([]);
            }
          } else {
            setDynamicQcImages([]);
          }
        } else {
          setDynamicQcImages([]);
        }
      } catch (err) {
        console.error("Error fetching dynamic QC:", err);
        setDynamicQcImages([]);
      } finally {
        setDynamicQcLoading(false);
      }
    };

    fetchDynamicQc();
  }, [productDetails?.product?.link]);

  // Track click stats
  const trackStat = useCallback(async (productId, type = 'product_click', agent = null) => {
    try {
      const visitorId = getAnalyticsVisitorId();
      const now = Date.now();
      const clickKey = [productId || 'unknown', agent || 'unknown', visitorId || 'anon'].join(':');
      const lastTrackedAt = recentTrackedClicksRef.current.get(clickKey);
      
      if (lastTrackedAt && now - lastTrackedAt < CLICK_TRACK_COOLDOWN_MS) {
        return;
      }
      recentTrackedClicksRef.current.set(clickKey, now);

      await fetch('/api/stats', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ 
          productId, 
          type, 
          agent,
          visitorId,
          userAgent: navigator.userAgent,
          path: window.location.pathname + window.location.search
        })
      });
    } catch (err) {
      console.error("Stats error:", err);
    }
  }, []);

  // Handle wishlist add/delete
  const handleAddToWishlist = async (id) => {
    if (!user) {
      setError({ message: 'Musisz być zalogowany, aby dodać do ulubionych!', type: 'error' });
      return;
    }

    setProductDetails(prev => {
      if (!prev) return prev;
      return {
        ...prev,
        product: {
          ...prev.product,
          isFavorited: !prev.product.isFavorited
        }
      };
    });

    try {
      const isFavorited = productDetails?.product?.isFavorited;
      const endpoint = `/api/users/favorites/${id}`;
      const method = isFavorited ? 'DELETE' : 'POST';

      const res = await fetchWithAuth(endpoint, { method });
      const data = await res.json();
      if (!data.success) throw new Error(data.message || 'Error');

      setError({
        message: isFavorited ? 'Usunięto z ulubionych' : 'Dodano do ulubionych!',
        type: 'success'
      });
    } catch (err) {
      console.error('Wishlist error:', err);
      setError({ message: 'Błąd ulubionych', type: 'error' });
      // Revert state
      setProductDetails(prev => {
        if (!prev) return prev;
        return {
          ...prev,
          product: {
            ...prev.product,
            isFavorited: !prev.product.isFavorited
          }
        };
      });
    }
  };

  const handleColorClick = (color) => {
    setSelectedColor(color.name);
    if (color.image) {
      setGalleryImage(color.image);
    }
    if (color.productId) {
      // Smooth Next.js navigation to client page of sibling product
      router.push(`/products/${color.productId}`, { scroll: false });
    }
  };

  return (
    <div className={styles.productDetailPageWrapper}>
      <div className={styles.productDetailPageContent}>
        
        {/* Toast Notification */}
        {error.message && (
          <div className={`${styles.errorMessage} ${error.type === 'success' ? styles.success : ''}`}>
            <span>{error.message}</span>
            <button onClick={() => setError({ message: null, type: null })} className={styles.errorCloseButton}>
              <FontAwesomeIcon icon={faTimes} />
            </button>
          </div>
        )}

        {/* Back To Gallery Header */}
        <div className={styles.descModalHeaderRow}>
          <button className={styles.backToGalleryBtn} onClick={() => {
            // Clear hash and go back to products
            if (window.location.hash) {
              window.history.replaceState(null, '', window.location.pathname);
            }
            router.push('/products');
          }}>
            <FontAwesomeIcon icon={faArrowLeft} style={{ marginRight: '8px' }} />
            {t('products.backToGallery') || 'Wróć do Galerii'}
          </button>
        </div>

        {detailLoading ? (
          /* Premium Shimmer Skeleton Loader */
          <div className={styles.skeletonDetailLayout}>
            <div className={styles.skeletonDetailLeft}>
              <div className={styles.skeletonDetailBigImage}></div>
              <div className={styles.skeletonDetailThumbnails}>
                {[...Array(4)].map((_, i) => <div key={i} className={styles.skeletonDetailThumb}></div>)}
              </div>
            </div>
            <div className={styles.skeletonDetailRight}>
              <div className={styles.skeletonDetailTitle}></div>
              <div className={styles.skeletonDetailPrice}></div>
              <div className={styles.skeletonDetailSection}></div>
              <div className={styles.skeletonDetailSection}></div>
            </div>
          </div>
        ) : productDetails && (
          <div className={styles.modalProductLayoutNew}>
            
            {/* Left Column: Image Gallery, Metadata, Order Action */}
            <div className={styles.modalProductLeftColumn}>
              
              {/* Large Viewport */}
              <div className={styles.mainImageContainerNew}>
                <img 
                  src={galleryImage || productDetails.product.image} 
                  alt={productDetails.product.name} 
                  className={styles.mainGalleryImageNew} 
                />
              </div>

              {/* Thumbnails strip */}
              {(() => {
                const thumbnails = Array.from(new Set([
                  productDetails.product.image,
                  ...productDetails.colors.map(c => c.image),
                ].filter(Boolean)));

                if (thumbnails.length <= 1) return null;

                return (
                  <div className={styles.thumbnailsStripNew}>
                    {thumbnails.map((img, idx) => (
                      <button
                        key={idx}
                        className={`${styles.thumbnailBtnNew} ${galleryImage === img ? styles.activeThumbnailNew : ''}`}
                        onClick={() => setGalleryImage(img)}
                      >
                        <img src={img} alt={`Thumbnail ${idx + 1}`} className={styles.thumbnailImgNew} />
                      </button>
                    ))}
                  </div>
                );
              })()}

              {/* Primary Order Action */}
              <div className={styles.orderActionsContainer}>
                <a
                  href={convertLink(productDetails.product.link, preferredAgent)}
                  target="_blank"
                  rel="noopener noreferrer"
                  className={styles.orderButtonPremiumNew}
                  onClick={() => trackStat(productDetails.product._id, 'product_click', preferredAgent)}
                >
                  <img src={preferredAgentLogo} alt={preferredAgent} className={styles.orderAgentLogoNew} />
                  <span>{t('products.orderProduct') || 'Zamów Produkt'}</span>
                </a>
                <button
                  className={`${styles.detailCopyBtnNew} ${copiedId === 'main' ? styles.copiedNew : ''}`}
                  onClick={() => {
                    const link = convertLink(productDetails.product.link, preferredAgent);
                    navigator.clipboard.writeText(link);
                    setCopiedId('main');
                    trackStat(productDetails.product._id, 'product_click', preferredAgent);
                    setTimeout(() => setCopiedId(null), 2000);
                  }}
                  title="Kopiuj link do agenta"
                >
                  <FontAwesomeIcon icon={copiedId === 'main' ? faCheck : faCopy} />
                </button>
              </div>

              {/* Alternative Agents Selection */}
              <div className={styles.altAgentsSectionNew}>
                <div className={styles.altAgentsTitleNew}>{t('products.otherAgents') || 'Inni agenci:'}</div>
                <div className={styles.altAgentsGridNew}>
                  {SUPPORTED_AGENTS.filter(a => a.value !== preferredAgent).map((agent) => (
                    <a
                      key={agent.value}
                      href={convertLink(productDetails.product.link, agent.value)}
                      target="_blank"
                      rel="noopener noreferrer"
                      className={styles.altAgentChipNew}
                      onClick={() => trackStat(productDetails.product._id, 'product_click', agent.value)}
                      title={agent.label}
                    >
                      <img src={agent.icon} alt={agent.label} className={styles.altAgentIconNew} />
                      <span>{agent.label}</span>
                    </a>
                  ))}
                </div>
              </div>

              {/* Product details table */}
              <div className={styles.detailsBoxNew}>
                <h4 className={styles.detailsBoxTitleNew}>{t('products.productDetails') || 'Szczegóły Produktu'}</h4>
                <div className={styles.detailsGridNew}>
                  <div className={styles.detailRowNew}>
                    <span className={styles.detailLabelNew}>{t('products.platform') || 'Platforma'}</span>
                    <span className={`${styles.detailValNew} ${styles.badgePlatformNew}`}>
                      {productDetails.details.platform.toUpperCase()}
                    </span>
                  </div>
                  <div className={styles.detailRowNew}>
                    <span className={styles.detailLabelNew}>{t('products.category') || 'Kategoria'}</span>
                    <span className={`${styles.detailValNew} ${styles.badgeCategoryNew}`}>
                      {productDetails.product.category.toUpperCase()}
                    </span>
                  </div>
                  <div className={styles.detailRowNew}>
                    <span className={styles.detailLabelNew}>{t('products.weight') || 'Waga'}</span>
                    <span className={styles.detailValNew}>
                      {productDetails.details.weight && productDetails.details.weight !== 'N/A' 
                        ? productDetails.details.weight 
                        : (
                            <span style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                              {getEstimatedWeight(productDetails.product.category, productDetails.product.name)}
                              <span className={styles.estimatedBadgeNew}>{t('products.estimated') || 'Szacowana'}</span>
                            </span>
                          )
                      }
                    </span>
                  </div>
                  <div className={styles.detailRowNew}>
                    <span className={styles.detailLabelNew}>{t('products.delivery') || 'Dostawa'}</span>
                    <span className={styles.detailValNew}>{productDetails.details.delivery || 'N/A'}</span>
                  </div>
                  <div className={styles.detailRowNew}>
                    <span className={styles.detailLabelNew}>{t('products.sales') || 'Sprzedaż'}</span>
                    <span className={styles.detailValNew}>{productDetails.details.sales || '0'}</span>
                  </div>
                  <div className={styles.detailRowNew}>
                    <span className={styles.detailLabelNew}>{t('products.clicks') || 'Kliknięcia'}</span>
                    <span className={styles.detailValNew}>{productDetails.product.clicks || '0'}</span>
                  </div>
                </div>
              </div>

            </div>

            {/* Right Column: Text Information & Interactive selectors */}
            <div className={styles.modalProductRightColumn}>
              
              {/* Brand Shop & Favorite */}
              <div className={styles.shopRowNew}>
                <span className={styles.shopLabelNew}>{t('products.bestBatchLabel') || 'Best Batch'}</span>
                <button
                  className={`${styles.wishlistBtnNew} ${productDetails.product.isFavorited ? styles.wishlistActiveNew : ''}`}
                  onClick={() => handleAddToWishlist(productDetails.product._id)}
                  title="Dodaj do ulubionych"
                >
                  <FontAwesomeIcon icon={faHeart} />
                </button>
              </div>

              {/* Title & Price */}
              <h2 className={styles.productTitleNew}>{productDetails.product.name}</h2>
              <div className={styles.productPriceNew}>
                {formatPrice(productDetails.product.price)}
              </div>

              {/* Real-time stats */}
              <div className={styles.productStatsNew}>
                <span>{productDetails.details.views} {t('products.views') || 'wyświetleń'}</span>
                <span className={styles.statsSeparatorNew}>•</span>
                <span>{productDetails.details.favorites} {t('products.likes') || 'polubień'}</span>
              </div>

              {/* Colorways / Variant Selector */}
              {productDetails.colors && productDetails.colors.length > 0 && (
                <div className={styles.variantsSectionNew}>
                  <h4 className={styles.sectionLabelNew}>{t('products.colorways') || 'Warianty kolorystyczne'}</h4>
                  <div className={styles.variantsGridNew}>
                    {productDetails.colors.map((c, idx) => (
                      <button
                        key={idx}
                        className={`${styles.variantChipNew} ${selectedColor === c.name ? styles.activeVariantNew : ''}`}
                        onClick={() => handleColorClick(c)}
                        title={c.name}
                      >
                        {c.image && <img src={c.image} alt={c.name} className={styles.variantChipImgNew} />}
                        <span className={styles.variantChipTextNew}>{c.name}</span>
                      </button>
                    ))}
                  </div>
                </div>
              )}

              {/* Size Selector */}
              {productDetails.sizes && productDetails.sizes.length > 0 && (
                <div className={styles.sizesSectionNew}>
                  <h4 className={styles.sectionLabelNew}>{t('products.availableSizes') || 'Dostępne Rozmiary'}</h4>
                  <div className={styles.sizesGridNew}>
                    {productDetails.sizes.map((sz) => (
                      <button
                        key={sz}
                        className={`${styles.sizeChipNew} ${selectedSize === sz ? styles.activeSizeNew : ''}`}
                        onClick={() => setSelectedSize(sz)}
                      >
                        {sz}
                      </button>
                    ))}
                  </div>
                </div>
              )}

              {/* Share Button - always visible */}
              <button
                className={`${styles.shareButtonGray} ${copiedId === 'share' ? styles.shareButtonCopied : ''}`}
                onClick={(e) => {
                  e.stopPropagation();
                  const shareLink = `${window.location.origin}/products/${productDetails.product.slug || productDetails.product._id}`;
                  navigator.clipboard.writeText(shareLink);
                  setCopiedId('share');
                  setTimeout(() => setCopiedId(null), 2000);
                }}
              >
                <FontAwesomeIcon icon={copiedId === 'share' ? faCheck : faShare} />
                <span>{copiedId === 'share' ? 'Skopiowano!' : 'Udostępnij'}</span>
              </button>

              {/* QC Section inside right column */}
              <div className={styles.qcSectionRightColumn}>
                <h3 className={styles.qcSectionTitleRight}>
                  <span>Quality Check (QC)</span>
                  {qcAlbums.length > 0 && !dynamicQcLoading && (
                    <span className={styles.qcColorsCountRight}>
                      ({qcAlbums.length})
                    </span>
                  )}
                </h3>

                {dynamicQcLoading ? (
                  <div className={styles.qcShimmerGridRight}>
                    {[...Array(2)].map((_, i) => (
                      <div key={i} className={styles.qcShimmerCardRight}>
                        <div className={styles.qcShimmerImageRight}></div>
                        <div className={styles.qcShimmerTextRight}></div>
                      </div>
                    ))}
                  </div>
                ) : qcAlbums.length > 0 ? (
                  <div className={styles.qcGridRight}>
                    {qcAlbums.map((album, albumIdx) => {
                      const imgs = album.images || [];
                      const idx = qcCardIndex[albumIdx] || 0;
                      if (!imgs.length) return null;
                      return (
                        <div key={albumIdx} className={styles.qcCardRight}>
                          <div className={styles.qcCardImageContainerRight} onClick={() => {
                            setActiveQcModal({ albumIdx: albumIdx, imageIdx: idx });
                            setModalZoomLevel(1);
                            setModalPanPosition({ x: 0, y: 0 });
                          }}>
                            <img
                              src={imgs[idx]}
                              alt={`QC - ${album.colorway}`}
                              className={styles.qcCardImageRight}
                              onError={e => e.target.src = '/placeholder.png'}
                            />

                            {imgs.length > 1 && (
                              <>
                                <button
                                  className={`${styles.qcCardArrowRightCol} ${styles.qcCardArrowLeftRightCol}`}
                                  onClick={(e) => {
                                    e.stopPropagation();
                                    setQcCardIndex(prev => ({ ...prev, [albumIdx]: idx > 0 ? idx - 1 : imgs.length - 1 }));
                                  }}
                                >
                                  &#10094;
                                </button>
                                <button
                                  className={`${styles.qcCardArrowRightCol} ${styles.qcCardArrowRightRightCol}`}
                                  onClick={(e) => {
                                    e.stopPropagation();
                                    setQcCardIndex(prev => ({ ...prev, [albumIdx]: idx < imgs.length - 1 ? idx + 1 : 0 }));
                                  }}
                                >
                                  &#10095;
                                </button>
                                <div className={styles.qcCardCounterRight}>
                                  {idx + 1} / {imgs.length}
                                </div>
                              </>
                            )}
                          </div>

                          <div className={styles.qcCardColorLabelRight}>
                            {album.colorway || 'Default Style'}
                          </div>
                        </div>
                      );
                    })}
                  </div>
                ) : (
                  <div className={styles.qcEmptyMessageRight}>
                    {t('products.noQcPhotos') || 'Brak zdjęć QC dla tego produktu.'}
                  </div>
                )}
              </div>

            </div>

          </div>
        )}

      </div>

      {/* Premium Full-Screen QC Image Modal with Zoom and Pan */}
      {activeQcModal !== null && (() => {
        const album = qcAlbums[activeQcModal.albumIdx];
        if (!album) return null;
        const imgs = album.images || [];
        const currentImg = imgs[activeQcModal.imageIdx];
        if (!currentImg) return null;

        const handleNext = (e) => {
          e?.stopPropagation();
          setActiveQcModal(prev => ({
            ...prev,
            imageIdx: (prev.imageIdx + 1) % imgs.length
          }));
          setModalZoomLevel(1);
          setModalPanPosition({ x: 0, y: 0 });
        };

        const handlePrev = (e) => {
          e?.stopPropagation();
          setActiveQcModal(prev => ({
            ...prev,
            imageIdx: (prev.imageIdx - 1 + imgs.length) % imgs.length
          }));
          setModalZoomLevel(1);
          setModalPanPosition({ x: 0, y: 0 });
        };

        const handleZoomIn = (e) => {
          e?.stopPropagation();
          setModalZoomLevel(prev => Math.min(prev + 0.5, 4));
        };
        const handleZoomOut = (e) => {
          e?.stopPropagation();
          setModalZoomLevel(prev => {
            const next = Math.max(prev - 0.5, 1);
            if (next === 1) setModalPanPosition({ x: 0, y: 0 });
            return next;
          });
        };

        // Mouse Drag events for Panning
        const handleMouseDown = (e) => {
          if (modalZoomLevel > 1) {
            setIsDraggingModal(true);
            setDragStartModal({ x: e.clientX - modalPanPosition.x, y: e.clientY - modalPanPosition.y });
          }
        };

        const handleMouseMove = (e) => {
          if (isDraggingModal && modalZoomLevel > 1) {
            setModalPanPosition({
              x: e.clientX - dragStartModal.x,
              y: e.clientY - dragStartModal.y
            });
          }
        };

        const handleMouseUp = () => setIsDraggingModal(false);

        // Touch Drag events for Panning (mobile support)
        const handleTouchStart = (e) => {
          if (e.touches.length === 1 && modalZoomLevel > 1) {
            const touch = e.touches[0];
            setIsDraggingModal(true);
            setDragStartModal({ x: touch.clientX - modalPanPosition.x, y: touch.clientY - modalPanPosition.y });
          }
        };

        const handleTouchMove = (e) => {
          if (isDraggingModal && modalZoomLevel > 1 && e.touches.length === 1) {
            const touch = e.touches[0];
            setModalPanPosition({
              x: touch.clientX - dragStartModal.x,
              y: touch.clientY - dragStartModal.y
            });
          }
        };

        const handleTouchEnd = () => setIsDraggingModal(false);

        return (
          <div 
            style={{
              position: 'fixed',
              top: 0,
              left: 0,
              width: '100vw',
              height: '100vh',
              background: 'rgba(0, 0, 0, 0.95)',
              zIndex: 99999,
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              userSelect: 'none',
            }}
            onMouseMove={handleMouseMove}
            onMouseUp={handleMouseUp}
            onTouchMove={handleTouchMove}
            onTouchEnd={handleTouchEnd}
            onClick={() => setActiveQcModal(null)}
          >
            {/* Close Button in top right */}
            <button
              onClick={() => setActiveQcModal(null)}
              style={{
                position: 'absolute',
                top: '20px',
                right: '20px',
                background: 'rgba(255, 255, 255, 0.1)',
                border: 'none',
                color: 'white',
                borderRadius: '50%',
                width: '40px',
                height: '40px',
                fontSize: '18px',
                cursor: 'pointer',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                zIndex: 10,
                transition: 'background 0.2s',
              }}
              onMouseEnter={(e) => e.currentTarget.style.background = 'rgba(255, 255, 255, 0.2)'}
              onMouseLeave={(e) => e.currentTarget.style.background = 'rgba(255, 255, 255, 0.1)'}
            >
              <FontAwesomeIcon icon={faTimes} />
            </button>

            {/* Left Nav Arrow */}
            {imgs.length > 1 && (
              <button
                onClick={handlePrev}
                style={{
                  position: 'absolute',
                  left: '30px',
                  top: '50%',
                  transform: 'translateY(-50%)',
                  background: 'rgba(255, 255, 255, 0.05)',
                  border: '1px solid rgba(255, 255, 255, 0.1)',
                  color: 'white',
                  borderRadius: '50%',
                  width: '50px',
                  height: '50px',
                  cursor: 'pointer',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  zIndex: 5,
                  fontSize: '16px',
                  transition: 'background 0.2s, transform 0.2s'
                }}
                onMouseEnter={(e) => e.currentTarget.style.background = 'rgba(255, 255, 255, 0.15)'}
                onMouseLeave={(e) => e.currentTarget.style.background = 'rgba(255, 255, 255, 0.05)'}
              >
                &#10094;
              </button>
            )}

            {/* Right Nav Arrow */}
            {imgs.length > 1 && (
              <button
                onClick={handleNext}
                style={{
                  position: 'absolute',
                  right: '30px',
                  top: '50%',
                  transform: 'translateY(-50%)',
                  background: 'rgba(255, 255, 255, 0.05)',
                  border: '1px solid rgba(255, 255, 255, 0.1)',
                  color: 'white',
                  borderRadius: '50%',
                  width: '50px',
                  height: '50px',
                  cursor: 'pointer',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  zIndex: 5,
                  fontSize: '16px',
                  transition: 'background 0.2s, transform 0.2s'
                }}
                onMouseEnter={(e) => e.currentTarget.style.background = 'rgba(255, 255, 255, 0.15)'}
                onMouseLeave={(e) => e.currentTarget.style.background = 'rgba(255, 255, 255, 0.05)'}
              >
                &#10095;
              </button>
            )}

            {/* Image Container */}
            <div 
              onClick={(e) => e.stopPropagation()}
              style={{
                position: 'relative',
                maxWidth: '85%',
                maxHeight: '80%',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                overflow: 'hidden',
                borderRadius: '8px'
              }}
            >
              <img
                src={currentImg}
                alt="QC Full View"
                onMouseDown={handleMouseDown}
                onTouchStart={handleTouchStart}
                style={{
                  maxWidth: '100%',
                  maxHeight: '80vh',
                  objectFit: 'contain',
                  transform: `scale(${modalZoomLevel}) translate(${modalPanPosition.x / modalZoomLevel}px, ${modalPanPosition.y / modalZoomLevel}px)`,
                  cursor: modalZoomLevel > 1 ? 'grab' : 'zoom-in',
                  transition: isDraggingModal ? 'none' : 'transform 0.15s ease-out',
                }}
                draggable={false}
              />

              {/* Counter Badge in top right corner of image container */}
              <div
                style={{
                  position: 'absolute',
                  top: '15px',
                  right: '15px',
                  background: 'rgba(0, 0, 0, 0.65)',
                  color: 'white',
                  fontSize: '12px',
                  padding: '4px 10px',
                  borderRadius: '12px',
                  fontFamily: 'monospace',
                  pointerEvents: 'none',
                }}
              >
                {activeQcModal.imageIdx + 1} / {imgs.length}
              </div>
            </div>

            {/* Zoom Control Panel at bottom center */}
            <div
              onClick={(e) => e.stopPropagation()}
              style={{
                position: 'absolute',
                bottom: '30px',
                left: '50%',
                transform: 'translateX(-50%)',
                background: 'rgba(0, 0, 0, 0.75)',
                border: '1px solid rgba(255, 255, 255, 0.1)',
                padding: '6px 16px',
                borderRadius: '30px',
                display: 'flex',
                alignItems: 'center',
                gap: '15px',
                color: 'white',
                zIndex: 10,
              }}
            >
              <button
                onClick={handleZoomOut}
                style={{
                  background: 'none',
                  border: 'none',
                  color: 'white',
                  cursor: 'pointer',
                  fontSize: '18px',
                  padding: '0 5px',
                  display: 'flex',
                  alignItems: 'center',
                  outline: 'none'
                }}
              >
                -
              </button>
              <span style={{ fontSize: '13px', fontFamily: 'monospace', minWidth: '45px', textAlign: 'center' }}>
                {Math.round(modalZoomLevel * 100)}%
              </span>
              <button
                onClick={handleZoomIn}
                style={{
                  background: 'none',
                  border: 'none',
                  color: 'white',
                  cursor: 'pointer',
                  fontSize: '18px',
                  padding: '0 5px',
                  display: 'flex',
                  alignItems: 'center',
                  outline: 'none'
                }}
              >
                +
              </button>
            </div>
          </div>
        );
      })()}
    </div>
  );
}
