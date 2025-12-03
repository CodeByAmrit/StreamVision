import http from 'k6/http';
import { sleep } from 'k6';

export const options = {
  vus: 100,
  duration: '30s',
};

export default function () {

  const cams = [17, 67, 69, 71, 73, 75, 77, 79, 66, 68, 70, 72, 74, 76, 78, 80];

  cams.forEach(id => {
    const playlist = http.get(`https://cctvcameralive.in/streams/dvr_2/cam_${id}/index.m3u8`);
    
    if (playlist.status === 200) {
      const lines = playlist.body.split("\n");
      const segments = lines.filter(l => l.endsWith(".ts"));

      segments.forEach(seg => {
        http.get(`https://cctvcameralive.in/streams/dvr_2/cam_${id}/${seg}`);
      });
    }
  });

  sleep(1);
}
