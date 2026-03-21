import { validateMetrics } from '@/lib/validators/metricValidator';
import { validateAiOutput } from '@/lib/modules/ai/validator';
import { mockGA4Response, mockPriorGA4Response } from './fixtures/metrics';
import { RawMetricSet } from '@/types/metrics';

describe('Validation Engine', () => {
  describe('metricValidator', () => {
    it('passes valid metrics properly', () => {
      const result = validateMetrics(mockGA4Response, mockPriorGA4Response);
      expect(result.passedValidation).toBe(true);
      expect(result.validated.sessions.status).toBe('valid');
    });

    it('marks as unreliable when zero anomaly occurs', () => {
      const brokenCurrent: RawMetricSet = {
        ...mockGA4Response,
        metrics: {
          ...mockGA4Response.metrics,
          sessions: 0 // Prior was 4000
        }
      };

      const result = validateMetrics(brokenCurrent, mockPriorGA4Response);
      expect(result.validated.sessions.status).toBe('unreliable');
      // If 1 out of 5 fails, it's 80% valid, > 50%, so should pass full payload validation
      expect(result.passedValidation).toBe(true);
    });

    it('marks as preliminary on huge spike', () => {
      const spikedCurrent: RawMetricSet = {
        ...mockGA4Response,
        metrics: {
          ...mockGA4Response.metrics,
          sessions: 20000 // Huge spike vs 4000
        }
      };

      const result = validateMetrics(spikedCurrent, mockPriorGA4Response);
      expect(result.validated.sessions.status).toBe('preliminary');
    });
  });

  describe('outputValidator', () => {
    it('passes standard narrative', () => {
      const text = "Sessions increased by 10% this month driven by direct traffic.";
      const res = validateAiOutput(text);
      expect(res.isValid).toBe(true);
    });

    it('flags speculative words', () => {
      const text = "It's possible that the traffic increased due to seasonality.";
      const res = validateAiOutput(text);
      expect(res.isValid).toBe(false);
      expect(res.flaggedPhrases.length).toBeGreaterThan(0);
    });
  });
});
