import { createServer } from 'vite';
import { fileURLToPath } from 'node:url';
const root=fileURLToPath(new URL('../',import.meta.url));
const { chromium } = await import(process.env.QA_PLAYWRIGHT_MODULE || 'playwright');
const assert = (await import('node:assert/strict')).default;
process.env.VITE_API_BASE_URL='http://127.0.0.1:5197/api';
const server=await createServer({root,server:{host:'127.0.0.1',port:5197,strictPort:true}});
await server.listen();
let browser;
const errors=[];
const user={id:1,name:'Test Administrator',email:'qa@example.test',department:'Administration',roleLevel:'Manager'};
const products=[{id:1,sku:'QA-1',name:'Alpha Product',category:'Smart Home',stock:2,reorderPoint:1,capacity:null,supplier:'Supplier A',leadTime:1,unit:'units',monthlySales:1},{id:2,sku:'QA-2',name:'Beta Product',category:'Smart Home',stock:3,reorderPoint:1,capacity:10,supplier:'Supplier B',leadTime:2,unit:'units',monthlySales:2}];
const inventory={products,batches:[],transactions:[],adjustments:[],audit:[],alerts:[]};
async function makePage(handler,token=true){
 const page=await browser.newPage();page.setDefaultTimeout(6000);page.on('pageerror',e=>errors.push(e.message));
 if(token)await page.addInitScript(()=>sessionStorage.setItem('wba-auth-token','test-only-token'));
 await page.route('**/api/**',async route=>{const path=new URL(route.request().url()).pathname;const method=route.request().method();const json=(status,data)=>route.fulfill({status,contentType:'application/json',body:JSON.stringify(data)});await handler({route,path,method,json});});
 return page;
}
try{
 browser=await chromium.launch({channel:'msedge',headless:true});
 let meCalls=0;
 const restore=await makePage(({path,json})=>path.endsWith('/auth/me')?json(++meCalls===1?500:200,meCalls===1?{message:'Session service unavailable.'}:{user}):json(200,inventory));
 await restore.goto('http://127.0.0.1:5197');
 await restore.getByRole('button',{name:'Retry session restoration'}).waitFor();assert.equal(meCalls,1);
 await restore.getByRole('button',{name:'Retry session restoration'}).click();
 await restore.getByRole('link',{name:/Inventory/}).first().waitFor();assert.equal(meCalls,2);
 console.log('Session failure and retry passed.');
 let inventoryFail=false,postCalls=0,deleteCalls=0,releaseDelete,releaseProduct,productCalls=0;
 const page=await makePage(({route,path,method,json})=>{
 if(path.endsWith('/auth/me'))return json(200,{user});
 if(path.endsWith('/inventory'))return json(inventoryFail?500:200,inventoryFail?{message:'Refresh unavailable.'}:inventory);
 if(path.endsWith('/users')&&method==='GET')return json(200,{data:[user]});
 if(path.endsWith('/movements')){postCalls++;inventoryFail=true;return json(201,{data:{id:9}});}
 if(path.endsWith('/products')&&method==='POST'){productCalls++;return new Promise(resolve=>releaseProduct=()=>resolve(json(422,{message:'Validation failed.',errors:{sku:['SKU is already in use.']}})));}
 if(path.endsWith('/products/1')&&method==='DELETE'){deleteCalls++;return new Promise(resolve=>releaseDelete=()=>resolve(json(409,{message:'Product has inventory history.'})));}
 return json(200,{});
 });
 await page.goto('http://127.0.0.1:5197/#/inventory');await page.getByRole('button',{name:'Add product',exact:true}).waitFor();
 await page.getByRole('button',{name:'Edit',exact:true}).nth(0).click();assert.equal(await page.locator('input[name="sku"]').inputValue(),'QA-1');assert.equal(await page.locator('input[name="capacity"]').inputValue(),'');
 await page.getByRole('button',{name:'Edit',exact:true}).nth(1).click();assert.equal(await page.locator('input[name="sku"]').inputValue(),'QA-2');
 await page.getByRole('button',{name:'Add product',exact:true}).click();assert.equal(await page.locator('input[name="sku"]').inputValue(),'');
 await page.getByRole('button',{name:'Create product',exact:true}).click();assert.ok(await page.locator('form :invalid').count());assert.equal(productCalls,0);
 await page.locator('input[name="sku"]').fill('QA-1');await page.locator('input[name="name"]').fill('Test');await page.locator('input[name="category"]').fill('Smart Home');
 await page.locator('input[name="stock"]').fill('-1');await page.getByRole('button',{name:'Create product',exact:true}).click();assert.equal(await page.locator('input[name="stock"]').evaluate(el=>el.validity.rangeUnderflow),true);assert.equal(productCalls,0);await page.locator('input[name="stock"]').fill('0');
 await page.getByRole('button',{name:'Create product',exact:true}).click();await page.getByRole('button',{name:/^Saving/}).waitFor();for(const control of await page.locator('form input').all())assert.equal(await control.isDisabled(),true);await page.locator('form').evaluate(form=>form.requestSubmit());assert.equal(productCalls,1);releaseProduct();await page.locator('input[name="sku"][aria-invalid="true"]').waitFor();
 const errorId=await page.locator('input[name="sku"]').getAttribute('aria-describedby');assert.match(await page.locator(`[id="${errorId}"]`).innerText(),/already in use/);
 await page.getByRole('button',{name:'Cancel',exact:true}).click();
 const trigger=page.getByRole('button',{name:'Delete',exact:true}).first();await trigger.click();const dialog=page.getByRole('dialog');await dialog.waitFor();
 assert.equal(await dialog.getByRole('button',{name:'Cancel'}).evaluate(el=>el===document.activeElement),true);
 await page.keyboard.press('Shift+Tab');assert.equal(await dialog.getByRole('button',{name:'Delete product',exact:true}).evaluate(el=>el===document.activeElement),true);
 await page.keyboard.press('Tab');assert.equal(await dialog.getByRole('button',{name:'Cancel'}).evaluate(el=>el===document.activeElement),true);
 await page.keyboard.press('Escape');await dialog.waitFor({state:'detached'});assert.equal(await trigger.evaluate(el=>el===document.activeElement),true);
 await trigger.click();await dialog.getByRole('button',{name:'Delete product',exact:true}).click();await dialog.getByRole('button',{name:/Processing/}).waitFor();
 await page.keyboard.press('Escape');assert.equal(await dialog.count(),1);await page.keyboard.press('Tab');assert.equal(await dialog.evaluate(el=>el===document.activeElement),true);assert.equal(deleteCalls,1);
 releaseDelete();await dialog.getByRole('alert').waitFor();assert.match(await dialog.getByRole('alert').innerText(),/inventory history/);await dialog.getByRole('button',{name:'Cancel'}).click();
 await page.goto('http://127.0.0.1:5197/#/users');await page.getByRole('button',{name:'Add user',exact:true}).click();
 await page.locator('select[name="department"]').selectOption('Sales');assert.deepEqual(await page.locator('select[name="roleLevel"] option:not([disabled])').allTextContents(),['Staff','Supervisor']);
 await page.goto('http://127.0.0.1:5197/#/stock-in');await page.locator('select[name="productId"]').selectOption('1');await page.locator('input[name="quantity"]').fill('2');await page.locator('input[name="reference"]').fill('test');
 await page.getByRole('button',{name:'Record stock in'}).click();await page.getByRole('heading',{name:'Unable to load inventory'}).waitFor();assert.match(await page.getByRole('alert').innerText(),/Your change was saved/);assert.equal(postCalls,1);
 inventoryFail=false;await page.getByRole('button',{name:'Retry inventory loading'}).click();await page.getByRole('heading',{name:'Unable to load inventory'}).waitFor({state:'detached'});assert.equal(postCalls,1);

 await page.locator('select[name="productId"]').selectOption('1');await page.locator('input[name="quantity"]').fill('7');await page.locator('input[name="reference"]').fill('Receiving reference');
 for(const [label,heading] of [['Stock Out','Stock Out transaction'],['Transfers','Transfer transaction'],['Returns','Return transaction'],['Stock In','Stock In transaction']]){
  await page.getByRole('link',{name:new RegExp(label)}).click();await page.getByRole('heading',{name:heading}).waitFor();
  assert.equal(await page.locator('input[name="quantity"]').inputValue(),'');assert.equal(await page.locator('input[name="reference"]').inputValue(),'');
 }
 console.log('Movement navigation resets passed.');
 console.log('CRUD resets, validation, supported roles, dialog keyboard/pending/failure, and saved-write refresh retry passed.');
 const reviewer={...user,department:'Purchasing',roleLevel:'Manager'};
 const reviews={...inventory,adjustments:[{id:1,productId:1,requestedById:2,requestedBy:'Other',systemQty:2,requestedQty:3,reason:'Count',status:'Pending'},{id:2,productId:1,requestedById:1,requestedBy:'Self',systemQty:2,requestedQty:3,reason:'Count',status:'Pending'}]};
 const review=await makePage(({path,json})=>json(200,path.endsWith('/auth/me')?{user:reviewer}:reviews));
 await review.goto('http://127.0.0.1:5197/#/adjustments');await review.getByRole('heading',{name:'Approve or reject requests'}).waitFor();assert.equal(await review.getByRole('heading',{name:'Submit adjustment',exact:true}).count(),0);assert.equal(await review.getByRole('button',{name:'Approve',exact:true}).count(),1);await review.getByRole('link',{name:/Adjustments/}).waitFor();
 const empty=await makePage(({path,json})=>json(200,path.endsWith('/auth/me')?{user}:{...inventory,products:[]}));await empty.goto('http://127.0.0.1:5197/#/cycle-count');await empty.getByRole('heading',{name:'No products to count'}).waitFor();
 const login=await makePage(({json})=>json(422,{message:'Invalid credentials.',errors:{email:['Email credentials do not match.']}}),false);await login.goto('http://127.0.0.1:5197');await login.locator('input[name="email"]').fill('test@example.test');await login.locator('input[name="password"]').fill('test-password');await login.getByRole('button',{name:'Sign in',exact:true}).click();await login.locator('input[name="email"][aria-invalid="true"]').waitFor();

 for(const status of [403,404,500]){
  const failure=await makePage(({path,json})=>path.endsWith('/auth/me')?json(200,{user}):json(status,{message:'Request failed.'}));
  await failure.goto('http://127.0.0.1:5197');await failure.getByRole('heading',{name:'Unable to load inventory'}).waitFor();
  assert.match(await failure.getByRole('alert').innerText(),status===403?/permission/:status===404?/no longer available/:/Request failed/);await failure.close();
 }
 const expired=await makePage(({json})=>json(401,{message:'Unauthenticated.'}));await expired.goto('http://127.0.0.1:5197');await expired.getByRole('button',{name:'Sign in',exact:true}).waitFor();assert.equal(await expired.evaluate(()=>sessionStorage.getItem('wba-auth-token')),null);
 const offline=await makePage(({route,path,json})=>path.endsWith('/auth/me')?json(200,{user}):route.abort('connectionrefused'));await offline.goto('http://127.0.0.1:5197');await offline.getByRole('heading',{name:'Unable to load inventory'}).waitFor();assert.match(await offline.getByRole('alert').innerText(),/Unable to reach the API/);
 const sales=await makePage(({path,json})=>json(200,path.endsWith('/auth/me')?{user:{...user,department:'Sales',roleLevel:'Staff'}}:inventory));await sales.goto('http://127.0.0.1:5197/#/users');await sales.getByRole('heading',{name:'This module is not part of your assigned workspace.'}).waitFor();assert.equal(await sales.getByRole('link',{name:/User Management/}).count(),0);
 for(const width of [1440,390]){
  await page.setViewportSize({width,height:900});
  for(const path of ['inventory','batches','stock-in','adjustments','users']){
   await page.goto(`http://127.0.0.1:5197/#/${path}`);await page.getByRole('heading',{name:{inventory:'Inventory at a glance',batches:'FIFO and expiry management','stock-in':'Stock In transaction',adjustments:'Inventory adjustments',users:'User management'}[path],exact:true}).waitFor();
   if(await page.evaluate(()=>document.documentElement.scrollWidth>innerWidth+1)) console.log('Overflow details',await page.evaluate(()=>[...document.querySelectorAll('main *')].filter(el=>el.getBoundingClientRect().right>innerWidth+1).slice(0,15).map(el=>({tag:el.tagName,class:el.className,width:el.getBoundingClientRect().width,right:el.getBoundingClientRect().right}))));
   assert.equal(await page.evaluate(()=>document.documentElement.scrollWidth<=innerWidth+1),true,`Page overflow: ${path} at ${width}`);
   if(width===390){await page.getByRole('button',{name:'Open navigation'}).click();await page.getByRole('link',{name:/Inventory/}).first().click();await page.getByRole('heading',{name:'Inventory at a glance'}).waitFor();}
  }
 }
 console.log('401/403/404/500/network, forbidden route, and desktop/mobile navigation and overflow checks passed.');
 assert.deepEqual(errors,[]);console.log('Reviewer matrix, self-review prevention, empty Cycle Count, and login field errors passed. No browser exceptions.');
}catch(e){console.error(e);process.exitCode=1;}finally{if(browser)await Promise.race([browser.close(),new Promise(r=>setTimeout(r,1000))]);await server.close();process.exit(process.exitCode||0);}
