'use client';

import { useState, useEffect, useCallback } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { useAuth } from '@/lib/useAuth';
import Container from '@/components/ui/Container';
import { fetchAllTickets, updateTicketStatus, SupportTicket } from '@/lib/api';

// ─── Parse ticket message into structured fields ──────────────
function parseEnquiryMessage(msg: string): Record<string, string> {
  const fields: Record<string, string> = {};
  const lines = msg.split('\n').filter(Boolean);
  for (const line of lines) {
    const idx = line.indexOf(':');
    if (idx > 0) {
      const key = line.slice(0, idx).trim();
      const val = line.slice(idx + 1).trim();
      if (key && val) fields[key] = val;
    }
  }
  return fields;
}

const STATUS_COLORS: Record<string, string> = {
  open: 'bg-blue-100 text-blue-800 dark:bg-blue-900/40 dark:text-blue-300',
  in_progress: 'bg-yellow-100 text-yellow-800 dark:bg-yellow-900/40 dark:text-yellow-300',
  waiting_for_user: 'bg-purple-100 text-purple-800 dark:bg-purple-900/40 dark:text-purple-300',
  resolved: 'bg-green-100 text-green-800 dark:bg-green-900/40 dark:text-green-300',
  closed: 'bg-gray-100 text-gray-700 dark:bg-gray-700 dark:text-gray-300',
};

const CATEGORY_BADGE: Record<string, string> = {
  sponsor: 'bg-amber-100 text-amber-800 dark:bg-amber-900/40 dark:text-amber-300',
  yajaman: 'bg-orange-100 text-orange-800 dark:bg-orange-900/40 dark:text-orange-300',
  shivirarthi: 'bg-teal-100 text-teal-800 dark:bg-teal-900/40 dark:text-teal-300',
  'business-stall': 'bg-indigo-100 text-indigo-800 dark:bg-indigo-900/40 dark:text-indigo-300',
  'food-stall': 'bg-rose-100 text-rose-800 dark:bg-rose-900/40 dark:text-rose-300',
};

