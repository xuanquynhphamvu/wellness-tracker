

/**
 * Health Check Endpoint
 * 
 * Used by load balancers, uptime monitors (like AWS, UptimeRobot), 
 * and orchestration systems (Kubernetes/Docker) to verify application health.
 */
export async function loader() {
    return {
        status: "ok",
        timestamp: new Date().toISOString(),
        uptime: process.uptime(),
    };
}
