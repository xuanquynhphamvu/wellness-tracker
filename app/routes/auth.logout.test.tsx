
import { describe, it, expect, vi } from 'vitest';
import { action } from './auth.logout';
import { logout } from '~/lib/session.server';

// Mock dependencies
vi.mock('~/lib/session.server', () => ({
    logout: vi.fn(),
}));

describe('Logout Action', () => {
    it('should call logout and redirect', async () => {
        const request = new Request('http://localhost/logout', {
            method: 'POST'
        });

        await action({ request } as any);

        expect(logout).toHaveBeenCalledWith(request, '/');
    });
});
