'use client';

import { useRouter, useSearchParams } from 'next/navigation';
import { Suspense, useMemo } from 'react';
import { cleanCategories } from '@/utils/categories';

function CategoryList({ categories }) {
  const router = useRouter();
  const searchParams = useSearchParams();
  const currentCategory = searchParams.get('category') || 'All';
  
  const cleanCats = useMemo(() => cleanCategories(categories), [categories]);

  const handleSelect = (cat) => {
    if (cat === 'All') {
      router.push('/');
    } else {
      router.push(`/?category=${encodeURIComponent(cat)}`);
    }
  };

  return (
    <div className="gms-category-bar">
      <div className="gms-category-scroll">
        <button 
          className={`gms-cat-btn ${currentCategory === 'All' ? 'active' : ''}`}
          onClick={() => handleSelect('All')}
        >
          All
        </button>
        {cleanCats.map(cat => (
          <button 
            key={cat}
            className={`gms-cat-btn ${currentCategory === cat ? 'active' : ''}`}
            onClick={() => handleSelect(cat)}
          >
            {cat}
          </button>
        ))}
      </div>
    </div>
  );
}

export default function CategoryBar({ categories }) {
  return (
    <Suspense fallback={<div className="gms-category-bar">Loading categories...</div>}>
      <CategoryList categories={categories} />
    </Suspense>
  );
}
