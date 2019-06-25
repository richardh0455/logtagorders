import React, { Component } from 'react';
import OrderItem from './OrderItem';
import '../../public/css/gridforms.css';
import * as jsPDF from 'jspdf';
import * as Base64 from 'base-64';
import pdfEnd from '../../public/images/ncombskhir.png';
import logo from '../../public/images/LTLogoInvoice.png';
import {NotificationContainer, NotificationManager} from 'react-notifications';
import 'jspdf-autotable';
import { Auth, API } from 'aws-amplify';

const variantsAPI = 'VariantsAPI';



class OrderList extends Component {
	constructor(props) {
    super(props);
		this.state = {
			counter: '5'
		};
	}

  async componentDidMount() {
		const session = await Auth.currentSession();
    this.setState({ authToken: session.accessToken.jwtToken });
    this.setState({ idToken: session.idToken.jwtToken });
		if (this.props.order_items === undefined )
	  {
			this.props.order_items=[]
			this.addOrderLine()
	  }
  }




	buildInvoiceBody() {
		var lines =[]
		var items = this.props.order_items;
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
	  var items = this.props.order_items;
	  for(var i = 0; i < items.length; i++) {
		if(items[i].key === key) {
			items.splice(i, 1);
		}
	  }
	  this.props.order_items= items;
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
	  this.props.order_items.push(cloneOfDefault);
	  this.saveState({counter: key});
  }


   saveState(state) {
	this.setState(state)
   }

   calculateTotal() {
	  var items = this.props.order_items;
	  var total = 0.0;
	  for(var i = 0; i < items.length; i++) {
		total += parseInt(items[i].Quantity) * parseFloat(items[i].Pricing);
	  }
	  return (total).toFixed(2);
   }

	 orderItemUpdated = (key, field, event) => {
	 	var items = this.props.order_items;
		for(var i = 0; i < items.length; i++) {
	 		if(items[i].LineID === key) {
		 		items[i][field] = event;
	 		}
	 		this.props.order_item_updated(items);
	 	}
 	}

	generatePDF = (logtagInvoiceNumber) => {
		this.generatePDFAsync(logtagInvoiceNumber)
	}

  async generatePDFAsync(logtagInvoiceNumber){
		var pageWidth = 210;
		var margin = 20;
		var doc = new jsPDF({orientation:'p', unit:'mm', format:'a4'});
		var initX = 15;
		var initY = 0;
		await this.generateHeader(doc, pageWidth, margin, initY);
		await this.generateShippingAddress(doc, margin, initY);
		await this.generateInvoiceNumber(doc, pageWidth, margin, initY, logtagInvoiceNumber);
		await this.generateDate(doc, pageWidth, margin, initY);
		await this.generatePurchaseOrderNumber(doc,pageWidth, margin, initY);
		await this.generateShippingAccount(doc, margin, initY);
		var postTableY = await this.generateOrderTable(doc, margin, 150);
		postTableY = this.checkPageHeight(doc, postTableY);
		await this.generateBankDetails(doc, margin, postTableY);
		postTableY = this.checkPageHeight(doc, postTableY+10);
		await this.generateFooter(doc, pageWidth, margin, postTableY);


   }

	 checkPageHeight(doc, currentY)
	 {
		 if (currentY >= doc.internal.pageSize.height)
 		 {
   		doc.addPage();
   		return 0; // Restart height position
 		 }
		 else {
		 	return currentY;
		 }

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
		 var shippingLines = []
		 if(this.props.shippingAddress)
		 {
			 shippingLines = this.buildAddress(this.props.shippingAddress.address)
		 }

		 var addressText= addressArray.concat(shippingLines);
		 doc.text(addressText, margin+doc.getTextWidth(addressTitle), yCoord);
		 yCoord += 42;
		 doc.text("Tel: "+this.props.customer["ContactInfo"]["PrimaryContact"]["Phone"], margin, yCoord);
		 doc.text("Fax: "+this.props.customer["ContactInfo"]["PrimaryContact"]["Fax"], margin, yCoord + 5);
		 doc.text("Attn: "+this.props.customer["ContactInfo"]["PrimaryContact"]["Name"], margin, yCoord + 15);

	 }

	 buildAddress(address){
		 var addressArray = [];
		 if(this.fieldHasValidValue(address.Street))
		 {
			 addressArray.push(address.Street)
		 }
		 if(this.fieldHasValidValue(address.Suburb))
		 {
			 addressArray.push(address.Suburb)
		 }
		 if(this.fieldHasValidValue(address.City))
		 {
			 addressArray.push(address.City)
		 }
		 if(this.fieldHasValidValue(address.State))
		 {
			 addressArray.push(address.State)
		 }
		 if(this.fieldHasValidValue(address.Country))
		 {
			 addressArray.push(address.Country)
		 }
		 if(this.fieldHasValidValue(address.PostCode))
		 {
			 addressArray[addressArray.length-1].concat(", "+address.PostCode)
		 }
		 return addressArray;
	 }

	 fieldHasValidValue(field)
	 {
		 return field && field.trim() !== "" && field.trim() !== "None"
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
		 var courierAccount = this.props.courierAccount ? this.props.courierAccount.label : '';
		 var shippingInfo = 'Ship Via:- '+courierAccount;
		 doc.text(shippingInfo,  margin, initY+141);
	 }



