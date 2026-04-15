import { useMemo, useState } from 'react';

import {
  evaluateMechanism,
  poolTogetherCompatibility,
  type CompatibilityRow,
} from '../services/MechanismDesign';
import './MerkabaLab.css';

const statusClass = (verdict: CompatibilityRow['verdict']) => {
  if (verdict === 'Native') return 'compat-native';
  if (verdict === 'Wrapper Layer') return 'compat-wrapper';
  return 'compat-separate';
};

const fmt = (n: number) => `$${n.toFixed(2)}`;

const MerkabaLab = () => {
  const [startPrice, setStartPrice] = useState(100);
  const [reserveTarget, setReserveTarget] = useState(100);
  const [numRungs, setNumRungs] = useState(10);
  const [biddersPerRung, setBiddersPerRung] = useState(100);
  const [feePerBid, setFeePerBid] = useState(0.2);
  const [priceDropPerRung, setPriceDropPerRung] = useState(2);
  const [sidepotShare, setSidepotShare] = useState(0.4);
  const [immediatePotShare, setImmediatePotShare] = useState(0.5);

  const result = useMemo(
    () =>
      evaluateMechanism({
        startPrice,
        reserveTarget,
        numRungs,
        biddersPerRung,
        feePerBid,
        priceDropPerRung,
        sidepotShare,
        immediatePotShare,
      }),
    [
      startPrice,
      reserveTarget,
      numRungs,
      biddersPerRung,
      feePerBid,
      priceDropPerRung,
      sidepotShare,
      immediatePotShare,
    ]
  );

  return (
    <section className="merkaba-lab-section">
      <div className="merkaba-lab-header">
        <h2>MERKABA LAB</h2>
        <p>Solvency + EV simulator and PoolTogether feasibility boundary map.</p>
      </div>

      <div className="merkaba-lab-grid">
        <div className="merkaba-panel">
          <h3>Mechanism Inputs</h3>
          <label>
            Start Price ({fmt(startPrice)})
            <input
              type="range"
              min={10}
              max={1000}
              step={10}
              value={startPrice}
              onChange={(e) => setStartPrice(Number(e.target.value))}
            />
          </label>
          <label>
            Reserve Target ({fmt(reserveTarget)})
            <input
              type="range"
              min={10}
              max={1000}
              step={10}
              value={reserveTarget}
              onChange={(e) => setReserveTarget(Number(e.target.value))}
            />
          </label>
          <label>
            Rungs ({numRungs})
            <input
              type="range"
              min={1}
              max={40}
              step={1}
              value={numRungs}
              onChange={(e) => setNumRungs(Number(e.target.value))}
            />
          </label>
          <label>
            Bidders / Rung ({biddersPerRung})
            <input
              type="range"
              min={5}
              max={500}
              step={5}
              value={biddersPerRung}
              onChange={(e) => setBiddersPerRung(Number(e.target.value))}
            />
          </label>
          <label>
            Fee / Bid ({fmt(feePerBid)})
            <input
              type="range"
              min={0.05}
              max={2}
              step={0.05}
              value={feePerBid}
              onChange={(e) => setFeePerBid(Number(e.target.value))}
            />
          </label>
          <label>
            Price Drop / Rung ({fmt(priceDropPerRung)})
            <input
              type="range"
              min={0.1}
              max={20}
              step={0.1}
              value={priceDropPerRung}
              onChange={(e) => setPriceDropPerRung(Number(e.target.value))}
            />
          </label>
          <label>
            Sidepot Share ({Math.round(sidepotShare * 100)}%)
            <input
              type="range"
              min={0}
              max={0.9}
              step={0.05}
              value={sidepotShare}
              onChange={(e) => setSidepotShare(Number(e.target.value))}
            />
          </label>
          <label>
            Immediate Draw Share ({Math.round(immediatePotShare * 100)}%)
            <input
              type="range"
              min={0}
              max={1}
              step={0.05}
              value={immediatePotShare}
              onChange={(e) => setImmediatePotShare(Number(e.target.value))}
            />
          </label>
        </div>

        <div className="merkaba-panel">
          <h3>Model Outputs</h3>
          <ul className="output-list">
            <li>
              <span>Final Item Price</span>
              <strong>{fmt(result.finalPrice)}</strong>
            </li>
            <li>
              <span>Total Fee Intake</span>
              <strong>{fmt(result.totalFees)}</strong>
            </li>
            <li>
              <span>Seller Proceeds</span>
              <strong>{fmt(result.sellerProceeds)}</strong>
            </li>
            <li>
              <span>Sidepot Funding</span>
              <strong>{fmt(result.sidepotFunding)}</strong>
            </li>
            <li>
              <span>Immediate Pot Funding</span>
              <strong>{fmt(result.immediatePotFunding)}</strong>
            </li>
            <li>
              <span>Long-Horizon Pot Funding</span>
              <strong>{fmt(result.longPotFunding)}</strong>
            </li>
            <li>
              <span>Small Bidder Immediate EV</span>
              <strong className={result.bidderImmediateEv >= 0 ? 'ok' : 'warn'}>
                {fmt(result.bidderImmediateEv)}
              </strong>
            </li>
          </ul>
          <div className={`solvency-banner ${result.sellerSolvent ? 'pass' : 'fail'}`}>
            {result.sellerSolvent
              ? 'Seller Solvency: PASS (meets reserve target)'
              : 'Seller Solvency: FAIL (below reserve target)'}
          </div>
        </div>
      </div>

      <div className="merkaba-panel compat-panel">
        <h3>PoolTogether V5 Compatibility Matrix</h3>
        <table>
          <thead>
            <tr>
              <th>Feature</th>
              <th>Fit</th>
              <th>Execution Path</th>
            </tr>
          </thead>
          <tbody>
            {poolTogetherCompatibility.map((row) => (
              <tr key={row.feature}>
                <td>{row.feature}</td>
                <td>
                  <span className={`compat-chip ${statusClass(row.verdict)}`}>{row.verdict}</span>
                </td>
                <td>{row.note}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </section>
  );
};

export default MerkabaLab;
