import http from 'k6/http';
import { check, sleep } from 'k6';

export let options = {
    stages: [
        { duration: '30s', target: 10 },
        { duration: '1m', target: 30 },
        { duration: '1m', target: 50 },
        { duration: '30s', target: 0 },
    ],
};

export default function () {
    const payload = JSON.stringify({
        dvrId: '45',
        channel: 1,
    });

    const res = http.post(
        `${__ENV.SERVICE_URL_STREAMVISION}/api/start-stream`,
        payload,
        {
            headers: {
                'Content-Type': 'application/json',
                Authorization: 'Bearer YOUR_STATIC_TEST_TOKEN',
            },
        }
    );

    check(res, {
        'stream started': r => r.status === 200 || r.status === 409,
    });

    sleep(2);
}
