
import { describe, it, expect } from 'vitest';
import { loader } from './health';


describe('Health Loader', () => {
    it('should return healthy status with timestamp and uptime', async () => {


        const response = await loader();

        expect(response).toEqual({
            status: "ok",
            timestamp: expect.any(String),
            uptime: expect.any(Number),
        });
    });
});
