'use client';
import { useEffect, useState } from 'react';
import { apiClient } from '../../lib/api-client';
import CitizenCard from '../../components/CitizenCard';
import { Users, Search, UserPlus, Sparkles, Filter } from 'lucide-react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';

export default function CitizensListPage() {
  const router = useRouter();
  const [citizens, setCitizens] = useState<any[]>([]);
  const [search, setSearch] = useState('');
  const [filterType, setFilterType] = useState('ALL');
  const [loadError, setLoadError] = useState('');

  useEffect(() => {
    fetchCitizens();
  }, []);

  const fetchCitizens = async () => {
    try {
      const res = await apiClient.get('/citizens/', { params: { limit: 1000 } });
      setCitizens(res.data);
      setLoadError('');
    } catch (e) {
      console.error(e);
      setLoadError('The beneficiary list could not be loaded. Start the backend on http://localhost:8000 and sign in again.');
    }
  };

  const filtered = citizens.filter((c) => {
    const query = search.toLowerCase();
    const matchSearch = (c.name || '').toLowerCase().includes(query) ||
                        (c.district || '').toLowerCase().includes(query) ||
                        (c.mobile_number || '').includes(search);
    if (filterType === 'BPL') return matchSearch && c.is_bpl;
    if (filterType === 'SUPER_SENIOR') return matchSearch && c.age >= 70;
    return matchSearch;
  });

  return (
    <div className="animate-fade-in">
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '1rem', marginBottom: '1.5rem' }}>
        <div>
          <h2 style={{ fontSize: '1.8rem', display: 'flex', alignItems: 'center', gap: '0.6rem' }}>
            <Users size={28} color="#2dd4bf" />
            <span>Senior Citizens Beneficiary Directory</span>
          </h2>
          <p style={{ color: 'var(--text-secondary)', fontSize: '0.92rem', marginTop: '0.2rem' }}>
            Active cohort managed under this Anganwadi Field Worker sector
          </p>
        </div>
        <Link href="/register" className="btn btn-primary">
          <UserPlus size={18} />
          <span>+ Onboard New Citizen</span>
        </Link>
      </div>

      {/* Filter & Search Bar */}
      <div className="card" style={{ padding: '1.2rem', marginBottom: '1.75rem' }}>
        <div style={{ display: 'flex', gap: '1rem', flexWrap: 'wrap', alignItems: 'center', justifyContent: 'space-between' }}>
          <div style={{ position: 'relative', flex: '1 1 300px' }}>
            <Search size={17} color="#64748b" style={{ position: 'absolute', left: '12px', top: '50%', transform: 'translateY(-50%)' }} />
            <input
              type="text"
              placeholder="Search by citizen name, district, or mobile..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="form-control"
              style={{ paddingLeft: '2.4rem' }}
            />
          </div>

          <div style={{ display: 'flex', gap: '0.5rem', flexWrap: 'wrap' }}>
            <button 
              onClick={() => setFilterType('ALL')} 
              className={`btn ${filterType === 'ALL' ? 'btn-primary' : 'btn-secondary'}`}
              style={{ fontSize: '0.84rem', padding: '0.5rem 0.9rem' }}
            >
              All ({citizens.length})
            </button>
            <button 
              onClick={() => setFilterType('BPL')} 
              className={`btn ${filterType === 'BPL' ? 'btn-warning' : 'btn-secondary'}`}
              style={{ fontSize: '0.84rem', padding: '0.5rem 0.9rem' }}
            >
              BPL Enrolled
            </button>
            <button 
              onClick={() => setFilterType('SUPER_SENIOR')} 
              className={`btn ${filterType === 'SUPER_SENIOR' ? 'btn-primary' : 'btn-secondary'}`}
              style={{ fontSize: '0.84rem', padding: '0.5rem 0.9rem' }}
            >
              Super Seniors (70+)
            </button>
          </div>
        </div>
      </div>

      {/* Directory Grid */}
      <div className="grid-2">
        {filtered.map((cit) => (
          <CitizenCard 
            key={cit.id} 
            citizen={cit} 
            onEvaluate={() => router.push(`/?citizen=${cit.id}`)} 
          />
        ))}
      </div>

      {filtered.length === 0 && (
        <div className="card" style={{ textAlign: 'center', padding: '3rem' }}>
          <p style={{ color: loadError ? '#fda4af' : 'var(--text-secondary)' }}>
            {loadError || 'No senior citizens found matching the search criteria.'}
          </p>
        </div>
      )}
    </div>
  );
}
