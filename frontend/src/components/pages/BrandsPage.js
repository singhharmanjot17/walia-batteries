'use client';

import React, { useEffect, useState } from 'react';
import AppLayout from '../AppLayout';
import { brandAPI, modelAPI } from '../../services/api';

const BrandsPage = () => {
  const [brands, setBrands] = useState([]);
  const [models, setModels] = useState([]);

  const [brandName, setBrandName] = useState('');
  const [brandLoading, setBrandLoading] = useState(false);
  const [brandError, setBrandError] = useState('');
  const [brandSuccess, setBrandSuccess] = useState('');

  const [modelForm, setModelForm] = useState({
    brand_id: '',
    model_name: '',
    warranty_months: '',
  });
  const [modelLoading, setModelLoading] = useState(false);
  const [modelError, setModelError] = useState('');
  const [modelSuccess, setModelSuccess] = useState('');

  useEffect(() => {
    loadBrands();
    loadModels();
  }, []);

  const loadBrands = async () => {
    try {
      const res = await brandAPI.getAll();
      if (res.data.success) setBrands(res.data.data || []);
    } catch {}
  };

  const loadModels = async () => {
    try {
      const res = await modelAPI.getAll();
      if (res.data.success) setModels(res.data.data || []);
    } catch {}
  };

  const handleBrandSubmit = async (e) => {
    e.preventDefault();
    setBrandError('');
    setBrandSuccess('');
    setBrandLoading(true);
    try {
      const res = await brandAPI.create({ name: brandName });
      if (res.data.success) {
        setBrandSuccess('Brand created');
        setBrandName('');
        loadBrands();
      } else {
        setBrandError(res.data.message || 'Failed to create brand');
      }
    } catch (err) {
      setBrandError(err.response?.data?.message || 'Failed to create brand');
    } finally {
      setBrandLoading(false);
    }
  };

  const handleModelSubmit = async (e) => {
    e.preventDefault();
    setModelError('');
    setModelSuccess('');
    setModelLoading(true);
    try {
      const res = await modelAPI.create({
        brand_id: parseInt(modelForm.brand_id),
        model_name: modelForm.model_name,
        warranty_months: modelForm.warranty_months
          ? parseInt(modelForm.warranty_months)
          : null,
      });
      if (res.data.success) {
        setModelSuccess('Model created');
        setModelForm({ brand_id: '', model_name: '', warranty_months: '' });
        loadModels();
      } else {
        setModelError(res.data.message || 'Failed to create model');
      }
    } catch (err) {
      setModelError(err.response?.data?.message || 'Failed to create model');
    } finally {
      setModelLoading(false);
    }
  };

  const brandsMap = Object.fromEntries(brands.map((b) => [b.id, b.name]));

  return (
    <AppLayout>
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Brands column */}
        <div className="space-y-5">
          <section className="bg-white rounded-xl shadow-sm p-5 border border-slate-100">
            <h2 className="text-sm font-semibold text-slate-800 mb-1">Add Brand</h2>
            <p className="text-xs text-slate-500 mb-4">
              Add a new battery brand.
            </p>

            {brandError && (
              <div className="mb-3 rounded-md bg-red-50 border border-red-200 px-3 py-2 text-xs text-red-700">
                {brandError}
              </div>
            )}
            {brandSuccess && (
              <div className="mb-3 rounded-md bg-emerald-50 border border-emerald-200 px-3 py-2 text-xs text-emerald-700">
                {brandSuccess}
              </div>
            )}

            <form onSubmit={handleBrandSubmit} className="flex gap-2">
              <input
                value={brandName}
                onChange={(e) => setBrandName(e.target.value)}
                required
                className="flex-1 rounded-md border border-slate-300 px-3 py-2 text-xs focus:outline-none focus:ring-2 focus:ring-blue-500"
                placeholder="Brand name (e.g. Exide)"
              />
              <button
                type="submit"
                disabled={brandLoading}
                className="rounded-md bg-blue-600 px-4 py-2 text-xs font-medium text-white hover:bg-blue-700 disabled:opacity-60"
              >
                {brandLoading ? 'Saving...' : 'Add'}
              </button>
            </form>
          </section>

          <section className="bg-white rounded-xl shadow-sm p-5 border border-slate-100">
            <div className="flex items-center justify-between mb-3">
              <h2 className="text-sm font-semibold text-slate-800">Brands</h2>
              <span className="text-xs text-slate-400">{brands.length} total</span>
            </div>
            {brands.length === 0 ? (
              <p className="text-xs text-slate-500">No brands yet. Add one above.</p>
            ) : (
              <div className="space-y-1.5">
                {brands.map((b) => (
                  <div
                    key={b.id}
                    className="flex items-center justify-between rounded-lg border border-slate-100 px-3 py-2 bg-slate-50"
                  >
                    <span className="text-xs font-medium text-slate-700">
                      {b.name}
                    </span>
                    <span className="text-xs text-slate-400">#{b.id}</span>
                  </div>
                ))}
              </div>
            )}
          </section>
        </div>

        {/* Models column */}
        <div className="space-y-5">
          <section className="bg-white rounded-xl shadow-sm p-5 border border-slate-100">
            <h2 className="text-sm font-semibold text-slate-800 mb-1">Add Model</h2>
            <p className="text-xs text-slate-500 mb-4">
              Add a new battery model under a brand.
            </p>

            {modelError && (
              <div className="mb-3 rounded-md bg-red-50 border border-red-200 px-3 py-2 text-xs text-red-700">
                {modelError}
              </div>
            )}
            {modelSuccess && (
              <div className="mb-3 rounded-md bg-emerald-50 border border-emerald-200 px-3 py-2 text-xs text-emerald-700">
                {modelSuccess}
              </div>
            )}

            <form onSubmit={handleModelSubmit} className="space-y-3">
              <div>
                <label className="block text-xs font-medium text-slate-700 mb-1">
                  Brand
                </label>
                <select
                  value={modelForm.brand_id}
                  onChange={(e) =>
                    setModelForm((prev) => ({ ...prev, brand_id: e.target.value }))
                  }
                  required
                  className="w-full rounded-md border border-slate-300 px-3 py-2 text-xs focus:outline-none focus:ring-2 focus:ring-blue-500"
                >
                  <option value="">Select brand</option>
                  {brands.map((b) => (
                    <option key={b.id} value={b.id}>
                      {b.name}
                    </option>
                  ))}
                </select>
              </div>

              <div>
                <label className="block text-xs font-medium text-slate-700 mb-1">
                  Model Name
                </label>
                <input
                  value={modelForm.model_name}
                  onChange={(e) =>
                    setModelForm((prev) => ({
                      ...prev,
                      model_name: e.target.value,
                    }))
                  }
                  required
                  className="w-full rounded-md border border-slate-300 px-3 py-2 text-xs focus:outline-none focus:ring-2 focus:ring-blue-500"
                  placeholder="e.g. FEW0-TZ0"
                />
              </div>

              <div>
                <label className="block text-xs font-medium text-slate-700 mb-1">
                  Warranty (months, optional)
                </label>
                <input
                  type="number"
                  value={modelForm.warranty_months}
                  onChange={(e) =>
                    setModelForm((prev) => ({
                      ...prev,
                      warranty_months: e.target.value,
                    }))
                  }
                  min="1"
                  className="w-full rounded-md border border-slate-300 px-3 py-2 text-xs focus:outline-none focus:ring-2 focus:ring-blue-500"
                  placeholder="e.g. 24"
                />
              </div>

              <button
                type="submit"
                disabled={modelLoading}
                className="w-full inline-flex justify-center rounded-md bg-blue-600 px-3 py-2 text-xs font-medium text-white shadow-sm hover:bg-blue-700 disabled:opacity-60"
              >
                {modelLoading ? 'Saving...' : 'Add Model'}
              </button>
            </form>
          </section>

          <section className="bg-white rounded-xl shadow-sm p-5 border border-slate-100">
            <div className="flex items-center justify-between mb-3">
              <h2 className="text-sm font-semibold text-slate-800">Models</h2>
              <span className="text-xs text-slate-400">{models.length} total</span>
            </div>
            {models.length === 0 ? (
              <p className="text-xs text-slate-500">No models yet. Add one above.</p>
            ) : (
              <div className="overflow-x-auto">
                <table className="min-w-full text-xs border border-slate-100 rounded-lg overflow-hidden">
                  <thead className="bg-slate-50">
                    <tr>
                      <th className="px-3 py-2 text-left font-medium text-slate-600 border-b border-slate-100">
                        Brand
                      </th>
                      <th className="px-3 py-2 text-left font-medium text-slate-600 border-b border-slate-100">
                        Model
                      </th>
                      <th className="px-3 py-2 text-left font-medium text-slate-600 border-b border-slate-100">
                        Warranty
                      </th>
                    </tr>
                  </thead>
                  <tbody>
                    {models.map((m) => (
                      <tr key={m.id} className="hover:bg-slate-50">
                        <td className="px-3 py-2 border-b border-slate-100">
                          {brandsMap[m.brand_id] || '-'}
                        </td>
                        <td className="px-3 py-2 border-b border-slate-100 font-medium">
                          {m.model_name}
                        </td>
                        <td className="px-3 py-2 border-b border-slate-100 text-slate-500">
                          {m.warranty_months ? `${m.warranty_months} mo` : '-'}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </section>
        </div>
      </div>
    </AppLayout>
  );
};

export default BrandsPage;
