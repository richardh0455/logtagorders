import React, { Component } from 'react';
import OrderItem from './OrderItem';
import '../../public/css/gridforms.css';
import * as jsPDF from 'jspdf';
import * as Base64 from 'base-64';
import pdfEnd from '../../public/images/ncombskhir.png';
import logo from '../../public/images/LTLogoInvoice.png';
import {NotificationContainer, NotificationManager} from 'react-notifications';
import 'jspdf-autotable';



class OrderList extends Component {
	constructor(props) {
    super(props);
		this.state = {
			counter: '5',
			order_items:  []
		};
	}

  async componentDidMount() {
	  if (this.state.order_items === undefined || this.state.order_items.length == 0)
	  {
			this.addOrderLine()
	  }
  }




	buildInvoiceBody() {
		var lines =[]
		var items = this.state.order_items;
		for(var i = 0; i < items.length; i++) {
			var item = items[i];
			var variant_id = 0;
			if(item.variant_id === -1) {
				variant_id = 'NULL';
			}

			lines.push({"ProductID":item.product_id, "VariationID": item.variant_id, "Quantity": item.quantity, "Price":item.price});
		}
		return lines;
	}

   removeItem = (key) => {
	  var items = this.state.order_items;
	  for(var i = 0; i < items.length; i++) {
		if(items[i].key === key) {
			items.splice(i, 1);
		}
	  }
	  this.saveState({order_items: items});
   }

  addItem = (event) => {
		event.preventDefault();
		this.addOrderLine();
  }

  addOrderLine() {
	  var key = Number(this.state.counter) + 1;
 	  var default_item = {key:'0', product_name:'Select a Product', product_id:"-1", variant:'No Variant', variant_id:'0', quantity:'0', price:'0'};
	  var cloneOfDefault = JSON.parse(JSON.stringify(default_item));
	  cloneOfDefault.key = key;
	  var items = this.state.order_items;
	  items.push(cloneOfDefault);
	  this.saveState({counter: key, order_items: items });
  }


   saveState(state) {
	this.setState(state)
   }

   calculateTotal(subtotals) {
	  var items = this.state.order_items;
	  var total = 0;
	  for(var i = 0; i < items.length; i++) {
		total += items[i].quantity * items[i].price;
	  }
	  return total;
   }

   orderItemUpdated = (key, item) => {
	   var items = this.state.order_items;
	   for(var i = 0; i < items.length; i++) {
		if(items[i].key === key) {
			if(item == null){
				items.splice(i, 1);
			}else {
				items[i] = {...items[i], ...item}
			}
		}
	  }
	  this.saveState({order_items: items});
   }


  generatePDF = (logtagInvoiceNumber) => {
		var pageWidth = 210;
		var margin = 20;
		var doc = new jsPDF({orientation:'p', unit:'mm', format:'a4'});
		var initX = 15;
		var initY = 0;
		this.generateHeader(doc, pageWidth, margin, initY);
		this.generateShippingAddress(doc, margin, initY);
		this.generateInvoiceNumber(doc, pageWidth, margin, initY, logtagInvoiceNumber);
		this.generateDate(doc, pageWidth, margin, initY);
		this.generatePurchaseOrderNumber(doc,pageWidth, margin, initY);
		this.generateShippingAccount(doc, margin, initY);
		var postTableY = this.generateOrderTable(doc, margin, 125);
		this.generateBankDetails(doc, margin, postTableY);
		this.generateFooter(doc, pageWidth, margin, postTableY);


   }

