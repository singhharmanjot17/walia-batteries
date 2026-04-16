'use client';

import React, { useEffect, useState } from 'react';
import AppLayout from '../AppLayout';
import { batteryAPI, brandAPI, modelAPI, customerAPI } from '../../services/api';

const BatteriesPage = () => {
  const [customerPhone, setCustomerPhone] = useState('');
  const [selectedCustomer, setSelectedCustomer] = useState(null);
  const [customerSearchLoading, setCustomerSearchLoading] = useState(false);
  const [customerSearchError, setCustomerSearchError] = useState('');

  const [brands, setBrands] = useState([]);
  const [allModels, setAllModels] = useState([]);
  const [filteredModels, setFilteredModels] = useState([]);

  const [form, setForm] = useState({
    brand_id: '',
    model_id: '',
    serial_number: '',
    date_of_sale: '',
    invoice_number: '',
  });
  const [formLoading, setFormLoading] = useState(false);
  const [formError, setFormError] = useState('');
  const [formSuccess, setFormSuccess] = useState('');

  const [batteries, setBatteries] = useState([]);
  const [listMode, setListMode] = useState('all');
  const [listLoading, setListLoading] = useState(false);

  useEffect(() => {
    loadBrands();
    loadAllModels();
    loadAllBatteries();
  }, []);

  const loadBrands = async () => {
    try {
      const res = await brandAPI.getAll(1);
      if (res.data.success) setBrands(res.data.data || []);
    } catch {}
  };

  const loadAllModels = async () => {
    try {
      const res = await modelAPI.getAll(null, 1);
      if (res.data.success) setAllModels(res.data.data || []);
    } catch {}
  };

  const loadAllBatteries = async () => {
    setListLoading(true);
    setListMode('all');
    try {
      const res = await batteryAPI.getAll(1, 50);
      if (res.data.success) setBatteries(res.data.data.batteries || []);
    } catch {}
    finally { setListLoading(false); }
  };

  const loadCustomerBatteries = async (customer) => {
    setListLoading(true);
    setListMode('customer');
    try {
      const res = await batteryAPI.getByCustomer(customer.id);
      if (res.data.success) {
        const items = res.data.data || [];
        setBatteries(
          items.map((item) => ({
            ...item.battery,
            brand_name: item.brand?.name,
            model_name: item.model?.model_name,
            warranty_months: item.model?.warranty_months,
          }))
        );
      }
    } catch {}
    finally { setListLoading(false); }
  };

  const handleCustomerSearch = async (e) => {
    e.preventDefault();
    if (!customerPhone.trim()) return;
    setCustomerSearchError('');
    setSelectedCustomer(null);
    setCustomerSearchLoading(true);
    try {
      const res = await customerAPI.searchByPhone(customerPhone.trim());
      if (res.data.success) {
        setSelectedCustomer(res.data.data);
      } else {
        setCustomerSearchError('Customer not found');
      }
    } catch {
      setCustomerSearchError('Customer not found');
    } finally {
      setCustomerSearchLoading(false);
    }
  };

  const handleBrandChange = (e) => {
    const brandId = e.target.value;
    setForm((prev) => ({ ...prev, brand_id: brandId, model_id: '' }));
    setFilteredModels(
      brandId
        ? allModels.filter((m) => String(m.brand_id) === String(brandId))
        : []
    );
  };

  const handleFormChange = (e) => {
    const { name, value } = e.target;
    setForm((prev) => ({ ...prev, [name]: value }));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!selectedCustomer) {
      setFormError('Search and select a customer first');
      return;
    }
    setFormError('');
    setFormSuccess('');
    setFormLoading(true);
    try {
      const res = await batteryAPI.create({
        customer_id: selectedCustomer.id,
        brand_id: parseInt(form.brand_id),
        model_id: parseInt(form.model_id),
        serial_number: form.serial_number,
        date_of_sale: form.date_of_sale,
        invoice_number: form.invoice_number || null,
      });
      if (res.data.success) {
        setFormSuccess('Battery added successfully');
        setForm({
          brand_id: '',
          model_id: '',
          serial_number: '',
          date_of_sale: '',
          invoice_number: '',
        });
        setFilteredModels([]);
        loadAllBatteries();
      } else {
        setFormError(res.data.message || 'Failed to add battery');
      }
    } catch (err) {
      setFormError(err.response?.data?.message || 'Failed to add battery');
    } finally {
      setFormLoading(false);
    }
  };

  const brandsMap = Object.fromEntries(brands.map((b) => [b.id, b.name]));
  const modelsMap = Object.fromEntries(allModels.map((m) => [m.id, m.model_name]));

  return (
    <AppLayout>
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Left: Add Battery form */}
        <section className="lg:col-span-1 bg-white rounded-xl shadow-sm p-5 border border-slate-100">
          <h2 className="text-sm font-semibold text-slate-800 mb-1">Add Battery</h2>
          <p className="text-xs text-slate-500 mb-4">
            Register a battery sold to a customer.
          </p>

          {/* Customer search */}
          <div className="mb-4">
            <label className="block text-xs font-medium text-slate-700 mb-1">
              Find Customer
            </label>
            <form onSubmit={handleCustomerSearch} className="flex gap-2">
              <input
                value={customerPhone}
                onChange={(e) => setCustomerPhone(e.target.value)}
                className="flex-1 rounded-md border border-slate-300 px-3 py-2 text-xs focus:outline-none focus:ring-2 focus:ring-blue-500"
                placeholder="Phone number"
              />
              <button
                type="submit"
                disabled={customerSearchLoading}
                className="rounded-md bg-slate-800 px-3 py-2 text-xs font-medium text-white hover:bg-slate-900 disabled:opacity-60"
              >
                Find
              </button>
            </form>
            {customerSearchError && (
              <p className="mt-1 text-xs text-red-600">{customerSearchError}</p>
            )}
            {selectedCustomer && (
              <div className="mt-2 flex items-center justify-between rounded-md bg-emerald-50 border border-emerald-200 px-3 py-2">
                <div>
                  <p className="text-xs font-semibold text-emerald-800">
                    {selectedCustomer.name}
                  </p>
                  <p className="text-xs text-emerald-600">{selectedCustomer.phone}</p>
                </div>
                <button
                  type="button"
                  onClick={() => loadCustomerBatteries(selectedCustomer)}
                  className="text-xs text-emerald-700 underline"
                >
                  View batteries
                </button>
              </div>
            )}
          </div>

          {formError && (
            <div className="mb-3 rounded-md bg-red-50 border border-red-200 px-3 py-2 text-xs text-red-700">
              {formError}
            </div>
          )}
          {formSuccess && (
            <div className="mb-3 rounded-md bg-emerald-50 border border-emerald-200 px-3 py-2 text-xs text-emerald-700">
              {formSuccess}
            </div>
          )}

          <form onSubmit={handleSubmit} className="space-y-3">
            <div>
              <label className="block text-xs font-medium text-slate-700 mb-1">
                Brand
              </label>
              <select
                value={form.brand_id}
                onChange={handleBrandChange}
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
                Model
              </label>
              <select
                name="model_id"
                value={form.model_id}
                onChange={handleFormChange}
                required
                disabled={!form.brand_id}
                className="w-full rounded-md border border-slate-300 px-3 py-2 text-xs focus:outline-none focus:ring-2 focus:ring-blue-500 disabled:bg-slate-50 disabled:text-slate-400"
              >
                <option value="">Select model</option>
                {filteredModels.map((m) => (
                  <option key={m.id} value={m.id}>
                    {m.model_name}
                    {m.warranty_months ? ` (${m.warranty_months}mo)` : ''}
                  </option>
                ))}
              </select>
            </div>

            <div>
              <label className="block text-xs font-medium text-slate-700 mb-1">
                Serial Number
              </label>
              <input
                name="serial_number"
                value={form.serial_number}
                onChange={handleFormChange}
                required
                className="w-full rounded-md border border-slate-300 px-3 py-2 text-xs focus:outline-none focus:ring-2 focus:ring-blue-500"
                placeholder="Battery serial number"
              />
            </div>

            <div>
              <label className="block text-xs font-medium text-slate-700 mb-1">
                Date of Sale
              </label>
              <input
                type="date"
                name="date_of_sale"
                value={form.date_of_sale}
                onChange={handleFormChange}
                required
                className="w-full rounded-md border border-slate-300 px-3 py-2 text-xs focus:outline-none focus:ring-2 focus:ring-blue-500"
              />
            </div>

            <div>
              <label className="block text-xs font-medium text-slate-700 mb-1">
                Invoice # (optional)
              </label>
              <input
                name="invoice_number"
                value={form.invoice_number}
                onChange={handleFormChange}
                className="w-full rounded-md border border-slate-300 px-3 py-2 text-xs focus:outline-none focus:ring-2 focus:ring-blue-500"
                placeholder="Invoice number"
              />
            </div>

            <button
              type="submit"
              disabled={formLoading}
              className="w-full inline-flex justify-center rounded-md bg-blue-600 px-3 py-2 text-xs font-medium text-white shadow-sm hover:bg-blue-700 disabled:opacity-60"
            >
              {formLoading ? 'Saving...' : 'Add Battery'}
            </button>
          </form>
        </section>

        {/* Right: Batteries list */}
        <section className="lg:col-span-2 bg-white rounded-xl shadow-sm p-5 border border-slate-100">
          <div className="flex items-center justify-between mb-3">
            <div>
              <h2 className="text-sm font-semibold text-slate-800">Batteries</h2>
              <p className="text-xs text-slate-500">
                {listMode === 'customer' && selectedCustomer
                  ? `Filtered: ${selectedCustomer.name}`
                  : `All batteries (${batteries.length})`}
              </p>
            </div>
            {listMode === 'customer' && (
              <button
                onClick={loadAllBatteries}
                className="text-xs font-medium text-slate-600 bg-slate-100 px-3 py-1.5 rounded-md hover:bg-slate-200"
              >
                Show All
              </button>
            )}
          </div>

          {listLoading ? (
            <p className="text-xs text-slate-500">Loading...</p>
          ) : batteries.length === 0 ? (
            <p className="text-xs text-slate-500">No batteries found.</p>
          ) : (
            <div className="overflow-x-auto">
              <table className="min-w-full text-xs border border-slate-100 rounded-lg overflow-hidden">
                <thead className="bg-slate-50">
                  <tr>
                    {listMode === 'all' && (
                      <th className="px-3 py-2 text-left font-medium text-slate-600 border-b border-slate-100">
                        Customer
                      </th>
                    )}
                    <th className="px-3 py-2 text-left font-medium text-slate-600 border-b border-slate-100">
                      Brand
                    </th>
                    <th className="px-3 py-2 text-left font-medium text-slate-600 border-b border-slate-100">
                      Model
                    </th>
                    <th className="px-3 py-2 text-left font-medium text-slate-600 border-b border-slate-100">
                      Serial #
                    </th>
                    <th className="px-3 py-2 text-left font-medium text-slate-600 border-b border-slate-100">
                      Sale Date
                    </th>
                    <th className="px-3 py-2 text-left font-medium text-slate-600 border-b border-slate-100">
                      Invoice
                    </th>
                  </tr>
                </thead>
                <tbody>
                  {batteries.map((b) => (
                    <tr key={b.id} className="hover:bg-slate-50">
                      {listMode === 'all' && (
                        <td className="px-3 py-2 border-b border-slate-100 text-slate-500">
                          #{b.customer_id}
                        </td>
                      )}
                      <td className="px-3 py-2 border-b border-slate-100">
                        {b.brand_name || brandsMap[b.brand_id] || '-'}
                      </td>
                      <td className="px-3 py-2 border-b border-slate-100">
                        {b.model_name || modelsMap[b.model_id] || '-'}
                      </td>
                      <td className="px-3 py-2 border-b border-slate-100 font-mono">
                        {b.serial_number}
                      </td>
                      <td className="px-3 py-2 border-b border-slate-100">
                        {b.date_of_sale}
                      </td>
                      <td className="px-3 py-2 border-b border-slate-100">
                        {b.invoice_number || '-'}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </section>
      </div>
    </AppLayout>
  );
};

export default BatteriesPage;