// ─── Detail Drawer ─────────────────────────────────────────────
function DetailDrawer({
  ticket,
  fields,
  onClose,
  onStatusChange,
}: {
  ticket: SupportTicket;
  fields: Record<string, string>;
  onClose: () => void;
  onStatusChange: (id: string, s: string) => void;
}) {
  return (
    <div className="fixed inset-0 z-50 flex">
      {/* Backdrop */}
      <div className="flex-1 bg-black/40" onClick={onClose} />
      {/* Panel */}
      <div className="w-full max-w-md bg-white dark:bg-gray-900 h-full shadow-2xl overflow-y-auto flex flex-col">
        {/* Header */}
        <div className="px-6 py-5 border-b border-gray-200 dark:border-gray-700 flex items-start justify-between gap-3 sticky top-0 bg-white dark:bg-gray-900 z-10">
          <div>
            <p className="text-xs font-mono text-gray-400 mb-1">{ticket.ticketNumber}</p>
            <h2 className="text-base font-bold text-gray-900 dark:text-white leading-snug">
              {fields['Name'] || ticket.userName || '—'}
            </h2>
            {fields['Company'] && (
              <p className="text-sm text-gray-500 dark:text-gray-400">{fields['Company']}</p>
            )}
          </div>
          <button
            onClick={onClose}
            className="text-gray-400 hover:text-gray-600 dark:hover:text-gray-200 mt-1"
          >
            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
            </svg>
          </button>
        </div>

        {/* Body */}
        <div className="px-6 py-5 space-y-5 flex-1">
          {/* Status control */}
          <div className="flex items-center gap-3">
            <label className="text-xs font-semibold text-gray-500 dark:text-gray-400 w-20">Status</label>
            <select
              value={ticket.status}
              onChange={(e) => onStatusChange(ticket.id, e.target.value)}
              className={`text-xs font-semibold px-3 py-1.5 rounded-full border-0 cursor-pointer ${STATUS_COLORS[ticket.status] || ''}`}
            >
              <option value="open">Open</option>
              <option value="in_progress">In Progress</option>
              <option value="waiting_for_user">Waiting for User</option>
              <option value="resolved">Resolved</option>
              <option value="closed">Closed</option>
            </select>
          </div>

          {/* Contact */}
          <div className="rounded-xl bg-gray-50 dark:bg-gray-800 p-4 space-y-3">
            <p className="text-xs font-semibold uppercase tracking-wider text-gray-400">Contact</p>
            {[
              { label: 'Name', val: fields['Name'] },
              { label: 'Mobile', val: fields['Mobile'], href: fields['Mobile'] ? `tel:${fields['Mobile']}` : undefined },
              { label: 'Email', val: fields['Email'], href: fields['Email'] ? `mailto:${fields['Email']}` : undefined },
              { label: 'Company', val: fields['Company'] },
            ].map(({ label, val, href }) =>
              val ? (
                <div key={label} className="flex gap-3">
                  <span className="text-xs text-gray-400 w-16 shrink-0 pt-0.5">{label}</span>
                  {href ? (
                    <a href={href} className="text-sm font-medium text-orange-600 hover:underline break-all">{val}</a>
                  ) : (
                    <span className="text-sm font-medium text-gray-900 dark:text-white">{val}</span>
                  )}
                </div>
              ) : null
            )}
          </div>

          {/* Booking */}
          <div className="rounded-xl bg-gray-50 dark:bg-gray-800 p-4 space-y-3">
            <p className="text-xs font-semibold uppercase tracking-wider text-gray-400">Booking Intent</p>
            {[
              { label: 'Category', val: fields['Category'] },
              { label: 'Tier', val: fields['Tier'] },
            ].map(({ label, val }) =>
              val ? (
                <div key={label} className="flex gap-3">
                  <span className="text-xs text-gray-400 w-16 shrink-0 pt-0.5">{label}</span>
                  <span className="text-sm font-semibold text-gray-900 dark:text-white">{val}</span>
                </div>
              ) : null
            )}
          </div>

          {/* Message / notes */}
          {fields['Message'] && (
            <div className="rounded-xl bg-gray-50 dark:bg-gray-800 p-4">
              <p className="text-xs font-semibold uppercase tracking-wider text-gray-400 mb-2">Additional Notes</p>
              <p className="text-sm text-gray-700 dark:text-gray-300 whitespace-pre-wrap">{fields['Message']}</p>
            </div>
          )}

          {/* Meta */}
          <div className="text-xs text-gray-400 space-y-1">
            <p>Submitted: {new Date(ticket.createdAt).toLocaleString('en-IN')}</p>
            <p>Ticket: {ticket.ticketNumber}</p>
          </div>
        </div>

        {/* Footer quick actions */}
        <div className="px-6 py-4 border-t border-gray-200 dark:border-gray-700 flex gap-3 sticky bottom-0 bg-white dark:bg-gray-900">
          {fields['Mobile'] && (
            <a
              href={`tel:${fields['Mobile']}`}
              className="flex-1 py-2.5 rounded-lg text-sm font-semibold text-center bg-green-600 hover:bg-green-700 text-white transition-colors"
            >
              📞 Call
            </a>
          )}
          {fields['Mobile'] && (
            <a
              href={`https://wa.me/91${fields['Mobile'].replace(/\D/g, '').replace(/^91/, '')}`}
              target="_blank"
              rel="noopener noreferrer"
              className="flex-1 py-2.5 rounded-lg text-sm font-semibold text-center bg-emerald-500 hover:bg-emerald-600 text-white transition-colors"
            >
              💬 WhatsApp
            </a>
          )}
          {fields['Email'] && (
            <a
              href={`mailto:${fields['Email']}`}
              className="flex-1 py-2.5 rounded-lg text-sm font-semibold text-center bg-blue-600 hover:bg-blue-700 text-white transition-colors"
            >
              ✉️ Email
            </a>
          )}
        </div>
      </div>
    </div>
  );
}