	 generateHeader(doc,pageWidth, margin, initY) {
		var imageWidth = 60;
	 	var imageHeight = (imageWidth/5) * 2;
	 	var img = new Image();
	 	img.src = logo;
	 	doc.addImage(img , 'PNG', (pageWidth-imageWidth)/2, initY+20, imageWidth, imageHeight);

	 	doc.setFontSize(11);
	 	doc.setFontStyle("bold");
	 	var addressLine1 = "LogTag Recorders (HK) Ltd. Room A, 12/F., Tak Lee Commercial Building"
	 	var addressLine2 = "113-117 Wanchai Road, Wanchai, Hong Kong Tel +649 444 5881"
	   doc.text([addressLine1,addressLine2], pageWidth/2, initY+50, {align:"center"});
	 	doc.setLineWidth(1);
	 	doc.line(margin, initY+56, pageWidth-margin, initY+56 );

	 	doc.setFontSize(22);
	 	var invoiceTitle = 'Commercial Invoice';
	 	doc.text(invoiceTitle, pageWidth/2, initY+65, {align:"center"});
	 	var underlineStart = ( pageWidth/2) - (doc.getTextWidth(invoiceTitle)/2);
	 	doc.setLineWidth(1);
	 	doc.line(underlineStart, initY+66, underlineStart + doc.getTextWidth(invoiceTitle), initY+66 )

	 }

	 generateShippingAddress(doc, margin, initY){
		 doc.setFontSize(14);
		 var yCoord = initY + 75;
		 var addressTitle = 'TO:  ';
		 doc.text(addressTitle, margin, yCoord);
		 var addressArray = new Array(this.props.customer.label);
		 var shippingLines = this.props.shippingAddress.label.split(',').map(s => s.trim());
		 var addressText= addressArray.concat(shippingLines);
		 doc.text(addressText, margin+doc.getTextWidth(addressTitle), yCoord);
		 yCoord += 28;
		 doc.text("Tel: "+this.props.customer["ContactInfo"]["PrimaryContact"]["Phone"], margin, yCoord);
		 doc.text("Fax: "+this.props.customer["ContactInfo"]["PrimaryContact"]["Fax"], margin, yCoord + 5);
		 doc.text("Attn: "+this.props.customer["ContactInfo"]["PrimaryContact"]["Name"], margin, yCoord + 15);

	 }

	 generateInvoiceNumber(doc, pageWidth, margin, initY, logtagInvoiceNumber) {
		 var invoiceNumberTitle = 'INVOICE NUMBER: ';
		 var invoiceNumberTextWidth = doc.getTextWidth(invoiceNumberTitle+logtagInvoiceNumber);
		 doc.text(invoiceNumberTitle+logtagInvoiceNumber,  pageWidth-margin-invoiceNumberTextWidth, initY+75);
		 var underlineStart = pageWidth-margin-doc.getTextWidth(logtagInvoiceNumber);
		 doc.setLineWidth(0.8);
		 doc.line(underlineStart, initY+76, underlineStart + doc.getTextWidth(logtagInvoiceNumber), initY+76 )
	 }

	 generateDate(doc, pageWidth, margin, initY) {
		var dateTitle = 'DATE: ';
	 	var dateOptions = {  year: 'numeric', month: 'long', day: 'numeric' };
	 	var date = new Date().toLocaleDateString("en-US", dateOptions)
	 	var dateTextWidth = doc.getTextWidth(dateTitle+date);
	 	doc.text(dateTitle+date,  pageWidth-margin-dateTextWidth, initY+85);

	 }

	 generatePurchaseOrderNumber(doc, pageWidth, margin, initY) {
		var title = 'Ref:- Your PO #';
	 	var purchaseOrderNumber= this.props.purchaseOrderNumber;
	 	var textWidth = doc.getTextWidth(title+purchaseOrderNumber);
	 	doc.text(title+purchaseOrderNumber,  pageWidth-margin-textWidth, initY+115);

	 }

	 generateShippingAccount(doc, margin, initY) {
		 doc.setFontSize(12);
		 var courierAccount = this.props.courierAccount.label || '';
		 var shippingInfo = 'Ship Via:- '+courierAccount;
		 doc.text(shippingInfo,  margin, initY+124);
	 }



