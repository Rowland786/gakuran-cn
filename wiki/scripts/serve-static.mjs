import http from 'node:http';
import fs from 'node:fs';
import path from 'node:path';
const root=path.resolve('dist/client');
const prefix=process.env.NEXT_PUBLIC_BASE_PATH||'';
const mime={'.html':'text/html; charset=utf-8','.js':'text/javascript; charset=utf-8','.css':'text/css; charset=utf-8','.json':'application/json; charset=utf-8','.png':'image/png','.webp':'image/webp','.gif':'image/gif','.svg':'image/svg+xml','.md':'text/plain; charset=utf-8','.rsc':'text/x-component','.woff2':'font/woff2'};
http.createServer((req,res)=>{let pathname;try{pathname=decodeURIComponent(new URL(req.url,'http://localhost').pathname)}catch{res.writeHead(400).end();return}if(prefix&&pathname==='/'){res.writeHead(302,{Location:prefix+'/'}).end();return}if(prefix&&pathname.startsWith(prefix+'/'))pathname=pathname.slice(prefix.length);const file=path.resolve(root,'.'+(pathname==='/'?'/index.html':pathname));if(!file.startsWith(root+path.sep)){res.writeHead(403).end();return}fs.stat(file,(err,stat)=>{if(err||!stat.isFile()){res.writeHead(404).end('Not found');return}res.writeHead(200,{'Content-Type':mime[path.extname(file)]||'application/octet-stream','Cache-Control':'no-cache'});fs.createReadStream(file).pipe(res)})}).listen(5173,'127.0.0.1',()=>console.log('Local: http://127.0.0.1:5173'+prefix+'/'));
