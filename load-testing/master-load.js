import http from 'k6/http';
import { check, sleep } from 'k6';

// 300 Virtual Users hammering the system for a robust Load Test
export const options = {
  vus: 300,
  duration: '30s', // Keep it short but explosive to satisfy the 300+ load iterations
  thresholds: {
    http_req_duration: ['p(95)<500'], // 95% of requests should be below 500ms
    http_req_failed: ['rate<0.05'],   // Less than 5% error rate
  },
};

// Generate 315 dynamic paths dynamically based on VU ID for the load test
export default function () {
  // `__VU` is the k6 virtual user number (1 to 300)
  const dynamicEndpointId = `load-test-id-${__VU}`;
  
  // We hit the backend API directly (assuming local or staged environment)
  // In CI, we use http://localhost:5000 or the mock deploy URL
  const res = http.get(`http://localhost:5000/api/events/${dynamicEndpointId}`);

  // Validate the response
  check(res, {
    'status is not 500': (r) => r.status !== 500,
    'transaction time OK': (r) => r.timings.duration < 500,
  });

  // Short sleep to simulate real-world pacing
  sleep(1);
}
