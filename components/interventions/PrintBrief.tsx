'use client';
import { EXPORTS_ENABLED } from '@/lib/features';
export default function PrintBrief() {
  return EXPORTS_ENABLED ? <button className="outline-button brief-print" onClick={() => window.print()}>Print / save as PDF</button> : null;
}
