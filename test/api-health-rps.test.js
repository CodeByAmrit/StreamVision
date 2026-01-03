import http from "k6/http";
import { check, sleep } from "k6";

export let options = {
  stages: [
    { duration: "30s", target: 50 },
    { duration: "1m", target: 200 },
    { duration: "1m", target: 500 },
    { duration: "30s", target: 0 },
  ],
  thresholds: {
    http_req_failed: ["rate<0.01"],
    http_req_duration: ["p(95)<200"],
  },
};

export default function () {
  const res = http.get(`${__ENV.SERVICE_URL_STREAMVISION}/api/health`);
  console.log(`Health Check Response: ${res.status} - ${res.body}`);
  check(res, {
    "status is 200": (r) => r.status === 200,
  });

  sleep(1);
}