	 generateOrderTable(doc, margin,initY ) {
		var data = [];
	 	var headers = [['Description','Qty','Unit Price','Currency','Subtotal']];
	 	var items = this.state.order_items;
		var currency = 'Not Specified';
		if(this.props.currency && this.props.currency.label) {
			currency = this.props.currency.label;
		}
	 	for(var i = 0; i < items.length; i++) {
	 		var variant = '';
	 		if(items[i].variant.replace(',',', \n') != 'No Variant') {
	 			variant = ' - '+items[i].variant.replace(',',', \n');
	 		}
	 		var line = [ items[i].product_name+variant, items[i].quantity,items[i].price, currency, items[i].quantity*items[i].price+'' ];
	 		data.push(line);

	 	}
	 	var footer = [['Total','','',this.calculateTotal()]]
	 	var tableHeight = 0;
	 	doc.autoTable({
	 		startY: initY,
	 		head: headers,
	 		body: data,
	 		foot: footer,
	 		margin: {top:0, right:margin,bottom:0, left:margin},
	 		headStyles: {
	 			fillColor: [6,46,112],
	 			textColor: [255,255,255]
	 		},
	 		footStyles: {
	 			fillColor: [255,255,255],
	 			textColor: [0,0,0]
	 		},
	 		styles:{
	 			lineWidth:0.1,
	 			lineColor:[0,0,0]
	 		},
	 		didDrawPage: function (HookData) {
	         tableHeight = HookData.table.height
	     },
	 		});
	 		return initY + tableHeight;
	 }

	 generateBankDetails(doc, margin, initY) {
		doc.setFontStyle("");
	 	doc.setFontSize(12);
	 	var paymentInfo = ['HS Code # ' +this.props.hsCode.label,
	 'Make Payment in advance to LogTag Recorders (HK) Ltd. Bank Account:-']
	 	doc.text(paymentInfo,  margin, initY +10);
	 	doc.setFontStyle("bold");
	 	var bankAccount = ['HSBC','No.1, Queen\'s Road', 'Central, Hong Kong']
	 	doc.text(bankAccount,  margin, initY +20);
	 	var accountNumberTitle = 'Account Number:'
	 	doc.text(accountNumberTitle,  margin, initY +35);
	 	doc.setTextColor(247,29,29)
	 	var accountNumber ='652-144304-838'
	 	doc.text(accountNumber,  margin+doc.getTextWidth(accountNumberTitle), initY +35);
	 	doc.text('LogTag Recorders (HK) Limited',  margin, initY +40);
	 	doc.setTextColor(0,0,0)
	 	doc.text('SWIFT - HSBCHKHHHKH',  margin, initY +50);

	 }

	 generateFooter(doc, pageWidth, margin, initY) {
		 var footerImageWidth = 62;
		 var footerImageHeight = 18;
		 var footerImage = new Image();
		 footerImage.src = pdfEnd;
		 footerImage.onload = function() {
		 	doc.addImage(footerImage , 'PNG', (pageWidth-footerImageWidth-margin), initY +60, footerImageWidth, footerImageHeight);
			doc.save('Order.pdf')
	 	 }

	 }

   saveOrderAndGeneratePDF = (event) => {
	   event.preventDefault();
		 if(this.props.shippingAddress === null) {
			 window.alert('Please Select a Shipping Address');
			 return;
		 }
		 if (window.confirm('Are you sure?')) {
	     this.props.create_invoice_handler(this.buildInvoiceBody())
			 .then( response => {
						var logtagInvoiceNumber = response["LogtagInvoiceNumber"];
						console.log(response)
						this.generatePDF(logtagInvoiceNumber);
						NotificationManager.success('', 'Order Successfully Created', 3000);
					})
					.catch(err =>
		      {
						console.log('Create Order Error:')
						console.log(err)
		        NotificationManager.error('Order Creation Failed', 'Error', 5000, () => {});
		        return false;
		      })
	   }
   }


   render() {
    return (
	<div className = "OrderList">

      <fieldset>
		{this.state.order_items.map(item => (
			<OrderItem
				key={item.key}
				item={item}
				products={this.props.products}
				update_item_handler={this.orderItemUpdated}
				customer={this.props.customer}
			/>
		))}


	  </fieldset>

	  <button onClick={this.addItem}>Add Product</button>

	  <div>
		<strong>Total: {this.calculateTotal()}</strong>
	  </div>

	  <div>
		<button onClick={this.saveOrderAndGeneratePDF}>Generate PDF</button>
	  </div>
	</div>

    );
  }
}

export default OrderList;
