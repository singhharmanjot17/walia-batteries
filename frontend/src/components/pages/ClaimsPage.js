'use client';

import React, { useEffect, useState } from 'react';
import AppLayout from '../AppLayout';
import { claimAPI, customerAPI, batteryAPI, modelAPI } from '../../services/api';

const STATUS_COLORS = {
  pending: 'bg-amber-50 text-amber-700 border-amber-200',
  resolved: 'bg-emerald-50 text-emerald-700 border-emerald-200',
  rejected: 'bg-red-50 text-red-700 border-red-200',
};

const STOCK_LABELS = {
  new: 'New',
  foc: 'FOC',
  not_in_stock: 'Not in Stock',
};

const ClaimsPage = () => {
  const [customerPhone, setCustomerPhone] = useState('');
  const [selectedCustomer, setSelectedCustomer] = useState(null);
  const [customerBatteries, setCustomerBatteries] = useState([]);
  const [customerSearchLoading, setCustomerSearchLoading] = useState(false);
  const [customerSearchError, setCustomerSearchError] = useState('');

  const [models, setModels] = useState([]);

  const [form, setForm] = useState({
    faulty_battery_id: '',
    co_number: '',
    actual_dos: '',
    stock_status: 'new',
    new_battery_model_id: '',
    new_battery_serial_number: '',
    remarks: '',
  });
  const [formLoading, setFormLoading] = useState(false);
  const [formError, setFormError] = useState('');
  const [formSuccess, setFormSuccess] = useState('');

  const [claims, setClaims] = useState([]);
  const [listLoading, setListLoading] = useState(false);
  const [statusFilter, setStatusFilter] = useState('');

  useEffect(() => {
    loadModels();
    loadClaims('');
  }, []);

  const loadModels = async () => {
    try {
      const res = await modelAPI.getAll(null, 1);
      if (res.data.success) setModels(res.data.data || []);
    } catch {}
  };

  const loadClaims = async (status) => {
    setListLoading(true);
    try {
      const res = await claimAPI.getAll(1, 50, status || undefined);
      if (res.data.success) setClaims(res.data.data.claims || []);
    } catch {}
    finally { setListLoading(false); }
  };

  const handleCustomerSearch = async (e) => {
    e.preventDefault();
    if (!customerPhone.trim()) return;
    setCustomerSearchError('');
    setSelectedCustomer(null);
    setCustomerBatteries([]);
    setCustomerSearchLoading(true);
    try {
      const res = await customerAPI.searchByPhone(customerPhone.trim());
      if (res.data.success) {
        const cust = res.data.data;
        setSelectedCustomer(cust);
        const batRes = await batteryAPI.getByCustomer(cust.id);
        if (batRes.data.success) {
          const items = batRes.data.data || [];
          setCustomerBatteries(
            items.map((item) => ({
              ...item.battery,
              brand_name: item.brand?.name,
              model_name: item.model?.model_name,
            }))
          );
        }
      } else {
        setCustomerSearchError('Customer not found');
      }
    } catch {
      setCustomerSearchError('Customer not found');
    } finally {
      setCustomerSearchLoading(false);
    }
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
      const res = await claimAPI.create({
        customer_id: selectedCustomer.id,
        faulty_battery_id: parseInt(form.faulty_battery_id),
        co_number: form.co_number || null,
        actual_dos: form.actual_dos || null,
        stock_status: form.stock_status,
        new_battery_model_id: form.new_battery_model_id
          ? parseInt(form.new_battery_model_id)
          : null,
        new_battery_serial_number: form.new_battery_serial_number || null,
        remarks: form.remarks || null,
      });
      if (res.data.success) {
        setFormSuccess(`Claim #${res.data.data.claim_number} created successfully`);
        setForm({
          faulty_battery_id: '',
          co_number: '',
          actual_dos: '',
          stock_status: 'new',
          new_battery_model_id: '',
          new_battery_serial_number: '',
          remarks: '',
        });
        loadClaims(statusFilter);
      } else {
        setFormError(res.data.message || 'Failed to create claim');
      }
    } catch (err) {
      setFormError(err.response?.data?.message || 'Failed to create claim');
    } finally {
      setFormLoading(false);
    }
  };

  const handleFilterChange = (status) => {
    setStatusFilter(status);
    loadClaims(status);
  };

  return (
    <AppLayout>
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Left: Create Claim */}
        <section className="lg:col-span-1 bg-white rounded-xl shadow-sm p-5 border border-slate-100">
          <h2 className="text-sm font-semibold text-slate-800 mb-1">
            New Warranty Claim
          </h2>
          <p className="text-xs text-slate-500 mb-4">
            File a claim for a faulty battery.
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
              <div className="mt-2 rounded-md bg-emerald-50 border border-emerald-200 px-3 py-2 text-xs text-emerald-800">
                <p className="font-semibold">{selectedCustomer.name}</p>
                <p className="text-emerald-600">{selectedCustomer.phone}</p>
                <p className="text-emerald-500 mt-0.5">
                  {customerBatteries.length} battery
                  {customerBatteries.length !== 1 ? 'ies' : 'y'} on record
                </p>
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
                Faulty Battery
              </label>
              <select
                name="faulty_battery_id"
                value={form.faulty_battery_id}
                onChange={handleFormChange}
                required
                disabled={customerBatteries.length === 0}
                className="w-full rounded-md border border-slate-300 px-3 py-2 text-xs focus:outline-none focus:ring-2 focus:ring-blue-500 disabled:bg-slate-50 disabled:text-slate-400"
              >
                <option value="">
                  {selectedCustomer
                    ? customerBatteries.length === 0
                      ? 'No batteries found'
                      : 'Select battery'
                    : 'Find customer first'}
                </option>
                {customerBatteries.map((b) => (
                  <option key={b.id} value={b.id}>
                    {b.brand_name} {b.model_name} — {b.serial_number}
                  </option>
                ))}
              </select>
            </div>

            <div>
              <label className="block text-xs font-medium text-slate-700 mb-1">
                CO Number (optional)
              </label>
              <input
                name="co_number"
                value={form.co_number}
                onChange={handleFormChange}
                className="w-full rounded-md border border-slate-300 px-3 py-2 text-xs focus:outline-none focus:ring-2 focus:ring-blue-500"
                placeholder="CO number"
              />
            </div>

            <div>
              <label className="block text-xs font-medium text-slate-700 mb-1">
                Actual Date of Sale (optional)
              </label>
              <input
                type="date"
                name="actual_dos"
                value={form.actual_dos}
                onChange={handleFormChange}
                className="w-full rounded-md border border-slate-300 px-3 py-2 text-xs focus:outline-none focus:ring-2 focus:ring-blue-500"
              />
            </div>

            <div>
              <label className="block text-xs font-medium text-slate-700 mb-1">
                Stock Status
              </label>
              <select
                name="stock_status"
                value={form.stock_status}
                onChange={handleFormChange}
                required
                className="w-full rounded-md border border-slate-300 px-3 py-2 text-xs focus:outline-none focus:ring-2 focus:ring-blue-500"
              >
                <option value="new">New</option>
                <option value="foc">FOC</option>
                <option value="not_in_stock">Not in Stock</option>
              </select>
            </div>

            {form.stock_status !== 'not_in_stock' && (
              <>
                <div>
                  <label className="block text-xs font-medium text-slate-700 mb-1">
                    New Battery Model (optional)
                  </label>
                  <select
                    name="new_battery_model_id"
                    value={form.new_battery_model_id}
                    onChange={handleFormChange}
                    className="w-full rounded-md border border-slate-300 px-3 py-2 text-xs focus:outline-none focus:ring-2 focus:ring-blue-500"
                  >
                    <option value="">Select model</option>
                    {models.map((m) => (
                      <option key={m.id} value={m.id}>
                        {m.model_name}
                        {m.warranty_months ? ` (${m.warranty_months}mo)` : ''}
                      </option>
                    ))}
                  </select>
                </div>

                <div>
                  <label className="block text-xs font-medium text-slate-700 mb-1">
                    New Battery Serial # (optional)
                  </label>
                  <input
                    name="new_battery_serial_number"
                    value={form.new_battery_serial_number}
                    onChange={handleFormChange}
                    className="w-full rounded-md border border-slate-300 px-3 py-2 text-xs focus:outline-none focus:ring-2 focus:ring-blue-500"
                    placeholder="New serial number"
                  />
                </div>
              </>
            )}

            <div>
              <label className="block text-xs font-medium text-slate-700 mb-1">
                Remarks (optional)
              </label>
              <textarea
                name="remarks"
                value={form.remarks}
                onChange={handleFormChange}
                rows={2}
                className="w-full rounded-md border border-slate-300 px-3 py-2 text-xs focus:outline-none focus:ring-2 focus:ring-blue-500 resize-none"
                placeholder="Additional remarks..."
              />
            </div>

            <button
              type="submit"
              disabled={formLoading}
              className="w-full inline-flex justify-center rounded-md bg-blue-600 px-3 py-2 text-xs font-medium text-white shadow-sm hover:bg-blue-700 disabled:opacity-60"
            >
              {formLoading ? 'Filing Claim...' : 'File Claim'}
            </button>
          </form>
        </section>

        {/* Right: Claims list */}
        <section className="lg:col-span-2 bg-white rounded-xl shadow-sm p-5 border border-slate-100">
          <div className="flex items-center justify-between mb-3">
            <h2 className="text-sm font-semibold text-slate-800">
              Claims ({claims.length})
            </h2>
            <div className="flex gap-1">
              {['', 'pending', 'resolved', 'rejected'].map((s) => (
                <button
                  key={s}
                  onClick={() => handleFilterChange(s)}
                  className={`text-xs font-medium px-2.5 py-1 rounded-md border ${
                    statusFilter === s
                      ? 'bg-blue-600 text-white border-blue-600'
                      : 'text-slate-600 border-slate-200 hover:bg-slate-50'
                  }`}
                >
                  {s === ''
                    ? 'All'
                    : s.charAt(0).toUpperCase() + s.slice(1)}
                </button>
              ))}
            </div>
          </div>

          {listLoading ? (
            <p className="text-xs text-slate-500">Loading...</p>
          ) : claims.length === 0 ? (
            <p className="text-xs text-slate-500">No claims found.</p>
          ) : (
            <div className="overflow-x-auto">
              <table className="min-w-full text-xs border border-slate-100 rounded-lg overflow-hidden">
                <thead className="bg-slate-50">
                  <tr>
                    <th className="px-3 py-2 text-left font-medium text-slate-600 border-b border-slate-100">
                      Claim #
                    </th>
                    <th className="px-3 py-2 text-left font-medium text-slate-600 border-b border-slate-100">
                      Customer
                    </th>
                    <th className="px-3 py-2 text-left font-medium text-slate-600 border-b border-slate-100">
                      Faulty Battery
                    </th>
                    <th className="px-3 py-2 text-left font-medium text-slate-600 border-b border-slate-100">
                      Stock
                    </th>
                    <th className="px-3 py-2 text-left font-medium text-slate-600 border-b border-slate-100">
                      Status
                    </th>
                    <th className="px-3 py-2 text-left font-medium text-slate-600 border-b border-slate-100">
                      Date
                    </th>
                  </tr>
                </thead>
                <tbody>
                  {claims.map((item) => {
                    const c = item.claim;
                    const statusCls =
                      STATUS_COLORS[c.status] ||
                      'bg-slate-50 text-slate-600 border-slate-200';
                    return (
                      <tr key={c.id} className="hover:bg-slate-50">
                        <td className="px-3 py-2 border-b border-slate-100 font-mono font-medium">
                          #{c.claim_number}
                        </td>
                        <td className="px-3 py-2 border-b border-slate-100">
                          <p className="font-medium">{item.customer_name}</p>
                          <p className="text-slate-400">{item.customer_phone}</p>
                        </td>
                        <td className="px-3 py-2 border-b border-slate-100 font-mono text-slate-500">
                          {item.battery_serial || '-'}
                        </td>
                        <td className="px-3 py-2 border-b border-slate-100">
                          {STOCK_LABELS[c.stock_status] || c.stock_status}
                        </td>
                        <td className="px-3 py-2 border-b border-slate-100">
                          <span
                            className={`inline-flex items-center rounded-full border px-2 py-0.5 text-xs font-medium capitalize ${statusCls}`}
                          >
                            {c.status}
                          </span>
                        </td>
                        <td className="px-3 py-2 border-b border-slate-100 text-slate-500">
                          {new Date(c.created_at).toLocaleDateString()}
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          )}
        </section>
      </div>
    </AppLayout>
  );
};

export default ClaimsPage;