	 async generateOrderTable(doc, margin,initY ) {
		var data = [];
	 	var headers = [['Description','Qty','Unit Price','Currency','Subtotal']];
	 	var items = this.props.order_items;
		var currency = 'Not Specified';
		if(this.props.currency && this.props.currency.label) {
			currency = this.props.currency.label;
		}
	 	for(var i = 0; i < items.length; i++) {
	 		var variant = await this.getVariantDescription(items[i].VariationID)
			console.log('Variant Description')
			console.log(variant)
			if(variant.trim() != 'No Variant' && variant.trim() != 'None'  && variant.trim() != '') {
				variant = ' - '+variant

			}
			if(this.findMatchingElementByID(items[i].ProductID,this.props.products)) {
				var line = [ this.findMatchingElementByID(items[i].ProductID,this.props.products).label+variant, items[i].Quantity, '$'+items[i].Pricing, currency, (items[i].Quantity*items[i].Pricing).toFixed(2)+'' ];
				data.push(line);
			}
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

	 async getVariantDescription (id) {
		if(!id)
		{
			return '';
		}
		const apiRequest = {
         headers: {
           'Authorization': this.state.idToken,
           'Content-Type': 'application/json'
         }
       };

		var response = await API.get(variantsAPI, '/'+id, apiRequest)
		return JSON.parse(response.body).Description || '';
	 }

	 generateBankDetails(doc, margin, initY) {
		doc.setFontStyle("");
	 	doc.setFontSize(12);
		var hsCode = this.props.hsCode ? this.props.hsCode.label : '';
	 	var paymentInfo = ['HS Code # ' + hsCode,
	 'Make Payment in advance to LogTag Recorders (HK) Ltd. Bank Account:-']
	  initY = this.checkPageHeight(doc, initY);
	 	doc.text(paymentInfo,  margin, initY +10);
		initY= initY +10;
	 	doc.setFontStyle("bold");
	 	var bankAccount = ['HSBC','No.1, Queen\'s Road', 'Central, Hong Kong']
		initY = this.checkPageHeight(doc, initY);
	 	doc.text(bankAccount,  margin, initY +10);
		initY= initY +10;
	 	var accountNumberTitle = 'Account Number:'
		initY = this.checkPageHeight(doc, initY);
	 	doc.text(accountNumberTitle,  margin, initY +15);
		initY= initY +15;
	 	doc.setTextColor(247,29,29)
	 	var accountNumber ='652-144304-838'
		initY = this.checkPageHeight(doc, initY);
	 	doc.text(accountNumber,  margin+doc.getTextWidth(accountNumberTitle), initY);
	 	doc.text('LogTag Recorders (HK) Limited',  margin, initY +5);
		initY= initY +5;
		initY = this.checkPageHeight(doc, initY);
	 	doc.setTextColor(0,0,0)
	 	doc.text('SWIFT - HSBCHKHHHKH',  margin, initY +10);

	 }

	 generateFooter(doc, pageWidth, margin, initY) {
		 initY = this.checkPageHeight(doc, initY+10);
		 var footerImageWidth = 62;
		 var footerImageHeight = 18;
		 var footerImage = new Image();
		 footerImage.src = pdfEnd;
		 footerImage.onload = function() {
		 	doc.addImage(footerImage , 'PNG', (pageWidth-footerImageWidth-margin), initY+10, footerImageWidth, footerImageHeight);
			doc.save('Order.pdf')
	 	 }

	 }

	 findMatchingElementByID(value, list) {
       var result = list.find(element => element.value===value);
			 return result;

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

	 saveOrder = (event) => {
		 event.preventDefault();
		 this.props.create_invoice_handler(this.buildInvoiceBody())
		 .then( response => {
			 NotificationManager.success('', 'Order Successfully Saved', 3000);
		 })
		 .catch(err =>
		 {
			 console.log('Order Saving Error:')
			 console.log(err)
			 NotificationManager.error('Order Saving Failed', 'Error', 5000, () => {});
			 return false;
		 })
	 }


   render() {
    return (
	<div className = "OrderList">

      <fieldset>
		{this.props.order_items.map(item => (
			<OrderItem
				key={item.LineID}
				id={item.LineID}
				product={this.findMatchingElementByID(item.ProductID,this.props.products)}
				variant_id={item.VariationID}
				products={this.props.products}
				update_item_handler={this.orderItemUpdated.bind(this)}
				delete_item_handler={this.props.delete_invoice_line_handler.bind(this)}
				customer={this.props.customer}
				price={item.Pricing}
				quantity={item.Quantity}
			/>
		))}


	  </fieldset>

	  <button onClick={this.props.create_invoice_line_handler}>Add Product</button>

	  <div>
		<strong>Total: {this.calculateTotal()}</strong>
	  </div>

	  <div>
		<button onClick={this.saveOrderAndGeneratePDF}>Generate PDF</button>
		<button onClick={this.saveOrder}>Save Order</button>
	  </div>

	</div>

    );
  }
}

export default OrderList;