// ─── Main Page ─────────────────────────────────────────────────
export default function YagyaEnquiriesPage() {
  const router = useRouter();
  const { user, accessToken, isAuthenticated, isLoading } = useAuth();

  const [tickets, setTickets] = useState<SupportTicket[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [selected, setSelected] = useState<SupportTicket | null>(null);

  // Filters
  const [statusFilter, setStatusFilter] = useState('all');
  const [categoryFilter, setCategoryFilter] = useState('all');
  const [search, setSearch] = useState('');

  const isAdmin =
    user?.role === 'super_admin' || user?.role === 'admin' || user?.role === 'content_editor';

  const load = useCallback(async () => {
    if (!accessToken) return;
    setLoading(true);
    try {
      const all = await fetchAllTickets(accessToken).catch(() => []);
      const yagya = (Array.isArray(all) ? all : []).filter((t) => t.category === 'yagya');
      setTickets(yagya);
    } catch {
      setError('Failed to load enquiries');
    } finally {
      setLoading(false);
    }
  }, [accessToken]);

  useEffect(() => {
    if (!isLoading && !isAuthenticated) router.push('/login?redirect=/admin/yagya-enquiries');
    else if (!isLoading && isAuthenticated && !isAdmin) router.push('/dashboard');
  }, [isAuthenticated, isLoading, isAdmin, router]);

  useEffect(() => {
    if (isAuthenticated && isAdmin && accessToken) load();
  }, [isAuthenticated, isAdmin, accessToken, load]);

  const handleStatusChange = async (ticketId: string, newStatus: string) => {
    if (!accessToken) return;
    try {
      await updateTicketStatus(ticketId, newStatus, accessToken);
      setTickets((prev) =>
        prev.map((t) => (t.id === ticketId ? { ...t, status: newStatus as SupportTicket['status'] } : t))
      );
      if (selected?.id === ticketId) setSelected((s) => s ? { ...s, status: newStatus as SupportTicket['status'] } : s);
    } catch {
      setError('Failed to update status');
    }
  };

  // Extract parsed fields for each ticket
  const enriched = tickets.map((t) => ({ ticket: t, fields: parseEnquiryMessage(t.message) }));

  // Filter + search
  const filtered = enriched.filter(({ ticket, fields }) => {
    if (statusFilter !== 'all' && ticket.status !== statusFilter) return false;
    const cat = (fields['Category'] || '').toLowerCase();
    if (categoryFilter !== 'all' && cat !== categoryFilter) return false;
    if (search) {
      const q = search.toLowerCase();
      const haystack = [
        fields['Name'], fields['Mobile'], fields['Email'], fields['Company'],
        fields['Category'], fields['Tier'], ticket.ticketNumber,
      ].join(' ').toLowerCase();
      if (!haystack.includes(q)) return false;
    }
    return true;
  });

  // Stats
  const stats = {
    total: tickets.length,
    open: tickets.filter((t) => t.status === 'open').length,
    inProgress: tickets.filter((t) => t.status === 'in_progress').length,
    resolved: tickets.filter((t) => t.status === 'resolved' || t.status === 'closed').length,
  };

  // Category counts
  const catCounts = enriched.reduce<Record<string, number>>((acc, { fields }) => {
    const c = (fields['Category'] || 'unknown').toLowerCase();
    acc[c] = (acc[c] || 0) + 1;
    return acc;
  }, {});

  if (isLoading || loading) {
    return (
      <Container className="py-8">
        <div className="flex items-center justify-center min-h-[60vh]">
          <div className="animate-spin w-8 h-8 border-4 border-orange-500 border-t-transparent rounded-full" />
        </div>
      </Container>
    );
  }

  return (
    <div className="min-h-[70vh] py-8 bg-gradient-to-b from-amber-50/30 to-white dark:from-gray-900 dark:to-gray-800">
      <Container>
        {/* Header */}
        <div className="mb-8">
          <div className="flex items-center gap-2 mb-2">
            <Link href="/admin" className="text-sm text-orange-600 hover:text-orange-700">
              ← Admin
            </Link>
          </div>
          <h1 className="text-3xl font-bold text-gray-900 dark:text-white">Maha Yagya Enquiries</h1>
          <p className="mt-1 text-gray-600 dark:text-gray-400">
            All sponsor, yajaman, shivirarthi &amp; stall booking enquiries
          </p>
        </div>

        {error && (
          <div className="mb-6 p-4 bg-red-50 dark:bg-red-900/30 border border-red-200 dark:border-red-800 rounded-lg text-red-700 dark:text-red-300">
            {error}
          </div>
        )}

        {/* Stats */}
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-4 mb-8">
          {[
            { label: 'Total', value: stats.total, color: 'text-gray-900 dark:text-white' },
            { label: 'Open', value: stats.open, color: 'text-blue-600' },
            { label: 'In Progress', value: stats.inProgress, color: 'text-yellow-600' },
            { label: 'Resolved', value: stats.resolved, color: 'text-green-600' },
          ].map((s) => (
            <div
              key={s.label}
              className="bg-white dark:bg-gray-800 rounded-xl p-4 shadow-sm border border-gray-200 dark:border-gray-700"
            >
              <p className={`text-2xl font-bold ${s.color}`}>{s.value}</p>
              <p className="text-xs text-gray-500 dark:text-gray-400">{s.label}</p>
            </div>
          ))}
        </div>

        {/* Category pills */}
        {Object.keys(catCounts).length > 0 && (
          <div className="flex flex-wrap gap-2 mb-6">
            {Object.entries(catCounts).map(([cat, count]) => (
              <button
                key={cat}
                onClick={() => setCategoryFilter(categoryFilter === cat ? 'all' : cat)}
                className={`px-3 py-1.5 rounded-full text-xs font-semibold capitalize transition-all ${
                  categoryFilter === cat
                    ? 'ring-2 ring-orange-500 ring-offset-1'
                    : ''
                } ${CATEGORY_BADGE[cat] || 'bg-gray-100 text-gray-700 dark:bg-gray-700 dark:text-gray-300'}`}
              >
                {cat} <span className="opacity-60">({count})</span>
              </button>
            ))}
          </div>
        )}

        {/* Filters row */}
        <div className="flex flex-col sm:flex-row gap-3 mb-6">
          <input
            type="text"
            placeholder="Search name, mobile, email, company, tier..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="flex-1 px-4 py-2.5 text-sm border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-800 text-gray-900 dark:text-white focus:ring-2 focus:ring-orange-400 focus:border-transparent"
          />
          <select
            value={statusFilter}
            onChange={(e) => setStatusFilter(e.target.value)}
            className="px-3 py-2.5 text-sm border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-800 text-gray-900 dark:text-white"
          >
            <option value="all">All Status</option>
            <option value="open">Open</option>
            <option value="in_progress">In Progress</option>
            <option value="waiting_for_user">Waiting</option>
            <option value="resolved">Resolved</option>
            <option value="closed">Closed</option>
          </select>
          <button
            onClick={load}
            className="px-4 py-2.5 text-sm font-medium rounded-lg border border-gray-300 dark:border-gray-600 hover:bg-gray-50 dark:hover:bg-gray-700 text-gray-700 dark:text-gray-300 transition-colors"
          >
            ↻ Refresh
          </button>
        </div>

        {/* Table */}
        <div className="bg-white dark:bg-gray-800 rounded-xl shadow-sm border border-gray-200 dark:border-gray-700 overflow-hidden">
          {filtered.length === 0 ? (
            <div className="p-16 text-center">
              <span className="text-5xl mb-4 block">🙏</span>
              <p className="text-gray-500 dark:text-gray-400">
                {tickets.length === 0 ? 'No enquiries yet.' : 'No results match your filters.'}
              </p>
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead>
                  <tr className="border-b border-gray-200 dark:border-gray-700 bg-gray-50 dark:bg-gray-900/50">
                    {['#', 'Name', 'Mobile', 'Category', 'Tier', 'Status', 'Date', ''].map((h) => (
                      <th
                        key={h}
                        className="px-4 py-3 text-left text-xs font-semibold uppercase tracking-wide text-gray-500 dark:text-gray-400 whitespace-nowrap"
                      >
                        {h}
                      </th>
                    ))}
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-100 dark:divide-gray-700">
                  {filtered.map(({ ticket, fields }, idx) => {
                    const catKey = (fields['Category'] || '').toLowerCase();
                    return (
                      <tr
                        key={ticket.id}
                        className="hover:bg-amber-50/40 dark:hover:bg-amber-900/10 transition-colors"
                      >
                        <td className="px-4 py-3 text-xs font-mono text-gray-400">
                          {filtered.length - idx}
                        </td>
                        <td className="px-4 py-3">
                          <div className="font-semibold text-gray-900 dark:text-white whitespace-nowrap">
                            {fields['Name'] || ticket.userName || '—'}
                          </div>
                          {fields['Company'] && (
                            <div className="text-xs text-gray-400 truncate max-w-[160px]">
                              {fields['Company']}
                            </div>
                          )}
                          {fields['Email'] && (
                            <div className="text-xs text-gray-400 truncate max-w-[160px]">
                              {fields['Email']}
                            </div>
                          )}
                        </td>
                        <td className="px-4 py-3 whitespace-nowrap">
                          {fields['Mobile'] ? (
                            <a
                              href={`tel:${fields['Mobile']}`}
                              className="text-orange-600 hover:underline font-medium"
                            >
                              {fields['Mobile']}
                            </a>
                          ) : (
                            <span className="text-gray-400">—</span>
                          )}
                        </td>
                        <td className="px-4 py-3">
                          <span
                            className={`px-2 py-0.5 rounded-full text-xs font-semibold capitalize ${
                              CATEGORY_BADGE[catKey] ||
                              'bg-gray-100 text-gray-700 dark:bg-gray-700 dark:text-gray-300'
                            }`}
                          >
                            {fields['Category'] || '—'}
                          </span>
                        </td>
                        <td className="px-4 py-3 text-gray-700 dark:text-gray-300 whitespace-nowrap max-w-[180px] truncate">
                          {fields['Tier'] || '—'}
                        </td>
                        <td className="px-4 py-3">
                          <select
                            value={ticket.status}
                            onChange={(e) => handleStatusChange(ticket.id, e.target.value)}
                            className={`text-xs font-semibold px-2 py-1 rounded-full border-0 cursor-pointer ${
                              STATUS_COLORS[ticket.status] || ''
                            }`}
                            onClick={(e) => e.stopPropagation()}
                          >
                            <option value="open">Open</option>
                            <option value="in_progress">In Progress</option>
                            <option value="waiting_for_user">Waiting</option>
                            <option value="resolved">Resolved</option>
                            <option value="closed">Closed</option>
                          </select>
                        </td>
                        <td className="px-4 py-3 text-xs text-gray-400 whitespace-nowrap">
                          {new Date(ticket.createdAt).toLocaleDateString('en-IN')}
                        </td>
                        <td className="px-4 py-3">
                          <button
                            onClick={() => setSelected(ticket)}
                            className="px-3 py-1.5 text-xs font-semibold rounded-lg bg-orange-100 text-orange-700 hover:bg-orange-200 dark:bg-orange-900/30 dark:text-orange-300 transition-colors"
                          >
                            View
                          </button>
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          )}
        </div>

        <p className="mt-4 text-xs text-gray-400 text-right">
          Showing {filtered.length} of {tickets.length} enquiries
        </p>
      </Container>

      {/* Detail Drawer */}
      {selected && (
        <DetailDrawer
          ticket={selected}
          fields={parseEnquiryMessage(selected.message)}
          onClose={() => setSelected(null)}
          onStatusChange={handleStatusChange}
        />
      )}
    </div>
  );
}
