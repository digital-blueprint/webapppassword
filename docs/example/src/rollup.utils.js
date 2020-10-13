import path from 'path';
import url from 'url';
import child_process from 'child_process';
import resolve from '@rollup/plugin-node-resolve';

export function getBuildInfo(build) {
    let remote = child_process.execSync('git config --get remote.origin.url').toString().trim();
    let commit = child_process.execSync('git rev-parse --short HEAD').toString().trim();

    let parsed = url.parse(remote);
    let newPath = parsed.path.slice(0, parsed.path.lastIndexOf('.'));
    let newUrl = parsed.protocol + '//' + parsed.host + newPath + '/commit/' + commit;

    return {
        info: commit,
        url: newUrl,
        time: new Date().toISOString(),
        env: build
    }
}

export async function getPackagePath(packageName, assetPath) {
    const r = resolve();
    const id = (await r.resolveId(packageName)).id;
    const packageInfo = r.getPackageInfoForId(id);
    const fullAssetPath = path.join(packageInfo.root, assetPath);
    return path.relative(process.cwd(), fullAssetPath);
}