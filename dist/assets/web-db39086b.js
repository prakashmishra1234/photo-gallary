import{W as P}from"./index-ab85191c.js";function m(l){const e=l.split("/").filter(t=>t!=="."),r=[];return e.forEach(t=>{t===".."&&r.length>0&&r[r.length-1]!==".."?r.pop():r.push(t)}),r.join("/")}function x(l,e){l=m(l),e=m(e);const r=l.split("/"),t=e.split("/");return l!==e&&r.every((i,s)=>i===t[s])}class g extends P{constructor(){super(...arguments),this.DB_VERSION=1,this.DB_NAME="Disc",this._writeCmds=["add","put","delete"]}async initDb(){if(this._db!==void 0)return this._db;if(!("indexedDB"in window))throw this.unavailable("This browser doesn't support IndexedDB");return new Promise((e,r)=>{const t=indexedDB.open(this.DB_NAME,this.DB_VERSION);t.onupgradeneeded=g.doUpgrade,t.onsuccess=()=>{this._db=t.result,e(t.result)},t.onerror=()=>r(t.error),t.onblocked=()=>{console.warn("db blocked")}})}static doUpgrade(e){const t=e.target.result;switch(e.oldVersion){case 0:case 1:default:t.objectStoreNames.contains("FileStorage")&&t.deleteObjectStore("FileStorage"),t.createObjectStore("FileStorage",{keyPath:"path"}).createIndex("by_folder","folder")}}async dbRequest(e,r){const t=this._writeCmds.indexOf(e)!==-1?"readwrite":"readonly";return this.initDb().then(i=>new Promise((s,a)=>{const c=i.transaction(["FileStorage"],t).objectStore("FileStorage")[e](...r);c.onsuccess=()=>s(c.result),c.onerror=()=>a(c.error)}))}async dbIndexRequest(e,r,t){const i=this._writeCmds.indexOf(r)!==-1?"readwrite":"readonly";return this.initDb().then(s=>new Promise((a,n)=>{const h=s.transaction(["FileStorage"],i).objectStore("FileStorage").index(e)[r](...t);h.onsuccess=()=>a(h.result),h.onerror=()=>n(h.error)}))}getPath(e,r){const t=r!==void 0?r.replace(/^[/]+|[/]+$/g,""):"";let i="";return e!==void 0&&(i+="/"+e),r!==""&&(i+="/"+t),i}async clear(){(await this.initDb()).transaction(["FileStorage"],"readwrite").objectStore("FileStorage").clear()}async readFile(e){const r=this.getPath(e.directory,e.path),t=await this.dbRequest("get",[r]);if(t===void 0)throw Error("File does not exist.");return{data:t.content?t.content:""}}async writeFile(e){const r=this.getPath(e.directory,e.path);let t=e.data;const i=e.encoding,s=e.recursive,a=await this.dbRequest("get",[r]);if(a&&a.type==="directory")throw Error("The supplied path is a directory.");const n=r.substr(0,r.lastIndexOf("/"));if(await this.dbRequest("get",[n])===void 0){const h=n.indexOf("/",1);if(h!==-1){const y=n.substr(h);await this.mkdir({path:y,directory:e.directory,recursive:s})}}if(!i&&(t=t.indexOf(",")>=0?t.split(",")[1]:t,!this.isBase64String(t)))throw Error("The supplied data is not valid base64 content.");const c=Date.now(),d={path:r,folder:n,type:"file",size:t.length,ctime:c,mtime:c,content:t};return await this.dbRequest("put",[d]),{uri:d.path}}async appendFile(e){const r=this.getPath(e.directory,e.path);let t=e.data;const i=e.encoding,s=r.substr(0,r.lastIndexOf("/")),a=Date.now();let n=a;const o=await this.dbRequest("get",[r]);if(o&&o.type==="directory")throw Error("The supplied path is a directory.");if(await this.dbRequest("get",[s])===void 0){const h=s.indexOf("/",1);if(h!==-1){const y=s.substr(h);await this.mkdir({path:y,directory:e.directory,recursive:!0})}}if(!i&&!this.isBase64String(t))throw Error("The supplied data is not valid base64 content.");o!==void 0&&(o.content!==void 0&&!i?t=btoa(atob(o.content)+atob(t)):t=o.content+t,n=o.ctime);const d={path:r,folder:s,type:"file",size:t.length,ctime:n,mtime:a,content:t};await this.dbRequest("put",[d])}async deleteFile(e){const r=this.getPath(e.directory,e.path);if(await this.dbRequest("get",[r])===void 0)throw Error("File does not exist.");if((await this.dbIndexRequest("by_folder","getAllKeys",[IDBKeyRange.only(r)])).length!==0)throw Error("Folder is not empty.");await this.dbRequest("delete",[r])}async mkdir(e){const r=this.getPath(e.directory,e.path),t=e.recursive,i=r.substr(0,r.lastIndexOf("/")),s=(r.match(/\//g)||[]).length,a=await this.dbRequest("get",[i]),n=await this.dbRequest("get",[r]);if(s===1)throw Error("Cannot create Root directory");if(n!==void 0)throw Error("Current directory does already exist.");if(!t&&s!==2&&a===void 0)throw Error("Parent directory must exist");if(t&&s!==2&&a===void 0){const d=i.substr(i.indexOf("/",1));await this.mkdir({path:d,directory:e.directory,recursive:t})}const o=Date.now(),c={path:r,folder:i,type:"directory",size:0,ctime:o,mtime:o};await this.dbRequest("put",[c])}async rmdir(e){const{path:r,directory:t,recursive:i}=e,s=this.getPath(t,r),a=await this.dbRequest("get",[s]);if(a===void 0)throw Error("Folder does not exist.");if(a.type!=="directory")throw Error("Requested path is not a directory");const n=await this.readdir({path:r,directory:t});if(n.files.length!==0&&!i)throw Error("Folder is not empty");for(const o of n.files){const c=`${r}/${o.name}`;(await this.stat({path:c,directory:t})).type==="file"?await this.deleteFile({path:c,directory:t}):await this.rmdir({path:c,directory:t,recursive:i})}await this.dbRequest("delete",[s])}async readdir(e){const r=this.getPath(e.directory,e.path),t=await this.dbRequest("get",[r]);if(e.path!==""&&t===void 0)throw Error("Folder does not exist.");const i=await this.dbIndexRequest("by_folder","getAllKeys",[IDBKeyRange.only(r)]);return{files:await Promise.all(i.map(async a=>{let n=await this.dbRequest("get",[a]);return n===void 0&&(n=await this.dbRequest("get",[a+"/"])),{name:a.substring(r.length+1),type:n.type,size:n.size,ctime:n.ctime,mtime:n.mtime,uri:n.path}}))}}async getUri(e){const r=this.getPath(e.directory,e.path);let t=await this.dbRequest("get",[r]);return t===void 0&&(t=await this.dbRequest("get",[r+"/"])),{uri:(t==null?void 0:t.path)||r}}async stat(e){const r=this.getPath(e.directory,e.path);let t=await this.dbRequest("get",[r]);if(t===void 0&&(t=await this.dbRequest("get",[r+"/"])),t===void 0)throw Error("Entry does not exist.");return{type:t.type,size:t.size,ctime:t.ctime,mtime:t.mtime,uri:t.path}}async rename(e){await this._copy(e,!0)}async copy(e){return this._copy(e,!1)}async requestPermissions(){return{publicStorage:"granted"}}async checkPermissions(){return{publicStorage:"granted"}}async _copy(e,r=!1){let{toDirectory:t}=e;const{to:i,from:s,directory:a}=e;if(!i||!s)throw Error("Both to and from must be provided");t||(t=a);const n=this.getPath(a,s),o=this.getPath(t,i);if(n===o)return{uri:o};if(x(n,o))throw Error("To path cannot contain the from path");let c;try{c=await this.stat({path:i,directory:t})}catch{const u=i.split("/");u.pop();const p=u.join("/");if(u.length>0&&(await this.stat({path:p,directory:t})).type!=="directory")throw new Error("Parent directory of the to path is a file")}if(c&&c.type==="directory")throw new Error("Cannot overwrite a directory with a file");const d=await this.stat({path:s,directory:a}),h=async(f,u,p)=>{const b=this.getPath(t,f),w=await this.dbRequest("get",[b]);w.ctime=u,w.mtime=p,await this.dbRequest("put",[w])},y=d.ctime?d.ctime:Date.now();switch(d.type){case"file":{const f=await this.readFile({path:s,directory:a});r&&await this.deleteFile({path:s,directory:a});const u=await this.writeFile({path:i,directory:t,data:f.data});return r&&await h(i,y,d.mtime),u}case"directory":{if(c)throw Error("Cannot move a directory over an existing object");try{await this.mkdir({path:i,directory:t,recursive:!1}),r&&await h(i,y,d.mtime)}catch{}const f=(await this.readdir({path:s,directory:a})).files;for(const u of f)await this._copy({from:`${s}/${u}`,to:`${i}/${u}`,directory:a,toDirectory:t},r);r&&await this.rmdir({path:s,directory:a})}}return{uri:o}}isBase64String(e){try{return btoa(atob(e))==e}catch{return!1}}}g._debug=!0;export{g as FilesystemWeb};
