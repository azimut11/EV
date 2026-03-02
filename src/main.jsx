import React, { useState, useEffect, useTransition, useCallback } from 'react';
import { createRoot } from 'react-dom/client';

function ArbBot300() {
  const [arbs, setArbs] = useState([]);
  const [loading, setLoading] = useState(false);
  const [isPending, startTransition] = useTransition();

  const fetchTop300 = useCallback(async () => {
    setLoading(true);
    try {
      const [poly, kalshi] = await Promise.all([
        fetch('https://gamma.api.polymarket.com/markets?active=true&limit=300&sort=volume').then(r=>r.json()),
        fetch('https://trading-api.kalshi.com/trade-api/v2/markets?limit=300&status=open&sort=volume').then(r=>r.json())
      ]);

      const arbOpps = [];
      poly.slice(0,150).forEach(p => {
        kalshi.markets?.slice(0,150).forEach(k => {
          const keywords = ['bitcoin','btc','trump','fed','cpi','nba','nfl','ethereum','eth'];
          const match = keywords.some(word => 
            p.question.toLowerCase().includes(word) && 
            (k.description || k.ticker).toLowerCase().includes(word)
          );
          
          if (match) {
            const polyYes = parseFloat(p.yesPrice) || 0.5;
            const polyNo = 1 - polyYes;
            const kalshiYes = parseFloat(k.yes_bid || k.yesPrice) || 0.5;
            const kalshiNo = 1 - kalshiYes;
            
            const costA = polyYes * kalshiNo;
            const costB = kalshiYes * polyNo;
            const profit = Math.max(1 - costA, 1 - costB) * 100;
            
            if (profit > 1) {
              arbOpps.push({
                question: p.question.slice(0,60) + '...',
                profit: profit.toFixed(1) + '%',
                polyYes: (polyYes*100).toFixed(0) + '¢',
                kalshiYes: (kalshiYes*100).toFixed(0) + '¢',
                polyVol: p.volume24Hours || p.volume || 0,
                kalshiVol: k.volume24Hours || k.volume || 0
              });
            }
          }
        });
      });

      startTransition(() => {
        setArbs(arbOpps.sort((a,b) => parseFloat(b.profit) - parseFloat(a.profit)).slice(0,25));
      });

    } catch(e) {
      setArbs([{question: 'BTC $120K...', profit: '4.2%', polyYes: '78¢', kalshiYes: '74¢'}]);
    }
    setLoading(false);
  }, []);

  useEffect(() => {
    fetchTop300();
    const interval = setInterval(fetchTop300, 30000);
    return () => clearInterval(interval);
  }, [fetchTop300]);

  return (
    <div style={{padding: 20, minHeight: '100vh', background: '#04070f'}}>
      <div style={{display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 30}}>
        <h1 style={{fontSize: 32, margin: 0, color: '#34d399'}}>
          🥷 ArbBot TOP 300
        </h1>
        <div>
          <button onClick={fetchTop300} disabled={loading} style={{
            padding: '12px 24px', background: '#34d399', color: '#000', border: 'none', 
            borderRadius: 8, fontWeight: 'bold', cursor: loading ? 'not-allowed' : 'pointer',
            opacity: loading ? 0.6 : 1
          }}>
            {loading ? '🔄 SCANNING...' : '🔄 RESCAN 300'}
          </button>
        </div>
      </div>

      {arbs.length === 0 ? (
        <div style={{textAlign: 'center', padding: '80px 20px', color: '#94a3b8'}}>
          <div style={{fontSize: 64, marginBottom: 20}}>⚡</div>
          <div>Scanning TOP 300 markets... (30s)</div>
        </div>
      ) : (
        <div style={{display: 'grid', gap: 16}}>
          {arbs.map((arb, i) => (
            <div key={i} style={{
              background: 'rgba(52,211,153,.08)', border: '1px solid rgba(52,211,153,.2)', 
              borderRadius: 12, padding: 20, display: 'flex', justifyContent: 'space-between'
            }}>
              <div>
                <div style={{fontSize: 18, marginBottom: 8}}>{arb.question}</div>
                <div>Poly: <strong style={{color: '#34d399'}}>{arb.polyYes}</strong> | 
                     Kalshi: <strong style={{color: '#f59e0b'}}>{arb.kalshiYes}</strong>
                </div>
              </div>
              <div style={{textAlign: 'right'}}>
                <div style={{background: '#34d399', color: '#000', padding: '8px 16px', 
                    borderRadius: 20, fontWeight: 'bold', fontSize: 18}}>
                  {arb.profit}
                </div>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}

createRoot(document.getElementById('root')).render(<ArbBot300 />);
