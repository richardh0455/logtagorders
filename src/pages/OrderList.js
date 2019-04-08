import React, { Component } from 'react';
import OrderItem from './OrderItem';
import '../public/css/gridforms.css';
import * as jsPDF from 'jspdf';
import * as Base64 from 'base-64';
import logo from '../public/images/LTLogoInvoice.png';
import 'jspdf-autotable';



class OrderList extends Component {
	constructor(props) {
    super(props);
	this.state = {
		counter: /*localStorage.getItem('counter') ? localStorage.getItem('counter') :*/ '5',
		order_items: /*localStorage.getItem('order_items') ? JSON.parse(localStorage.getItem('order_items')) :*/ []

	};

    this.removeItem = this.removeItem.bind(this);
    this.orderItemUpdated = this.orderItemUpdated.bind(this);
    this.addItem = this.addItem.bind(this);
    this.generatePDF = this.generatePDF.bind(this);
    this.saveOrderAndGeneratePDF = this.saveOrderAndGeneratePDF.bind(this);


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

   removeItem(key) {
	  var items = this.state.order_items;
	  for(var i = 0; i < items.length; i++) {
		if(items[i].key === key) {
			items.splice(i, 1);
		}
	  }
	  this.saveState({order_items: items});
   }

   addItem(event) {
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

   orderItemUpdated(key, item) {
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


  generatePDF(logtagInvoiceNumber) {
	var pageWidth = 210;
	var margin = 20;
	var doc = new jsPDF({orientation:'p', unit:'mm', format:'a4'});
	var initX = 15;



	var imageWidth = 60;
	var imageHeight = (imageWidth/5) * 2;
	var img = new Image();
	img.src = logo;
	doc.addImage(img , 'PNG', (pageWidth-imageWidth)/2, 20, imageWidth, imageHeight);

	doc.setFontSize(11);
	doc.setFontStyle("bold");
	var addressLine1 = "LogTag Recorders (HK) Ltd. Room A, 12/F., Tak Lee Commercial Building"
	var addressLine2 = "113-117 Wanchai Road, Wanchai, Hong Kong Tel +649 444 5881"
  doc.text([addressLine1,addressLine2], pageWidth/2, 50, {align:"center"});
	doc.setLineWidth(1);
	doc.line(margin, 56, pageWidth-margin, 56 );

	doc.setFontSize(22);
	var invoiceTitle = 'Commercial Invoice';
	doc.text(invoiceTitle, pageWidth/2, 65, {align:"center"});
	var underlineStart = ( pageWidth/2) - (doc.getTextWidth(invoiceTitle)/2);
	doc.setLineWidth(1);
	doc.line(underlineStart, 66, underlineStart + doc.getTextWidth(invoiceTitle), 66 )
	doc.setFontSize(14);

	var addressTitle = 'TO:  ';
	doc.text(addressTitle, margin, 75);
	//var customerName = this.props.customer.label;
	var addressArray = new Array(this.props.customer.label);
	//addressAr
	var shippingLines = this.props.shippingAddress.label.split(',').map(s => s.trim());
	var addressText= addressArray.concat(shippingLines);
	doc.text(addressText, margin+doc.getTextWidth(addressTitle), 75);

	var invoiceNumberTitle = 'INVOICE NUMBER: ';
	var invoiceNumberTextWidth = doc.getTextWidth(invoiceNumberTitle+logtagInvoiceNumber);
	doc.text(invoiceNumberTitle+logtagInvoiceNumber,  pageWidth-margin-invoiceNumberTextWidth, 75);
	underlineStart = pageWidth-margin-doc.getTextWidth(logtagInvoiceNumber);
	doc.setLineWidth(0.8);
	doc.line(underlineStart, 76, underlineStart + doc.getTextWidth(logtagInvoiceNumber), 76 )



	var data = [];
	var headers = [['Description','Qty','Unit Price','Subtotal']];
	var items = this.state.order_items;
	for(var i = 0; i < items.length; i++) {
		var line = [ items[i].product_name+' - '+items[i].variant.replace(',',', \n'), items[i].quantity,items[i].price, items[i].quantity*items[i].price+'' ];
		data.push(line);

	}
var footer = [['Total','','',this.calculateTotal()]]
var tableHeight = 0;
var initY = 100;
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
	var postTableY = initY + tableHeight;
	doc.setFontStyle("");
	doc.setFontSize(12);
	var paymentInfo = ['HS Code # 9025 1980 90 0000 0000 00 00 Country of Origin - Peoples Republic of China',
'Make Payment in advance to LogTag Recorders (HK) Ltd. Bank Account:-']
	doc.text(paymentInfo,  margin, postTableY +10);
	var bankAccount = ['HSBC','No.1, Queen\'s Road', 'Central, Hong Kong']
	doc.text(bankAccount,  margin, postTableY +20);
	var accountNumberTitle = 'Account Number:'
	doc.text(accountNumberTitle,  margin, postTableY +40);
	doc.setTextColor(247,29,29)
	var accountNumber ='652-144304-838'
	doc.text(accountNumber,  margin+doc.getTextWidth(accountNumberTitle), postTableY +30);
	doc.text('LogTag Recorders (HK) Limited',  margin, postTableY +40);
	doc.setTextColor(0,0,0)
	doc.text('SWIFT - HSBCHKHHHKH',  margin, postTableY +50);
	doc.save('Order.pdf')

   }

	 getPadding(textLength, width){
		 return (width - textLength)/2;

	 }

   saveOrderAndGeneratePDF(event) {
	   event.preventDefault();
		 if (window.confirm('Are you sure?')) {

	     this.props.create_invoice_handler(this.buildInvoiceBody())
			 .then( response => {
					var parsed_body = JSON.parse(JSON.parse(response.body))
					var logtagInvoiceNumber = parsed_body["LogtagInvoiceNumber"]+'-'+parsed_body["InvoiceID"];
					this.generatePDF(logtagInvoiceNumber);
			}
			)
	   }
   }


   render() {
    return (
	<div className = "OrderList">

      <fieldset>
		{this.state.order_items.map(item => (
			<OrderItem key={item.key} item={item} products={this.props.products} update_item_handler={this.orderItemUpdated} customer={this.props.customer}/>
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
