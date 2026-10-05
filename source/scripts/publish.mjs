// 빌드 결과(dist)를 저장소 루트로 복사합니다. (GitHub Pages: Branch=main, Folder=/(root) 용)
import { rmSync, cpSync, writeFileSync } from 'node:fs';
import { fileURLToPath } from 'node:url';
import path from 'node:path';

const here = path.dirname(fileURLToPath(import.meta.url));
const dist = path.resolve(here, '../dist');
const root = path.resolve(here, '../..'); // source/ 의 바깥 = 저장소 루트

rmSync(path.join(root, 'assets'), { recursive: true, force: true });
rmSync(path.join(root, 'index.html'), { force: true });
cpSync(dist, root, { recursive: true });
writeFileSync(path.join(root, '.nojekyll'), '');
console.log('✅ 저장소 루트에 배포 파일을 갱신했습니다:', root);
