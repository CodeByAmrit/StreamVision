import { check, group, sleep } from 'k6';
import http from 'k6/http';

export const options = {
  stages: [
    { duration: '1m', target: 10 },
    { duration: '2m', target: 10 },
    { duration: '1m', target: 0 },
  ],
  thresholds: {
    http_req_failed: ['rate<0.01'], 
    http_req_duration: ['p(95)<200'],
  },
};

const BASE_URL = 'http://localhost'; 

export default function () {
  group('User Routes', function () {
    group('GET /login', function () {
      const res = http.get(`${BASE_URL}/login`);
      check(res, {
        'status is 200': (r) => r.status === 200,
      });
    });

    group('GET /', function () {
      const res = http.get(`${BASE_URL}/`);
      check(res, {
        'status is 200': (r) => r.status === 200,
      });
    });

    group('GET /updates', function () {
      const res = http.get(`${BASE_URL}/updates`);
      check(res, {
        'status is 200': (r) => r.status === 200,
      });
    });

    group('POST /login', function () {
      const payload = JSON.stringify({
        username: 'test',
        password: 'password',
      });
      const params = {
        headers: {
          'Content-Type': 'application/json',
        },
      };
      const res = http.post(`${BASE_URL}/login`, payload, params);
      check(res, {
        'status is 200 or 401': (r) => r.status === 200 || r.status === 401,
      });
    });
  });

  group('Public Routes', function () {
    group('GET /public/dvr/:id', function () {
      const res = http.get(`${BASE_URL}/public/dvr/1`);
      check(res, {
        'status is 200 or 404': (r) => r.status === 200 || r.status === 404,
      });
    });
  });

  group('WebSocket Routes', function () {
    group('GET /api/dvr/:dvrId/cameras', function () {
      const res = http.get(`${BASE_URL}/api/dvr/1/cameras`);
      check(res, {
        'status is 200 or 404': (r) => r.status === 200 || r.status === 404,
      });
    });
  });
}
