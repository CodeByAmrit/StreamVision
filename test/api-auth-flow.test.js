import http from 'k6/http';
import { check, sleep } from 'k6';

export let options = {
    vus: 100,
    duration: '2m',
};

export default function () {
    // 1. Login
    const loginPayload = JSON.stringify({
        username: 'testuser',
        password: 'testpassword',
    });

    const loginRes = http.post(
        `${__ENV.SERVICE_URL_STREAMVISION}/api/login`,
        loginPayload,
        { headers: { 'Content-Type': 'application/json' } }
    );

    check(loginRes, {
        'login success': r => r.status === 200,
    });

    const token = loginRes.json('token');

    // 2. Get DVR list
    const dvrRes = http.get(
        `${__ENV.SERVICE_URL_STREAMVISION}/api/dvr`,
        {
            headers: {
                Authorization: `Bearer ${token}`,
            },
        }
    );

    check(dvrRes, {
        'dvr list ok': r => r.status === 200,
    });

    sleep(1);
}
