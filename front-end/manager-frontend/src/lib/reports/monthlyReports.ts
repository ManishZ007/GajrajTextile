import { apiFetch, ApiError } from "../api/apiFetch";
import { collectPages, CustomerOrder } from "../api/dashboardApi";
import { DealerOrder } from "../api/dealerApi";
import { fetchCustomerProfile } from "../api/customerApi";
import { fetchProductDetail } from "../api/productApi";
import { getShipmentByOrderId, ShipmentResponse } from "../api/shippingApi";
import { PaymentSummary } from "../api/paymentApi";
import { Sheet, downloadWorkbook } from "./xlsx";
export type ReportType = "customer-orders" | "dealer-orders" | "customers";
interface Address {id:number;label:string;street:string;city:string;state:string;postalCode:string;country:string;isDefault:boolean}
interface Profile {customer:{id:string;createdAt:string;gender:string;dateOfBirth:string;addresses:Address[]};authentication:{auth:{fullName:string;email:string;phoneNumber:string;createdAt:string}}}
interface Item {productId:string;variantId:string;quantity:number;subtotal:number;orderType:string;currentStatus:string}
interface Order extends CustomerOrder {userId:string;addressId:string;handledByManagerId:string;items:Item[]}
interface Product {name:string;variants?:{variantId:string;sku:string;color:string;size:string}[]}
// LocalDateTime values come from services in IST; timestamps with offsets are converted to IST.
const date = (s:string|undefined) => !s ? "" : /(?:Z|[+-]\d{2}:\d{2})$/.test(s) ? new Date(s).toLocaleString("en-IN",{timeZone:"Asia/Kolkata"}) : s.replace("T"," ").slice(0,19);
const addressText=(a:Address|undefined)=>a?[a.street,a.city,a.state,a.postalCode,a.country].filter(Boolean).join(", "):"Unavailable";
export function reportMonths(now=new Date()) {
 const parts=new Intl.DateTimeFormat("en-CA",{timeZone:"Asia/Kolkata",year:"numeric",month:"2-digit"}).formatToParts(now);
 const year=Number(parts.find(p=>p.type==="year")?.value), month=Number(parts.find(p=>p.type==="month")?.value);
 return Array.from({length:6},(_,i)=>{const d=new Date(Date.UTC(year,month-1-i,1));return {value:d.toISOString().slice(0,7),label:d.toLocaleDateString("en-IN",{month:"long",year:"numeric",timeZone:"UTC"})};});
}
async function mapped<T,R>(items:T[],fn:(item:T)=>Promise<R>):Promise<R[]> {
 const output:R[]=[];
 for(let i=0;i<items.length;i+=5)output.push(...await Promise.all(items.slice(i,i+5).map(fn)));
 return output;
}
export async function exportMonthlyReport(type:ReportType,month:string,basis:"ordered"|"registered",progress:(s:string)=>void) {
 if(!reportMonths().some(m=>m.value===month))throw new Error("Choose one of the last six months.");
 const issues:string[]=[];
 const summary:Sheet={name:"Summary",headers:["Field","Value"],rows:[["Report",type],["Month",month],["Generated at (IST)",new Date().toLocaleString("en-IN",{timeZone:"Asia/Kolkata"})],["Scope","Organisation-wide; all managers"],["Status basis","Current status at export, not historical month-end status"],["Currency","INR"],["Manager attribution","Current handling manager; completion actor is not recorded separately"],["Addresses","Current saved addresses; not historical snapshots"]]};
 progress("Loading monthly orders and manager names…");
 const staff: {id:string;name:string}[]=await apiFetch("http://localhost:8081/auth/admin/report-staff");
 const names=new Map(staff.map(s=>[s.id,s.name]));
 const manager=(id:string)=>{if(!id)return "Unassigned";const name=names.get(id);if(!name)issues.push("A handling manager's name is unavailable (possibly a deleted account).");return name||"Name unavailable";};
 const list=<T,>(kind:string)=>collectPages<T>(page=>apiFetch(`http://localhost:8083/manager/orders/reports/${kind}?month=${month}&page=${page}`));
 const finish=(sheets:Sheet[])=>{
  summary.rows.push(["Missing-data warnings",new Set(issues).size]);
  downloadWorkbook(`${type}-${month}.xlsx`,[summary,...sheets,{name:"Data notes",headers:["Note"],rows:[...[...new Set(issues)].map(s=>[s]),["No passwords, authentication tokens or raw manager/user IDs are exported."]]}]);
  return issues.length?"Downloaded with data warnings. See the Data notes sheet.":"Excel report downloaded.";
 };
 if(type==="dealer-orders"){
  const orders=await list<DealerOrder>("dealer");
  const main:Sheet={name:"Dealer orders",headers:["Order","Created (IST)","Dealer","Email","Phone","Address","Manager","Order status","Delivery status","Payment status","Order value INR","Collected INR","Balance INR","Notes"],rows:[]};
  const items:Sheet={name:"Items",headers:["Order","Category","Colour","Butti","Padar","Zari","Gondas","Quantity","Unit price INR","Total INR"],rows:[]};
  const payments:Sheet={name:"Payments",headers:["Order","Recorded (IST)","Amount INR","Method","Reference","Recorded by","Note"],rows:[]};
  orders.forEach(o=>{
   const paid=Number(o.paidAmount),amount=Number(o.totalAmount);
   main.rows.push([o.orderNumber,date(o.createdAt),o.dealer.name,o.dealer.email,o.dealer.phone,[o.dealer.address,o.dealer.city,o.dealer.state].filter(Boolean).join(", "),manager(o.createdByManagerId),o.status,o.status==="DELIVERED"?"Delivered / handed over":"Not delivered; no courier workflow",paid>=amount&&amount>0?"PAID":paid>0?"PARTIALLY PAID":"UNPAID",amount,paid,Number(o.balanceAmount),o.notes]);
   o.items.forEach(i=>items.rows.push([o.orderNumber,i.category,i.color,i.buttiName,i.padarName,i.zariName,i.gondas,i.quantity,Number(i.pricePerPiece),Number(i.totalPrice)]));
   o.payments.forEach(p=>payments.rows.push([o.orderNumber,date(p.paidAt),Number(p.amount),p.paymentMode,p.referenceNumber,manager(p.recordedByManagerId),p.note]));
  });
  summary.rows.push(["Orders",orders.length],["Delivered orders",orders.filter(o=>o.status==="DELIVERED").length],["Total order value INR (all statuses)",orders.reduce((sum,o)=>sum+Number(o.totalAmount),0)],["Payment rows","All payments recorded against these orders, including payments after the selected month"]);
  return finish([main,items,payments]);
 }
 let orders=await list<Order>("customer");
 let ids=[...new Set(orders.map(o=>o.userId))];
 if(type==="customers"&&basis==="registered"){
  const registered=await collectPages<{userId:string}>(page=>apiFetch(`http://localhost:8082/internal/customers?month=${month}&page=${page}&size=100`));
  ids=[...new Set(registered.map(c=>c.userId))];const selected=new Set(ids);orders=orders.filter(o=>selected.has(o.userId));
 }
 summary.rows.push(["Delivered orders",orders.filter(o=>o.orderStatus==="DELIVERED").length],["Completed orders",orders.filter(o=>o.orderStatus==="COMPLETED").length],["Total order value INR (all statuses)",orders.reduce((sum,o)=>sum+Number(o.totalAmount),0)],["Customer selection",type==="customers"?basis:"Customers with orders in selected month"],["Customers",ids.length],["Orders in selected month",orders.length]);
 progress("Loading customer details and addresses…");
 const profiles=new Map<string,Profile>();
 await mapped(ids,async id=>{try{const p:Profile=await fetchCustomerProfile(id);if(!p.customer||!p.authentication?.auth?.fullName)throw new Error();profiles.set(id,p);}catch{issues.push("A customer profile could not be loaded; related rows are marked unavailable.");}});
 progress("Loading payments and delivery status…");
 const paymentData:Record<string,PaymentSummary>={};
 for(let i=0;i<orders.length;i+=500){try{Object.assign(paymentData,await apiFetch("http://localhost:8088/payment/manager/orders/summaries",{method:"POST",body:JSON.stringify(orders.slice(i,i+500).map(o=>o.orderId))}));}catch{issues.push("Payment service unavailable for some orders.");}}
 const shipments=new Map<string,ShipmentResponse|null>();
 await mapped(orders,async o=>{try{shipments.set(o.orderId,await getShipmentByOrderId(o.orderId));}catch(e){if(e instanceof ApiError&&e.status===404)shipments.set(o.orderId,null);else issues.push("Shipping status unavailable for some orders.");}});
 const main:Sheet={name:"Customer orders",headers:["Order","Created (IST)","Customer","Email","Phone","Delivery address","Handling manager","Order status","Payment method","Payment status","Order amount INR","Payment amount INR","COD cash collected","Delivery status","Courier","Tracking number","Estimated delivery","Integration pending"],rows:[]};
 orders.forEach(o=>{
  const p=profiles.get(o.userId),auth=p?.authentication.auth,ship=shipments.get(o.orderId),pay=paymentData[o.orderId];
  const paymentStatus=o.paymentMethod==="COD"?(o.codCollected?"CASH COLLECTED":"AWAITING CASH COLLECTION"):pay?.status??"Unavailable";
  if(!pay&&o.paymentMethod!=="COD")issues.push("Some orders have no payment record; their payment status is unavailable.");
  main.rows.push([o.orderNumber,date(o.orderDate),auth?.fullName||"Name unavailable",auth?.email,auth?.phoneNumber,addressText(p?.customer.addresses?.find(a=>String(a.id)===String(o.addressId))),manager(o.handledByManagerId),o.orderStatus,o.paymentMethod,paymentStatus,Number(o.totalAmount),pay?.amount==null?"Unavailable":Number(pay.amount),o.paymentMethod==="COD"?(o.codCollected?"Yes":"No"):"Not applicable",ship===null?"No shipment":ship?.shipmentStatus??"Unavailable",ship?.courierName,ship?.trackingNumber,ship?.estimatedDelivery,o.integrationPending?"Yes":"No"]);
 });
 if(type==="customers"){
  const customers:Sheet={name:"Customers",headers:["Customer","Email","Phone","Gender","Date of birth","Registered (IST)","Orders in selected month","Order value INR","Saved addresses","Data status"],rows:[]};
  const addresses:Sheet={name:"Addresses",headers:["Customer","Email","Label","Street","City","State","Postal code","Country","Default"],rows:[]};
  ids.forEach(id=>{const p=profiles.get(id),a=p?.authentication.auth,rows=orders.filter(o=>o.userId===id);
   customers.rows.push([a?.fullName||"Name unavailable",a?.email,a?.phoneNumber,p?.customer.gender,p?.customer.dateOfBirth,date(p?.customer.createdAt),rows.length,rows.reduce((sum,o)=>sum+Number(o.totalAmount),0),p?.customer.addresses?.length,p?"Available":"Profile unavailable"]);
   p?.customer.addresses?.forEach(v=>addresses.rows.push([a?.fullName,a?.email,v.label,v.street,v.city,v.state,v.postalCode,v.country,v.isDefault]));
  });
  return finish([customers,addresses,main]);
 }
 progress("Loading product names and item details…");
 const productIds=[...new Set(orders.flatMap(o=>(o.items??[]).map(i=>i.productId)))];const products=new Map<string,Product>();
 await mapped(productIds,async id=>{try{products.set(id,await fetchProductDetail(id));}catch{issues.push("A product name could not be loaded.");}});
 const items:Sheet={name:"Items",headers:["Order","Product","SKU","Colour","Size","Type","Quantity","Subtotal INR","Item status"],rows:[]};
 orders.forEach(o=>(o.items??[]).forEach(i=>{const p=products.get(i.productId),v=p?.variants?.find(v=>v.variantId===i.variantId);items.rows.push([o.orderNumber,p?.name||"Product unavailable",v?.sku,v?.color,v?.size,i.orderType,i.quantity,Number(i.subtotal),i.currentStatus]);}));
 return finish([main,items]);
}
